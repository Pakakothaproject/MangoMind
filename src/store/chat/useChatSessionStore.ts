import { create } from 'zustand';
import { generateId } from '../../utils/chatUtils';
import {
    getChats,
    createChatDB,
    updateChatDB,
    deleteChatDB,
    getCategories,
    createCategoryDB,
    deleteCategoryDB,
} from '../../services/chatService';
import { supabase } from '../../services/supabaseClient';
import { getUserPreferences, updateUserPreferences } from '../../services/preferencesService';
import type { Chat, Model, ChatMode } from '../../types';

import { DEFAULT_TEXT_GEN_MODEL } from '../../constants/models';
// FIX: The function `getEnabledChatModels` is not used in this file and does not exist.
// import { getEnabledChatModels } from '../../services/configService';

interface ChatSessionState {
    chats: Omit<Chat, 'messages'>[];
    categories: string[];
    activeChatId: string | null;
    isInitialized: boolean;
    isModelGalleryOpen: boolean;
    isSystemPromptModalOpen: boolean;
    collapsedCategories: Record<string, boolean>;

    actions: {
        init: () => Promise<void>;
        newChat: (options?: { title?: string; systemPrompt?: string; models?: (Model | string)[] }) => Promise<string>;
        selectChat: (id: string) => void;
        deleteChat: (id: string) => Promise<void>;
        renameChat: (id: string, newTitle: string) => Promise<void>;
        updateChatModels: (id: string, models: (Model | string)[]) => Promise<void>;
        updateSystemPrompt: (id: string, newPrompt: string) => Promise<void>;
        setChatCategory: (chatId: string, category: string) => void;
        togglePinChat: (chatId: string) => void;
        setChatMode: (chatId: string, mode: ChatMode) => void;
        addCategory: (name: string) => Promise<void>;
        deleteCategory: (name: string) => Promise<void>;
        toggleModelGallery: () => void;
        toggleSystemPromptModal: () => void;
        toggleCategoryCollapse: (category: string) => void;
        // Internal actions
        _addChat: (chat: Chat) => void;
        _updateChat: (chatId: string, updates: Partial<Chat>) => void;
    };
}

export const useChatSessionStore = create<ChatSessionState>((set, get) => ({
    chats: [],
    categories: [],
    activeChatId: null,
    isInitialized: false,
    isModelGalleryOpen: false,
    isSystemPromptModalOpen: false,
    collapsedCategories: {},

    actions: {
        init: async () => {
            if (get().isInitialized) return;
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                set({ isInitialized: true, chats: [], activeChatId: null, categories: [], collapsedCategories: {} });
                await get().actions.newChat(); // Create an initial local chat for logged-out users
                return;
            }

            try {
                const [chatsFromDB, categoriesFromDB, preferences] = await Promise.all([
                    getChats(user.id),
                    getCategories(user.id),
                    getUserPreferences(),
                ]);
                
                const collapsedCategories = preferences?.chatCollapsedCategories || {};

                if (chatsFromDB.length > 0) {
                    set({ chats: chatsFromDB, categories: categoriesFromDB, activeChatId: chatsFromDB[0].id, isInitialized: true, collapsedCategories });
                } else {
                    set({ isInitialized: true, categories: categoriesFromDB, collapsedCategories });
                    await get().actions.newChat();
                }
            } catch (error) {
                console.error("Failed to load user session data:", error);
                set({ isInitialized: true, categories: [] });
            }
        },
        newChat: async (options) => {
            const { data: { user } } = await supabase.auth.getUser();
            
            // Default to 'Personal' for persona chats (those with systemPrompts), otherwise 'Uncategorized'
            const defaultCategory = options?.systemPrompt ? 'Personal' : 'Uncategorized';
            
            const newChatData: Omit<Chat, 'id' | 'messages'> = {
                title: options?.title || 'New Chat',
                models: options?.models || ['auto'],
                systemPrompt: options?.systemPrompt,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                category: defaultCategory,
                pinned: false,
                chatMode: 'normal',
            };

            if (user) {
                try {
                    const savedChat = await createChatDB(user.id, newChatData);
                    const finalChat = { ...newChatData, ...savedChat };
                    set(state => ({
                        chats: [finalChat, ...state.chats],
                        activeChatId: finalChat.id
                    }));
                    return finalChat.id;
                } catch (error) {
                    console.error("Failed to save new chat:", error);
                    return '';
                }
            } else {
                const finalChat = { ...newChatData, id: generateId() };
                set(state => ({
                    chats: [finalChat, ...state.chats],
                    activeChatId: finalChat.id
                }));
                return finalChat.id;
            }
        },
        selectChat: (id) => {
            set({ activeChatId: id });
        },
        deleteChat: async (id) => {
            const originalChats = get().chats;
            const originalActiveId = get().activeChatId;

            set(state => {
                const remainingChats = state.chats.filter(c => c.id !== id);
                let newActiveId = state.activeChatId;
                if (state.activeChatId === id) {
                    newActiveId = remainingChats.length > 0 ? remainingChats[0].id : null;
                }
                return { chats: remainingChats, activeChatId: newActiveId };
            });
            
            if (!get().activeChatId && get().chats.length === 0) {
                await get().actions.newChat();
            }

            try {
                if (!isNaN(Number(id))) await deleteChatDB(id);
            } catch (error) {
                console.error("Failed to delete chat:", error);
                set({ chats: originalChats, activeChatId: originalActiveId });
            }
        },
        renameChat: async (id, title) => {
            get().actions._updateChat(id, { title });
            if (!isNaN(Number(id))) {
                try { await updateChatDB(id, { title }); } catch (e) { console.error("Failed to rename chat:", e) }
            }
        },
        updateChatModels: async (id, models) => {
            get().actions._updateChat(id, { models });
            if (!isNaN(Number(id))) {
                try { 
                    await updateChatDB(id, { models }); 
                } catch (e) { 
                    console.error("Failed to update chat models:", e); 
                }
            }
        },
        updateSystemPrompt: async (id, systemPrompt) => {
            get().actions._updateChat(id, { systemPrompt });
            if (!isNaN(Number(id))) {
                try { await updateChatDB(id, { systemPrompt }); } catch (e) { console.error("Failed to update system prompt:", e); }
            }
        },
        setChatCategory: (chatId, category) => {
            get().actions._updateChat(chatId, { category });
            if (!isNaN(Number(chatId))) {
                updateChatDB(chatId, { category }).catch(e => console.error("Failed to update chat category:", e));
            }
        },
        togglePinChat: (chatId) => {
            const chat = get().chats.find(c => c.id === chatId);
            if (!chat) return;
            const isPinned = !(chat.pinned ?? false);
            get().actions._updateChat(chatId, { pinned: isPinned });
            if (!isNaN(Number(chatId))) {
                updateChatDB(chatId, { pinned: isPinned }).catch(e => console.error("Failed to update chat pin status:", e));
            }
        },
        setChatMode: (chatId: string, mode: ChatMode) => {
            get().actions._updateChat(chatId, { chatMode: mode });
            if (!isNaN(Number(chatId))) {
                updateChatDB(chatId, { chatMode: mode }).catch(e => console.error("Failed to update chat mode:", e));
            }
        },
        addCategory: async (name) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const existingCategories = get().categories;
            if (existingCategories.includes(name)) return;
            
            set(state => ({ categories: [...state.categories, name].sort() }));
            try {
                await createCategoryDB(user.id, name);
            } catch (error) {
                console.error("Failed to add category:", error);
                set(state => ({ categories: state.categories.filter(c => c !== name) }));
            }
        },
        deleteCategory: async (name) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || name === 'Uncategorized') return;

            const chatsInCategory = get().chats.filter(c => c.category === name);
            if (chatsInCategory.length > 0) {
                const updates = chatsInCategory.map(chat => get().actions.setChatCategory(chat.id, 'Uncategorized'));
                await Promise.all(updates);
            }

            const originalCategories = get().categories;
            set(state => ({ categories: state.categories.filter(c => c !== name) }));
            try {
                await deleteCategoryDB(user.id, name);
            } catch (error) {
                console.error("Failed to delete category:", error);
                set({ categories: originalCategories });
            }
        },
        toggleModelGallery: () => set(state => ({ isModelGalleryOpen: !state.isModelGalleryOpen })),
        toggleSystemPromptModal: () => set(state => ({ isSystemPromptModalOpen: !state.isSystemPromptModalOpen })),
        toggleCategoryCollapse: (category) => {
            const newCollapsedState = { ...get().collapsedCategories };
            newCollapsedState[category] = !newCollapsedState[category];
            set({ collapsedCategories: newCollapsedState });
            updateUserPreferences({ chatCollapsedCategories: newCollapsedState }).catch(e => {
                console.error("Failed to save collapsed categories", e);
            });
        },

        // Internal actions for optimistic updates
        _addChat: (chat) => {
            set(state => ({
                chats: [chat, ...state.chats].sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0))
            }));
        },
        _updateChat: (chatId, updates) => {
            set(state => {
                const updatedChats = state.chats.map(c => c.id === chatId ? { ...c, ...updates, updatedAt: Date.now() } : c);
                // Only sort if the pinned status or updatedAt actually changed
                const needsSorting = updatedChats.some((chat, index) => {
                    const originalChat = state.chats[index];
                    return chat.pinned !== originalChat.pinned || chat.updatedAt !== originalChat.updatedAt;
                });
                
                if (needsSorting) {
                    return {
                        chats: updatedChats.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updatedAt || 0) - (a.updatedAt || 0))
                    };
                }
                return { chats: updatedChats };
            });
        },
    }
}));
