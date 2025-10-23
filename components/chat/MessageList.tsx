import React, { useRef, useEffect, useState } from 'react';
import type { Message } from '../../types';
import { useChatMessagesStore } from '../../store/chat';
import { ChatMessage } from './ChatMessage';
import { CopyIcon, RefreshCcwIcon, MoreHorizontalIcon, Trash2Icon } from '../Icons';
import { useChatSessionStore } from '../../store/chat';
import { LoadingSpinner } from '../LoadingSpinner';
import ConfirmationModal from '../ConfirmationModal';

interface MessageListProps {
    chatId: string;
    onDeleteMessage: (messageId: string) => void;
    onRegenerateResponse: (messageId: string) => void;
    onSendMessage?: (message: string) => void;
}

interface MessageTurn {
    userMessage: Message | null;
    modelMessages: Message[];
}

// Encapsulated Menu Component to handle its own state and click-outside logic
const MessageMenu: React.FC<{ children: React.ReactNode, buttonClassName: string, icon?: React.ReactNode }> = ({ children, buttonClassName, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const childrenWithCloseOnClick = React.Children.map(children, child => {
        // FIX: Add a generic type to `isValidElement` to inform TypeScript that `child` is a React element that accepts an `onClick` prop.
        // This resolves the error where `onClick` was not a known property on a generic React element.
        if (React.isValidElement<{ onClick?: React.MouseEventHandler }>(child)) {
            return React.cloneElement(child, {
                onClick: (e: React.MouseEvent) => {
                    // Call the original onClick handler if it exists.
                    if (child.props.onClick) {
                        child.props.onClick(e);
                    }
                    setIsOpen(false);
                }
            });
        }
        return child;
    });

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(p => !p); }}
                className={buttonClassName}
                aria-label="More options"
            >
                {icon || <MoreHorizontalIcon />}
            </button>
            {isOpen && (
                <div 
                    className="dropdown-menu-content absolute top-full right-0 mt-1 z-50"
                >
                    {childrenWithCloseOnClick}
                </div>
            )}
        </div>
    );
};

export const MessageList: React.FC<MessageListProps> = React.memo(({ chatId, onDeleteMessage, onRegenerateResponse, onSendMessage }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const messages = useChatMessagesStore(s => s.messages);
    const isLoading = useChatMessagesStore(s => s.isLoading);
    const isStreaming = useChatMessagesStore(s => s.isStreaming);
    
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const [deleteMessageType, setDeleteMessageType] = useState<'user' | 'response'>('user');
    
    const activeChat = useChatSessionStore(s => {
        const { chats, activeChatId } = s;
        return activeChatId ? chats.find(c => c.id === activeChatId) : undefined;
    });

    const handleDeleteMessage = (messageId: string, type: 'user' | 'response') => {
        setMessageToDelete(messageId);
        setDeleteMessageType(type);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteMessage = () => {
        if (messageToDelete) {
            onDeleteMessage(messageToDelete);
            setMessageToDelete(null);
            setShowDeleteConfirm(false);
        }
    };
    //     const { chats, activeChatId } = s;
    //     return activeChatId ? chats.find(c => c.id === activeChatId) : undefined;
    // });

    // Auto-scroll on new messages or when content changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Continuous auto-scroll during streaming
    useEffect(() => {
        if (!isStreaming) return;

        const scrollToBottom = () => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        };

        // Continuous scrolling during streaming with RAF for smoothness
        let rafId: number;
        const scroll = () => {
            scrollToBottom();
            if (isStreaming) {
                rafId = requestAnimationFrame(scroll);
            }
        };
        
        rafId = requestAnimationFrame(scroll);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [isStreaming]);

    if (isLoading) {
        return (
            <div className="flex-1 overflow-y-auto flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner message="Loading conversation..." />
                </div>
            </div>
        );
    }

    const messageTurns = messages.reduce((acc: MessageTurn[], msg) => {
        if (msg.role === 'user') {
            acc.push({ userMessage: msg, modelMessages: [] });
        } else { // model message
            const lastTurn = acc[acc.length - 1];
            if (lastTurn && lastTurn.userMessage !== null) {
                lastTurn.modelMessages.push(msg);
            } else {
                // Orphaned model message, create a new turn for it
                acc.push({ userMessage: null, modelMessages: [msg] });
            }
        }
        return acc;
    }, []);

    const suggestionPrompts = [
        {
            icon: 'code',
            title: 'Code Assistant',
            prompt: 'Help me write clean, efficient code. I need assistance with programming tasks, debugging, or code reviews.',
            color: 'border-[var(--jackfruit-accent)]/30'
        },
        {
            icon: 'campaign',
            title: 'Marketing Expert',
            prompt: 'Create compelling marketing content. Help me with copywriting, social media posts, or marketing strategies.',
            color: 'border-[var(--jackfruit-accent)]/30'
        },
        {
            icon: 'science',
            title: 'Research Assistant',
            prompt: 'Help me research and analyze information. I need detailed explanations, summaries, or academic assistance.',
            color: 'border-[var(--jackfruit-accent)]/30'
        },
        {
            icon: 'search',
            title: 'Internet Search',
            prompt: 'Search the web for current information. I need up-to-date facts, news, or real-time data.',
            color: 'border-[var(--jackfruit-accent)]/30'
        },
        {
            icon: 'edit_note',
            title: 'Content Writer',
            prompt: 'Write engaging content for me. Help with articles, blog posts, stories, or creative writing.',
            color: 'border-[var(--jackfruit-accent)]/30'
        },
        {
            icon: 'psychology',
            title: 'Problem Solver',
            prompt: 'Help me solve complex problems. I need logical thinking, brainstorming, or strategic planning assistance.',
            color: 'border-[var(--jackfruit-accent)]/30'
        }
    ];

    return (
        <div ref={scrollRef} className="h-full w-full overflow-y-auto">
            <div className="flex flex-col items-center min-h-full">
                {messages.length === 0 && onSendMessage && (
                    <div className="flex-1 flex items-center justify-center w-full px-4 py-8">
                        <div className="max-w-4xl w-full">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-[var(--jackfruit-light)] mb-2">How can I help you today?</h2>
                                <p className="text-sm md:text-base text-[var(--jackfruit-muted)]">Choose a scenario below or type your own message</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                {suggestionPrompts.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => onSendMessage(suggestion.prompt)}
                                        className={`group relative p-4 md:p-5 rounded-xl border-2 ${suggestion.color} bg-transparent hover:bg-[var(--jackfruit-accent)]/5 hover:border-[var(--jackfruit-accent)]/60 active:bg-[var(--jackfruit-accent)]/10 transition-all duration-300 text-left hover:shadow-lg hover:shadow-[var(--jackfruit-accent)]/20`}
                                    >
                                        <div className="flex items-center gap-3 mb-2 transition-transform duration-300 group-hover:translate-x-1">
                                            <span className="material-symbols-outlined text-2xl md:text-3xl text-[var(--jackfruit-accent)] transition-transform duration-300 group-hover:scale-110">{suggestion.icon}</span>
                                            <h3 className="font-bold text-sm md:text-base text-[var(--jackfruit-light)]">{suggestion.title}</h3>
                                        </div>
                                        <p className="text-xs md:text-sm text-[var(--jackfruit-muted)] leading-relaxed">
                                            {suggestion.prompt}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {messageTurns.map((turn) => (
                    <React.Fragment key={turn.userMessage?.id || turn.modelMessages[0].id}>
                        {turn.userMessage && (
                             <div className="w-full max-w-4xl mx-auto px-4 py-4 flex justify-end">
                                <div className="user-message-tile max-w-[85%] group relative">
                                    <ChatMessage message={turn.userMessage} isTile={true} />
                                    <div className="absolute top-1 right-1">
                                        <MessageMenu
                                            buttonClassName="p-1.5 rounded-full text-white/60 bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all hover:bg-white/20 hover:text-white z-10"
                                            icon={<MoreHorizontalIcon className="w-4 h-4" />}
                                        >
                                            <button 
                                                onClick={() => { 
                                                    if (turn.userMessage) {
                                                        handleDeleteMessage(turn.userMessage.id, 'user');
                                                    }
                                                }} 
                                                className="dropdown-menu-item danger"
                                            >
                                                <Trash2Icon className="w-4 h-4" /> Delete Message
                                            </button>
                                        </MessageMenu>
                                    </div>
                                </div>
                            </div>
                        )}
                        {turn.modelMessages.length > 0 && (
                            <div className="w-full max-w-4xl mx-auto px-4 pb-4 flex justify-start">
                                <div className="model-responses-grid max-w-[85%]">
                                    {turn.modelMessages.map((modelMsg) => {
                                        const colorClass = activeChat?.models.findIndex(m => m === modelMsg.sourceModel) ?? -1;
                                        const colorClassName = colorClass > -1 ? `model-color-${colorClass + 1}` : 'model-color-inactive';
                                        // const colorClass = modelIndex > -1 ? `model-color-${modelIndex + 1}` : 'model-color-inactive';

                                        return (
                                            <div key={modelMsg.id} id={`message-${modelMsg.id}`} className={`chat-message-tile-container group ${colorClassName}`}>
                                                <div className="chat-message-tile">
                                                    <ChatMessage message={modelMsg} isTile={true} />
                                                    <MessageMenu
                                                        buttonClassName="model-response-menu-button"
                                                    >
                                                        <button 
                                                            onClick={() => {
                                                                handleDeleteMessage(modelMsg.id, 'response');
                                                            }} 
                                                            className="dropdown-menu-item danger"
                                                        >
                                                            <Trash2Icon className="w-4 h-4" /> Delete
                                                        </button>
                                                    </MessageMenu>
                                                </div>
                                                <div className="model-response-actions">
                                                    <button onClick={() => navigator.clipboard.writeText(modelMsg.text)} className="model-response-action-button">
                                                        <CopyIcon className="w-4 h-4"/>
                                                        <span>Copy</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => onRegenerateResponse(modelMsg.id)} 
                                                        className="model-response-action-button"
                                                        disabled={messages.some(m => m.isLoading)}
                                                    >
                                                        <RefreshCcwIcon />
                                                        <span>Regenerate</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
            
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDeleteMessage}
                title={deleteMessageType === 'user' ? 'Delete Message' : 'Delete Response'}
                message={deleteMessageType === 'user' 
                    ? 'Are you sure you want to delete this message? This action cannot be undone.' 
                    : 'Are you sure you want to delete this response?'}
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </div>
    );
});
