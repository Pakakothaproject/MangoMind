import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { XIcon, EyeIcon, EyeOffIcon } from './Icons';
import EmailConfirmationPanel from './EmailConfirmationPanel';

interface AuthModalProps {
    initialMode: 'signin' | 'signup';
    onClose: () => void;
    onSignupSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ initialMode, onClose, onSignupSuccess }) => {
    const [mode, setMode] = useState(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmationPanel, setShowConfirmationPanel] = useState(false);

    const handleConfirmationClose = () => {
        setShowConfirmationPanel(false);
        onClose(); // Close the auth modal as well
        if (onSignupSuccess) {
            onSignupSuccess(); // Trigger callback to show sign-in modal
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (mode === 'signup') {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setError(error.message);
            } else {
                setShowConfirmationPanel(true);
            }
        } else { // signin
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setError(error.message);
            } else {
                // Let the onAuthStateChange listener in App.tsx handle the redirect.
                onClose();
            }
        }
        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        setMessage('');

        try {
            console.log('Initiating Google OAuth sign-in...');
            
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) {
                console.error('Google OAuth error:', error);
                setError(`Sign-in failed: ${error.message}`);
                setLoading(false);
                return;
            }
            
            console.log('Google OAuth initiated successfully:', data);
            setMessage('Redirecting to Google...');
            // If successful, user will be redirected to Google OAuth
        } catch (err) {
            console.error('Unexpected error during Google sign-in:', err);
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <div className="image-modal-backdrop" onClick={onClose}></div>
            <div className="image-modal-content">
                <div className="neo-card p-6 md:p-8 w-full max-w-md space-y-5 m-4 relative animate-fade-in">
                    <button onClick={onClose} className="absolute top-4 right-4 neo-button neo-icon-button neo-button-secondary hover:rotate-90 transition-transform duration-200"><XIcon /></button>
                    <div className="text-center space-y-2">
                        <h2 id="auth-modal-title" className="text-3xl font-bold text-[var(--jackfruit-accent)]">
                            {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
                        </h2>
                        <p className="text-sm text-[var(--nb-text-secondary)]">
                            {mode === 'signin' ? 'Sign in to continue to MangoMind' : 'Join MangoMind and start creating'}
                        </p>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label htmlFor="email">Email</label>
                            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="neo-input mt-1" required />
                        </div>
                        <div>
                            <label htmlFor="password">Password</label>
                            <div className="relative">
                                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="neo-input mt-1 pr-10" required />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--nb-text)] opacity-70 hover:opacity-100"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full neo-button neo-button-primary text-lg">
                            {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>
                    
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[var(--nb-border)]"></div>
                        </div>
                        <div className="relative flex justify-center text-xs font-medium">
                            <span className="px-3 py-1 bg-[var(--nb-surface)] text-[var(--nb-text-secondary)] rounded-full">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="group relative w-full overflow-hidden bg-gradient-to-r from-[var(--jackfruit-accent)] to-[var(--jackfruit-accent)]/80 hover:from-[var(--jackfruit-accent)]/90 hover:to-[var(--jackfruit-accent)]/70 text-[var(--jackfruit-dark)] font-semibold py-4 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                        style={{ backgroundSize: '200% 200%' }}
                    >
                        {loading ? (
                            <svg className="animate-spin h-6 w-6 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        )}
                        <span className="text-base font-medium">
                            {loading ? 'Connecting...' : 'Continue with Google'}
                        </span>
                        {!loading && (
                            <span className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-lg">
                                →
                            </span>
                        )}
                    </button>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-fade-in">
                            <p className="text-sm text-center text-red-500 font-medium">{error}</p>
                        </div>
                    )}
                    {message && (
                        <div className="bg-[var(--nb-primary)]/10 border border-[var(--nb-primary)]/20 rounded-lg p-3 animate-fade-in">
                            <p className="text-sm text-center text-[var(--nb-primary)] font-medium">{message}</p>
                        </div>
                    )}
                    <div className="text-center text-sm pt-2 border-t border-[var(--nb-border)]">
                        {mode === 'signin' ? (
                            <p className="text-[var(--nb-text-secondary)]">Don't have an account? <button onClick={() => setMode('signup')} className="font-semibold text-[var(--nb-primary)] hover:underline transition-all">Sign Up</button></p>
                        ) : (
                            <p className="text-[var(--nb-text-secondary)]">Already have an account? <button onClick={() => setMode('signin')} className="font-semibold text-[var(--nb-primary)] hover:underline transition-all">Sign In</button></p>
                        )}
                    </div>
                </div>
            </div>
            {showConfirmationPanel && (
                <EmailConfirmationPanel onClose={handleConfirmationClose} />
            )}
        </div>
    );
};

export default AuthModal;