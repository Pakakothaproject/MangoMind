import React, { useRef, useEffect } from 'react';
import { useChatSessionStore, useChatMessagesStore } from '../../store/chat';
import { ChatMessage } from '../chat/ChatMessage';
import { SendIcon, StopIcon } from '../Icons';
import PlaygroundChatHeader from './PlaygroundChatHeader';

const PlaygroundChatWindow: React.FC = () => {
    // FIX: Replaced usePlaygroundStore with the correct stores for chat functionality.
    const { chats, activeChatId } = useChatSessionStore();
    const { isStreaming: isStreamingChat, actions } = useChatMessagesStore();
    const { sendMessage: sendChatMessage, stopStream } = actions;

    const [text, setText] = React.useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const activeChat = chats.find(c => c.id === activeChatId);
    const messages = activeChatId ? useChatMessagesStore.getState().messages : [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [text]);

    const handleSend = () => {
        if (text.trim() && !isStreamingChat) {
            sendChatMessage(text.trim(), []);
            setText('');
        }
    };

    if (!activeChat) {
        return (
            <div className="flex-1 h-full flex items-center justify-center text-center text-[var(--jackfruit-muted)]">
                <div>
                    <span className="material-symbols-outlined text-6xl">chat_bubble</span>
                    <h2 className="text-2xl font-bold mt-4">Playground Chat</h2>
                    <p>Select a chat or create a new one to begin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-[var(--jackfruit-background)] text-white">
            <PlaygroundChatHeader />
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
                     {messages.map((msg) => (
                        <div key={msg.id} className={`w-full flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] ${msg.role === 'user' ? 'user-message-tile' : 'chat-message-tile'}`}>
                                <ChatMessage message={msg} isTile={true} />
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="flex-shrink-0 p-4 border-t border-[var(--jackfruit-darker)] max-w-4xl mx-auto w-full">
                <div className="chat-input-container">
                    <div className="chat-input-row">
                        <div className="chat-input-textarea-wrapper">
                             <textarea
                                ref={textareaRef}
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                                placeholder="Ask me anything..."
                                className="chat-input-textarea"
                                rows={1}
                                disabled={isStreamingChat}
                            />
                        </div>
                         {isStreamingChat ? (
                            <button onClick={stopStream} className="chat-stop-button"><StopIcon /></button>
                        ) : (
                            <button onClick={handleSend} disabled={!text.trim()} className="chat-send-button"><SendIcon /></button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaygroundChatWindow;
