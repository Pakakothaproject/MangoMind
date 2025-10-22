import React from 'react';

const BillingSettings: React.FC = () => {
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Billing & Subscriptions</h1>
            <div className="neo-card p-8 text-center">
                 <span className="material-symbols-outlined text-5xl text-[var(--nb-text-secondary)]">
                    credit_card_off
                </span>
                <h2 className="text-xl font-semibold mt-4">Coming Soon</h2>
                <p className="text-[var(--nb-text-secondary)] mt-2">
                    Management of credits, subscriptions, and payment methods will be available here in a future update.
                </p>
            </div>
        </div>
    );
};

export default BillingSettings;