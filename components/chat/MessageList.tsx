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
                    className="dropdown-menu-content absolute top-full right-0 mt-1 z-10"
                >
                    {childrenWithCloseOnClick}
                </div>
            )}
        </div>
    );
};

export const MessageList: React.FC<MessageListProps> = React.memo(({ chatId, onDeleteMessage, onRegenerateResponse }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const messages = useChatMessagesStore(s => s.messages);
    const isLoading = useChatMessagesStore(s => s.isLoading);
    
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

    useEffect(() => {
        if (scrollRef.current && messages.length > 0) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

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

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center">
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
                                            <div key={modelMsg.id} className={`chat-message-tile-container group ${colorClassName}`}>
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
