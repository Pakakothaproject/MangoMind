import React, { useEffect, useState } from 'react';
import type { Message } from '../../types';

interface ModelNavigationDotsProps {
    messages: Message[];
    activeModels: (string | { id: string; name: string })[];
    isStreaming: boolean;
}

export const ModelNavigationDots: React.FC<ModelNavigationDotsProps> = ({ messages, activeModels, isStreaming }) => {
    const [modelResponses, setModelResponses] = useState<{ model: string; messageId: string; modelName: string }[]>([]);

    useEffect(() => {
        // Find the last user message and get all model responses after it
        const userMessages = messages.filter(m => m.role === 'user');
        if (userMessages.length === 0) return;

        const lastUserMessage = userMessages[userMessages.length - 1];
        const lastUserMessageIndex = messages.findIndex(m => m.id === lastUserMessage.id);
        
        // Get all model responses after the last user message
        const modelResponsesAfterLastUser = messages
            .slice(lastUserMessageIndex + 1)
            .filter(m => m.role === 'model' && m.sourceModel);

        // Group by model and get the first response for each
        const uniqueModels = new Map<string, { messageId: string; modelName: string }>();
        modelResponsesAfterLastUser.forEach(msg => {
            if (msg.sourceModel && !uniqueModels.has(msg.sourceModel)) {
                // Get model name from activeModels
                const modelInfo = activeModels.find(m => 
                    typeof m === 'string' ? m === msg.sourceModel : m.id === msg.sourceModel
                );
                const modelName = typeof modelInfo === 'string' 
                    ? modelInfo 
                    : modelInfo?.name || msg.sourceModel || 'Model';
                
                uniqueModels.set(msg.sourceModel, {
                    messageId: msg.id,
                    modelName: modelName.split('/').pop()?.split('-')[0] || modelName
                });
            }
        });

        const responses = Array.from(uniqueModels.entries()).map(([model, data]) => ({
            model,
            messageId: data.messageId,
            modelName: data.modelName
        }));

        setModelResponses(responses);
    }, [messages, activeModels]);

    const scrollToModel = (messageId: string) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const getModelColor = (model: string) => {
        const index = activeModels.findIndex(m => 
            typeof m === 'string' ? m === model : m.id === model
        );
        
        // Simple solid colors for clean bookmarks
        const colors = [
            { bg: 'bg-blue-500', text: 'text-white' },
            { bg: 'bg-green-500', text: 'text-white' },
            { bg: 'bg-purple-500', text: 'text-white' }
        ];
        
        return index >= 0 && index < colors.length 
            ? colors[index] 
            : { bg: 'bg-gray-500', text: 'text-white' };
    };

    // Don't show if no responses or still streaming
    if (modelResponses.length === 0 || isStreaming) return null;

    return (
        <>
            {modelResponses.map(({ model, messageId, modelName }) => {
                const colorScheme = getModelColor(model);
                return (
                    <button
                        key={model}
                        onClick={() => scrollToModel(messageId)}
                        className={`px-2 py-1 rounded-md ${colorScheme.bg} ${colorScheme.text} text-xs font-medium hover:opacity-80 transition-opacity duration-200 shadow-sm mb-1 mr-1`}
                        title={`Scroll to ${modelName} response`}
                    >
                        {modelName}
                    </button>
                );
            })}
        </>
    );
};
