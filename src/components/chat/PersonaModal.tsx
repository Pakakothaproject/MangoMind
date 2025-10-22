import React, { useState, useEffect } from 'react';
import { usePersonaStore } from '../../store/chat';
import type { Persona } from '../../types';
import { XIcon } from '../Icons';

const ICON_OPTIONS = [
    'smart_toy', 'psychology', 'school', 'history_edu', 'code', 'draw', 
    'translate', 'gavel', 'calculate', 'biotech', 'public', 'account_balance'
];

interface PersonaModalProps {
    isOpen: boolean;
    onClose: () => void;
    personaToEdit?: Persona | null;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({ isOpen, onClose, personaToEdit }) => {
    const { addPersona, updatePersona } = usePersonaStore(s => s.actions);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('smart_toy');
    const [systemPrompt, setSystemPrompt] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (personaToEdit) {
                setName(personaToEdit.name);
                setIcon(personaToEdit.icon);
                setSystemPrompt(personaToEdit.systemPrompt);
            } else {
                setName('');
                setIcon('smart_toy');
                setSystemPrompt('');
            }
        }
    }, [isOpen, personaToEdit]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim() || !systemPrompt.trim()) {
            alert('Please provide a name and system prompt.');
            return;
        }

        const personaData = { name, icon, systemPrompt };
        if (personaToEdit) {
            updatePersona(personaToEdit.id, personaData);
        } else {
            addPersona(personaData);
        }
        onClose();
    };

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="persona-modal-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#2B2D31] text-white rounded-lg shadow-xl w-full max-w-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-center">
                    <h2 id="persona-modal-title" className="text-lg font-bold">{personaToEdit ? 'Edit Persona' : 'Create New Persona'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-[rgba(78,80,88,0.6)]">
                        <XIcon />
                    </button>
                </div>
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label htmlFor="persona-name" className="text-sm font-semibold text-[#B5BAC1] mb-2 block">Name</label>
                        <input
                            id="persona-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Senior TypeScript Dev"
                            className="w-full p-2 bg-[#313338] rounded-md outline-none focus:ring-2 focus:ring-[#5865F2]"
                        />
                    </div>
                     <div>
                        <label className="text-sm font-semibold text-[#B5BAC1] mb-2 block">Icon</label>
                        <div className="grid grid-cols-6 gap-2">
                            {ICON_OPTIONS.map(iconName => (
                                <button
                                    key={iconName}
                                    onClick={() => setIcon(iconName)}
                                    className={`flex items-center justify-center p-3 rounded-md transition-colors ${icon === iconName ? 'bg-[var(--jackfruit-accent)] text-black' : 'bg-[#313338] hover:bg-[#4E5058]'}`}
                                >
                                    <span className="material-symbols-outlined">{iconName}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label htmlFor="persona-prompt" className="text-sm font-semibold text-[#B5BAC1] mb-2 block">System Prompt</label>
                        <textarea
                            id="persona-prompt"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="e.g., You are a senior software engineer specializing in TypeScript..."
                            className="w-full h-40 p-2 bg-[#313338] rounded-md resize-none outline-none focus:ring-2 focus:ring-[#5865F2]"
                        />
                    </div>
                </div>
                <div className="p-4 border-t border-[rgba(255,255,255,0.06)] flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-[#4E5058] hover:bg-[#5a5c63]">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-[#5865F2] hover:bg-[#4752c4]">Save</button>
                </div>
            </div>
        </div>
    );
};
