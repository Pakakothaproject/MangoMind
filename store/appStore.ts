import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';
import type { UploadedImage, Profile } from '../types';
import type { NavigateFunction } from 'react-router-dom';
import type { AuthSession as Session } from '@supabase/supabase-js';
import { getTokenBalance } from '../services/tokenService';
import { getTotalStorageUsage } from '../services/generationService';
import { getUserPreferences, updateUserPreferences } from '../services/preferencesService';
import { clearModelsCache } from '../services/configService';

// Default models if user has not set any preference
const DEFAULT_SEARCH_MODEL = 'perplexity/sonar-pro';
const DEFAULT_THINKING_MODEL = 'deepseek/deepseek-r1';
const DEFAULT_MULTIMODAL_MODEL = 'google/gemini-2.0-flash';


interface AppState {
    // Auth state
    session: Session | null;
    profile: Profile | null;
    authLoading: boolean;

    // Navigation and initial page state
    studioStartMode: 'tryon' | 'hairstyle' | 'sceneswap';
    initialStudioImage: UploadedImage | null;
    initialMarketingImage: UploadedImage | null;
    initialVideoGenImage: UploadedImage | null;
    initialGeneratorPrompt: string | null;

    // Global UI State
    theme: 'light' | 'dark';
    isBottomNavForced: boolean;
    bottomNavTimer: number | null;
    isMobileView: boolean;
    tokenBalance: number;
    storageUsageBytes: number;
    defaultSearchModel: string;
    defaultThinkingModel: string;
    defaultMultimodalModel: string;


    // A reference to the navigate function from react-router-dom
    navigate: NavigateFunction | null;

    // Actions
    actions: {
        init: (navigate: NavigateFunction) => void;
        checkUser: () => void;
        signOut: () => Promise<void>;
        updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
        
        // Navigation Actions
        navigateToStudio: (mode: 'tryon' | 'hairstyle' | 'sceneswap', initialImage?: UploadedImage | null) => void;
        navigateToMarketing: (initialImage?: UploadedImage | null) => void;
        navigateToDressMe: () => void;
        navigateToGenerations: () => void;
        navigateToGenerator: (prompt?: string) => void;
        navigateToSettings: () => void;
        navigateToVideoGen: (initialImage?: UploadedImage | null) => void;
        navigateToPlayground: () => void;
        navigateToPersonas: () => void;
        handleBackToDashboard: () => void;
        navigateToGeneratorWithPrompt: (prompt: string) => void;

        // UI Actions
        toggleTheme: () => void;
        showBottomNavTemporarily: () => void;
        fetchTokenBalance: () => Promise<void>;
        fetchStorageUsage: () => Promise<void>;
        fetchChatModeModels: () => Promise<void>;
        updateChatModeModels: (searchModel: string, thinkingModel?: string, multimodalModel?: string) => Promise<void>;
    }
}

export const useAppStore = create<AppState>((set, get) => ({
    // Initial State
    session: null,
    profile: null,
    authLoading: true,
    studioStartMode: 'tryon',
    initialStudioImage: null,
    initialMarketingImage: null,
    initialVideoGenImage: null,
    initialGeneratorPrompt: null,
    theme: 'dark',
    isBottomNavForced: false,
    bottomNavTimer: null,
    isMobileView: false,
    tokenBalance: 0,
    storageUsageBytes: 0,
    defaultSearchModel: DEFAULT_SEARCH_MODEL,
    defaultThinkingModel: DEFAULT_THINKING_MODEL,
    defaultMultimodalModel: DEFAULT_MULTIMODAL_MODEL,
    navigate: null,

    // Actions
    actions: {
        init: (navigate) => {
            // Default to dark theme, will be overridden by user preferences if available
            const initialTheme = 'dark';
            set({ navigate, theme: initialTheme, isMobileView: window.innerWidth < 768 });
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(initialTheme);
        },

        setIsMobileView: (isMobile: boolean) => {
            set({ isMobileView: isMobile });
        },

        checkUser: async (force = false) => {
            set({ authLoading: true });
            try {
                console.log('DEBUG: checkUser() called, force:', force);
                
                // Get current session - if auth state is changing, this might take a moment
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('DEBUG: Session check error:', error);
                    set({ session: null, profile: null, authLoading: false });
                    return;
                }

                // Check if session has actually changed before doing expensive operations
                const currentSession = get().session;
                if (!force && currentSession?.user?.id === session?.user?.id && currentSession?.access_token === session?.access_token) {
                    console.log('DEBUG: Session unchanged, skipping profile fetch');
                    set({ authLoading: false });
                    return;
                }

                // Add debounce check - if we checked recently, skip unless forced or session changed
                const lastCheckTime = sessionStorage.getItem('lastCheckUserTime');
                const currentTime = Date.now();
                const debounceMs = 2000; // 2 seconds
                
                if (!force && lastCheckTime && (currentTime - parseInt(lastCheckTime)) < debounceMs) {
                    console.log('DEBUG: Skipping checkUser - too soon since last check');
                    set({ authLoading: false });
                    return;
                }
                
                sessionStorage.setItem('lastCheckUserTime', currentTime.toString());

                if (session?.user) {
                    console.log('DEBUG: Session found, fetching profile for user:', session.user.id);
                    
                    // Check if we already have this user's data cached recently
                    const cachedUserId = sessionStorage.getItem('cachedUserId');
                    const cacheTimestamp = sessionStorage.getItem('profileCacheTimestamp');
                    const cacheExpiry = 30000; // 30 seconds
                    
                    // If we have recent cached data for this user, skip refetching
                    if (!force && cachedUserId === session.user.id && cacheTimestamp && 
                        (currentTime - parseInt(cacheTimestamp)) < cacheExpiry && get().profile) {
                        console.log('DEBUG: Using cached profile data');
                        set({ session, authLoading: false });
                        return;
                    }
                    
                    // Fetch user profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select(`username, full_name, gender, birth_date, username_last_changed_at, user_preferences, token_balance, current_package_id, package_expires_at, free_generations_remaining, bonus_expires_at, storage_limit_bytes`)
                        .eq('id', session.user.id)
                        .single();
                    
                    // Cache the profile data
                    sessionStorage.setItem('cachedUserId', session.user.id);
                    sessionStorage.setItem('profileCacheTimestamp', currentTime.toString());
                    
                    // Check if package has changed and clear model cache if needed
                    const previousPackageId = get().profile?.current_package_id;
                    const newPackageId = profile?.current_package_id;
                    if (previousPackageId !== newPackageId) {
                        console.log('DEBUG: Package changed, clearing model cache');
                        clearModelsCache();
                    }
                    
                    set({ session, profile, authLoading: false, tokenBalance: profile?.token_balance || 0 });
                    
                    // Load theme preference from profile
                    const preferences = profile?.user_preferences as any;
                    if (preferences?.theme) {
                        const savedTheme = preferences.theme as 'light' | 'dark';
                        set({ theme: savedTheme });
                        document.documentElement.classList.remove('light', 'dark');
                        document.documentElement.classList.add(savedTheme);
                    }
                    
                    get().actions.fetchStorageUsage();
                    get().actions.fetchChatModeModels();
                } else {
                    console.log('DEBUG: No session found');
                    set({ session: null, profile: null, authLoading: false, tokenBalance: 0 });
                }
            } catch (error) {
                console.error('DEBUG: Session check failed:', error);
                set({ session: null, profile: null, authLoading: false, tokenBalance: 0 });
            }
        },

        signOut: async () => {
            await supabase.auth.signOut();
            get().navigate?.('/');
        },

        updateProfile: async (updates) => {
            const { session } = get();
            if (!session) return { error: { message: 'Not authenticated' } };
        
            const currentProfile = get().profile;
            const profileData = {
                p_username: updates.username !== undefined ? updates.username : currentProfile?.username,
                p_full_name: updates.full_name !== undefined ? updates.full_name : currentProfile?.full_name,
                p_gender: updates.gender !== undefined ? updates.gender : currentProfile?.gender,
                p_birth_date: updates.birth_date !== undefined ? updates.birth_date : currentProfile?.birth_date,
            };
        
            const { error } = await supabase.rpc('update_user_profile', profileData);
        
            if (!error) {
                const { data, error: fetchError } = await supabase
                    .from('profiles')
                    .select(`username, full_name, gender, birth_date, username_last_changed_at, token_balance, current_package_id, package_expires_at, free_generations_remaining, bonus_expires_at, storage_limit_bytes`)
                    .eq('id', session.user.id)
                    .single();
        
                if (fetchError) {
                    console.error("Error re-fetching profile after update", fetchError);
                } else if (data) {
                    // Check if package changed and clear model cache
                    const previousPackageId = get().profile?.current_package_id;
                    const newPackageId = (data as Profile).current_package_id;
                    if (previousPackageId !== newPackageId) {
                        console.log('DEBUG: Package changed after profile update, clearing model cache');
                        clearModelsCache();
                    }
                    set({ profile: data as Profile });
                }
            }
            return { error };
        },

        navigateToStudio: (mode, initialImage = null) => {
            set({
                studioStartMode: mode,
                initialStudioImage: initialImage,
                initialMarketingImage: null,
                initialVideoGenImage: null,
            });
            get().navigate?.('/studio');
        },

        navigateToMarketing: (initialImage = null) => {
            set({
                initialMarketingImage: initialImage,
                initialStudioImage: null,
                initialVideoGenImage: null,
            });
            get().navigate?.('/marketing');
        },

        navigateToDressMe: () => get().navigate?.('/dress-me'),
        navigateToGenerations: () => get().navigate?.('/generations'),
        navigateToGenerator: (prompt?: string) => {
            const promptString = typeof prompt === 'string' ? prompt : '';
            set({ initialGeneratorPrompt: promptString });
            get().navigate?.('/generate');
        },
        navigateToSettings: () => get().navigate?.('/settings'),
        navigateToVideoGen: (initialImage = null) => {
            set({
                initialVideoGenImage: initialImage,
                initialStudioImage: null,
                initialMarketingImage: null,
            });
            get().navigate?.('/video');
        },
        navigateToPlayground: () => get().navigate?.('/playground'),
        navigateToPersonas: () => get().navigate?.('/personas'),

        handleBackToDashboard: () => {
            set({ initialStudioImage: null, initialMarketingImage: null });
            get().navigate?.('/');
        },

        navigateToGeneratorWithPrompt: (prompt) => {
            get().actions.navigateToGenerator(prompt);
        },
        
        toggleTheme: async () => {
            const newTheme = get().theme === 'light' ? 'dark' : 'light';
            set({ theme: newTheme });
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(newTheme);
            
            // Save to database if user is logged in
            const { session } = get();
            if (session?.user) {
                try {
                    await updateUserPreferences({ theme: newTheme });
                    console.log('Theme preference saved to database:', newTheme);
                } catch (error) {
                    console.error('Failed to save theme preference:', error);
                }
            }
        },

        showBottomNavTemporarily: () => {
            const { bottomNavTimer } = get();
            if (bottomNavTimer) {
                clearTimeout(bottomNavTimer);
            }
            set({ isBottomNavForced: true });
            const newTimer = window.setTimeout(() => {
                set({ isBottomNavForced: false, bottomNavTimer: null });
            }, 5000);
            set({ bottomNavTimer: newTimer });
        },

        fetchTokenBalance: async () => {
            if (!get().session) return;
            const balance = await getTokenBalance();
            set({ tokenBalance: balance });
        },

        fetchStorageUsage: async () => {
            if (!get().session) return;
            const usage = await getTotalStorageUsage();
            set({ storageUsageBytes: usage });
        },

        fetchChatModeModels: async () => {
            const preferences = await getUserPreferences();
            set({
                defaultSearchModel: preferences?.defaultSearchModel || DEFAULT_SEARCH_MODEL,
                defaultThinkingModel: preferences?.defaultThinkingModel || DEFAULT_THINKING_MODEL,
                defaultMultimodalModel: preferences?.defaultMultimodalModel || DEFAULT_MULTIMODAL_MODEL,
            });
        },

        updateChatModeModels: async (searchModel, thinkingModel, multimodalModel) => {
            const updates: any = {
                defaultSearchModel: searchModel,
            };
            
            if (thinkingModel !== undefined) {
                updates.defaultThinkingModel = thinkingModel;
            }
            
            if (multimodalModel !== undefined) {
                updates.defaultMultimodalModel = multimodalModel;
            }
            
            set(updates);
            await updateUserPreferences(updates);
        }
    }
}));