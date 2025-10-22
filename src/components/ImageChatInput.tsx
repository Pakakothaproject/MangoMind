import React from 'react';
import { SendIcon, StopIcon, CrosshairIcon, XIcon } from './Icons';

interface ImageChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    isLoading: boolean;
    placeholder?: string;
    isSelectingPoint?: boolean;
    onToggleSelectPoint?: () => void;
    selectedPoint?: { x: number; y: number } | null;
    onClearPoint?: () => void;
}

export const ImageChatInput: React.FC<ImageChatInputProps> = ({
    value,
    onChange,
    onSend,
    isLoading,
    placeholder = "Describe an edit...",
    isSelectingPoint,
    onToggleSelectPoint,
    selectedPoint,
    onClearPoint
}) => {
    const canSend = !isLoading && value.trim().length > 0;
    
    return (
        <div className="w-full max-w-4xl mx-auto p-4 flex-shrink-0">
            <div className="chat-input-container">
                {selectedPoint && (
                    <div className="chat-input-top-area">
                        <div className="chat-input-pills-container">
                            <div className="chat-action-indicator point">
                                <CrosshairIcon />
                                <span>Point Selected</span>
                                <button onClick={onClearPoint}><XIcon /></button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="chat-input-row">
                    {onToggleSelectPoint && (
                         <button
                            onClick={onToggleSelectPoint}
                            className={`chat-input-action-button ${isSelectingPoint ? 'bg-red-500/80 !text-white' : ''}`}
                            title="Select point on image"
                            aria-label="Select point on image"
                        >
                            <CrosshairIcon />
                        </button>
                    )}
                    <div className="chat-input-textarea-wrapper">
                        <textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    onSend();
                                }
                            }}
                            placeholder={placeholder}
                            className="chat-input-textarea"
                            rows={1}
                            disabled={isLoading}
                        />
                        <div className="chat-input-sizer" aria-hidden="true">
                            {value}{' '}
                        </div>
                    </div>
                    <button onClick={onSend} disabled={!canSend} className="chat-send-button" aria-label="Send Message">
                        <span className={`chat-send-button-icon ${canSend ? 'translate-x-0' : 'translate-x-full'}`}>
                            <SendIcon />
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};