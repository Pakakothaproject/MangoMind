import React, { useState } from 'react';
import useLocalStorage from '../../hooks/use-local-storage';
import { SaveIcon } from '../Icons';

const ApiSettings: React.FC = () => {
    const [imageGenModel, setImageGenModel] = useLocalStorage('gemini-image-gen-model', '');
    const [imageEditModel, setImageEditModel] = useLocalStorage('gemini-image-edit-model', '');
    const [textGenModel, setTextGenModel] = useLocalStorage('gemini-text-gen-model', '');
    const [videoGenModel, setVideoGenModel] = useLocalStorage('gemini-video-gen-model', '');

    const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    const handleSave = () => {
        // useLocalStorage saves on change, so this button is for user feedback.
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 1500);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Model Configuration</h1>
             <div className="neo-card p-6 space-y-6">
                <p className="text-sm opacity-80 -mt-2">
                    Specify the exact Gemini model versions to use for different tasks. Leave blank to use the application defaults.
                </p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="image-gen-model" className="font-semibold mb-1 block">Image Generation Model</label>
                        <input id="image-gen-model" type="text" value={imageGenModel} onChange={(e) => setImageGenModel(e.target.value)} className="neo-input" />
                        <p className="text-xs opacity-70 mt-1">e.g., imagen-4.0-generate-001</p>
                    </div>
                     <div>
                        <label htmlFor="image-edit-model" className="font-semibold mb-1 block">Image Editing Model</label>
                        <input id="image-edit-model" type="text" value={imageEditModel} onChange={(e) => setImageEditModel(e.target.value)} className="neo-input" />
                        <p className="text-xs opacity-70 mt-1">e.g., gemini-2.5-flash-image</p>
                    </div>
                     <div>
                        <label htmlFor="text-gen-model" className="font-semibold mb-1 block">Text & Analysis Model</label>
                        <input id="text-gen-model" type="text" value={textGenModel} onChange={(e) => setTextGenModel(e.target.value)} className="neo-input" />
                        <p className="text-xs opacity-70 mt-1">e.g., gemini-2.5-flash</p>
                    </div>
                     <div>
                        <label htmlFor="video-gen-model" className="font-semibold mb-1 block">Video Generation Model</label>
                        <input id="video-gen-model" type="text" value={videoGenModel} onChange={(e) => setVideoGenModel(e.target.value)} className="neo-input" />
                        <p className="text-xs opacity-70 mt-1">e.g., veo-2.0-generate-001</p>
                    </div>
                </div>
                
                 <div className="flex justify-end items-center gap-3 pt-4 border-t border-[var(--nb-border)]">
                    {status === 'saved' && <p className="text-sm text-[var(--nb-primary)] font-semibold animate-fade-in">✓ Saved!</p>}
                    <button onClick={handleSave} className="neo-button neo-button-primary"><SaveIcon /> Save Settings</button>
                </div>
            </div>
        </div>
    );
};

export default ApiSettings;