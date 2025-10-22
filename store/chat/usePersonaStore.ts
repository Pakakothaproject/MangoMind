import { create } from 'zustand';
import { supabase } from '../../services/supabaseClient';
// FIX: Import DB functions for creating, updating, and deleting personas.
import { getPersonasDB, createPersonaDB, updatePersonaDB, deletePersonaDB } from '../../services/chatService';
import type { Persona } from '../../types';

interface PersonaState {
    personas: Persona[];
    isInitialized: boolean;
    // FIX: Add state for modal management and editing.
    isPersonaModalOpen: boolean;
    editingPersona: Persona | null;
    
    actions: {
        init: () => Promise<void>;
        // FIX: Add missing actions for persona management.
        addPersona: (persona: Omit<Persona, 'id'>) => Promise<void>;
        updatePersona: (id: string, updates: Partial<Omit<Persona, 'id'>>) => Promise<void>;
        deletePersona: (id: string) => Promise<void>;
        setEditingPersona: (persona: Persona | null) => void;
        togglePersonaModal: () => void;
    };
}

export const usePersonaStore = create<PersonaState>((set, get) => ({
    personas: [],
    isInitialized: false,
    // FIX: Add initial state for new properties.
    isPersonaModalOpen: false,
    editingPersona: null,
    
    actions: {
        init: async () => {
            if (get().isInitialized) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ isInitialized: true, personas: [] });
                return;
            }
            try {
                let personasFromDB = await getPersonasDB(user.id);
                
                // If the user has no personas, it might be an older account.
                // Let's backfill the defaults for them.
                if (personasFromDB.length === 0) {
                    console.log('No personas found for user, attempting to backfill default personas.');
                    const { error } = await supabase.rpc('backfill_user_defaults', { p_user_id: user.id });
                    
                    if (error) {
                        console.error('Failed to backfill personas:', error);
                    } else {
                        // Re-fetch personas after backfilling successfully.
                        personasFromDB = await getPersonasDB(user.id);
                    }
                }

                set({ personas: personasFromDB, isInitialized: true });
            } catch (error) {
                console.error("Failed to load personas:", error);
                set({ isInitialized: true });
            }
        },
        // FIX: Implement the new actions.
        togglePersonaModal: () => set(state => ({ isPersonaModalOpen: !state.isPersonaModalOpen })),
        setEditingPersona: (persona) => set({ editingPersona: persona }),
        addPersona: async (personaData) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            try {
                const newPersona = await createPersonaDB(user.id, personaData);
                set(state => ({ personas: [...state.personas, newPersona] }));
            } catch (error) {
                console.error("Failed to add persona:", error);
            }
        },
        updatePersona: async (id, updates) => {
            const originalPersonas = get().personas;
            set(state => ({
                personas: state.personas.map(p => p.id === id ? { ...p, ...updates } : p)
            }));
            try {
                await updatePersonaDB(id, updates);
            } catch (error) {
                console.error("Failed to update persona:", error);
                set({ personas: originalPersonas }); // Revert on error
            }
        },
        deletePersona: async (id) => {
            const originalPersonas = get().personas;
            set(state => ({
                personas: state.personas.filter(p => p.id !== id)
            }));
            try {
                await deletePersonaDB(id);
            } catch (error) {
                console.error("Failed to delete persona:", error);
                set({ personas: originalPersonas }); // Revert on error
            }
        },
    }
}));
