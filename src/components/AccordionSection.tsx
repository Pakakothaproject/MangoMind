import React from 'react';
import { CollapseIcon, ExpandIcon } from './Icons';

// Accordion Component for the new UI
export const AccordionSection: React.FC<{
  title: string;
  sectionId: string;
  activeSection: string | null;
  setActiveSection: React.Dispatch<React.SetStateAction<string | null>>;
  isEnabled?: boolean;
  isComplete?: boolean;
  children: React.ReactNode;
  Icon: React.FC;
}> = ({ title, sectionId, activeSection, setActiveSection, isEnabled = true, isComplete = false, children, Icon }) => {
    const isOpen = activeSection === sectionId;
    
    const handleToggle = () => {
        if (!isEnabled) return;
        if (isOpen) {
            // Allow closing only if it's not the only logical next step
            setActiveSection(null);
        } else {
            setActiveSection(sectionId);
        }
    };

    return (
        <div className={`neo-card p-0 transition-opacity ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <button
                onClick={handleToggle}
                disabled={!isEnabled}
                className="w-full flex justify-between items-center p-4"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-lg border-2 border-[var(--nb-border)] transition-colors
                        ${isOpen ? 'bg-[var(--nb-primary)] text-[var(--nb-border)] dark:text-[var(--nb-bg)]' : 'bg-[var(--nb-surface-alt)]'}
                        ${isComplete && !isOpen ? 'bg-[var(--nb-accent)]' : ''}`}
                    >
                        <Icon />
                    </div>
                    <h3 className="text-xl font-bold">{title}</h3>
                </div>
                {isOpen ? <CollapseIcon className="w-6 h-6"/> : <ExpandIcon className="w-6 h-6"/>}
            </button>
            {isOpen && (
                <div className="p-5 border-t-2 border-dashed border-[var(--nb-border)] animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};
