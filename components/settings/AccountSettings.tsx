import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { supabase } from '../../services/supabaseClient';

const AccountSettings: React.FC = () => {
    const email = useAppStore(state => state.session?.user?.email);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Account</h1>
            <div className="neo-card p-6 space-y-6">
                <div>
                    <h2 className="font-semibold text-lg">Email Address</h2>
                    <p className="text-[var(--nb-text-secondary)]">{email}</p>
                </div>
                 <div>
                    <h2 className="font-semibold text-lg">Password</h2>
                    {!isChangingPassword ? (
                        <button 
                            onClick={() => setIsChangingPassword(true)} 
                            className="neo-button neo-button-secondary"
                        >
                            Change Password
                        </button>
                    ) : (
                        <PasswordChangeForm onCancel={() => setIsChangingPassword(false)} />
                    )}
                </div>
                 <div className="border-t border-[var(--nb-border)] pt-6">
                    <h2 className="font-semibold text-lg text-[var(--nb-secondary)]">Danger Zone</h2>
                    <p className="text-[var(--nb-text-secondary)] mb-2">Permanently delete your account and all associated data.</p>
                    <button className="neo-button neo-button-danger" disabled>Delete Account</button>
                </div>
            </div>
        </div>
    );
};

const PasswordChangeForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
    const email = useAppStore(state => state.session?.user?.email);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            // Re-authenticate with current password
            const { error: reauthError } = await supabase.auth.signInWithPassword({
                email: email || '',
                password: currentPassword,
            });

            if (reauthError) {
                setError('Current password is incorrect');
                return;
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) {
                setError(updateError.message);
            } else {
                setMessage('Password changed successfully!');
                setTimeout(() => {
                    onCancel();
                }, 2000);
            }
        } catch (err) {
            setError('An error occurred while changing your password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="neo-input"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="neo-input"
                    required
                    minLength={6}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="neo-input"
                    required
                    minLength={6}
                />
            </div>
            
            {error && <p className="text-sm text-[var(--nb-secondary)]">{error}</p>}
            {message && <p className="text-sm text-green-500">{message}</p>}
            
            <div className="flex gap-2">
                <button type="submit" disabled={loading} className="neo-button neo-button-primary">
                    {loading ? 'Updating...' : 'Update Password'}
                </button>
                <button type="button" onClick={onCancel} className="neo-button neo-button-secondary">
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default AccountSettings;