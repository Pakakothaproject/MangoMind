import React from 'react';

interface EmailConfirmationPanelProps {
    onClose: () => void;
}

const EmailConfirmationPanel: React.FC<EmailConfirmationPanelProps> = ({ onClose }) => {
    const handleOkay = () => {
        onClose();
    };

    return (
        <div 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="confirmation-panel-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
            <div className="image-modal-backdrop"></div>
            <div className="neo-card p-8 w-full max-w-md space-y-6 m-4 relative animate-fade-in z-[10000]">
                {/* Email Icon */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--nb-primary)] to-purple-500 flex items-center justify-center shadow-lg">
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
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                            />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center space-y-2">
                    <h2 
                        id="confirmation-panel-title" 
                        className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[var(--nb-primary)] to-purple-500 bg-clip-text text-transparent"
                    >
                        Check Your Email
                    </h2>
                    <p className="text-base text-[var(--nb-text-secondary)] leading-relaxed">
                        We've sent a confirmation link to your email address. 
                        Please check your inbox and click the link to verify your account.
                    </p>
                </div>

                {/* Additional Info */}
                <div className="bg-[var(--nb-primary)]/10 border border-[var(--nb-primary)]/20 rounded-lg p-4">
                    <p className="text-sm text-[var(--nb-text-secondary)] text-center">
                        <span className="font-semibold text-[var(--nb-text)]">Tip:</span> Don't forget to check your spam folder if you don't see the email within a few minutes.
                    </p>
                </div>

                {/* Okay Button */}
                <button 
                    onClick={handleOkay}
                    className="w-full neo-button neo-button-primary text-lg py-3 font-semibold"
                    autoFocus
                >
                    Okay
                </button>
            </div>
        </div>
    );
};

export default EmailConfirmationPanel;
