import React from 'react';
import { useChatSessionStore } from '../../store/chat';
import { useModelStore } from '../../store/modelStore';
import { ChevronDownIcon, TuneIcon } from '../Icons';

const PlaygroundChatHeader: React.FC = () => {
    // FIX: Replaced usePlaygroundStore with the correct store for chat functionality.
    const { activeChatId, chats, actions } = useChatSessionStore();
    const { toggleModelGallery: toggleModelModal, toggleSystemPromptModal } = actions;
    const activeChat = chats.find(c => c.id === activeChatId);
    // FIX: Module '"../../constants/chatModels"' has no exported member 'CHAT_MODELS'. Get models from the store instead.
    const { models: allModels } = useModelStore();

    if (!activeChat) {
        return <div className="h-16 flex-shrink-0 border-b border-[var(--jackfruit-darker)]"></div>;
    }

    return (
        <header className="flex-shrink-0 flex items-center justify-between py-3 px-4 border-b border-[var(--jackfruit-darker)] h-16">
            <div className="flex items-center gap-3 min-w-0">
                <h2 className="font-bold text-lg text-white truncate">{activeChat.title}</h2>
                <div onClick={() => toggleModelModal()} className="chat-header-models-container flex-shrink-0">
                    {activeChat.models.map((modelId, index) => {
                        const modelName = allModels.find(m => m.id === modelId)?.name || modelId;
                        const colorClass = `model-color-${index + 1}`;
                        return (
                            <div key={modelId} className={`chat-header-model-pill ${colorClass}`}>
                                {modelName}
                            </div>
                        );
                    })}
                    <ChevronDownIcon className="w-4 h-4 text-[var(--jackfruit-muted)]" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => toggleSystemPromptModal()} className="p-2 text-[var(--jackfruit-muted)] hover:text-white rounded-md hover:bg-[var(--jackfruit-hover-dark)]" title="Tune Model Instructions">
                    <TuneIcon />
                </button>
            </div>
        </header>
    );
};

export default PlaygroundChatHeader;
