// services/connectionManager.ts
// Manages Supabase connection health and automatic session refresh

import { supabase } from './supabaseClient';

interface ConnectionState {
    isHealthy: boolean;
    lastHealthCheck: number;
    consecutiveFailures: number;
    sessionRefreshInProgress: boolean;
}

const HEALTH_CHECK_INTERVAL = 60000; // Check every 60 seconds
const MAX_CONSECUTIVE_FAILURES = 3;
const SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh if expires in < 5 minutes
const FORCE_REFRESH_INTERVAL = 15 * 60 * 1000; // Force refresh every 15 minutes

class ConnectionManager {
    private state: ConnectionState = {
        isHealthy: true,
        lastHealthCheck: 0,
        consecutiveFailures: 0,
        sessionRefreshInProgress: false,
    };

    private healthCheckInterval: number | null = null;
    private lastSessionRefresh: number = 0;
    private listeners: Array<(healthy: boolean) => void> = [];

    /**
     * Initialize the connection manager
     */
    public async initialize(): Promise<void> {
        console.log('[ConnectionManager] Initializing...');
        
        // Initial health check
        await this.performHealthCheck();
        
        // Set up periodic health checks
        this.startHealthCheckInterval();
        
        // Set up periodic session refresh
        this.setupSessionRefresh();
        
        // Monitor online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Monitor visibility change to refresh when tab becomes visible
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    /**
     * Clean up resources
     */
    public cleanup(): void {
        console.log('[ConnectionManager] Cleaning up...');
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        window.removeEventListener('online', () => this.handleOnline());
        window.removeEventListener('offline', () => this.handleOffline());
        document.removeEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    /**
     * Add a listener for connection health changes
     */
    public addListener(listener: (healthy: boolean) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Get current connection health status
     */
    public isHealthy(): boolean {
        return this.state.isHealthy;
    }

    /**
     * Ensure session is fresh and valid
     */
    public async ensureValidSession(forceRefresh: boolean = false): Promise<boolean> {
        try {
            // Prevent concurrent refresh attempts
            if (this.state.sessionRefreshInProgress && !forceRefresh) {
                console.log('[ConnectionManager] Session refresh already in progress, waiting...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.state.isHealthy;
            }

            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('[ConnectionManager] Error getting session:', error);
                this.markUnhealthy();
                return false;
            }

            if (!session) {
                console.log('[ConnectionManager] No active session');
                return true; // Not logged in is a valid state
            }

            const now = Date.now();
            const timeSinceLastRefresh = now - this.lastSessionRefresh;

            // Check if token is expiring soon or force refresh interval has passed
            let shouldRefresh = forceRefresh;
            
            if (session.expires_at) {
                const expiresInMs = (session.expires_at * 1000) - now;
                if (expiresInMs < SESSION_REFRESH_THRESHOLD) {
                    console.log(`[ConnectionManager] Session expires in ${Math.round(expiresInMs / 1000)}s, refreshing...`);
                    shouldRefresh = true;
                }
            }

            // Force refresh if it's been too long
            if (timeSinceLastRefresh > FORCE_REFRESH_INTERVAL) {
                console.log(`[ConnectionManager] Force refresh (${Math.round(timeSinceLastRefresh / 1000)}s since last refresh)`);
                shouldRefresh = true;
            }

            if (shouldRefresh) {
                this.state.sessionRefreshInProgress = true;
                
                const { data, error: refreshError } = await supabase.auth.refreshSession();
                
                this.state.sessionRefreshInProgress = false;
                
                if (refreshError) {
                    console.error('[ConnectionManager] Session refresh failed:', refreshError);
                    this.markUnhealthy();
                    return false;
                }

                if (data.session) {
                    console.log('[ConnectionManager] Session refreshed successfully');
                    this.lastSessionRefresh = now;
                    this.markHealthy();
                    return true;
                }
            }

            this.markHealthy();
            return true;

        } catch (error) {
            console.error('[ConnectionManager] Session validation error:', error);
            this.state.sessionRefreshInProgress = false;
            this.markUnhealthy();
            return false;
        }
    }

    /**
     * Perform a health check on the connection
     */
    private async performHealthCheck(): Promise<void> {
        const now = Date.now();
        
        // Don't check too frequently
        if (now - this.state.lastHealthCheck < 10000) {
            return;
        }

        this.state.lastHealthCheck = now;

        try {
            // Simple ping to check if Supabase is reachable
            const { error } = await supabase.from('profiles').select('id').limit(0);
            
            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
                console.warn('[ConnectionManager] Health check failed:', error);
                this.markUnhealthy();
            } else {
                this.markHealthy();
            }
        } catch (error) {
            console.error('[ConnectionManager] Health check error:', error);
            this.markUnhealthy();
        }
    }

    /**
     * Start periodic health checks
     */
    private startHealthCheckInterval(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = window.setInterval(() => {
            this.performHealthCheck();
        }, HEALTH_CHECK_INTERVAL);
    }

    /**
     * Set up automatic session refresh
     */
    private setupSessionRefresh(): void {
        // Refresh session every 10 minutes
        setInterval(() => {
            this.ensureValidSession(false);
        }, 10 * 60 * 1000);
    }

    /**
     * Handle online event
     */
    private async handleOnline(): Promise<void> {
        console.log('[ConnectionManager] Network back online, performing health check...');
        this.state.consecutiveFailures = 0;
        await this.performHealthCheck();
        await this.ensureValidSession(true);
    }

    /**
     * Handle offline event
     */
    private handleOffline(): void {
        console.log('[ConnectionManager] Network offline');
        this.markUnhealthy();
    }

    /**
     * Handle visibility change (tab focus)
     */
    private async handleVisibilityChange(): Promise<void> {
        if (!document.hidden) {
            console.log('[ConnectionManager] Tab visible, checking connection...');
            await this.performHealthCheck();
            await this.ensureValidSession(false);
        }
    }

    /**
     * Mark connection as healthy
     */
    private markHealthy(): void {
        const wasUnhealthy = !this.state.isHealthy;
        this.state.isHealthy = true;
        this.state.consecutiveFailures = 0;
        
        if (wasUnhealthy) {
            console.log('[ConnectionManager] Connection restored');
            this.notifyListeners(true);
        }
    }

    /**
     * Mark connection as unhealthy
     */
    private markUnhealthy(): void {
        this.state.consecutiveFailures++;
        
        if (this.state.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            const wasHealthy = this.state.isHealthy;
            this.state.isHealthy = false;
            
            if (wasHealthy) {
                console.error('[ConnectionManager] Connection unhealthy after multiple failures');
                this.notifyListeners(false);
            }
        }
    }

    /**
     * Notify all listeners of connection status change
     */
    private notifyListeners(healthy: boolean): void {
        this.listeners.forEach(listener => {
            try {
                listener(healthy);
            } catch (error) {
                console.error('[ConnectionManager] Error notifying listener:', error);
            }
        });
    }
}

// Export singleton instance
export const connectionManager = new ConnectionManager();
