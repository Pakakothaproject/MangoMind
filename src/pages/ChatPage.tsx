import React, { useState, useEffect } from 'react';
import { useChatSessionStore, useChatMessagesStore, usePersonaStore } from '../store/chat';
import { useAppStore } from '../store/appStore';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ModelGalleryPanel } from '../components/chat/ModelGalleryPanel';
import BottomNavBar from '../components/BottomNavBar';
import ConfirmationModal from '../components/ConfirmationModal';


const ChatPage: React.FC = () => {
    const { chats, activeChatId, isInitialized, actions: sessionActions } = useChatSessionStore();
    const { isStreaming } = useChatMessagesStore();
    const { personas, activePersonaId, actions: personaActions } = usePersonaStore();
    const { isMobileView, actions: appActions } = useAppStore();
    
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);

    const activeChat = chats.find(c => c.id === activeChatId) || null;
    const activePersona = personas.find(p => p.id === activePersonaId) || null;

    useEffect(() => {
        if (!isInitialized) {
            sessionActions.init();
        }
    }, [isInitialized, sessionActions]);

    useEffect(() => {
        if (!activePersona && personas.length > 0) {
            personaActions.setActivePersona(personas[0].id);
        }
    }, [activePersona, personas, personaActions]);

    useEffect(() => {
        const checkMobileView = () => {
            appActions.setIsMobileView(window.innerWidth < 768);
        };
        
        checkMobileView();
        window.addEventListener('resize', checkMobileView);
        
        return () => window.removeEventListener('resize', checkMobileView);
    }, [appActions]);

    const handleDeleteChat = (chatId: string) => {
        setChatToDelete(chatId);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteChat = async () => {
        if (chatToDelete) {
            await sessionActions.deleteChat(chatToDelete);
            setChatToDelete(null);
            setShowDeleteConfirm(false);
        }
    };

    if (!isInitialized) {
        return (
            <div className="flex h-full w-full bg-[var(--jackfruit-background)] font-display">
                <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner message="Loading chat..." />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-[var(--jackfruit-background)] font-display">
            {!isMobileView && (
                <div className="w-80 h-full flex-shrink-0">
                    <ChatSidebar 
                        onChatSelect={sessionActions.selectChat} 
                        onNewChat={sessionActions.newChat}
                        onDeleteChat={handleDeleteChat}
                    />
                </div>
            )}
            
            {/* Mobile: Show sidebar when no chat is selected */}
            {isMobileView && !activeChat && (
                <div className="w-full h-full">
                    <ChatSidebar 
                        onChatSelect={sessionActions.selectChat} 
                        onNewChat={sessionActions.newChat}
                        onDeleteChat={handleDeleteChat}
                    />
                </div>
            )}
            
            {/* Chat content area */}
            {(!isMobileView || activeChat) && (
                <div className="flex-1 h-full min-w-0">
                    {activeChat ? (
                        <ChatWindow
                            key={activeChat.id}
                            chat={activeChat}
                            isStreaming={isStreaming}
                            onBack={isMobileView ? () => sessionActions.selectChat('') : undefined}
                            onDeleteChat={() => handleDeleteChat(activeChat.id)}
                        />
                    ) : (
                        <div className="flex-1 h-full flex items-center justify-center text-center text-[var(--jackfruit-muted)]">
                            <div>
                                <span className="material-symbols-outlined text-6xl">chat_bubble</span>
                                <h2 className="text-2xl font-bold mt-4">Chat</h2>
                                <p>Select a chat or create a new one to begin.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ModelGalleryPanel />

            {isMobileView && <BottomNavBar />}

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDeleteChat}
                title="Delete Chat"
                message="Are you sure you want to delete this chat? This action cannot be undone."
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </div>
    );
};

export default ChatPage;