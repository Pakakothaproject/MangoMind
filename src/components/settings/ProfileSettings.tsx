import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { supabase } from '../../services/supabaseClient';
import { SaveIcon } from '../Icons';

const ProfileSettings: React.FC = () => {
    // FIX: `updateProfile` is nested under the 'actions' property in the store.
    const { profile, actions } = useAppStore();
    
    // Debug: Check if profile is loaded
    console.log('ProfileSettings - Profile:', profile);
    console.log('ProfileSettings - Actions:', actions);
    
    const [loading, setLoading] = useState(false);
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
        console.log('ProfileSettings - useEffect triggered, profile:', profile);
        if (profile) {
            console.log('ProfileSettings - Setting form data from profile:', {
                username: profile.username,
                full_name: profile.full_name,
                gender: profile.gender,
                birth_date: profile.birth_date
            });
            setUsername(profile.username || '');
            setOriginalUsername(profile.username || null);
            setFullName(profile.full_name || '');
            setGender(profile.gender || '');
            setBirthDate(profile.birth_date || '');
        }
    }, [profile]);
    
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

        setLoading(true);
        const { error: updateError } = await actions.updateProfile({
            username,
            full_name: fullName,
            gender,
            birth_date: birthDate,
        });
        setLoading(false);

        if (updateError) {
            setError(updateError.message);
        } else {
            setMessage('Profile saved successfully!');
            setTimeout(() => setMessage(''), 2000);
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
    
    const getDaysUntilChange = () => {
        if (!profile?.username_last_changed_at) return 0;
        const lastChange = new Date(profile.username_last_changed_at).getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        const nextChange = lastChange + thirtyDays;
        const now = new Date().getTime();
        if (now > nextChange) return 0;
        return Math.ceil((nextChange - now) / (1000 * 60 * 60 * 24));
    };
    
    const daysUntilChange = getDaysUntilChange();
    const isUsernameEditable = daysUntilChange <= 0;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Profile Information</h1>
            <div className="neo-card p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                     <div>
                        <label htmlFor="username" className="font-semibold">Username</label>
                        <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} className="neo-input mt-1" required minLength={3} disabled={!isUsernameEditable} />
                        {!isUsernameEditable ? (
                             <p className="text-xs text-[var(--nb-accent)] font-semibold mt-1">You can change your username again in {daysUntilChange} day(s).</p>
                        ) : renderUsernameFeedback()}
                        
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
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={loading} className="neo-button neo-button-primary">
                            <SaveIcon /> {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                     {error && <p className="text-sm text-center text-[var(--nb-secondary)] mt-2">{error}</p>}
                     {message && <p className="text-sm text-center text-[var(--nb-primary)] mt-2">{message}</p>}
                </form>
            </div>
        </div>
    );
};

export default ProfileSettings;
