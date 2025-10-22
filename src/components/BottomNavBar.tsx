import React from 'react';
import { NavLink } from 'react-router-dom';
import { useHoverSoundProps } from '../useSound';

// --- Reusable Navigation Button for Bottom Nav Bar ---
const BottomNavButton: React.FC<{
    label: string;
    icon: string;
    to: string;
    end?: boolean;
}> = ({ label, icon, to, end = false }) => {
    const hoverSoundProps = useHoverSoundProps();
    return (
     <NavLink
        {...hoverSoundProps}
        to={to}
        end={end}
        title={label}
        className={({ isActive }) => `relative flex flex-col items-center justify-center h-full flex-1 p-1 text-center transition-colors duration-200 group rounded-lg ${
            isActive ? 'text-[var(--nb-primary)]' : 'text-[var(--nb-text-secondary)] hover:text-[var(--nb-text)]'
        }`}
    >
        {({ isActive }) => (
            <>
                <div className={`relative flex items-center justify-center w-14 h-8 rounded-full transition-colors duration-200`}>
                    <span className={`material-symbols-outlined text-2xl ${label === 'Playground' ? 'playground-icon-glow' : ''}`}>{icon}</span>
                </div>
                <span className="text-xs font-semibold mt-1">{label}</span>
                {isActive && <div className="absolute bottom-1.5 h-1 w-5 bg-[var(--nb-primary)] rounded-full transition-all duration-300" />}
            </>
        )}
    </NavLink>
)};

// --- Mobile Bottom Navigation Bar ---
const BottomNavBar: React.FC<{ isOverlay?: boolean }> = ({ isOverlay }) => (
    <footer className={`md:hidden fixed bottom-0 left-0 right-0 z-20 ${isOverlay ? 'bottom-nav-overlay' : ''} bg-[var(--nb-surface)] border-t border-[var(--nb-border)] shadow-[0_-5px_15px_rgba(0,0,0,0.1)]`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <nav className="flex justify-around items-stretch h-16 max-w-md mx-auto">
            <BottomNavButton label="Dashboard" icon="auto_awesome" to="/" end />
            <BottomNavButton label="Chat" icon="chat_bubble" to="/chat" />
            <BottomNavButton label="Video" icon="movie" to="/video" />
            <BottomNavButton label="Settings" icon="settings" to="/settings" />
        </nav>
    </footer>
);

export default BottomNavBar;