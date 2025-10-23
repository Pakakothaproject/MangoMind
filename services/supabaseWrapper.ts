// services/supabaseWrapper.ts
// Robust wrapper for Supabase calls with timeout, retry, and error handling

import { supabase } from './supabaseClient';

interface RetryOptions {
    maxRetries?: number;
    timeoutMs?: number;
    retryDelayMs?: number;
    onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    timeoutMs: 10000, // 10 seconds
    retryDelayMs: 1000, // 1 second
    onRetry: (attempt, error) => {
        console.warn(`Retry attempt ${attempt} after error:`, error);
    },
};

/**
 * Create a promise that rejects after a timeout
 */
function createTimeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Request timeout after ${ms}ms`));
        }, ms);
    });
}

/**
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (network issues, timeouts, etc.)
 */
function isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    
    // Network errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection')) {
        return true;
    }
    
    // Supabase specific errors
    if (errorCode === 'pgrst301' || // JWT expired
        errorCode === 'pgrst116' || // Connection error
        errorCode === '08006' ||    // Connection failure
        errorCode === '08003' ||    // Connection does not exist
        errorCode === '08000') {    // Connection exception
        return true;
    }
    
    // HTTP status codes
    if (error.status === 408 || // Request Timeout
        error.status === 429 || // Too Many Requests
        error.status === 500 || // Internal Server Error
        error.status === 502 || // Bad Gateway
        error.status === 503 || // Service Unavailable
        error.status === 504) { // Gateway Timeout
        return true;
    }
    
    return false;
}

/**
 * Execute a Supabase query with timeout and retry logic
 */
export async function executeWithRetry<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
        try {
            // Race between the query and timeout
            const result = await Promise.race([
                queryFn(),
                createTimeoutPromise(opts.timeoutMs)
            ]);
            
            // If we got a result, check for errors
            if (result.error) {
                lastError = result.error;
                
                // If error is retryable and we have retries left, continue
                if (isRetryableError(result.error) && attempt < opts.maxRetries) {
                    opts.onRetry(attempt, result.error);
                    await delay(opts.retryDelayMs * attempt); // Exponential backoff
                    continue;
                }
                
                // Non-retryable error or out of retries
                return result;
            }
            
            // Success!
            return result;
            
        } catch (error: any) {
            lastError = error;
            
            // If this was a timeout or network error and we have retries left
            if (isRetryableError(error) && attempt < opts.maxRetries) {
                opts.onRetry(attempt, error);
                await delay(opts.retryDelayMs * attempt);
                continue;
            }
            
            // Out of retries or non-retryable error
            return { data: null, error: lastError };
        }
    }
    
    // Should never reach here, but just in case
    return { data: null, error: lastError };
}

/**
 * Execute an RPC call with retry logic
 */
export async function executeRPCWithRetry<T>(
    rpcName: string,
    params?: Record<string, any>,
    options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
    return executeWithRetry(
        () => supabase.rpc(rpcName, params),
        options
    );
}

/**
 * Refresh the Supabase session if it's expired or about to expire
 */
export async function ensureValidSession(): Promise<boolean> {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            return false;
        }
        
        if (!session) {
            return false;
        }
        
        // Check if token is about to expire (within 5 minutes)
        const expiresAt = session.expires_at;
        if (expiresAt) {
            const expiresInMs = (expiresAt * 1000) - Date.now();
            const fiveMinutesInMs = 5 * 60 * 1000;
            
            if (expiresInMs < fiveMinutesInMs) {
                console.log('Session expiring soon, refreshing...');
                const { data, error: refreshError } = await supabase.auth.refreshSession();
                
                if (refreshError) {
                    console.error('Error refreshing session:', refreshError);
                    return false;
                }
                
                console.log('Session refreshed successfully');
                return !!data.session;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error ensuring valid session:', error);
        return false;
    }
}

/**
 * Execute a query with session validation
 */
export async function executeWithSessionCheck<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
    // First, ensure we have a valid session
    await ensureValidSession();
    
    // Then execute the query with retry logic
    return executeWithRetry(queryFn, options);
}

/**
 * Batch multiple queries with retry logic
 */
export async function executeBatch<T extends any[]>(
    queries: (() => Promise<any>)[],
    options: RetryOptions = {}
): Promise<T> {
    const results = await Promise.all(
        queries.map(query => executeWithRetry(query, options))
    );
    
    return results as T;
}

/**
 * Helper for common select queries
 */
export async function selectWithRetry<T>(
    table: string,
    columns: string = '*',
    filters?: (query: any) => any,
    options: RetryOptions = {}
): Promise<{ data: T[] | null; error: any }> {
    return executeWithSessionCheck(
        () => {
            let query = supabase.from(table).select(columns);
            if (filters) {
                query = filters(query);
            }
            return query;
        },
        options
    );
}

/**
 * Helper for insert queries
 */
export async function insertWithRetry<T>(
    table: string,
    data: any,
    options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
    return executeWithSessionCheck(
        () => supabase.from(table).insert(data).select().single(),
        options
    );
}

/**
 * Helper for update queries
 */
export async function updateWithRetry<T>(
    table: string,
    data: any,
    filters: (query: any) => any,
    options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
    return executeWithSessionCheck(
        () => {
            let query = supabase.from(table).update(data);
            query = filters(query);
            return query.select().single();
        },
        options
    );
}

/**
 * Helper for delete queries
 */
export async function deleteWithRetry(
    table: string,
    filters: (query: any) => any,
    options: RetryOptions = {}
): Promise<{ data: any; error: any }> {
    return executeWithSessionCheck(
        () => {
            let query = supabase.from(table).delete();
            query = filters(query);
            return query;
        },
        options
    );
}
