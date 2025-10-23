import React, { useState } from 'react';
import type { Chat } from '../../types';
import { useChatSessionStore, useChatMessagesStore } from '../../store/chat';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ModelSelectionModal } from './ModelSelectionModal';
import { SystemPromptModal } from './SystemPromptModal';
import { ModelNavigationDots } from './ModelNavigationDots';

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
    
    const messages = useChatMessagesStore(s => s.messages);

    const { 
        updateChatModels, 
        updateSystemPrompt, 
    } = useChatSessionStore(s => s.actions);

    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isSystemPromptModalOpen, setIsSystemPromptModalOpen] = useState(false);

    return (
        <div className="flex flex-col h-full w-full bg-[var(--jackfruit-background)] text-[var(--jackfruit-light)] chat-window-container">
            <ChatHeader
                title={chat.title}
                models={chat.models}
                onBack={onBack}
                onModelSelectClick={() => setIsModelModalOpen(true)}
                onSystemPromptClick={() => setIsSystemPromptModalOpen(true)}
                onDeleteChat={onDeleteChat}
            />
            <div className="flex-1 min-h-0 overflow-y-auto">
                <MessageList 
                    chatId={chat.id}
                    onDeleteMessage={deleteMessage}
                    onRegenerateResponse={regenerateResponse}
                    onSendMessage={(text) => sendMessage(text, [])}
                />
            </div>
            <div className="flex-shrink-0 chat-input-area safe-area-bottom relative">
                <div className="px-2 md:px-4 pb-1 relative">
                    {/* Bookmarks positioned absolutely above the input */}
                    <div className="absolute bottom-full left-0 flex items-center gap-1 px-2 md:px-4 ml-8 mb-[-2px]">
                        <ModelNavigationDots 
                            messages={messages}
                            activeModels={chat.models}
                            isStreaming={isStreaming}
                        />
                    </div>
                    <ChatInput
                        onSendMessage={sendMessage}
                        isStreaming={isStreaming}
                        onStopStream={stopStream}
                    />
                </div>
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
