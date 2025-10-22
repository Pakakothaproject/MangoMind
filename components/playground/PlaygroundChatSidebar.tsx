import React, { useState, useRef, useEffect } from 'react';
// FIX: The PlaygroundChat type is defined in the playground store, not the global types file.
// Correcting by importing the base Chat type and creating a local alias.
import type { Persona, Chat } from '../../types';
import { EditIcon, Trash2Icon, ChevronDownIcon, ChevronUpIcon, MoreHorizontalIcon } from '../Icons';
import { useChatSessionStore, usePersonaStore } from '../../store/chat';
import ConfirmationModal from '../ConfirmationModal';

// Define PlaygroundChat locally to fix the missing type issue.
type PlaygroundChat = Omit<Chat, 'messages'>;

const PersonaButton: React.FC<{ 
    icon: string; 
    label: string; 
    onClick: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}> = ({ icon, label, onClick, onEdit, onDelete }) => (
    <div className="group w-full flex items-center gap-3 p-2 rounded-lg text-[var(--jackfruit-light)] hover:bg-[var(--jackfruit-hover-dark)] transition-colors text-left" role="button" onClick={onClick}>
        <span className="material-symbols-outlined text-[var(--jackfruit-accent)] text-2xl">{icon}</span>
        <span className="font-semibold flex-1 truncate">{label}</span>
        {onEdit && onDelete && (
            <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-[var(--jackfruit-muted)] hover:text-white" title="Edit Persona"><EditIcon className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-[var(--jackfruit-muted)] hover:text-white" title="Delete Persona"><Trash2Icon className="w-4 h-4" /></button>
            </div>
        )}
    </div>
);

const ChatListItem: React.FC<{
    chat: PlaygroundChat;
    isActive: boolean;
    onSelect: () => void;
}> = ({ chat, isActive, onSelect }) => {
    // FIX: Corrected store usage to get actions from useChatSessionStore.
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
                 <div className="flex-shrink-0 relative group" ref={menuRef}>
                    <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p); }} className="p-1 text-[var(--jackfruit-muted)] hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100" title="More options">
                        <MoreHorizontalIcon />
                    </button>
                    {isMenuOpen && (
                        <div className="dropdown-menu-content absolute top-full right-0 mt-1 chat-list-item-menu">
                            <button onClick={(e) => { e.stopPropagation(); togglePinChat(chat.id); setIsMenuOpen(false);}} className="dropdown-menu-item">
                                <span className="material-symbols-outlined !text-base" style={{ transform: chat.pinned ? 'none' : 'rotate(45deg)'}}>push_pin</span>
                                {chat.pinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsMenuOpen(false);}} className="dropdown-menu-item">
                                <EditIcon className="w-4 h-4"/> Rename
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); setIsMenuOpen(false);}} className="dropdown-menu-item danger">
                                <Trash2Icon className="w-4 h-4"/> Delete
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


const PlaygroundChatSidebar: React.FC = () => {
    // FIX: Replaced usePlaygroundStore with the correct stores for chat functionality.
    const { chats, categories, activeChatId, actions: sessionActions } = useChatSessionStore();
    const { newChat, selectChat, addCategory, deleteCategory, setChatCategory, togglePinChat } = sessionActions;
    const { personas, actions: personaActions } = usePersonaStore();
    const { addPersona, updatePersona, deletePersona, setEditingPersona, togglePersonaModal } = personaActions;
    
    const [searchTerm, setSearchTerm] = useState('');
    const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [personaToDelete, setPersonaToDelete] = useState<string | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<'persona' | 'category' | null>(null);
    
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    const handleNewPersonaChat = (persona: Omit<Persona, 'id'>) => {
        newChat({ title: persona.name, systemPrompt: persona.systemPrompt });
    };

    const handleAddNewCategory = () => {
        if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
            addCategory(newCategoryName.trim());
            setNewCategoryName('');
            setIsAddingCategory(false);
        }
    };

    const handleDeletePersona = (personaId: string) => {
        setPersonaToDelete(personaId);
        setDeleteType('persona');
        setShowDeleteConfirm(true);
    };

    const handleDeleteCategory = (category: string) => {
        setCategoryToDelete(category);
        setDeleteType('category');
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (deleteType === 'persona' && personaToDelete) {
            await deletePersona(personaToDelete);
            setPersonaToDelete(null);
        } else if (deleteType === 'category' && categoryToDelete) {
            deleteCategory(categoryToDelete);
            setCategoryToDelete(null);
        }
        setDeleteType(null);
        setShowDeleteConfirm(false);
    };
    
    const handleDrop = (category: string, e: React.DragEvent) => {
        const chatId = e.dataTransfer.getData('chatId');
        if (chatId) {
            setChatCategory(chatId, category);
        }
    };
    
    const pinnedChats = filteredChats.filter(c => c.pinned);
    const uncategorizedChats = filteredChats.filter(c => !c.pinned && (c.category === 'Uncategorized' || !c.category));
    const categorizedChats = filteredChats.filter(c => !c.pinned && c.category && c.category !== 'Uncategorized');
    
    const allCategories = Array.from(new Set(['Work', 'Personal', ...categories])).sort();

    const chatsByCategory = allCategories.reduce<Record<string, PlaygroundChat[]>>((acc, category) => {
        acc[category] = categorizedChats.filter(c => c.category === category);
        return acc;
    }, {});
    
    return (
        <aside className="w-80 h-full bg-[#212121] flex flex-col p-4 border-l border-[var(--jackfruit-darker)]">
            <button onClick={() => newChat()} className="w-full text-left bg-[var(--jackfruit-accent)] text-[var(--jackfruit-dark)] font-semibold py-2 px-4 rounded-lg flex items-center justify-between hover:opacity-90 transition-opacity mb-4">
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
                     <CategorySection title="Pinned" isCollapsed={collapsedCategories['pinned'] || false} onToggle={() => setCollapsedCategories(p => ({...p, pinned: !p.pinned}))} onDrop={(e) => {
                        const chatId = e.dataTransfer.getData('chatId');
                        const chat = chats.find(c => c.id === chatId);
                        if (chat && !chat.pinned) togglePinChat(chatId);
                     }}>
                        {pinnedChats.map(chat => (
                            <ChatListItem key={chat.id} chat={chat} isActive={chat.id === activeChatId} onSelect={() => selectChat(chat.id)} />
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
                        <ChatListItem key={chat.id} chat={chat} isActive={chat.id === activeChatId} onSelect={() => selectChat(chat.id)} />
                    ))}
                </div>

                <div className="w-full h-px bg-[var(--jackfruit-darker)] my-2"></div>

                <CategorySection 
                    title="Personas" 
                    isCollapsed={collapsedCategories['personas'] || false} 
                    onToggle={() => setCollapsedCategories(p => ({...p, personas: !p.personas}))}
                    onDrop={() => {}}
                >
                    {personas.map(p => (
                        <PersonaButton 
                            key={p.id} 
                            {...p} 
                            label={p.name} 
                            onClick={() => handleNewPersonaChat(p)}
                            onEdit={() => { setEditingPersona(p); togglePersonaModal(); }}
                            onDelete={() => handleDeletePersona(p.id)}
                        />
                    ))}
                </CategorySection>
                
                {allCategories.map(category => (
                    (chatsByCategory[category] && chatsByCategory[category].length > 0) && (
                        <CategorySection 
                            key={category} 
                            title={category}
                            isCollapsed={collapsedCategories[category] || false}
                            onToggle={() => setCollapsedCategories(prev => ({...prev, [category]: !prev[category]}))}
                            onDelete={ (category !== 'Work' && category !== 'Personal') ? () => handleDeleteCategory(category) : undefined }
                            onDrop={(e) => handleDrop(category, e)}
                        >
                            {chatsByCategory[category].map(chat => (
                                <ChatListItem key={chat.id} chat={chat} isActive={chat.id === activeChatId} onSelect={() => selectChat(chat.id)} />
                            ))}
                        </CategorySection>
                    )
                ))}
            </div>
            <div className="flex-shrink-0 pt-4 border-t border-[var(--jackfruit-darker)] space-y-2">
                 {isAddingCategory && (
                    <div className="flex gap-2 animate-fade-in">
                        <input
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddNewCategory()}
                            placeholder="New section name..."
                            autoFocus
                            className="flex-grow bg-[var(--jackfruit-background)] border border-[var(--jackfruit-darker)] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--jackfruit-accent)] text-[var(--jackfruit-light)] placeholder-[var(--jackfruit-muted)] text-sm"
                        />
                        <button onClick={handleAddNewCategory} className="bg-[var(--jackfruit-hover-dark)] text-white px-3 rounded-lg text-sm font-semibold hover:bg-[var(--jackfruit-accent)] hover:text-black transition-colors">Add</button>
                    </div>
                 )}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => { setEditingPersona(null); togglePersonaModal(); }}
                        disabled={personas.length >= 5}
                        className="w-full text-center text-[var(--jackfruit-muted)] font-semibold py-2 px-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[var(--jackfruit-hover-dark)] hover:text-white transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined">person_add</span>
                        New Persona
                    </button>
                    <button
                        onClick={() => setIsAddingCategory(p => !p)}
                        className="w-full text-center text-[var(--jackfruit-muted)] font-semibold py-2 px-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[var(--jackfruit-hover-dark)] hover:text-white transition-colors text-sm"
                    >
                        <span className="material-symbols-outlined">create_new_folder</span>
                        Add Section
                    </button>
                </div>
            </div>
            
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title={deleteType === 'persona' ? "Delete Persona" : "Delete Category"}
                message={deleteType === 'persona' 
                    ? "Are you sure you want to delete this persona?" 
                    : `Are you sure you want to delete the "${categoryToDelete}" category? This will move all chats to Uncategorized.`
                }
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </aside>
    );
};

export default PlaygroundChatSidebar;
