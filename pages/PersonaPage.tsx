import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersonaStore } from '../store/chat/usePersonaStore';
import { useChatSessionStore } from '../store/chat/useChatSessionStore';
import { useModelStore } from '../store/modelStore';
import { useAppStore } from '../store/appStore';
import { ArrowLeftIcon } from '../components/Icons';
import { LoadingSpinner } from '../components/LoadingSpinner';

const PersonaCard: React.FC<{
    icon: string;
    name: string;
    description: string;
    onClick: () => void;
}> = ({ icon, name, description, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="neo-card p-6 text-left w-full h-full flex flex-col hover:border-[var(--nb-primary)] hover:scale-105 transition-all duration-200"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--nb-surface-alt)] rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-[var(--nb-primary)]">{icon}</span>
                </div>
                <h3 className="text-xl font-bold">{name}</h3>
            </div>
            <p className="text-sm text-[var(--nb-text-secondary)] mt-4 flex-grow">{description}</p>
        </button>
    );
};

const PersonaPage: React.FC = () => {
    const navigate = useNavigate();
    const { handleBackToDashboard } = useAppStore(state => state.actions);
    const { personas, isInitialized, actions: personaActions } = usePersonaStore();
    const { newChat } = useChatSessionStore(state => state.actions);
    const { models: availableModels } = useModelStore();

    useEffect(() => {
        if (!isInitialized) {
            personaActions.init();
        }
    }, [isInitialized, personaActions]);

    const handlePersonaSelect = async (persona: typeof personas[0]) => {
        try {
            // Look for a premium, then a standard model to assign to the new chat
            const premiumModel = availableModels.find(model => model.id === 'openai/gpt-5-chat-latest' && model.is_accessible);
            const standardModel = availableModels.find(model => model.id === 'google/gemini-2.5-flash' && model.is_accessible);

            const personaModels = premiumModel 
                ? [premiumModel.id] 
                : (standardModel ? [standardModel.id] : ['auto']); // Fallback to auto
            
            console.log('Creating new chat with persona:', persona.name);
            const chatId = await newChat({
                title: persona.name,
                systemPrompt: persona.systemPrompt,
                models: personaModels,
            });
            
            console.log('Chat created, navigating to:', chatId);
            // Navigate with chat ID to ensure proper loading
            navigate(`/chat?chatId=${chatId}`);
        } catch (error) {
            console.error('Failed to create persona chat:', error);
            // Navigate anyway to show error state
            navigate('/chat');
        }
    };

    return (
        <div className="h-screen w-full bg-[var(--nb-bg)] text-[var(--nb-text)] flex flex-col animate-fade-in">
            <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-[var(--nb-border)]">
                <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-[var(--nb-text)] hover:opacity-80 transition-opacity">
                    <ArrowLeftIcon />
                    <span className="font-semibold">Back</span>
                </button>
                <h1 className="text-xl font-bold">Explore Personas</h1>
                <div className="w-20"></div> {/* Spacer */}
            </header>
            <main className="flex-grow p-4 md:p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {!isInitialized ? (
                        <div className="flex justify-center items-center h-64">
                            <LoadingSpinner message="Loading personas..." />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {personas.map(persona => (
                                <PersonaCard
                                    key={persona.id}
                                    icon={persona.icon}
                                    name={persona.name}
                                    description={persona.systemPrompt.substring(0, 150) + '...'}
                                    onClick={() => handlePersonaSelect(persona)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PersonaPage;