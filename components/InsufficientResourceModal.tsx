import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatBytes, formatTokens } from '../services/resourceCheckService';

interface InsufficientResourceModalProps {
    type: 'tokens' | 'storage';
    onClose: () => void;
    tokensNeeded?: number;
    currentTokens?: number;
    storageNeeded?: number;
    currentStorage?: number;
    storageLimit?: number;
    operationType?: 'image' | 'video' | 'general';
}

const InsufficientResourceModal: React.FC<InsufficientResourceModalProps> = ({
    type,
    onClose,
    tokensNeeded,
    currentTokens,
    storageNeeded,
    currentStorage,
    storageLimit,
    operationType = 'general',
}) => {
    const navigate = useNavigate();

    const handleUpgrade = () => {
        onClose();
        navigate('/settings/subscription');
    };

    const handleBuyTokens = () => {
        onClose();
        navigate('/settings/tokens');
    };

    const handleManageStorage = () => {
        onClose();
        navigate('/generations');
    };

    const renderTokensContent = () => (
        <>
            {/* Icon */}
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <svg 
                        className="w-10 h-10 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                    </svg>
                </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                    Insufficient Tokens
                </h2>
                <p className="text-base text-[var(--nb-text-secondary)] leading-relaxed">
                    You don't have enough tokens to complete this {operationType} generation.
                </p>
            </div>

            {/* Stats */}
            <div className="bg-[var(--nb-surface-alt)] rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--nb-text-secondary)]">Current Balance:</span>
                    <span className="text-lg font-bold text-[var(--nb-text)]">{formatTokens(currentTokens || 0)} tokens</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--nb-text-secondary)]">Tokens Needed:</span>
                    <span className="text-lg font-bold text-orange-500">{formatTokens(tokensNeeded || 0)} tokens</span>
                </div>
                <div className="w-full h-2 bg-[var(--nb-bg)] rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                        style={{ width: `${Math.min(((currentTokens || 0) / ((currentTokens || 0) + (tokensNeeded || 1))) * 100, 100)}%` }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <button 
                    onClick={handleBuyTokens}
                    className="w-full neo-button neo-button-primary text-lg py-3 font-semibold"
                >
                    <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Buy More Tokens
                </button>
                <button 
                    onClick={handleUpgrade}
                    className="w-full neo-button neo-button-secondary text-lg py-3 font-semibold"
                >
                    <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Upgrade Plan
                </button>
                <button 
                    onClick={onClose}
                    className="w-full text-[var(--nb-text-secondary)] hover:text-[var(--nb-text)] py-2 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </>
    );

    const renderStorageContent = () => {
        const usagePercentage = storageLimit ? ((currentStorage || 0) / storageLimit) * 100 : 0;
        
        return (
            <>
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <svg 
                            className="w-10 h-10 text-white" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" 
                            />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                        Storage Full
                    </h2>
                    <p className="text-base text-[var(--nb-text-secondary)] leading-relaxed">
                        You don't have enough storage space to generate a new {operationType}.
                        {operationType === 'image' && ' At least 5 MB is required.'}
                        {operationType === 'video' && ' At least 10 MB is required.'}
                    </p>
                </div>

                {/* Stats */}
                <div className="bg-[var(--nb-surface-alt)] rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--nb-text-secondary)]">Current Usage:</span>
                        <span className="text-lg font-bold text-[var(--nb-text)]">{formatBytes(currentStorage || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--nb-text-secondary)]">Storage Limit:</span>
                        <span className="text-lg font-bold text-[var(--nb-text)]">{formatBytes(storageLimit || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--nb-text-secondary)]">Additional Needed:</span>
                        <span className="text-lg font-bold text-red-500">{formatBytes(storageNeeded || 0)}</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--nb-bg)] rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${usagePercentage >= 95 ? 'bg-red-500' : 'bg-gradient-to-r from-red-500 to-pink-500'}`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-center text-[var(--nb-text-secondary)]">
                        {usagePercentage.toFixed(1)}% used
                    </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-sm text-[var(--nb-text-secondary)] text-center">
                        <span className="font-semibold text-[var(--nb-text)]">💡 Tip:</span> Delete old generations to free up space or upgrade your plan for more storage.
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button 
                        onClick={handleManageStorage}
                        className="w-full neo-button neo-button-primary text-lg py-3 font-semibold"
                    >
                        <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Old Generations
                    </button>
                    <button 
                        onClick={handleUpgrade}
                        className="w-full neo-button neo-button-secondary text-lg py-3 font-semibold"
                    >
                        <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Upgrade for More Storage
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full text-[var(--nb-text-secondary)] hover:text-[var(--nb-text)] py-2 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </>
        );
    };

    return (
        <div 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="resource-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
            <div className="image-modal-backdrop" onClick={onClose}></div>
            <div className="neo-card p-8 w-full max-w-md space-y-6 m-4 relative animate-fade-in z-[10000] max-h-[90vh] overflow-y-auto">
                {type === 'tokens' ? renderTokensContent() : renderStorageContent()}
            </div>
        </div>
    );
};

export default InsufficientResourceModal;
