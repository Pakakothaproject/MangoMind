import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { getMyTokenUsageHistory } from '../../services/tokenService';
import type { TokenUsage } from '../../types';

const TOKENS_PER_CREDIT = 100;
const PRICE_PER_TOKEN_USD = 0.0000025;
const USD_TO_BDT_RATE = 121.45;

const StatCard: React.FC<{ title: string; value: string; subtext?: string; className?: string }> = ({ title, value, subtext, className }) => (
    <div className={`bg-[var(--nb-surface-alt)] p-4 rounded-lg text-center ${className}`}>
        <p className="text-sm text-[var(--nb-text-secondary)] font-semibold">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {subtext && <p className="text-xs text-[var(--nb-text-secondary)]">{subtext}</p>}
    </div>
);

const UsageSettings: React.FC = () => {
    const { storageUsageBytes, profile } = useAppStore();
    const [history, setHistory] = useState<TokenUsage[]>([]);
    const [totalTokenUsage, setTotalTokenUsage] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const veryOldDate = new Date('2000-01-01');
        
        setLoading(true);
        getMyTokenUsageHistory(veryOldDate).then(allHistory => {
            // FIX: Type 'unknown' is not assignable to type 'number'.
            const total = allHistory.reduce((sum: number, record) => sum + (Number(record.total_tokens) || 0), 0);
            setTotalTokenUsage(total);

            const last30DaysHistory = allHistory.filter(record => new Date(record.created_at) >= thirtyDaysAgo);
            setHistory(last30DaysHistory);
            
            setLoading(false);
        });
    }, []);

    const usageLast30Days = useMemo(() => {
        return history.reduce((sum, record) => sum + (Number(record.total_tokens) || 0), 0);
    }, [history]);

    const usageByFeature = useMemo(() => {
        const grouped = history.reduce<Record<string, number>>((acc, record) => {
            const feature = record.feature || 'unknown';
            if (!acc[feature]) {
                acc[feature] = 0;
            }
            acc[feature] += (Number(record.total_tokens) || 0);
            return acc;
        }, {});

        return Object.entries(grouped)
            .map(([feature, total]): { feature: string; total: number } => ({ feature, total }))
            .sort((a, b) => b.total - a.total);
    }, [history]);

    const totalCreditsUsed = totalTokenUsage / TOKENS_PER_CREDIT;
    const totalCostUSD = totalTokenUsage * PRICE_PER_TOKEN_USD;
    const totalCostBDT = totalCostUSD * USD_TO_BDT_RATE;

    const storageLimitBytes = profile?.storage_limit_bytes || (200 * 1024 * 1024);
    const storageLimitMB = storageLimitBytes / 1024 / 1024;
    const usagePercentage = storageUsageBytes ? (storageUsageBytes / storageLimitBytes) * 100 : 0;
    const usageMB = storageUsageBytes ? (storageUsageBytes / 1024 / 1024).toFixed(2) : '0.00';
    
    const isBonusActive = profile?.bonus_expires_at && new Date(profile.bonus_expires_at) > new Date();

    if (loading) {
        return <p>Loading usage data...</p>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Credits & Usage</h1>
            <div className="space-y-8">
                 <div className="neo-card p-6">
                    <h2 className="font-semibold text-lg mb-4">Summary</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard 
                            title="Credits Used" 
                            value={totalCreditsUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            subtext={`(${(totalTokenUsage || 0).toLocaleString()} tokens)`}
                        />
                         <StatCard 
                            title="Cost (USD)" 
                            value={`$${totalCostUSD.toFixed(4)}`}
                        />
                        <StatCard 
                            title="Cost (BDT)" 
                            value={`৳${totalCostBDT.toFixed(2)}`}
                        />
                         <StatCard 
                            title="Storage Used" 
                            value={`${usageMB} MB`}
                            subtext={`of ${storageLimitMB} MB`}
                        />
                    </div>
                    {isBonusActive && profile && (
                        <div className="mt-6 p-4 bg-color-mix(in srgb, var(--nb-accent) 15%, transparent) rounded-lg border border-[var(--nb-accent)]">
                            <h3 className="font-bold text-lg mb-2">New User Bonus</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <StatCard 
                                    title="Free Generations Left" 
                                    value={profile.free_generations_remaining.toString()}
                                    className="!bg-color-mix(in srgb, var(--nb-accent) 25%, transparent)"
                                />
                                <StatCard 
                                    title="Bonus Expires" 
                                    value={new Date(profile.bonus_expires_at!).toLocaleDateString()}
                                    className="!bg-color-mix(in srgb, var(--nb-accent) 25%, transparent)"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="neo-card p-6">
                    <h2 className="font-semibold text-lg mb-4">Usage by Feature (Last 30 Days)</h2>
                    <div className="space-y-3">
                        {usageByFeature.length > 0 ? usageByFeature.map(({ feature, total }) => (
                            <div key={feature} className="space-y-1">
                                <div className="flex justify-between items-baseline">
                                    <p className="font-semibold text-sm capitalize">{feature.replace(/[-_]/g, ' ')}</p>
                                    <p className="text-sm font-mono">{total.toLocaleString()} tokens</p>
                                </div>
                                <div className="w-full bg-[var(--nb-surface-alt)] rounded-full h-2.5">
                                    <div 
                                        className="bg-[var(--nb-primary)] h-2.5 rounded-full" 
                                        style={{ width: `${usageLast30Days > 0 ? (total / usageLast30Days) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-sm text-[var(--nb-text-secondary)] py-4">No token usage recorded in the last 30 days.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsageSettings;