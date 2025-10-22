// services/aimlapiService.ts
import { supabase, supabaseUrl } from './supabaseClient';
import { logTokenUsage } from './tokenService';
import type { AttachedImage } from '../types';

const API_PROXY_URL = `${supabaseUrl}/functions/v1/aimlapi`;

// This function will handle both text-only and multimodal (text+image) requests
export const getSingleCompletion = async ({
    model,
    messages, // A simplified message array
    systemPrompt,
}: {
    model: string;
    messages: Array<{
        role: 'user' | 'model';
        text?: string;
        images?: AttachedImage[];
    }>;
    systemPrompt?: string;
}): Promise<string> => {
    // Format messages for OpenAI-compatible API
    const apiMessages: any[] = [];
    if (systemPrompt) {
        apiMessages.push({ role: 'system', content: systemPrompt });
    }

    messages.forEach(msg => {
        const content: any[] = [];
        if (msg.text) {
            content.push({ type: 'text', text: msg.text });
        }
        if (msg.images) {
            msg.images.forEach(img => {
                content.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${img.type};base64,${img.base64}`
                    }
                });
            });
        }
        
        // If content has only one item and it's text, we can use the simple format
        const finalContent = content.length === 1 && content[0].type === 'text'
            ? content[0].text
            : content;
            
        apiMessages.push({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: finalContent
        });
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("User not authenticated.");

    const response = await fetch(API_PROXY_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: apiMessages,
            stream: false,
        }),
    });
    
    if (!response.ok) {
        let errorMsg = `API error: ${response.statusText}`;
        try { const errorData = await response.json(); errorMsg = errorData.error || errorData.message || errorMsg; } catch (e) { /* ignore */ }
        throw new Error(errorMsg);
    }
    
    const result = await response.json();

    if (result.usage) {
      await logTokenUsage({
          model_used: model,
          feature: 'single-completion-aimlapi',
          input_tokens: result.usage.prompt_tokens,
          output_tokens: result.usage.completion_tokens,
          total_tokens: result.usage.total_tokens,
      }, false);
    }

    const content = result.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('API returned an empty response.');
    }
    return content;
}