import React, { useState } from 'react';
import { Model } from '../../types';
import type { AttachedImage, Chat } from '../../types';
import { useChatSessionStore, useChatMessagesStore } from '../../store/chat';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ModelSelectionModal } from './ModelSelectionModal';
import { SystemPromptModal } from './SystemPromptModal';

interface ChatWindowProps {
    chat: Omit<Chat, 'messages'>;
    isStreaming: boolean;
    onBack: () => void;
    onDeleteChat: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = React.memo(({
    chat,
    isStreaming,
    onBack,
    onDeleteChat,
}) => {
    const { 
        sendMessage, 
        stopStream, 
        deleteMessage,
        regenerateResponse 
    } = useChatMessagesStore(s => s.actions);

    const { 
        updateChatModels, 
        updateSystemPrompt, 
    } = useChatSessionStore(s => s.actions);

    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isSystemPromptModalOpen, setIsSystemPromptModalOpen] = useState(false);

    return (
        <div className="flex flex-col h-full w-full bg-[var(--jackfruit-background)] text-[var(--jackfruit-light)]">
            <ChatHeader
                title={chat.title}
                models={chat.models}
                onBack={onBack}
                onModelSelectClick={() => setIsModelModalOpen(true)}
                onSystemPromptClick={() => setIsSystemPromptModalOpen(true)}
                onDeleteChat={onDeleteChat}
            />
            <MessageList 
                chatId={chat.id}
                onDeleteMessage={deleteMessage}
                onRegenerateResponse={regenerateResponse}
            />
            <div className="px-4 pb-4">
                <ChatInput
                    onSendMessage={sendMessage}
                    isStreaming={isStreaming}
                    onStopStream={stopStream}
                />
            </div>
            <ModelSelectionModal
                isOpen={isModelModalOpen}
                onClose={() => setIsModelModalOpen(false)}
                currentModels={chat.models}
                onSave={(newModels) => updateChatModels(chat.id, newModels)}
            />
            <SystemPromptModal
                isOpen={isSystemPromptModalOpen}
                onClose={() => setIsSystemPromptModalOpen(false)}
                currentPrompt={chat.systemPrompt || ''}
                onSave={(newPrompt) => updateSystemPrompt(chat.id, newPrompt)}
            />
        </div>
    );
});
