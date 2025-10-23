import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

const TokenCounter: React.FC = () => {
    const navigate = useNavigate();
    const { session, profile } = useAppStore();
    const fetchTokenBalance = useAppStore(s => s.actions.fetchTokenBalance);

    React.useEffect(() => {
        if (session) {
            fetchTokenBalance();
        }
    }, [session, fetchTokenBalance]);

    if (!session || !profile) {
        return null;
    }
    
    const isBonusActive = profile.bonus_expires_at && new Date(profile.bonus_expires_at) > new Date();
    const isPackageActive = profile.package_expires_at && new Date(profile.package_expires_at) > new Date();
    
    let expiryDate: Date | null = null;
    if (isPackageActive) {
        expiryDate = new Date(profile.package_expires_at!);
    } else if (isBonusActive) {
        expiryDate = new Date(profile.bonus_expires_at!);
    }

    const handleClick = () => {
        navigate('/settings/usage');
    };

    return (
        <div className="fixed top-2 right-2 md:top-4 md:right-4 z-50 group">
            <div 
                className="flex items-center gap-1 md:gap-2 bg-[var(--nb-surface)] text-[var(--nb-text)] px-2 py-1 md:px-3 md:py-1.5 rounded-full shadow-lg border border-[var(--nb-border)] cursor-pointer hover:bg-[var(--nb-surface-alt)] transition-colors"
                onClick={handleClick}
            >
                <span className="material-symbols-outlined text-[var(--nb-primary)] !text-xs md:!text-base">toll</span>
                <span className="font-semibold text-xs md:text-sm">{profile.token_balance.toLocaleString()}</span>
            </div>
            <div className="absolute top-full right-0 mt-2 p-3 neo-card w-56 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <h4 className="font-bold text-sm mb-2">Account Status</h4>
                 <div className="text-xs space-y-2">
                    <div className="flex justify-between font-semibold"><span>Token Balance:</span> <span>{profile.token_balance.toLocaleString()}</span></div>
                    {isBonusActive && (
                        <div className="flex justify-between">
                            <span>Free Generations:</span> 
                            <span className="font-semibold">{profile.free_generations_remaining}</span>
                        </div>
                    )}
                    {expiryDate ? (
                         <div className="flex justify-between pt-1 border-t border-[var(--nb-border)]">
                            <span>Expires:</span> 
                            <span className="font-semibold">{expiryDate.toLocaleDateString()}</span>
                        </div>
                    ) : (
                        <div className="pt-1 border-t border-[var(--nb-border)] text-center text-[var(--nb-secondary)] font-semibold">
                            Expired
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TokenCounter;