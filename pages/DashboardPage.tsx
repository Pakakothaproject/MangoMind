import React from 'react';
import { useAppStore } from '../store/appStore';
import { useHoverSoundProps } from '../useSound';

const ActionCard: React.FC<{
    icon: string;
    title: React.ReactNode;
    description: string;
    onClick: () => void;
    className?: string;
}> = ({ icon, title, description, onClick, className }) => {
    const hoverSoundProps = useHoverSoundProps();
    return (
    <button
        {...hoverSoundProps}
        onClick={onClick}
        className={`action-card ${className || ''}`}
    >
        <div className="action-card__inner">
            <div className="action-card__icon-wrapper">
                <span className="material-symbols-outlined action-card__icon">{icon}</span>
            </div>
            <div className="action-card__text-wrapper">
                <h3 className="action-card__title">{title}</h3>
                <p className="action-card__description">{description}</p>
            </div>
        </div>
    </button>
)};


const DashboardPage: React.FC = () => {
    // FIX: Actions are nested under the 'actions' property in the store.
    const { profile, actions } = useAppStore();

    return (
        <div className="dashboard-page">
            <main className="dashboard-page__main">
                <div className="dashboard-page__content">
                    <header className="dashboard-page__header">
                        <h1 className="dashboard-page__title">
                            Hello, {profile?.username || 'There'}
                        </h1>
                        <p className="dashboard-page__subtitle">The canvas is yours. Bring your imagination to life with the most powerful generative models.</p>
                    </header>
                    <div className="dashboard-page__grid">
                        <ActionCard
                            icon="auto_fix_high"
                            title={<>Generate<br />Image</>}
                            description="Create stunning visuals from a simple text prompt."
                            onClick={actions.navigateToGenerator}
                        />
                        <ActionCard
                            icon="edit_square"
                            title="Image Editor"
                            description="Virtual try-on, scene swapping, and your full creative suite."
                            onClick={() => actions.navigateToStudio('sceneswap')}
                            className="image-editor-card"
                        />
                         <ActionCard
                            icon="face_retouching_natural"
                            title="Style Me"
                            description="Upload your photo and see yourself in new styles and scenes."
                            onClick={actions.navigateToDressMe}
                        />
                        <ActionCard
                            icon="campaign"
                            title={<>Content<br />Generation</>}
                            description="Generate professional ad campaigns and product shots."
                            onClick={() => actions.navigateToMarketing()}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
