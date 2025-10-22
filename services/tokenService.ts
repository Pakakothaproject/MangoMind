// services/tokenService.ts
import { supabase } from './supabaseClient';
import { useAppStore } from '../store/appStore';
import type { TokenUsage } from '../types';

export const logTokenUsage = async (
    usage: Omit<TokenUsage, 'id' | 'created_at'>,
    isImageGeneration: boolean = false
): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // This function calls the unified RPC that handles token deduction and logging.
    // The complex logic for free generations is now handled server-side in the DB function.
    const { error } = await supabase.rpc('consume_resource_and_log', {
        p_model_used: usage.model_used,
        p_feature: usage.feature,
        p_input_tokens: usage.input_tokens || 0,
        p_output_tokens: usage.output_tokens || 0,
        p_total_tokens: usage.total_tokens || 0,
        p_is_image_generation: isImageGeneration,
    });

    if (error) {
        console.error("Error consuming resource and logging usage:", error);
        // We are not throwing the error here to avoid breaking the UI flow for the user,
        // but logging it for debugging. The original implementation also just logged errors.
    }

    // Always fetch the latest balance after any operation to keep the UI in sync.
    useAppStore.getState().actions.fetchTokenBalance();
};

export const getTokenBalance = async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('token_balance')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        return data?.token_balance || 0;
    } catch (error) {
        console.error("Error fetching token balance:", error);
        return 0;
    }
};

export const getMyTokenUsageHistory = async (startDate: Date): Promise<TokenUsage[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('token_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching token usage history:", error);
        return [];
    }
    return data || [];
};
