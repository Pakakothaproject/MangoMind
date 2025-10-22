import React from 'react';
import { useChatMessagesStore } from '../../store/chat';
import { ChatMessage } from '../chat/ChatMessage';
import { SendIcon, StopIcon } from '../Icons';

const PlaygroundChat: React.FC = () => {
    // FIX: Replaced usePlaygroundStore with the correct stores for chat functionality.
    const { messages: chatMessages, isStreaming: isStreamingChat, actions } = useChatMessagesStore();
    const { sendMessage: sendChatMessage, stopStream } = actions;
    
    const [text, setText] = React.useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSend = () => {
        if (text.trim() && !isStreamingChat) {
            sendChatMessage(text.trim(), []);
            setText('');
        }
    };

    return (
        <div className="h-full flex flex-col bg-[var(--jackfruit-background)] text-white">
            <header className="flex-shrink-0 p-4 border-b border-[var(--jackfruit-darker)]">
                <h2 className="font-bold text-lg">AI Assistant</h2>
                <p className="text-sm text-[var(--jackfruit-muted)]">Brainstorm ideas for your creations.</p>
            </header>
            
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                    {chatMessages.map((msg) => (
                        <div key={msg.id} className={`w-full flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] ${msg.role === 'user' ? 'user-message-tile' : 'chat-message-tile'}`}>
                                <ChatMessage message={msg} isTile={true} />
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="flex-shrink-0 p-4 border-t border-[var(--jackfruit-darker)]">
                <div className="chat-input-container">
                    <div className="chat-input-row">
                        <div className="chat-input-textarea-wrapper">
                             <textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                                placeholder="Ask me anything..."
                                className="chat-input-textarea"
                                rows={1}
                                disabled={isStreamingChat}
                            />
                            <div className="chat-input-sizer" aria-hidden="true">{text}{' '}</div>
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
export default PlaygroundChat;
