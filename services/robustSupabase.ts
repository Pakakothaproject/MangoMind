// services/robustSupabase.ts
// Simple but robust Supabase query wrapper with timeout and session refresh

import { supabase } from './supabaseClient';

const DEFAULT_TIMEOUT = 15000; // 15 seconds
const SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

/**
 * Wrap any promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
}

/**
 * Check and refresh session if needed
 */
export async function ensureFreshSession(): Promise<void> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        // Check if token expires soon
        if (session.expires_at) {
            const expiresInMs = (session.expires_at * 1000) - Date.now();
            
            if (expiresInMs < SESSION_REFRESH_THRESHOLD) {
                console.log('[RobustSupabase] Session expiring soon, refreshing...');
                await supabase.auth.refreshSession();
                console.log('[RobustSupabase] Session refreshed');
            }
        }
    } catch (error) {
        console.warn('[RobustSupabase] Session refresh failed:', error);
    }
}

/**
 * Execute a Supabase query with timeout and session check
 */
export async function robustQuery<T>(
    queryFn: () => Promise<T>,
    timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
    // Ensure session is fresh
    await ensureFreshSession();
    
    // Execute with timeout
    try {
        return await withTimeout(queryFn(), timeoutMs);
    } catch (error: any) {
        // If it's a timeout, provide a better error message
        if (error.message?.includes('timeout')) {
            console.error('[RobustSupabase] Query timeout:', error);
            throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw error;
    }
}

/**
 * Execute an RPC call with timeout
 */
export async function robustRPC<T = any>(
    rpcName: string,
    params?: Record<string, any>,
    timeoutMs: number = DEFAULT_TIMEOUT
): Promise<{ data: T | null; error: any }> {
    return robustQuery(
        async () => {
            const result = await supabase.rpc(rpcName, params);
            return result;
        },
        timeoutMs
    );
}

/**
 * Execute a select query with timeout
 */
export async function robustSelect<T = any>(
    table: string,
    options: {
        columns?: string;
        filter?: (query: any) => any;
        timeout?: number;
    } = {}
): Promise<any> {
    const { columns = '*', filter, timeout = DEFAULT_TIMEOUT } = options;
    
    return robustQuery(
        async () => {
            let query = supabase.from(table).select(columns);
            if (filter) {
                query = filter(query);
            }
            const result = await query;
            return result;
        },
        timeout
    );
}
