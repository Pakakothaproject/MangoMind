import React, { useMemo, useState, useEffect } from 'react';
import { marked } from 'marked';
import type { Message } from '../../types';
import { AlertTriangleIcon } from '../Icons';
import { useModelStore } from '../../store/modelStore';
import { CodeBlock } from './CodeBlock';

const StreamingIndicator: React.FC = () => {
    return (
        <div className="flex items-center gap-1 text-xs text-[var(--jackfruit-light)] opacity-70 mt-1">
            <div className="w-1.5 h-1.5 bg-[var(--jackfruit-accent)] rounded-full animate-pulse"></div>
            <span>Generating...</span>
        </div>
    );
};

const ThinkingIndicator: React.FC<{ modelName?: string }> = ({ modelName }) => {
    const [currentPhase, setCurrentPhase] = useState(0);

    const phases = [
        { text: "Thinking", dots: "..." },
        { text: "Analyzing your request", dots: "." },
        { text: "Processing information", dots: "..." },
        { text: "Generating response", dots: ".." },
        { text: "Almost ready", dots: "." }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPhase(prev => (prev + 1) % phases.length);
        }, 1800); // Change phase every 1.8 seconds for smoother flow

        return () => clearInterval(interval);
    }, []);

    const phase = phases[currentPhase];

    return (
        <div className="flex flex-col gap-2 pt-1">
            <p className="font-bold text-sm">{modelName || 'AI'}</p>
            <div className="flex items-center gap-2 text-sm text-[var(--jackfruit-light)]">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[var(--jackfruit-accent)] rounded-full animate-pulse"></div>
                    <span className="animate-pulse">{phase.text}</span>
                    <span className="animate-bounce">{phase.dots}</span>
                </div>
            </div>
        </div>
    );
};

interface ChatMessageProps {
    message: Message;
    isTile?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTile = false }) => {
    const { models: allModels } = useModelStore();

    const contentParts = useMemo(() => {
        const parts: { type: 'markdown' | 'code'; content: string; lang?: string }[] = [];
        if (!message.text) return parts;
        
        let lastIndex = 0;
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        let match;

        while ((match = codeBlockRegex.exec(message.text)) !== null) {
            // Text before the code block
            if (match.index > lastIndex) {
                parts.push({ type: 'markdown', content: message.text.substring(lastIndex, match.index) });
            }
            // The code block
            parts.push({ type: 'code', lang: match[1] || '', content: match[2] });
            lastIndex = match.index + match[0].length;
        }

        // Text after the last code block
        if (lastIndex < message.text.length) {
            parts.push({ type: 'markdown', content: message.text.substring(lastIndex) });
        }
        
        // If no code blocks found, just return the whole text as markdown
        if (parts.length === 0 && message.text) {
             parts.push({ type: 'markdown', content: message.text });
        }

        return parts;
    }, [message.text]);
    
    const isUser = message.role === 'user';
    const modelInfo = allModels.find(m => m.id === message.sourceModel);

    if (message.isLoading && !message.text) {
        return (
            <div className={`flex items-start p-3 w-full`}>
                <ThinkingIndicator modelName={modelInfo?.name || message.sourceModel} />
            </div>
        );
    }

    return (
        <div className={`flex items-start p-3 ${isUser ? 'justify-end' : ''}`}>
            <div className={`flex flex-col gap-2 overflow-hidden ${isUser ? 'items-end' : ''} ${!isUser ? 'glassmorphic-message' : ''}`}>
                {isUser && message.sentWithMode && (
                    <div className={`chat-action-indicator ${message.sentWithMode}`}>
                        <span className="material-symbols-outlined !text-base">
                            {message.sentWithMode === 'search' ? 'search' : 'psychology'}
                        </span>
                        {message.sentWithMode}
                    </div>
                )}
                
                {!isUser && (
                    <div className="flex items-center gap-2 flex-wrap">
                         {message.sourceModel === 'auto' ? (
                            <p className="font-bold text-sm flex items-center gap-1">
                                <span className="material-symbols-outlined !text-base">auto_awesome</span>
                                Auto
                            </p>
                        ) : (
                            <>
                                <p className="font-bold text-sm">{modelInfo?.name || message.sourceModel}</p>
                                {modelInfo?.tags && modelInfo.tags.length > 0 && (
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {modelInfo.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--jackfruit-darker)] text-[var(--jackfruit-muted)] border border-[var(--jackfruit-darker)]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {message.isError && <AlertTriangleIcon className="w-4 h-4 text-[var(--nb-secondary)]" />}
                    </div>
                )}
                
                {message.images && message.images.length > 0 && (
                    <div className="mb-2 grid grid-cols-2 gap-2 max-w-sm">
                        {message.images.map((img, index) => (
                            <img key={index} src={`data:${img.type};base64,${img.base64}`} alt={`attachment ${index + 1}`} className="rounded-lg max-h-48" />
                        ))}
                    </div>
                )}



                <div 
                    className={`chat-message-content prose prose-invert prose-sm max-w-none text-[var(--jackfruit-light)] ${isUser ? 'text-right' : ''} ${message.isError ? 'error' : ''}`}
                >
                    {contentParts.map((part, index) => {
                        if (part.type === 'code') {
                            return <CodeBlock key={index} language={part.lang || ''} code={part.content} />;
                        } else {
                            return <div key={index} dangerouslySetInnerHTML={{ __html: marked.parse(part.content, { gfm: true, breaks: true }) }} />;
                        }
                    })}
                    {message.isLoading && <StreamingIndicator />}
                </div>
            </div>
        </div>
    );
};
