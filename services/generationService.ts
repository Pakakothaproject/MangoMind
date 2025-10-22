import { supabase } from './supabaseClient';
import type { Generation } from '../types';
import { useAppStore } from '../store/appStore';
import { dataUrlToBlob } from '../utils/image';

export const addGeneration = async (
    userId: string, 
    imageDataUrl: string,
    prompt: string | null, 
    type: string, 
    model: string, 
    provider: string, 
    settings: Record<string, any> | null
) => {
  const blob = dataUrlToBlob(imageDataUrl);
  const bytes = blob ? blob.size : 0;

  const { error } = await supabase
    .from('generations')
    .insert([{ 
        user_id: userId, 
        image_url: imageDataUrl, 
        prompt,
        type,
        model_used: model,
        api_provider: provider,
        settings,
        size_bytes: bytes,
    }]);
  
  if (error) {
    console.error('Error saving generation:', error);
  } else {
    useAppStore.getState().actions.fetchStorageUsage();
  }
};

export const getGenerations = async (): Promise<Generation[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching generations:', error);
    return [];
  }
  return data;
};

export const deleteGeneration = async (id: number) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('No user logged in');
        }
        
        // Verify generation ownership first
        const { data: generation, error: fetchError } = await supabase
            .from('generations')
            .select('id, user_id')
            .eq('id', id)
            .single();
        
        if (fetchError || !generation) {
            throw new Error('Generation not found');
        }
        
        if (generation.user_id !== user.id) {
            throw new Error('Permission denied: Generation belongs to different user');
        }
        
        // Perform deletion with user verification
        const { error, count } = await supabase
            .from('generations')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting generation:', error);
            throw error;
        }
        
        if (count !== 1) {
            console.warn(`Attempted to delete generation ${id}, but ${count ?? 0} rows were affected. RLS may have prevented this.`);
            throw new Error('Delete failed: Generation not found or permission denied.');
        }
        
        console.log(`✅ Successfully deleted generation ${id}`);
        
        // On success, update storage usage
        useAppStore.getState().actions.fetchStorageUsage();
        
    } catch (error) {
        console.error(`Error deleting generation ${id}:`, error);
        throw error;
    }
};

export const deleteGenerations = async (ids: number[]) => {
    if (ids.length === 0) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('No user logged in');
        }
        
        // Verify all generations belong to current user
        const { data: generations, error: fetchError } = await supabase
            .from('generations')
            .select('id, user_id')
            .in('id', ids);
        
        if (fetchError) {
            throw fetchError;
        }
        
        if (!generations || generations.length !== ids.length) {
            throw new Error('Some generations not found');
        }
        
        // Check if all belong to current user
        const foreignGenerations = generations.filter(g => g.user_id !== user.id);
        if (foreignGenerations.length > 0) {
            throw new Error('Permission denied: Some generations belong to different user');
        }
        
        // Perform batch deletion with user verification
        const { error, count } = await supabase
            .from('generations')
            .delete({ count: 'exact' })
            .in('id', ids)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting generations:', error);
            throw error;
        }
        
        if ((count ?? 0) !== ids.length) {
            console.warn(`Attempted to delete ${ids.length} generations, but only ${count ?? 0} were affected. RLS may be preventing some deletions.`);
            throw new Error(`Delete failed: Not all selected items could be deleted.`);
        }
        
        console.log(`✅ Successfully deleted ${ids.length} generations`);
        
        // On full success, update storage usage
        useAppStore.getState().actions.fetchStorageUsage();
        
    } catch (error) {
        console.error(`Error deleting generations:`, error);
        throw error;
    }
};

export const getTotalStorageUsage = async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
        .from('generations')
        .select('size_bytes')
        .eq('user_id', user.id);
    
    if (error) {
        console.error('Error fetching generation sizes:', error);
        return 0;
    }

    const AVERAGE_IMAGE_SIZE_BYTES = 750 * 1024; // 750 KB as a reasonable estimate for older images

    return data.reduce((acc: number, gen: { size_bytes: number | null }) => {
        if (gen.size_bytes && gen.size_bytes > 0) {
            return acc + gen.size_bytes;
        } else {
            // For old generations without a size, add an average size.
            return acc + AVERAGE_IMAGE_SIZE_BYTES;
        }
    }, 0);
};