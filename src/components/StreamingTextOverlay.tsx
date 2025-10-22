import React, { useState, useEffect } from 'react';
import { TerminalIcon, XIcon, ChevronUpIcon, ChevronDownIcon } from './Icons';

interface StreamingTextOverlayProps {
    streamingText: string | null;
    isStreamingFinal: boolean;
    onClose: () => void;
}

export const StreamingTextOverlay: React.FC<StreamingTextOverlayProps> = ({ streamingText, isStreamingFinal, onClose }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (streamingText) {
            setIsExpanded(true);
        }
    }, [streamingText]);

    if (!streamingText) return null;

    const lines = streamingText.split('\n');
    const lastNonEmptyLine = [...lines].reverse().find(line => line.trim() !== '') || lines[lines.length - 1] || '';

    return (
        <div className="absolute bottom-4 left-4 right-4 z-30 transition-all duration-300 ease-in-out animate-fade-in">
             <div className="neo-card max-w-2xl mx-auto shadow-2xl">
                <div className="flex justify-between items-center p-3 border-b border-[var(--nb-border)]">
                    <h3 className="text-md font-bold flex items-center gap-2"><TerminalIcon /> Model Response</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="neo-button neo-icon-button !p-1.5" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
                            {isExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
                        </button>
                        <button onClick={onClose} className="neo-button neo-icon-button !p-1.5" aria-label="Close">
                            <XIcon />
                        </button>
                    </div>
                </div>
                {isExpanded ? (
                    <div className="p-4 text-left whitespace-pre-wrap bg-[var(--nb-surface-alt)] max-h-48 overflow-y-auto">
                        {streamingText}
                        {!isStreamingFinal && <span className="inline-block w-2 h-4 bg-[var(--nb-primary)] ml-1" style={{ animation: 'blink 1s step-end infinite' }}></span>}
                    </div>
                ) : (
                    <div className="p-3 text-left whitespace-nowrap overflow-hidden text-ellipsis text-sm text-[var(--nb-text-secondary)]">
                        {lastNonEmptyLine}
                        {!isStreamingFinal && <span className="inline-block w-2 h-4 bg-[var(--nb-primary)] ml-1" style={{ animation: 'blink 1s step-end infinite' }}></span>}
                    </div>
                )}
            </div>
        </div>
    );
};