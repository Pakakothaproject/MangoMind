import React, { useState } from 'react';
import { XIcon } from '../Icons';

interface SystemPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPrompt: string;
    onSave: (newPrompt: string) => void;
}

export const SystemPromptModal: React.FC<SystemPromptModalProps> = ({ isOpen, onClose, currentPrompt, onSave }) => {
    const [prompt, setPrompt] = useState(currentPrompt);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(prompt);
        onClose();
    };

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="system-prompt-title" className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#2B2D31] text-white rounded-lg shadow-xl w-full max-w-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-center">
                    <h2 id="system-prompt-title" className="text-lg font-bold">Tune Model Instructions</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-[rgba(78,80,88,0.6)]">
                        <XIcon />
                    </button>
                </div>
                <div className="p-4">
                    <p className="text-sm text-[#B5BAC1] mb-2">Provide custom instructions or context for the AI. This will apply to the current chat.</p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., You are a senior software engineer. All your code examples should be in TypeScript."
                        className="w-full h-48 p-2 bg-[#313338] rounded-md resize-none outline-none focus:ring-2 focus:ring-[#5865F2]"
                    />
                </div>
                <div className="p-4 border-t border-[rgba(255,255,255,0.06)] flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-[#4E5058] hover:bg-[#5a5c63]">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-[#5865F2] hover:bg-[#4752c4]">Save</button>
                </div>
            </div>
        </div>
    );
};