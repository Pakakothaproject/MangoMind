import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AuthSession as Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { SaveIcon, UserIcon } from '../components/Icons';

interface ProfileSetupPageProps {
  session: Session;
}

const ProfileSetupPage: React.FC<ProfileSetupPageProps> = ({ session }) => {
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [originalUsername, setOriginalUsername] = useState<string | null>(null);
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'too_short' | 'invalid_chars'>('idle');
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const debouncedCheck = useRef<number | null>(null);

    useEffect(() => {
        const getProfile = async () => {
            try {
                setLoading(true);
                const { user } = session;

                let { data, error, status } = await supabase
                    .from('profiles')
                    .select(`username, full_name, gender, birth_date`)
                    .eq('id', user.id)
                    .single();

                if (error && status !== 406) {
                    throw error;
                }

                if (data) {
                    setUsername(data.username || '');
                    setOriginalUsername(data.username || null);
                    setFullName(data.full_name || '');
                    setGender(data.gender || '');
                    setBirthDate(data.birth_date || '');
                }
            } catch (error) {
                if (error instanceof Error) {
                    setError('Error loading profile data: ' + error.message);
                }
            } finally {
                setLoading(false);
            }
        };
        getProfile();
    }, [session]);

    const checkUsername = useCallback(async (name: string) => {
        setUsernameStatus('checking');
        const { data, error } = await supabase.rpc('get_username_status', { p_username: name });
        if (error) {
            console.error(error);
            setUsernameStatus('idle');
        } else if (data) {
            setUsernameStatus(data.status);
            setUsernameSuggestions(data.suggestions || []);
        }
    }, []);

    useEffect(() => {
        if (debouncedCheck.current) clearTimeout(debouncedCheck.current);
        
        const trimmedUsername = username.trim();
        if (trimmedUsername === '' || trimmedUsername.toLowerCase() === originalUsername?.toLowerCase()) {
            setUsernameStatus('idle');
            setUsernameSuggestions([]);
            return;
        }

        setUsernameStatus('checking');
        debouncedCheck.current = window.setTimeout(() => {
            checkUsername(trimmedUsername);
        }, 500);

        return () => {
            if (debouncedCheck.current) clearTimeout(debouncedCheck.current);
        };
    }, [username, originalUsername, checkUsername]);


    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (username.toLowerCase() !== originalUsername?.toLowerCase() && usernameStatus !== 'available') {
            setError('Please choose an available username.');
            return;
        }

        try {
            setLoading(true);
            const { error: rpcError } = await supabase.rpc('update_user_profile', {
                p_username: username,
                p_full_name: fullName,
                p_gender: gender,
                p_birth_date: birthDate || null,
            });

            if (rpcError) throw rpcError;

            setMessage('Profile saved successfully! Redirecting...');
            setTimeout(() => {
                // Check if there's an intended URL to redirect to
                const intendedUrl = sessionStorage.getItem('intendedUrl');
                if (intendedUrl) {
                    sessionStorage.removeItem('intendedUrl');
                    window.location.href = intendedUrl;
                } else {
                    window.location.reload(); // Reload to trigger App.tsx's logic
                }
            }, 1500);

        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const renderUsernameFeedback = () => {
        const isUsernameChanged = username.trim().toLowerCase() !== originalUsername?.toLowerCase();
        if (!isUsernameChanged && username.trim() !== '') return null;

        switch (usernameStatus) {
            case 'checking':
                return <p className="text-xs text-[var(--nb-text-secondary)] mt-1 animate-pulse">Checking availability...</p>;
            case 'available':
                return <p className="text-xs text-green-500 font-semibold mt-1">✓ Username is available!</p>;
            case 'taken':
                return <p className="text-xs text-[var(--nb-secondary)] font-semibold mt-1">✗ Username is taken.</p>;
            case 'too_short':
                return <p className="text-xs text-[var(--nb-secondary)] font-semibold mt-1">Username must be at least 3 characters.</p>;
            case 'invalid_chars':
                return <p className="text-xs text-[var(--nb-secondary)] font-semibold mt-1">Only letters, numbers, and underscores allowed.</p>;
            default:
                return <p className="text-xs opacity-60 mt-1">This will be your public name.</p>;
        }
    };

    return (
        <div className="h-screen w-full bg-[var(--nb-bg)] text-[var(--nb-text)] flex flex-col items-center justify-center p-4">
            <div className="neo-card p-6 md:p-8 w-full max-w-lg space-y-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                <div className="text-center">
                    <div className="w-12 h-12 bg-[var(--nb-primary)] text-white rounded-lg flex items-center justify-center mx-auto mb-4">
                        <UserIcon />
                    </div>
                    <h1 className="text-3xl font-bold">Complete Your Profile</h1>
                    <p className="text-md opacity-70 mt-1">
                        Please set up your profile to continue to the studio.
                    </p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="font-semibold">Username</label>
                        <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} className="neo-input mt-1" required minLength={3} />
                        {renderUsernameFeedback()}
                        {usernameStatus === 'taken' && usernameSuggestions.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <p className="text-xs font-semibold">Suggestions:</p>
                                <div className="flex flex-wrap gap-2">
                                    {usernameSuggestions.map(suggestion => (
                                        <button key={suggestion} type="button" onClick={() => setUsername(suggestion)} className="text-xs bg-[var(--nb-surface-alt)] px-2 py-1 rounded-md hover:bg-[var(--nb-primary)] hover:text-white">
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="fullName" className="font-semibold">Full Name</label>
                        <input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="neo-input mt-1" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="gender" className="font-semibold">Gender</label>
                            <select id="gender" value={gender} onChange={e => setGender(e.target.value)} className="neo-input mt-1">
                                <option value="">Select...</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="other">Other</option>
                                <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="birthDate" className="font-semibold">Birth Date</label>
                            <input id="birthDate" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="neo-input mt-1" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full neo-button neo-button-primary text-lg mt-4">
                        <SaveIcon /> {loading ? 'Saving...' : 'Save and Continue'}
                    </button>
                </form>

                {error && <p className="text-sm text-center text-[var(--nb-secondary)] mt-4">{error}</p>}
                {message && <p className="text-sm text-center text-[var(--nb-primary)] mt-4">{message}</p>}
            </div>
        </div>
    );
};

export default ProfileSetupPage;