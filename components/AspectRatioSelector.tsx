import React from 'react';

interface AspectRatioSelectorProps {
    value: string;
    onChange: (value: string) => void;
    ratios: string[];
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ value, onChange, ratios }) => {
    return (
        <div>
            <label className="font-semibold block text-sm mb-2">Aspect Ratio</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {ratios.map(ratio => (
                    <button
                        key={ratio}
                        onClick={() => onChange(ratio)}
                        className={`py-2 px-1 text-sm font-semibold rounded-lg transition-colors border-2 ${
                            value === ratio
                                ? 'bg-[var(--nb-primary)] text-white border-transparent'
                                : 'bg-[var(--nb-surface-alt)] border-[var(--nb-border)] hover:bg-[var(--nb-surface)]'
                        }`}
                    >
                        {ratio}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AspectRatioSelector;