import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChatSessionStore, useChatMessagesStore, usePersonaStore } from '../store/chat';
import { useAppStore } from '../store/appStore';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ModelGalleryPanel } from '../components/chat/ModelGalleryPanel';
import BottomNavBar from '../components/BottomNavBar';
import ConfirmationModal from '../components/ConfirmationModal';


const ChatPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { chats, activeChatId, isInitialized, actions: sessionActions } = useChatSessionStore();
    const { isStreaming } = useChatMessagesStore();
    const { personas, activePersonaId, actions: personaActions } = usePersonaStore();
    const { isMobileView, actions: appActions } = useAppStore();
    
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    const [initError, setInitError] = useState<string | null>(null);

    const activeChat = chats.find(c => c.id === activeChatId) || null;
    const activePersona = personas.find(p => p.id === activePersonaId) || null;
    
    // Get chat ID from URL
    const urlChatId = searchParams.get('chatId');

    // Initialize chat session with error handling and timeout
    useEffect(() => {
        const initChat = async () => {
            try {
                if (!isInitialized) {
                    console.log('Initializing chat session...');
                    
                    // Add timeout to prevent infinite loading
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Initialization timeout')), 15000)
                    );
                    
                    await Promise.race([
                        sessionActions.init(),
                        timeoutPromise
                    ]);
                    
                    console.log('Chat session initialized successfully');
                    setInitError(null);
                }
            } catch (error) {
                console.error('Failed to initialize chat:', error);
                setInitError('Failed to load chat. Please try refreshing the page.');
            }
        };
        initChat();
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
    
    // Sync URL with active chat - only after initialization is complete
    useEffect(() => {
        if (!isInitialized) return; // Wait for initialization to complete
        
        if (urlChatId && urlChatId !== activeChatId) {
            // URL has a chat ID, select it
            sessionActions.selectChat(urlChatId);
        } else if (!urlChatId && activeChatId && isMobileView) {
            // No URL chat ID but we have an active chat on mobile - clear it
            sessionActions.selectChat('');
        }
    }, [urlChatId, activeChatId, isMobileView, sessionActions, isInitialized]);
    
    // Handle chat selection with URL update
    const handleChatSelect = (chatId: string) => {
        if (chatId) {
            // Set URL parameter for browser back button support
            setSearchParams({ chatId });
        } else {
            // Clear URL parameter when going back to list
            setSearchParams({});
        }
        sessionActions.selectChat(chatId);
    };
    
    // Handle back navigation
    const handleBack = () => {
        // Clear URL parameter and chat selection
        setSearchParams({});
        sessionActions.selectChat('');
    };

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

    // Show loading or error state
    if (!isInitialized) {
        return (
            <div className="flex h-full w-full bg-[var(--jackfruit-background)] font-display">
                <div className="flex-1 flex items-center justify-center p-4">
                    {initError ? (
                        <div className="text-center">
                            <span className="material-symbols-outlined text-6xl text-red-500">error</span>
                            <h2 className="text-xl font-bold mt-4 text-[var(--jackfruit-light)]">{initError}</h2>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="mt-4 px-4 py-2 bg-[var(--nb-primary)] text-black rounded-lg hover:opacity-90"
                            >
                                Refresh Page
                            </button>
                        </div>
                    ) : (
                        <LoadingSpinner message="Loading chat..." />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-[var(--jackfruit-background)] font-display overflow-hidden">
            {/* Desktop: Always show sidebar */}
            {!isMobileView && (
                <div className="w-64 h-full flex-shrink-0 border-r border-[var(--jackfruit-border)]">
                    <ChatSidebar 
                        onChatSelect={handleChatSelect} 
                        onNewChat={sessionActions.newChat}
                    />
                </div>
            )}
            
            {/* Mobile: Show sidebar when no chat is selected */}
            {isMobileView && !activeChat && (
                <div className="w-full h-full">
                    <ChatSidebar 
                        onChatSelect={handleChatSelect} 
                        onNewChat={sessionActions.newChat}
                    />
                </div>
            )}
            
            {/* Chat content area */}
            {(!isMobileView || activeChat) && (
                <div className="flex-1 h-full min-w-0 flex flex-col">
                    {activeChat ? (
                        <ChatWindow
                            key={activeChat.id}
                            chat={activeChat}
                            isStreaming={isStreaming}
                            onBack={isMobileView ? handleBack : undefined}
                            onDeleteChat={() => handleDeleteChat(activeChat.id)}
                        />
                    ) : (
                        <div className="flex-1 h-full flex items-center justify-center text-center text-[var(--jackfruit-muted)] p-4">
                            <div>
                                <span className="material-symbols-outlined text-6xl">chat_bubble</span>
                                <h2 className="text-xl md:text-2xl font-bold mt-4">Chat</h2>
                                <p className="text-sm md:text-base">Select a chat or create a new one to begin.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ModelGalleryPanel />

            {/* Mobile bottom nav - only show when not in active chat to avoid overlap */}
            {isMobileView && !activeChat && <BottomNavBar />}

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

ChatPage.displayName = 'ChatPage';

export default ChatPage;