// services/chatService.ts
import { Model, ModelDefinition, ChatMode } from '../types';
import type { Message, Role, Chat, Persona } from '../types';
import { supabase, supabaseUrl } from './supabaseClient';
import { connectionManager } from './connectionManager';
import { logTokenUsage } from './tokenService';
import { getAvailableModels } from './configService';
import { DEFAULT_TEXT_GEN_MODEL } from '../constants/models';
import { smartModelSelection, ModelSelectionContext } from './smartModelSelection';

export const getChatCompletion = async ({
    model,
    history,
    systemPrompt,
    signal,
    onChunk
}: {
    model: string;
    history: Message[];
    systemPrompt?: string;
    signal: AbortSignal;
    onChunk: (data: { text: string; isFinal: boolean, usage?: any, model?: string }) => void;
}): Promise<void> => {
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];
    
    // AIMLAPI doesn't support 'system' role - prepend to first user message instead
    let systemPrefixAdded = false;
    let lastRole: 'user' | 'assistant' | null = null;

    history.forEach(msg => {
        if (msg.text) {
            const role = msg.role === 'model' ? 'assistant' : 'user';
            let content = msg.text;
            
            // Skip if same role as previous message to ensure alternation
            if (lastRole === role) {
                // Merge content with previous message if same role
                if (messages.length > 0) {
                    messages[messages.length - 1].content += `\n\n${content}`;
                }
                return;
            }
            
            // Prepend system prompt to first user message
            if (systemPrompt && !systemPrefixAdded && role === 'user') {
                content = `${systemPrompt}\n\n${msg.text}`;
                systemPrefixAdded = true;
            }
            
            messages.push({ role, content });
            lastRole = role;
        }
    });
    
    try {
        // Ensure valid session before making API call
        await connectionManager.ensureValidSession();
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("User not authenticated.");

        const response = await fetch(`${supabaseUrl}/functions/v1/aimlapi`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
            }),
            signal,
        });

        if (!response.ok) {
            let errorMsg = `API error: ${response.status} ${response.statusText}`;
            let errorDetails: any = {};
            try { 
                errorDetails = await response.json(); 
                console.error('AIMLAPI error response:', errorDetails);
                errorMsg = errorDetails.error || errorDetails.message || JSON.stringify(errorDetails) || errorMsg; 
            } catch (e) { 
                console.error('Could not parse error response:', e);
            }
            console.error('Full error:', errorMsg);
            throw new Error(errorMsg);
        }

        if (!response.body) {
            throw new Error("The response body is empty.");
        }
        
        // --- Stream Processing ---
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponseText = "";
        let usage: any = null;
        let finalModel: string | undefined = undefined;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Process buffer line by line (SSE events are newline-separated)
            let boundary = buffer.indexOf('\n\n');
            while (boundary !== -1) {
                const eventData = buffer.substring(0, boundary);
                buffer = buffer.substring(boundary + 2);

                if (eventData.startsWith('data: ')) {
                    const data = eventData.substring(6);
                    if (data.trim() === '[DONE]') {
                        // This is the final event, break the inner loop
                        boundary = -1; // to exit outer while if no more data
                        break;
                    }
                    
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.model) finalModel = parsed.model;
                        const delta = parsed.choices?.[0]?.delta?.content || '';
                        if (delta) fullResponseText += delta;
                        if (parsed.usage) usage = parsed.usage;

                        onChunk({ text: fullResponseText, isFinal: false });

                    } catch (e) {
                        console.error('Failed to parse stream chunk:', data, e);
                    }
                }
                boundary = buffer.indexOf('\n\n');
            }
        }
        
        onChunk({ text: fullResponseText, isFinal: true, usage, model: finalModel });

        if (usage) {
            logTokenUsage({
                model_used: model,
                feature: 'chat-completion-stream',
                input_tokens: usage.prompt_tokens || 0,
                output_tokens: usage.completion_tokens || 0,
                total_tokens: usage.total_tokens || 0,
            });
        }

    } catch (error) {
        console.error('AIMLAPI chat streaming error:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            error: error
        });
        throw error;
    }
};

export const selectBestModel = async (
    history: Message[], 
    availableModels: ModelDefinition[], 
    context?: {
        chatMode?: ChatMode;
        hasImages?: boolean;
        hasDocuments?: boolean;
        messageText?: string;
    }
): Promise<string> => {
    // If context is provided, try smart model selection first
    if (context) {
        const selectionContext: ModelSelectionContext = {
            chatMode: context.chatMode || 'normal',
            hasImages: context.hasImages || false,
            hasDocuments: context.hasDocuments || false,
            messageText: context.messageText || '',
            conversationHistory: history
        };

        try {
            const smartResult = await smartModelSelection.selectModel(selectionContext);
            
            if (!smartResult.fallbackToRouter) {
                // Validate the selected model is available
                const isValid = await smartModelSelection.validateModel(smartResult.modelId);
                if (isValid) {
                    console.log(`Smart model selection: ${smartResult.reason}`);
                    return smartResult.modelId;
                }
            }
            
            console.log(`Falling back to router: ${smartResult.reason}`);
        } catch (error) {
            console.warn('Smart model selection failed, falling back to router:', error);
        }
    }

    // Fallback to existing AI router logic
    // Ensure valid session
    await connectionManager.ensureValidSession();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error("User not authenticated for model selection.");
    }

    // Select an accessible router model from available models
    // Prefer gemini-2.5-flash if accessible, otherwise use the first accessible model
    let routerModel = 'google/gemini-2.5-flash';
    const geminiFlash = availableModels.find(m => m.id === 'google/gemini-2.5-flash' && m.is_accessible);
    if (geminiFlash) {
        routerModel = geminiFlash.id;
    } else if (availableModels.length > 0) {
        // Try to find a working fallback model - prefer fast, reliable models
        const fallbackModels = [
            'google/gemini-2.0-flash',
            'deepseek-chat',
            'alibaba/qwen-turbo',
            'claude-3-haiku-20240307',
            'claude-3-5-haiku-20241022'
        ];
        
        let accessibleModel = null;
        for (const fallbackId of fallbackModels) {
            accessibleModel = availableModels.find(m => m.id === fallbackId && m.is_accessible);
            if (accessibleModel) break;
        }
        
        // If no preferred fallback found, use first accessible model
        if (!accessibleModel) {
            accessibleModel = availableModels.find(m => m.is_accessible);
        }
        
        if (accessibleModel) {
            routerModel = accessibleModel.id;
        } else {
            throw new Error("No accessible models available for routing.");
        }
    } else {
        throw new Error("No models available for routing.");
    }
    const modelList = availableModels
        .map(m => `- ${m.id}: Best for ${m.tags.join(', ')}`)
        .join('\n');

    const conversationForPrompt = history
        .slice(-6) // last 3 turns (user + model)
        .map(msg => `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}`)
        .join('\n');

    const systemPrompt = `You are an expert, personalized AI model router. Your task is to select the best model from the provided list to handle the user's latest request, considering the ongoing conversation context.

**Analyze the following:**
1.  **Conversation History:** What is the topic? Is it a technical discussion, creative writing, a simple question, or a complex reasoning task?
2.  **User's Latest Prompt:** What is the user's immediate goal?
3.  **Model Capabilities:** Match the user's needs to the best model from the list below based on their described strengths (tags). Prioritize models that excel at the current task (e.g., 'Coding' for code, 'Reasoning' for logic puzzles, 'Fast' for quick answers).

**CRITICAL RULE:** If the user's query asks for recent information, facts about current events, or anything that would benefit from a web search, you MUST prioritize selecting a model that has a 'Search' tag, if one is available in the list.

**Available Models:**
${modelList}

Based on your analysis of the conversation below, respond with ONLY the ID of the best model (e.g., 'openai/gpt-4o'). Do not provide any explanation, preamble, or additional text.`;
    
    const userPrompt = `**Conversation:**\n${conversationForPrompt}`;


    const response = await fetch(`${supabaseUrl}/functions/v1/aimlapi`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        // This simplified and explicit payload prevents "Failed to fetch" errors.
        body: JSON.stringify({
            model: routerModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: false,
        }),
    });

    if (!response.ok) {
        let errorMsg = `Router model API error: ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
        } catch(e) { /* response may not be json */ }
        throw new Error(errorMsg);
    }

    const result = await response.json();

    if (result.usage) {
        logTokenUsage({
            model_used: routerModel,
            feature: 'auto-model-router',
            input_tokens: result.usage.prompt_tokens,
            output_tokens: result.usage.completion_tokens,
            total_tokens: result.usage.total_tokens,
        });
    }

    const selectedModelId = (result.choices[0]?.message?.content || '').trim();
    
    // Validate the response
    if (availableModels.some(m => m.id === selectedModelId)) {
        return selectedModelId;
    }

    console.warn(`Router model returned an invalid model ID: "${selectedModelId}". Falling back to default.`);
    return DEFAULT_TEXT_GEN_MODEL;
};


export const generateTitle = async (message: string): Promise<string> => {
    try {
        // Ensure valid session
        await connectionManager.ensureValidSession();
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error("User not authenticated for title generation.");
        }

        const enabledModels = await getAvailableModels();
        let titleModel = enabledModels.find(m => m.id.includes('mini') || m.id.includes('flash') || m.id.includes('haiku'));
        
        // If no fast model found, try specific reliable models
        if (!titleModel) {
            const preferredModels = [
                'google/gemini-2.5-flash',
                'google/gemini-2.0-flash', 
                'deepseek-chat',
                'alibaba/qwen-turbo',
                'claude-3-haiku-20240307',
                'claude-3-5-haiku-20241022'
            ];
            
            for (const prefId of preferredModels) {
                titleModel = enabledModels.find(m => m.id === prefId);
                if (titleModel) break;
            }
        }
        
        if (!titleModel && enabledModels.length > 0) {
            titleModel = enabledModels[0];
        }
        
        if (!titleModel) {
            console.warn("No enabled models found for generating title. Using default.");
            return "New Chat";
        }

        const model = titleModel.id;

        const response = await fetch(`${supabaseUrl}/functions/v1/aimlapi`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: `Generate a short, concise title (4 words max) for the following user query. Do not use quotes or special characters. Just return the title.\n\nQUERY: "${message}"`
                    }
                ],
                max_tokens: 20,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API error');
        }

        const result = await response.json();
        
        if (result.usage) {
            logTokenUsage({
                model_used: model,
                feature: 'generate-title',
                input_tokens: result.usage.prompt_tokens,
                output_tokens: result.usage.completion_tokens,
                total_tokens: result.usage.total_tokens,
            });
        }
        
        const title = result.choices[0]?.message?.content || 'New Chat';
        return title.trim().replace(/["'*]/g, '');

    } catch (error) {
        console.error("Error generating title:", error);
        return "New Chat";
    }
};

// --- Database Functions ---

export const getChats = async (userId: string): Promise<Omit<Chat, 'messages'>[]> => {
    const { data, error } = await supabase
        .from('chats')
        .select('id, title, models, system_instruction, created_at, updated_at, category, pinned, chat_mode')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((chat: any) => ({
        id: String(chat.id),
        title: chat.title,
        models: chat.models || [],
        systemPrompt: chat.system_instruction,
        createdAt: new Date(chat.created_at).getTime(),
        updatedAt: new Date(chat.updated_at).getTime(),
        category: chat.category || 'Uncategorized',
        pinned: chat.pinned || false,
        chatMode: chat.chat_mode || 'normal',
    }));
};

export const getMessages = async (chatId: string): Promise<Message[]> => {
    const { data, error } = await supabase
        .from('messages')
        .select('id, role, content, source_model')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map((msg: any) => ({
        id: String(msg.id),
        role: msg.role as Role,
        text: msg.content || '',
        sourceModel: msg.source_model as Model,
    }));
};


export const getChatsWithMessages = async (userId: string): Promise<Chat[]> => {
    const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('id, title, models, system_instruction, created_at, updated_at, category, pinned, chat_mode')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (chatsError) throw chatsError;
    
    if (!chatsData) return [];

    const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id, chat_id, role, content, source_model')
        .in('chat_id', chatsData.map(c => c.id))
        .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    const messagesByChatId = (messagesData || []).reduce((acc, msg) => {
        if (!acc[msg.chat_id]) {
            acc[msg.chat_id] = [];
        }
        acc[msg.chat_id].push({
            id: String(msg.id),
            role: msg.role as Role,
            text: msg.content || '',
            sourceModel: msg.source_model as Model,
        });
        return acc;
    }, {} as Record<string, Message[]>);
    
    return chatsData.map((chat: any) => ({
        id: String(chat.id),
        title: chat.title,
        messages: messagesByChatId[chat.id] || [],
        models: chat.models || [],
        systemPrompt: chat.system_instruction,
        createdAt: new Date(chat.created_at).getTime(),
        updatedAt: new Date(chat.updated_at).getTime(),
        category: chat.category || 'Uncategorized',
        pinned: chat.pinned || false,
        chatMode: chat.chat_mode || 'normal',
    }));
};

export const createChatDB = async (userId: string, chat: Omit<Chat, 'id' | 'messages' | 'createdAt' | 'updatedAt'>): Promise<Chat> => {
    const { data, error } = await supabase
        .from('chats')
        .insert({
            user_id: userId,
            title: chat.title,
            models: chat.models,
            system_instruction: chat.systemPrompt,
            category: chat.category,
            pinned: chat.pinned,
            chat_mode: chat.chatMode,
        })
        .select()
        .single();
        
    if (error) throw error;
    
    return {
        id: String(data.id),
        title: data.title,
        messages: [],
        models: data.models as (Model | string)[],
        systemPrompt: data.system_instruction,
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
        category: data.category,
        pinned: data.pinned,
        chatMode: data.chat_mode,
    };
};

export const updateChatDB = async (chatId: string, updates: Partial<Pick<Chat, 'title' | 'models' | 'systemPrompt' | 'category' | 'pinned' | 'chatMode'>>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.models !== undefined) dbUpdates.models = updates.models;
    if (updates.systemPrompt !== undefined) dbUpdates.system_instruction = updates.systemPrompt;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.pinned !== undefined) dbUpdates.pinned = updates.pinned;
    if (updates.chatMode !== undefined) dbUpdates.chat_mode = updates.chatMode;
    
    if (Object.keys(dbUpdates).length === 0) return;

    const { error } = await supabase
        .from('chats')
        .update(dbUpdates)
        .eq('id', chatId);
        
    if (error) throw error;
};

export const deleteChatDB = async (chatId: string) => {
    const { error, count } = await supabase
        .from('chats')
        .delete({ count: 'exact' })
        .eq('id', chatId);
    if (error) throw error;
    if (count !== 1) {
        console.warn(`Attempted to delete chat ${chatId}, but ${count ?? 0} rows were affected. RLS may have prevented this.`);
        throw new Error('Delete failed: Chat not found or permission denied.');
    }
};

export const createMessageDB = async (chatId: string, message: Pick<Message, 'role' | 'text' | 'images' | 'sourceModel'>): Promise<{ id: string }> => {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            chat_id: chatId,
            role: message.role,
            content: message.text,
            source_model: message.sourceModel,
        })
        .select('id')
        .single();

    if (error || !data) {
        console.error("Error creating message in DB:", error);
        throw error || new Error("Failed to create message: No data returned.");
    }
    return { id: String(data.id) };
};

export const deleteMessageDB = async (messageId: string) => {
    const { error, count } = await supabase
        .from('messages')
        .delete({ count: 'exact' })
        .eq('id', messageId);
    if (error) throw error;
    if (count !== 1) {
        console.warn(`Attempted to delete message ${messageId}, but ${count ?? 0} rows were affected. RLS may have prevented this.`);
        throw new Error('Delete failed: Message not found or permission denied.');
    }
};

export const deleteMessagesDB = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    const { error, count } = await supabase
        .from('messages')
        .delete({ count: 'exact' })
        .in('id', messageIds);
    if (error) throw error;
    
    if ((count ?? 0) !== messageIds.length) {
        console.warn(`Attempted to delete ${messageIds.length} messages, but only ${count ?? 0} were affected. RLS may have prevented this.`);
        throw new Error('Delete failed: Not all messages could be deleted. Please refresh.');
    }
};

export const updateMessageDB = async (messageId: string, updates: { content?: string }) => {
    const { error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', messageId);
    if (error) throw error;
};

// --- Persona DB Functions ---

export const getPersonasDB = async (userId: string): Promise<Persona[]> => {
    const { data, error } = await supabase
        .from('personas')
        .select('id, name, icon, system_prompt')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map((p: any) => ({
        id: String(p.id),
        name: p.name,
        icon: p.icon,
        systemPrompt: p.system_prompt,
    }));
};

export const createPersonaDB = async (userId: string, persona: Omit<Persona, 'id'>): Promise<Persona> => {
    const { data, error } = await supabase
        .from('personas')
        .insert({
            user_id: userId,
            name: persona.name,
            icon: persona.icon,
            system_prompt: persona.systemPrompt,
        })
        .select()
        .single();
    
    if (error) throw error;

    return {
        id: String(data.id),
        name: data.name,
        icon: data.icon,
        systemPrompt: data.system_prompt,
    };
};

export const updatePersonaDB = async (personaId: string, updates: Partial<Omit<Persona, 'id'>>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.systemPrompt !== undefined) dbUpdates.system_prompt = updates.systemPrompt;
    
    if (Object.keys(dbUpdates).length === 0) return;

    const { error } = await supabase
        .from('personas')
        .update(dbUpdates)
        .eq('id', personaId);
        
    if (error) throw error;
};

export const deletePersonaDB = async (personaId: string) => {
    const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', personaId);
    if (error) throw error;
};


// --- Category DB Functions ---

export const getCategories = async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('user_id', userId)
        .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(c => c.name);
};

export const createCategoryDB = async (userId: string, name: string): Promise<{name: string}> => {
    const { data, error } = await supabase
        .from('categories')
        .insert({ user_id: userId, name })
        .select('name')
        .single();
    if (error) throw error;
    return data;
};

export const deleteCategoryDB = async (userId: string, name: string) => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .match({ user_id: userId, name });
    if (error) throw error;
};