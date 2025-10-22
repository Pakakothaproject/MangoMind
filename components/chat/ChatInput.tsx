import React, { useState, useRef, useEffect } from 'react';
import type { AttachedImage, ChatMode } from '../../types';
import { XIcon, PlusIcon, SendIcon, PaperclipIcon, StopIcon } from '../Icons';
import { useChatSessionStore } from '../../store/chat';

interface ChatInputProps {
  onSendMessage: (text: string, images: AttachedImage[]) => void;
  onStopStream: () => void;
  isStreaming: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = React.memo(({ onSendMessage, onStopStream, isStreaming }) => {
    const [text, setText] = useState('');
    const [images, setImages] = useState<AttachedImage[]>([]);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);
    const { activeChatId, chats, actions: sessionActions } = useChatSessionStore();
    const activeChat = chats.find(c => c.id === activeChatId);
    const chatMode = activeChat?.chatMode || 'normal';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setIsActionMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSendMessage = () => {
        if (isStreaming || (!text.trim() && images.length === 0)) return;
        onSendMessage(text, images);
        setText('');
        setImages([]);
    };
    
    const handleSetMode = (mode: ChatMode) => {
        if (activeChat) {
            sessionActions.setChatMode(activeChat.id, mode);
            setIsActionMenuOpen(false);
        }
    }
    
    const handleClearMode = () => {
        if (activeChat) {
            sessionActions.setChatMode(activeChat.id, 'normal');
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newImages: AttachedImage[] = [];
        const promises = Array.from(files).map((file: File) => {
            return new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64 = (e.target?.result as string).split(',')[1];
                    newImages.push({ base64, type: file.type });
                    resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promises).then(() => {
            setImages(prev => [...prev, ...newImages]);
        });
        
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };
    
    const canSend = !isStreaming && (text.trim().length > 0 || images.length > 0);

    return (
        <div className="chat-input-container">
            <div className="chat-input-top-area">
                <div className="chat-input-pills-container">
                    {images.map((image, index) => (
                        <div key={index} className="chat-action-indicator attachment">
                            <img
                                src={`data:${image.type};base64,${image.base64}`}
                                alt={`attachment preview ${index + 1}`}
                                className="chat-attachment-pill-preview"
                            />
                            <span>Attachment</span>
                            <button onClick={() => removeImage(index)}><XIcon /></button>
                        </div>
                    ))}
                    {chatMode !== 'normal' && (
                        <div className={`chat-action-indicator ${chatMode}`}>
                            <span className="material-symbols-outlined !text-base">{chatMode === 'search' ? 'search' : 'psychology'}</span>
                            <span>{chatMode} mode</span>
                            <button onClick={handleClearMode}><XIcon /></button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="chat-input-row">
                <div className="relative" ref={actionMenuRef}>
                    {isActionMenuOpen && (
                        <div className="action-menu">
                            <button onClick={() => { fileInputRef.current?.click(); setIsActionMenuOpen(false); }} className="action-menu-item"><PaperclipIcon /> Attach File</button>
                            <button onClick={() => handleSetMode('search')} className="action-menu-item">
                                <span className="material-symbols-outlined">search</span> Search Mode
                            </button>
                            <button onClick={() => handleSetMode('thinking')} className="action-menu-item">
                                <span className="material-symbols-outlined">psychology</span> Thinking Mode
                            </button>
                        </div>
                    )}
                     <button
                        onClick={() => setIsActionMenuOpen(p => !p)}
                        className={`chat-input-action-button ${isActionMenuOpen ? 'menu-open' : ''}`}
                        title="Actions"
                        aria-label="Actions"
                    >
                        <PlusIcon />
                    </button>
                </div>

                <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />

                <div className="chat-input-textarea-wrapper">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Start a new message..."
                        className="chat-input-textarea"
                        rows={1}
                        disabled={isStreaming}
                    />
                    <div className="chat-input-sizer" aria-hidden="true">
                        {text}{' '}
                    </div>
                </div>
                
                {isStreaming ? (
                    <button
                        onClick={onStopStream}
                        className="chat-stop-button"
                        aria-label="Stop Generation"
                    >
                        <StopIcon />
                    </button>
                ) : (
                    <button
                        onClick={handleSendMessage}
                        disabled={!canSend}
                        className="chat-send-button"
                        aria-label="Send Message"
                    >
                         <span className={`chat-send-button-icon ${canSend ? 'translate-x-0' : 'translate-x-full'}`}>
                            <SendIcon />
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
});