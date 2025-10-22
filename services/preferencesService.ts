import { supabase } from './supabaseClient';
import type { UserPreferences } from '../types';

export const getUserPreferences = async (): Promise<UserPreferences | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('user_preferences')
        .eq('id', user.id)
        .maybeSingle();
    
    if (error) {
        console.error('Error fetching user preferences:', error);
        return null;
    }
    
    return data?.user_preferences || {};
};

export const updateUserPreferences = async (updates: Partial<UserPreferences>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentPreferences = await getUserPreferences() || {};
    const newPreferences = { ...currentPreferences, ...updates };
    
    const { error } = await supabase
        .from('profiles')
        .update({ user_preferences: newPreferences })
        .eq('id', user.id);
        
    if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
    }
};