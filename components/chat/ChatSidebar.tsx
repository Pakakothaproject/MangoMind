import React, { useState, useRef, useEffect } from 'react';
// FIX: Import the `Chat` type to correctly type the `ChatListItem` component's props.
import type { Chat } from '../../types';
import { EditIcon, Trash2Icon, ChevronDownIcon, ChevronUpIcon, MoreHorizontalIcon } from '../Icons';
import { useChatSessionStore } from '../../store/chat';
import { useAppStore } from '../../store/appStore';
import ConfirmationModal from '../ConfirmationModal';


const ChatListItem: React.FC<{
    // FIX: The `chat` prop is a chat object, not a persona. Changed type from `Omit<Persona, 'messages'>` to `Omit<Chat, 'messages'>`.
    chat: Omit<Chat, 'messages'>;
    isActive: boolean;
    onSelect: () => void;
}> = ({ chat, isActive, onSelect }) => {
    const { renameChat, deleteChat, togglePinChat } = useChatSessionStore(s => s.actions);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(chat.title);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    useEffect(() => {
        setTitle(chat.title);
    }, [chat.title]);

    const handleRename = () => {
        if (title.trim() && title.trim() !== chat.title) {
            renameChat(chat.id, title.trim());
        } else {
            setTitle(chat.title);
        }
        setIsEditing(false);
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(prev => !prev);
    };

    return (
        <div 
            className={`flex items-center gap-2 pr-1 rounded-lg cursor-pointer relative transition-colors ${isActive ? 'bg-[var(--jackfruit-hover-dark)] border-l-2 border-[var(--jackfruit-accent)]' : 'hover:bg-[var(--jackfruit-hover-dark)] border-l-2 border-transparent'}`}
            style={{ paddingLeft: isActive ? 'calc(0.5rem - 2px)' : '0.5rem' }}
            onClick={() => !isEditing && onSelect()}
            draggable="true"
            onDragStart={(e) => {
                e.dataTransfer.setData('chatId', chat.id);
                e.dataTransfer.effectAllowed = 'move';
            }}
        >
            <span className="material-symbols-outlined text-[var(--jackfruit-muted)] cursor-grab touch-none" style={{fontSize: '20px'}}>drag_indicator</span>
            <div className="flex-1 truncate py-2">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') {
                                setTitle(chat.title);
                                setIsEditing(false);
                            }
                        }}
                        className="w-full bg-transparent outline-none text-[var(--jackfruit-light)]"
                    />
                ) : (
                    <span className={`font-medium ${isActive ? 'text-white' : 'text-[var(--jackfruit-light)]'}`}>{chat.title}</span>
                )}
            </div>
            {!isEditing && (
                 <div className="flex-shrink-0 relative" ref={menuRef}>
                    <button onClick={handleMenuClick} className="p-1 text-[var(--jackfruit-muted)] hover:text-white" title="More options">
                        <MoreHorizontalIcon />
                    </button>
                    {isMenuOpen && (
                        <div className="dropdown-menu-content absolute top-full right-0 mt-1 chat-list-item-menu">
                            <button onClick={(e) => { e.stopPropagation(); togglePinChat(chat.id); setIsMenuOpen(false);}} className="dropdown-menu-item">
                                <span className="material-symbols-outlined !text-base" style={{ transform: chat.pinned ? 'none' : 'rotate(45deg)'}}>push_pin</span>
                                {chat.pinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsMenuOpen(false);}} className="dropdown-menu-item">
                                <EditIcon className="w-4 h-4"/>
                                Rename
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); setIsMenuOpen(false);}} className="dropdown-menu-item danger">
                                <Trash2Icon className="w-4 h-4"/>
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const CategorySection: React.FC<{ title: string; children: React.ReactNode; isCollapsed: boolean; onToggle: () => void; onDelete?: () => void; onDrop: (e: React.DragEvent) => void; }> = ({ title, children, isCollapsed, onToggle, onDelete, onDrop }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    
    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onDrop(e); }}
            className={`rounded-lg transition-all relative ${isDragOver ? 'drop-zone-active' : ''}`}
        >
            <div className="drop-zone-overlay">
                <span className="font-semibold text-sm text-[var(--jackfruit-accent)]">Move to {title}</span>
            </div>
            <div className="group/category w-full flex items-center justify-between p-2 rounded-lg">
                <button onClick={onToggle} className="flex-1 flex items-center gap-2 text-left">
                     <span className="material-symbols-outlined !text-base text-[var(--jackfruit-muted)]">folder_open</span>
                    <h2 className="text-xs font-semibold text-[var(--jackfruit-muted)] uppercase">{title}</h2>
                </button>
                 <div className="flex items-center">
                    {onDelete && (
                        <button onClick={onDelete} className="p-1 text-[var(--jackfruit-muted)] hover:text-white opacity-0 group-hover/category:opacity-100 transition-opacity" title={`Delete "${title}" section`}>
                            <Trash2Icon className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={onToggle} className="p-1 text-[var(--jackfruit-muted)] hover:text-white">
                        {isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
                    </button>
                </div>
            </div>
            {!isCollapsed && <div className="mt-1 space-y-1 px-2 pb-2">{children}</div>}
        </div>
    );
};

interface ChatSidebarProps {
    onChatSelect: (id: string) => void;
    onNewChat: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ onChatSelect, onNewChat }) => {
    const { chats, categories, activeChatId, collapsedCategories, actions: sessionActions } = useChatSessionStore();
    // FIX: `showBottomNavTemporarily` is nested under the 'actions' property in the store.
    const appActions = useAppStore(state => state.actions);
    const { showBottomNavTemporarily, navigateToPersonas } = appActions;

    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    // TODO: Search functionality needs to be re-implemented with the new store structure.
    // For now, we just filter by title.
    const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const handleDrop = (category: string, e: React.DragEvent) => {
        const chatId = e.dataTransfer.getData('chatId');
        if (chatId) {
            sessionActions.setChatCategory(chatId, category);
        }
    };
    
    const pinnedChats = filteredChats.filter(c => c.pinned);
    const uncategorizedChats = filteredChats.filter(c => !c.pinned && (c.category === 'Uncategorized' || !c.category));
    const categorizedChats = filteredChats.filter(c => !c.pinned && c.category && c.category !== 'Uncategorized');

    // Ensure default categories are always in the list for grouping
    const allCategories = Array.from(new Set(['Work', 'Personal', ...categories])).sort();

    const chatsByCategory = allCategories.reduce<Record<string, (typeof chats[0])[]>>((acc, category) => {
        acc[category] = categorizedChats.filter(c => c.category === category);
        return acc;
    }, {});

    const handleDeleteCategory = (category: string) => {
        setCategoryToDelete(category);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteCategory = () => {
        if (categoryToDelete) {
            sessionActions.deleteCategory(categoryToDelete);
            setCategoryToDelete(null);
            setShowDeleteConfirm(false);
        }
    };
    
    return (
        <aside className="w-full md:w-80 bg-[var(--jackfruit-dark)] flex flex-col p-4 border-r border-[var(--jackfruit-darker)] h-full">
            <div className="flex items-center space-x-3 mb-4">
                <img alt="MangoMind logo" className="w-10 h-10 rounded-lg" src="https://res.cloudinary.com/dy80ftu9k/image/upload/v1760277916/SADW_eed6gu.png" />
                <h1 className="text-2xl font-bold text-[var(--jackfruit-light)]">MangoMind</h1>
            </div>
            <button onClick={onNewChat} className="w-full text-left bg-[var(--jackfruit-accent)] text-[var(--jackfruit-dark)] font-semibold py-2 px-4 rounded-lg flex items-center justify-between hover:opacity-90 transition-opacity mb-4">
                <span>New Chat</span>
                <span className="material-symbols-outlined">add</span>
            </button>
            <div className="relative mb-4">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--jackfruit-muted)]">search</span>
                <input 
                    className="w-full bg-[var(--jackfruit-background)] border border-[var(--jackfruit-darker)] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--jackfruit-accent)] text-[var(--jackfruit-light)] placeholder-[var(--jackfruit-muted)]" 
                    placeholder="Search chats..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex-grow overflow-y-auto -mr-2 pr-2 space-y-2">
                {pinnedChats.length > 0 && (
                     <CategorySection title="Pinned" isCollapsed={collapsedCategories['pinned'] || false} onToggle={() => sessionActions.toggleCategoryCollapse('pinned')} onDrop={(e) => {
                        const chatId = e.dataTransfer.getData('chatId');
                        const chat = chats.find(c => c.id === chatId);
                        if (chat && !chat.pinned) sessionActions.togglePinChat(chatId);
                     }}>
                        {pinnedChats.map(chat => (
                            <ChatListItem key={chat.id} chat={chat} isActive={chat.id === activeChatId} onSelect={() => onChatSelect(chat.id)} />
                        ))}
                    </CategorySection>
                )}
                
                <div 
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drop-zone-active'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('drop-zone-active'); }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drop-zone-active'); handleDrop('Uncategorized', e); }}
                    className="space-y-1 rounded-lg transition-all pt-2 relative"
                >
                    <div className="drop-zone-overlay">
                        <span className="font-semibold text-sm text-[var(--jackfruit-accent)]">Move to Recents</span>
                    </div>
                    {uncategorizedChats.map(chat => (
                        <ChatListItem key={chat.id} chat={chat} isActive={chat.id === activeChatId} onSelect={() => onChatSelect(chat.id)} />
                    ))}
                </div>

                {(pinnedChats.length > 0 || uncategorizedChats.length > 0) && (categorizedChats.length > 0 || allCategories.length > 0) && (
                    <div className="w-full h-px bg-[var(--jackfruit-darker)] my-2"></div>
                )}
                
                {allCategories.map(category => (
                    (chatsByCategory[category] && chatsByCategory[category].length > 0) && (
                        <CategorySection 
                            key={category} 
                            title={category}
                            isCollapsed={collapsedCategories[category] || false}
                            onToggle={() => sessionActions.toggleCategoryCollapse(category)}
                            onDelete={ (category !== 'Work' && category !== 'Personal') ? () => handleDeleteCategory(category) : undefined }
                            onDrop={(e) => handleDrop(category, e)}
                        >
                            {chatsByCategory[category].map(chat => (
                                <ChatListItem key={chat.id} chat={chat} isActive={chat.id === activeChatId} onSelect={() => onChatSelect(chat.id)} />
                            ))}
                        </CategorySection>
                    )
                ))}
            </div>
            <div className="flex-shrink-0 pt-4 border-t border-[var(--jackfruit-darker)] space-y-2">
                <div className="grid grid-cols-2 gap-2 md:hidden">
                    <button
                        onClick={navigateToPersonas}
                        title="Personas"
                        className="w-full text-center text-[var(--jackfruit-muted)] font-semibold py-1 px-2 rounded-lg flex flex-col items-center justify-center hover:bg-[var(--jackfruit-hover-dark)] hover:text-white transition-colors text-sm"
                    >
                        <span className="material-symbols-outlined">person_pin</span>
                        <span className="text-xs mt-1">Personas</span>
                    </button>
                    <button
                        onClick={showBottomNavTemporarily}
                        title="Navigation"
                        className="w-full bg-[var(--nb-accent)] text-black font-semibold flex flex-col items-center justify-center rounded-lg py-1 px-2 hover:opacity-90 transition-opacity"
                    >
                        <span className="material-symbols-outlined">explore</span>
                        <span className="text-xs mt-1">Navigate</span>
                    </button>
                </div>
                <div className="hidden md:block">
                    <button
                        onClick={navigateToPersonas}
                        className="w-full text-center text-[var(--jackfruit-muted)] font-semibold py-2 px-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[var(--jackfruit-hover-dark)] hover:text-white transition-colors text-sm"
                    >
                        <span className="material-symbols-outlined">person_pin</span>
                        Explore Personas
                    </button>
                </div>
            </div>
            
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDeleteCategory}
                title="Delete Category"
                message={`Are you sure you want to delete the "${categoryToDelete}" category? This will move all chats to Uncategorized.`}
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </aside>
    );
};
