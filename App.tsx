import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useNavigate, NavLink, Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import { useModelStore } from './store/modelStore';
import { supabase } from './services/supabaseClient';
import LandingPage from './pages/LandingPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import StudioPage from './pages/StudioPage';
import MyGenerationsPage from './pages/MyGenerationsPage';
import ImageGenerationPage from './pages/ImageGenerationPage';
import MarketingPage from './pages/MarketingPage';
import StyleMePage from './pages/DressMePage';
import ChatPage from './pages/ChatPage';
import VideoGenPage from './pages/VideoGenPage';
import PersonaPage from './pages/PersonaPage';
import PlaygroundPage from './pages/PlaygroundPage';
import useLocalStorage from './hooks/use-local-storage';
import { useHoverSoundProps } from './useSound';
import WelcomeLoader from './components/WelcomeLoader';
import BottomNavBar from './components/BottomNavBar';
import TokenCounter from './components/TokenCounter';

const SidebarButton: React.FC<{ label: string; icon: string; to: string; end?: boolean; isExpanded: boolean; }> = ({ label, icon, to, end, isExpanded }) => {
    const hoverSoundProps = useHoverSoundProps();

    return (
    <NavLink 
        {...hoverSoundProps}
        to={to} 
        end={end} 
        title={isExpanded ? '' : label}
        className={({ isActive }) => [
            "relative group rounded-lg transition-colors duration-200 w-full",
            isExpanded ? 'flex items-center p-2.5 gap-2.5' : 'flex flex-col items-center p-1.5 justify-center',
            isActive ? 'text-[var(--nb-primary)]' : 'text-[var(--nb-text-secondary)] hover:text-[var(--nb-text)] hover:bg-[var(--nb-surface)]',
        ].filter(Boolean).join(' ')}
    >
        {({isActive}) => (
            <>
                {isActive && (
                    <div className="absolute -left-3.5 top-1/4 bottom-1/4 w-1 bg-[var(--nb-primary)] rounded-r-full" />
                )}
                <span className={`material-symbols-outlined text-2xl ${label === 'Playground' ? 'playground-icon-glow' : ''}`}>{icon}</span>
                {isExpanded ? (
                    <span className="font-semibold text-xs truncate">{label}</span>
                ) : (
                    <span className="text-[8px] font-semibold text-center leading-tight mt-0.5">{label}</span>
                )}
            </>
        )}
    </NavLink>
)};

const SidebarAction: React.FC<{ label: string; icon: string; onClick: () => void; isDanger?: boolean; isExpanded: boolean; }> = ({ label, icon, onClick, isDanger, isExpanded }) => {
    const hoverSoundProps = useHoverSoundProps();
    return (
     <button 
        {...hoverSoundProps}
        onClick={onClick} 
        title={isExpanded ? '' : label}
        className={`relative group rounded-lg transition-colors duration-200 w-full ${isExpanded ? 'flex items-center p-2.5 gap-2.5' : 'flex flex-col items-center p-1.5 justify-center'} ${isDanger ? 'text-red-500 hover:bg-red-500/10' : 'text-[var(--nb-text-secondary)] hover:text-[var(--nb-text)] hover:bg-[var(--nb-surface)]'}`}
    >
        <span className="material-symbols-outlined text-xl">{icon}</span>
        {isExpanded && (
            <span className={`font-semibold text-xs truncate ${isDanger ? 'text-red-500' : ''}`}>{label}</span>
        )}
    </button>
)};


// --- Sidebar Component (for Desktop)  ---
const Sidebar: React.FC<{ isChatPage?: boolean; isHovered?: boolean }> = ({ isChatPage, isHovered }) => {
    const [isExpanded, setIsExpanded] = useLocalStorage('sidebar-expanded', false);
    const hoverSoundProps = useHoverSoundProps();

    const displayExpanded = !isChatPage && isExpanded;

    let asideClasses = `h-full min-h-0 flex flex-col bg-[var(--nb-surface-alt)] py-4 px-2.5 border-r border-[var(--nb-border)] transition-transform duration-300 ease-in-out overflow-hidden`;

    if (isChatPage) {
        asideClasses += ` w-20 items-center ${isHovered ? 'translate-x-0' : '-translate-x-full'}`;
    } else {
        asideClasses += displayExpanded ? ' w-60' : ' w-20 items-center';
    }
    
    return (
    <aside className={asideClasses}>
        <div className="flex flex-col items-center flex-shrink-0">
            <Link {...hoverSoundProps} to="/" className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg group" title="MangoMind Home">
                <img src="https://res.cloudinary.com/dy80ftu9k/image/upload/v1760277916/SADW_eed6gu.png" alt="MangoMind Logo" className="w-14 h-14 object-cover rounded-xl" />
            </Link>
            {displayExpanded && (
                <h1 className="text-sm font-bold text-center text-[var(--nb-text)] mt-1.5 animate-fade-in">
                    MangoMind Studio
                </h1>
            )}
        </div>
        
        <div className="w-full h-px bg-[var(--nb-border)] my-2 flex-shrink-0"></div>

        <nav className="flex-1 w-full flex flex-col items-stretch justify-between min-h-0 overflow-y-auto">
            <SidebarButton label="Dashboard" icon="auto_awesome" to="/" end isExpanded={displayExpanded} />
            <SidebarButton label="Chat" icon="chat_bubble" to="/chat" isExpanded={displayExpanded} />
            <SidebarButton label="Playground" icon="science" to="/playground" isExpanded={displayExpanded} />
            <SidebarButton label="Video Gen" icon="movie" to="/video" isExpanded={displayExpanded} />
            <SidebarButton label="My Generations" icon="photo_library" to="/generations" isExpanded={displayExpanded} />
        </nav>

        <div className="flex flex-col items-stretch w-full flex-shrink-0">
            <SidebarButton label="Settings" icon="settings" to="/settings" isExpanded={displayExpanded} />
            {!isChatPage && (
                <SidebarAction 
                    label={isExpanded ? "Collapse" : "Expand"} 
                    icon={isExpanded ? "menu_open" : "menu"} 
                    onClick={() => setIsExpanded((prev: boolean) => !prev)} 
                    isExpanded={displayExpanded} 
                />
            )}
        </div>
    </aside>
)};


// --- Main   LayoutComponent ---
const MainLayout: React.FC = () => {
    const location = useLocation();
    const isChatPage = React.useMemo(() => location.pathname.startsWith('/chat'), [location.pathname]);
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const isBottomNavForced = useAppStore(state => state.isBottomNavForced);

    // Remove debug log to reduce noise
    // console.log('DEBUG: MainLayout rendered, path:', location.pathname, 'isChatPage:', isChatPage);

    if (isChatPage) {
        // Special layout for chat page toenable hover-sidebar
        return (
            <div className="main-layout animate-fade-in h-screen w-full flex bg-[var(--nb-bg)] text-[var(--nb-text)] relative overflow-hidden">
                {/* Hover area and bookmark */}
                <div
                    className="hidden md:block absolute top-0 left-0 h-full w-4 z-40"
                    onMouseEnter={() => setSidebarHovered(true)}
                >
                    <div className={`absolute top-1/2 -translate-y-1/2 left-0 h-24 w-1.5 rounded-r-full bg-[var(--nb-primary)] transition-opacity duration-300 ${sidebarHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ boxShadow: '0 0 10px var(--nb-primary)' }}/>
                </div>
                {/* Sidebar container with hover logic */}
                <div
                    className="hidden md:block absolute top-0 left-0 h-full z-30"
                    onMouseLeave={() => setSidebarHovered(false)}
                >
                    <Sidebar isChatPage={true} isHovered={sidebarHovered} />
                </div>
                
                {/* Main content takes full width */}
                <main className="flex-grow w-full h-full overflow-hidden">
                    <Outlet />
                </main>

                {/* Temporary Bottom Nav for Chat Page */}
                {isBottomNavForced && <BottomNavBar isOverlay={true} />}
            </div>
        );
    }

    // Default layout for other pages
    return (
        <div className="main-layout animate-fade-in h-screen w-full flex bg-[var(--nb-bg)] text-[var(--nb-text)] overflow-hidden">
            <div className="hidden md:flex h-full flex-shrink-0">
                <Sidebar />
            </div>
            <main className="flex-grow w-full h-full overflow-hidden pb-20 md:pb-0">
                <Outlet />
            </main>
            <BottomNavBar />
        </div>
    );
};

// --- Placeholder Page Components ---
const PlaceholderPage: React.FC<{title: string; Icon: React.FC<{className?: string}>}> = ({title, Icon}) => (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[var(--nb-text)] opacity-70 bg-[var(--nb-bg)]">
        <div className="w-16 h-16"><Icon className="w-full h-full" /></div>
        <h1 className="text-3xl font-bold mt-4">{title}</h1>
        <p className="mt-2 text-lg">This feature is coming soon!</p>
    </div>
);


const App: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { init, checkUser } = useAppStore(state => state.actions);
    const { authLoading, session, profile } = useAppStore();
    const { fetchModels } = useModelStore(state => state.actions);
    
    // Memoize auth state to prevent unnecessary re-renders
    const hasValidSession = React.useMemo(() => !!session, [session]);
    const hasProfile = React.useMemo(() => !!profile?.username, [profile?.username]);
    
    const [showWelcome, setShowWelcome] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Simple mobile detection
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Initialize app and auth listener - SIMPLIFIED
    useEffect(() => {
        const initializeApp = async () => {
            console.log('App initializing...');
            
            // Initialize store
            init(navigate);
            
            // Check current user - force check on initial load
            try {
                await checkUser(true);
            } catch (error) {
                console.error('Error checking user:', error);
            }
        };
        
        initializeApp();

        // Set up auth state listener
        let isInitialSession = true; // Track if this is the first session check
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Only handle actual auth events, not tab visibility changes
            console.log('Auth event:', event, 'Session exists:', !!session, 'Initial:', isInitialSession);
            
            // Skip the first INITIAL_SESSION event which fires on tab switches
            if (event === 'INITIAL_SESSION' && !isInitialSession) {
                console.log('Skipping INITIAL_SESSION on tab switch');
                return;
            }
            
            // Mark that we've processed the initial session
            if (event === 'INITIAL_SESSION') {
                isInitialSession = false;
            }
            
            // Only respond to meaningful auth state changes, ignore tab switch events
            if (event === 'SIGNED_IN') {
                if (session) {
                    // Check if profile exists, if not create it (OAuth fallback)
                    await ensureProfileExists(session);
                    checkUser();
                }
            } else if (event === 'SIGNED_OUT') {
                useAppStore.setState({ session: null, profile: null, authLoading: false });
                navigate('/');
            }
            // Ignore these events that commonly fire on tab switches:
            // - 'INITIAL_SESSION' - fires when auth client initializes (handled above)
            // - 'TOKEN_REFRESHED' - happens automatically, not user-initiated
            // - 'MFA_CHALLENGE_VERIFIED' - MFA related
            // - Any other events that don't represent actual user auth changes
        });

        return () => subscription.unsubscribe();
    }, []); // Only run once on mount

    // Ensure profile exists for OAuth users (fallback if trigger fails)
    const ensureProfileExists = async (session: any) => {
        try {
            console.log('Checking if profile exists for user:', session.user.id);
            
            // Check if profile already exists
            const { data: existingProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('id, username')
                .eq('id', session.user.id)
                .maybeSingle();
            
            if (fetchError) {
                console.error('Error checking profile:', fetchError);
                return;
            }
            
            // If profile exists, we're good
            if (existingProfile) {
                console.log('Profile already exists:', existingProfile.username);
                return;
            }
            
            console.log('Profile does not exist, creating fallback profile...');
            
            // Generate username from email or metadata
            const email = session.user.email || '';
            const metadata = session.user.user_metadata || {};
            let username = metadata.username || 
                          metadata.name?.replace(/\s+/g, '_').toLowerCase() ||
                          email.split('@')[0] || 
                          `user_${session.user.id.substring(0, 8)}`;
            
            // Clean username
            username = username.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 30);
            
            // Ensure uniqueness
            let finalUsername = username;
            let counter = 0;
            while (true) {
                const { data: existing } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('username', finalUsername)
                    .maybeSingle();
                
                if (!existing) break;
                counter++;
                finalUsername = `${username}${counter}`;
            }
            
            console.log('Creating profile with username:', finalUsername);
            
            // Create profile
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: session.user.id,
                    username: finalUsername,
                    full_name: metadata.full_name || metadata.name || null,
                    token_balance: 10000,
                    free_generations_remaining: 3,
                    bonus_expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    storage_limit_bytes: 209715200
                });
            
            if (insertError) {
                console.error('Error creating profile:', insertError);
                return;
            }
            
            console.log('✅ Profile created successfully via fallback');
            
            // Create default categories
            await supabase.from('categories').insert([
                { user_id: session.user.id, name: 'Work' },
                { user_id: session.user.id, name: 'Personal' }
            ]).then(() => console.log('✅ Default categories created'));
            
            // Create default personas
            await supabase.from('personas').insert([
                {
                    user_id: session.user.id,
                    name: 'Doctor',
                    icon: 'medical_services',
                    system_prompt: 'You are a helpful and empathetic medical professional. Provide information for educational purposes, but always remind the user to consult a real doctor for medical advice.'
                },
                {
                    user_id: session.user.id,
                    name: 'Friend',
                    icon: 'sentiment_satisfied',
                    system_prompt: 'You are a friendly and supportive companion. Chat in a casual, conversational tone.'
                },
                {
                    user_id: session.user.id,
                    name: 'Lawyer',
                    icon: 'gavel',
                    system_prompt: 'You are a knowledgeable and professional lawyer. Provide general legal information and explanations for educational purposes, but always state that you are not giving legal advice and the user should consult with a licensed attorney for their specific situation.'
                }
            ]).then(() => console.log('✅ Default personas created'));
            
        } catch (error) {
            console.error('Error in ensureProfileExists:', error);
        }
    };

    // Fetch models when logged in
    useEffect(() => {
        if (hasValidSession) {
            fetchModels();
        }
    }, [hasValidSession, fetchModels]);

    // Show welcome screen when user first logs in
    useEffect(() => {
        if (!authLoading && session && profile?.username && !showWelcome) {
            // Only show welcome screen if this is a fresh login, not tab switching
            const lastWelcomeTimestamp = sessionStorage.getItem('lastWelcomeTimestamp');
            const currentTime = Date.now();
            const timeSinceLastWelcome = currentTime - (parseInt(lastWelcomeTimestamp || '0'));
            
            // Only show welcome if it's been more than 5 minutes since last welcome
            if (timeSinceLastWelcome > 300000) {
                console.log('Showing welcome screen for:', profile.username);
                sessionStorage.setItem('lastWelcomeTimestamp', currentTime.toString());
                setShowWelcome(true);
            }
        }
    }, [authLoading, session, profile?.username]);

    // Handle visibility change to prevent welcome screen on tab switching
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Tab is hidden, store the timestamp
                sessionStorage.setItem('tabHiddenTimestamp', Date.now().toString());
            } else {
                // Tab is visible again, check if we should prevent welcome screen
                const hiddenTimestamp = sessionStorage.getItem('tabHiddenTimestamp');
                if (hiddenTimestamp) {
                    const timeHidden = Date.now() - parseInt(hiddenTimestamp);
                    // If tab was hidden for less than 30 seconds, don't show welcome
                    if (timeHidden < 30000) {
                        sessionStorage.setItem('lastWelcomeTimestamp', Date.now().toString());
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Hide welcome screen after 1.5 seconds
    useEffect(() => {
        if (showWelcome) {
            const timer = setTimeout(() => {
                setShowWelcome(false);
            }, 1500);
            
            return () => clearTimeout(timer);
        }
    }, [showWelcome]);

    // Simple auth states - NO complex debugging
    if (authLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[var(--nb-bg)] flex-col">
                <svg className="animate-spin h-12 w-12 text-[var(--nb-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-[var(--nb-text)]">Loading...</p>
            </div>
        );
    }

    if (!hasValidSession) {
        return <LandingPage />;
    }

    if (!hasProfile) {
        return <ProfileSetupPage key={session.user.id} session={session} />;
    }
    
    // Main app - SIMPLE visibility logic
    return (
        <>
            {showWelcome && <WelcomeLoader username={profile.username} />}
            
            <div className={showWelcome ? 'opacity-0 pointer-events-none' : 'opacity-100'} style={{ transition: 'opacity 0.3s ease-in-out' }}>
                <TokenCounter />
                <Routes>
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<DashboardPage />} />
                        <Route path="chat" element={<ChatPage />} />
                        <Route path="video" element={<VideoGenPage />} />
                        <Route path="generations" element={<MyGenerationsPage />} />
                        <Route path="personas" element={<PersonaPage />} />
                    </Route>
                    <Route path="/studio" element={<StudioPage />} />
                    <Route path="/marketing" element={<MarketingPage />} />
                    <Route path="/generate" element={<ImageGenerationPage />} />
                    <Route path="/dress-me" element={<StyleMePage />} />
                    <Route path="/settings/*" element={<SettingsPage />} />
                    <Route path="/playground" element={<PlaygroundPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </>
    );
};

export default App;