import React, { useState } from 'react';
import { NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { ArrowLeftIcon, LogOutIcon } from '../components/Icons';

import ProfileSettings from '../components/settings/ProfileSettings';
import AccountSettings from '../components/settings/AccountSettings';
import UsageSettings from '../components/settings/UsageSettings';
import ModelPreferences from '../components/settings/ModelPreferences';
import BillingSettings from '../components/settings/BillingSettings';
import ChatModeSettings from '../components/settings/ChatModeSettings';
import ThemeSettings from '../components/settings/ThemeSettings';


const SettingsSidebarLink: React.FC<{ to: string, icon: string, label: string, onClick?: () => void }> = ({ to, icon, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive ? 'bg-[var(--nb-surface)] text-[var(--nb-primary)]' : 'text-[var(--nb-text-secondary)] hover:bg-[var(--nb-surface-alt)] hover:text-[var(--nb-text)]'
        }`}
    >
        <span className="material-symbols-outlined">{icon}</span>
        <span>{label}</span>
    </NavLink>
);

// Mobile Settings Navigation Component
const MobileSettingsNav: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
    const { handleBackToDashboard, signOut } = useAppStore(state => state.actions);
    
    return (
        <div className="lg:hidden h-full bg-[var(--nb-bg)] text-[var(--nb-text)] flex flex-col">
            <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-[var(--nb-border)]">
                <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-[var(--nb-text)] hover:opacity-80 transition-opacity">
                    <ArrowLeftIcon />
                    <span className="font-semibold">Back</span>
                </button>
                <h1 className="text-xl font-bold">Settings</h1>
            </header>
            
            <div className="flex-grow p-4">
                <nav className="flex flex-col gap-2">
                    <SettingsSidebarLink to="/settings/usage" icon="bar_chart" label="Usage" onClick={onNavigate} />
                    <SettingsSidebarLink to="/settings/profile" icon="person" label="Profile" onClick={onNavigate} />
                    <SettingsSidebarLink to="/settings/account" icon="shield_lock" label="Account" onClick={onNavigate} />
                    <SettingsSidebarLink to="/settings/theme" icon="palette" label="Appearance" onClick={onNavigate} />
                    <SettingsSidebarLink to="/settings/models" icon="model_training" label="SPDE Model Preferences" onClick={onNavigate} />
                    <SettingsSidebarLink to="/settings/chat-modes" icon="chat" label="Chat Modes" onClick={onNavigate} />
                    <SettingsSidebarLink to="/settings/billing" icon="credit_card" label="Billing" onClick={onNavigate} />
                    <SettingsSidebarLink to="/generations" icon="photo_library" label="My Generations" onClick={onNavigate} />
                </nav>
                
                <div className="mt-8 pt-4 space-y-2 border-t border-[var(--nb-border)]">
                    <button 
                        onClick={signOut} 
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10"
                    >
                        <LogOutIcon />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


const SettingsPage: React.FC = () => {
    // FIX: Actions are nested under the 'actions' property in the store.
    const { handleBackToDashboard, signOut } = useAppStore(state => state.actions);
    
    const location = useLocation();
    const isRootSettings = location.pathname === '/settings' || location.pathname === '/settings/';
    
    // Initialize showMobileNav based on whether we're on root settings or a specific page
    const [showMobileNav, setShowMobileNav] = useState(isRootSettings);

    // Update showMobileNav when location changes
    React.useEffect(() => {
        if (isRootSettings) {
            setShowMobileNav(true);
        } else {
            setShowMobileNav(false);
        }
    }, [isRootSettings]);

    // On mobile, show navigation panel only when on root settings path
    const shouldShowMobileNav = window.innerWidth < 1024 && (isRootSettings || showMobileNav);

    return (
        <div className="h-screen w-full bg-[var(--nb-bg)] text-[var(--nb-text)] flex flex-col animate-fade-in">
            {/* Mobile Navigation Panel */}
            {shouldShowMobileNav && window.innerWidth < 1024 && (
                <MobileSettingsNav onNavigate={() => setShowMobileNav(false)} />
            )}
            
            {/* Desktop Layout or Mobile Content View */}
            {(!shouldShowMobileNav || window.innerWidth >= 1024) && (
                <>
                    <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-[var(--nb-border)] lg:hidden">
                        <button 
                            onClick={() => {
                                if (isRootSettings) {
                                    handleBackToDashboard();
                                } else {
                                    setShowMobileNav(true);
                                }
                            }} 
                            className="flex items-center gap-2 text-[var(--nb-text)] hover:opacity-80 transition-opacity"
                        >
                            <ArrowLeftIcon />
                            <span className="font-semibold">{isRootSettings ? 'Back' : 'Settings'}</span>
                        </button>
                        <h1 className="text-xl font-bold">Settings</h1>
                    </header>
                    <div className="flex-grow flex overflow-hidden">
                        {/* Desktop Sidebar */}
                        <aside className="hidden lg:flex flex-col w-64 bg-[var(--nb-surface)] p-4 border-r border-[var(--nb-border)]">
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold px-2">Settings</h1>
                            </div>
                            <nav className="flex flex-col gap-2">
                                <SettingsSidebarLink to="/settings/usage" icon="bar_chart" label="Usage" />
                                <SettingsSidebarLink to="/settings/profile" icon="person" label="Profile" />
                                <SettingsSidebarLink to="/settings/account" icon="shield_lock" label="Account" />
                                <SettingsSidebarLink to="/settings/theme" icon="palette" label="Appearance" />
                                <SettingsSidebarLink to="/settings/models" icon="model_training" label="SPDE Model Preferences" />
                                <SettingsSidebarLink to="/settings/chat-modes" icon="chat" label="Chat Modes" />
                                <SettingsSidebarLink to="/settings/billing" icon="credit_card" label="Billing" />
                                <SettingsSidebarLink to="/generations" icon="photo_library" label="My Generations" />
                            </nav>
                             <div className="flex-shrink-0 pt-4 space-y-2 border-t border-[var(--nb-border)]">
                                <button 
                                    onClick={signOut} 
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10"
                                >
                                    <LogOutIcon />
                                    <span>Sign Out</span>
                                </button>
                                <button onClick={handleBackToDashboard} className="w-full neo-button neo-button-secondary">
                                    <ArrowLeftIcon /> Back to Dashboard
                                </button>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-grow p-4 md:p-8 overflow-y-auto">
                            <Routes>
                                <Route path="usage" element={<UsageSettings />} />
                                <Route path="profile" element={<ProfileSettings />} />
                                <Route path="account" element={<AccountSettings />} />
                                <Route path="theme" element={<ThemeSettings />} />
                                <Route path="models" element={<ModelPreferences />} />
                                <Route path="chat-modes" element={<ChatModeSettings />} />
                                <Route path="billing" element={<BillingSettings />} />
                                <Route index element={<Navigate to="usage" replace />} />
                                <Route path="*" element={<div>Route not found</div>} />
                            </Routes>
                        </main>
                    </div>
                </>
            )}
        </div>
    );
};

export default SettingsPage;
