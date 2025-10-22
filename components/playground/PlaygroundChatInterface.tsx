import React from 'react';
import { ChatSidebar } from '../chat/ChatSidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { useChatSessionStore, useChatMessagesStore } from '../../store/chat';
import { LoadingSpinner } from '../LoadingSpinner';

const PlaygroundChatInterface: React.FC = () => {
    const { chats, activeChatId, isInitialized, actions: sessionActions } = useChatSessionStore();
    const { isStreaming } = useChatMessagesStore();
    
    const activeChat = chats.find(c => c.id === activeChatId) || null;

    if (!isInitialized) {
        return (
            <div className="flex-1 h-full flex items-center justify-center">
                <LoadingSpinner message="Loading chat..." />
            </div>
        );
    }
    
    return (
        <div className="flex-1 h-full flex overflow-hidden">
            <div className="flex-1 h-full min-w-0">
                {activeChat ? (
                    <ChatWindow
                        key={activeChat.id}
                        chat={activeChat}
                        isStreaming={isStreaming}
                        onBack={() => {}} // No back button needed in playground
                        onDeleteChat={() => sessionActions.deleteChat(activeChat.id)}
                    />
                ) : (
                    <div className="flex-1 h-full flex items-center justify-center text-center text-[var(--jackfruit-muted)]">
                        <div>
                            <span className="material-symbols-outlined text-6xl">chat_bubble</span>
                            <h2 className="text-2xl font-bold mt-4">Playground Chat</h2>
                            <p>Select a chat or create a new one to begin.</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="w-80 h-full flex-shrink-0">
                <ChatSidebar onChatSelect={sessionActions.selectChat} onNewChat={sessionActions.newChat} />
            </div>
        </div>
    );
};

export default PlaygroundChatInterface;