import { create } from 'zustand';
import { generateId } from '../../utils/chatUtils';
import { 
    getChatCompletion, 
    generateTitle, 
    getMessages, 
    createMessageDB, 
    updateMessageDB, 
    deleteMessageDB, 
    deleteMessagesDB,
    selectBestModel,
} from '../../services/chatService';
import { Model } from '../../types';
import type { Chat, Message, AttachedImage } from '../../types';
import { useChatSessionStore } from './useChatSessionStore';
// FIX: The `ALL_CHAT_MODELS` constant is not available. Models should be fetched from the model store.
import { useModelStore } from '../modelStore';
import { useAppStore } from '../appStore';
// FIX: The function `getEnabledChatModels` does not exist; the correct function is `getAvailableModels`.
import { getAvailableModels } from '../../services/configService';

interface ChatMessagesState {
    messages: Message[];
    isLoading: boolean;
    isStreaming: boolean;
    abortController: AbortController | null;
    loadingChatId: string | null;

    actions: {
        loadMessages: (chatId: string | null) => Promise<void>;
        sendMessage: (text: string, images: AttachedImage[]) => Promise<void>;
        stopStream: () => void;
        deleteMessage: (messageId: string) => Promise<void>;
        regenerateResponse: (messageId: string) => Promise<void>;
        _addMessage: (message: Message) => void;
        _updateMessage: (id: string, updates: Partial<Message>) => void;
    }
}

const getFriendlyErrorMessage = (error: any, modelId: string): string => {
    let rawMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        rawMessage = error.message;
    } else if (typeof error === 'string') {
        rawMessage = error;
    } else if (typeof error === 'object' && error !== null) {
        rawMessage = error.message || error.error || JSON.stringify(error);
    } else {
        rawMessage = String(error);
    }
    
    // FIX: The `ALL_CHAT_MODELS` constant is not available. Models should be fetched from the model store.
    const { models: allModels } = useModelStore.getState();
    const modelName = allModels.find(m => m.id === modelId)?.name || modelId;
    
    if (rawMessage.includes("Failed to parse stream data")) {
        rawMessage = "The model returned an incomplete or invalid response. Please try again.";
    } else if (rawMessage.includes("timed out")) {
        rawMessage = "The request timed out. The model may be overloaded or the request was too complex. Please try again.";
    } else if (rawMessage.includes("[object Object]")) {
        rawMessage = "An unexpected API error occurred."
    }

    return `An error occurred with ${modelName}: ${rawMessage}`;
};

export const useChatMessagesStore = create<ChatMessagesState>((set, get) => {
    
    // Subscribe to chat session changes to load messages for the active chat
    let lastLoadedChatId: string | null = null;
    let loadTimeout: NodeJS.Timeout | null = null;
    let lastSubscriptionCall = 0;
    
    useChatSessionStore.subscribe((state, prevState) => {
      const now = Date.now();
      // Throttle subscription calls to prevent rapid re-triggering
      if (now - lastSubscriptionCall < 500) return;
      lastSubscriptionCall = now;
      
      const { activeChatId } = state;
      
      // Only load messages if the active chat actually changed and we're not already loading it
      if (activeChatId && activeChatId !== lastLoadedChatId && activeChatId !== get().loadingChatId) {
        // Clear any pending load timeout
        if (loadTimeout) {
          clearTimeout(loadTimeout);
        }
        
        // Set a longer delay to prevent rapid re-triggering
        loadTimeout = setTimeout(() => {
          lastLoadedChatId = activeChatId;
          get().actions.loadMessages(activeChatId);
        }, 300);
      }
    });

    return {
        messages: [],
        isLoading: false,
        isStreaming: false,
        abortController: null,
        loadingChatId: null,

        actions: {
            loadMessages: async (chatId) => {
                if (!chatId) {
                    set({ messages: [], isLoading: false, loadingChatId: null });
                    return;
                }
                
                if (get().loadingChatId === chatId && get().isLoading) {
                    return; // A load for this chat is already in progress
                }

                set({ isLoading: true, messages: [], loadingChatId: chatId });

                try {
                    let messages: Message[] = [];
                    if (!isNaN(Number(chatId))) {
                        messages = await getMessages(chatId);
                    } else {
                        const localChat = useChatSessionStore.getState().chats.find(c => c.id === chatId);
                        messages = (localChat as Chat)?.messages || [];
                    }
                    
                    if (get().loadingChatId === chatId) {
                        set({ messages, isLoading: false, loadingChatId: null });
                    }

                } catch (error) {
                    console.error("Failed to fetch messages:", error);
                    if (get().loadingChatId === chatId) {
                        set({ isLoading: false, loadingChatId: null });
                    }
                }
            },
            sendMessage: async (text, images) => {
                const MIN_CHAT_COST = 50;
                const { tokenBalance } = useAppStore.getState();
                if (tokenBalance < MIN_CHAT_COST) {
                    const errorMessage: Message = {
                        id: generateId(),
                        role: 'model',
                        text: `Insufficient tokens. A minimum of ${MIN_CHAT_COST} tokens is required.`,
                        isError: true,
                        sourceModel: 'system' as any,
                    };
                    get().actions._addMessage(errorMessage);
                    return;
                }
            
                const { activeChatId, chats, actions: sessionActions } = useChatSessionStore.getState();
                const activeChat = chats.find(c => c.id === activeChatId);
            
                if (!activeChat || get().isStreaming) return;
            
                const effectiveMode = activeChat.chatMode || 'normal';
                const userMessage: Message = {
                    id: generateId(), role: 'user', text, images,
                    sentWithMode: effectiveMode !== 'normal' ? effectiveMode : undefined,
                };
            
                const tempUserMessageId = userMessage.id;
                get().actions._addMessage(userMessage);
                
                const controller = new AbortController();
                set({ isStreaming: true, abortController: controller });
            
                if (get().messages.length === 1 && text.trim() && activeChat.title === 'New Chat') {
                    generateTitle(text).then(newTitle => {
                        if (newTitle) sessionActions.renameChat(activeChat.id, newTitle);
                    });
                }
            
                try {
                    const savedData = await createMessageDB(activeChat.id, userMessage);
                    get().actions._updateMessage(tempUserMessageId, { id: savedData.id });
                } catch (e) { 
                    console.error("Failed to save user message (this is expected if not logged in):", e); 
                }
            
                let modelsToUse: (Model | string)[] = [];
                let modelResolutionError: Error | null = null;
                const isAutoMode = activeChat.models.length === 1 && activeChat.models[0] === 'auto';
            
                try {
                    if (isAutoMode) {
                        // FIX: The function `getEnabledChatModels` does not exist; the correct function is `getAvailableModels`.
                        const allModels = await getAvailableModels();
                        const availableModels = allModels.filter(m => m.is_accessible);
                        if (availableModels.length === 0) throw new Error("No models available for auto-selection under your current plan.");
                        const historyForSelection = [...get().messages];
                        
                        // Prepare context for smart model selection
                        const hasImages = images && images.length > 0;
                        const hasDocuments = false; // TODO: Add document detection when implemented
                        
                        const bestModel = await selectBestModel(historyForSelection, availableModels, {
                            chatMode: effectiveMode,
                            hasImages,
                            hasDocuments,
                            messageText: text
                        });
                        modelsToUse = [bestModel];
                        sessionActions.updateChatModels(activeChat.id, modelsToUse);
                    } else {
                        const { defaultSearchModel, defaultThinkingModel } = useAppStore.getState();
                        if (effectiveMode === 'search') {
                            modelsToUse = [defaultSearchModel];
                        } else if (effectiveMode === 'thinking') {
                            modelsToUse = [defaultThinkingModel];
                        } else {
                            if (activeChat.models.length === 0) throw new Error("No models selected for this chat.");
                            modelsToUse = activeChat.models;
                        }
                    }
                } catch (error) {
                    modelResolutionError = error as Error;
                }
            
                if (modelResolutionError) {
                    const errorMessage: Message = { id: generateId(), role: 'model', text: getFriendlyErrorMessage(modelResolutionError, 'Model Router'), isError: true, sourceModel: 'system' as any };
                    get().actions._addMessage(errorMessage);
                    set({ isStreaming: false, abortController: null });
                    return;
                }
            
                const modelMessages: Message[] = modelsToUse.map(modelId => ({
                    id: generateId(), role: 'model', text: '', isLoading: true, sourceModel: modelId,
                }));
                const tempModelMessageIds = modelMessages.map(m => m.id);
                set(state => ({ messages: [...state.messages, ...modelMessages] }));
            
                let historyForApi: Message[] = get().messages.slice(0, get().messages.length - modelMessages.length);
                if (effectiveMode === 'search') {
                    historyForApi = [...historyForApi.slice(0, -1), { ...userMessage, text: `Using a web search, provide a comprehensive answer to the following question. Cite your sources. Question: "${text}"` }];
                }
            
                const allPromises = modelsToUse.map(async (modelId, index) => {
                    const tempModelId = tempModelMessageIds[index];
                    if (!tempModelId) return;

                    try {
                        await getChatCompletion({
                            model: modelId,
                            history: historyForApi,
                            systemPrompt: activeChat.systemPrompt,
                            signal: controller.signal,
                            onChunk: ({ text, isFinal, model: finalModel }) => {
                            const updates: Partial<Message> = { text };
                             if (isFinal) {
                                updates.isLoading = false;
                                if (finalModel && modelId !== finalModel) updates.sourceModel = finalModel;
                            }
                            get().actions._updateMessage(tempModelId, updates);
                        },
                        });
                    } catch (error) {
                        if (error instanceof DOMException && error.name === 'AbortError') {
                            get().actions._updateMessage(tempModelId, { text: 'Generation stopped.', isError: true, isLoading: false });
                        } else {
                            get().actions._updateMessage(tempModelId, { text: getFriendlyErrorMessage(error, modelId), isError: true, isLoading: false });
                        }
                    }
                });

                try {
                    await Promise.all(allPromises);
                } finally {
                    set({ isStreaming: false, abortController: null });
                    if (activeChat.chatMode !== 'normal') sessionActions.setChatMode(activeChat.id, 'normal');

                    if (!isNaN(Number(activeChat.id))) {
                        try {
                            const finalModelMessages = get().messages.filter(msg => tempModelMessageIds.includes(msg.id));
                            for (const msg of finalModelMessages) {
                                if (!msg.isError) {
                                    const savedData = await createMessageDB(activeChat.id, msg);
                                    get().actions._updateMessage(msg.id, { id: savedData.id });
                                }
                            }
                        } catch (error) { console.error("Failed to save model messages:", error); }
                    }
                }
            },
            stopStream: () => {
                get().abortController?.abort();
                set({ isStreaming: false, abortController: null });
            },
            deleteMessage: async (messageId) => {
                const DIGIT_ONLY_REGEX = /^\d+$/;
                const originalMessages = get().messages;
                set(state => ({ messages: state.messages.filter(m => m.id !== messageId) }));

                if (DIGIT_ONLY_REGEX.test(messageId)) {
                    try { await deleteMessageDB(messageId); } catch (error) {
                        console.error("Failed to delete message from DB:", error);
                        set({ messages: originalMessages });
                        throw error;
                    }
                }
            },
            regenerateResponse: async (messageId) => {
                const { messages, isStreaming } = get();
                const { activeChatId, chats } = useChatSessionStore.getState();
                const { defaultSearchModel } = useAppStore.getState();
                const activeChat = chats.find(c => c.id === activeChatId);
                if (!activeChat || isStreaming) return;

                const messageIndex = messages.findIndex(m => m.id === messageId);
                if (messageIndex === -1) return;
                
                const messageToRegen = messages[messageIndex];
                if (messageToRegen.role !== 'model') return;

                let userMessageIndex = -1;
                for (let i = messageIndex - 1; i >= 0; i--) {
                    if (messages[i].role === 'user') { userMessageIndex = i; break; }
                }
                if (userMessageIndex === -1) return;

                const userMessage = messages[userMessageIndex];
                const effectiveMode = userMessage.sentWithMode || 'normal';
                
                let modelToUse: Model | string;
                let historyForApi: Message[];

                const baseHistory = messages.slice(0, userMessageIndex + 1);

                if (effectiveMode === 'search') {
                    modelToUse = defaultSearchModel;
                    historyForApi = [...messages.slice(0, userMessageIndex), { ...userMessage, text: `Using a web search, provide a comprehensive answer to the following question. Cite your sources. Question: "${userMessage.text}"` }];
                } else {
                    modelToUse = messageToRegen.sourceModel!;
                    historyForApi = baseHistory;
                }
                
                if (!modelToUse) {
                    console.error("Could not determine model for regeneration.");
                    return;
                }
                
                const controller = new AbortController();
                set({ isStreaming: true, abortController: controller });
                get().actions._updateMessage(messageId, { text: '', isLoading: true, isError: false });

                try {
                    await getChatCompletion({
                        model: modelToUse,
                        history: historyForApi,
                        systemPrompt: activeChat.systemPrompt,
                        signal: controller.signal,
                        onChunk: ({ text, isFinal, model: finalModel }) => {
                            const updates: Partial<Message> = { text };
                             if (isFinal) {
                                updates.isLoading = false;
                                if (finalModel && messageToRegen.sourceModel !== finalModel) updates.sourceModel = finalModel;
                            }
                            get().actions._updateMessage(messageId, updates);
                        }
                    });

                    if (!isNaN(Number(messageId))) {
                        const finalMsg = get().messages.find(m => m.id === messageId);
                        if (finalMsg) await updateMessageDB(messageId, { content: finalMsg.text });
                    }
                } catch (error) {
                    if (error instanceof DOMException && error.name === 'AbortError') {
                        get().actions._updateMessage(messageId, { text: 'Generation stopped.', isError: true, isLoading: false });
                    } else {
                        get().actions._updateMessage(messageId, { text: getFriendlyErrorMessage(error, modelToUse), isError: true, isLoading: false });
                    }
                } finally {
                    set({ isStreaming: false, abortController: null });
                    useChatSessionStore.getState().actions._updateChat(activeChat.id, {});
                }
            },
            _addMessage: (message) => set(state => ({ messages: [...state.messages, message] })),
            _updateMessage: (id, updates) => set(state => ({
                messages: state.messages.map(m => m.id === id ? { ...m, ...updates } : m)
            })),
        }
    }
});
