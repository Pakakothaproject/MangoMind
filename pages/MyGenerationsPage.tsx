import React from 'react';
import { useGenerationsStore } from '../store/generationsStore';
import { useAppStore } from '../store/appStore';
import type { Generation } from '../types';
import { ArrowLeftIcon, CopyIcon, Share2Icon, DownloadIcon, EditIcon, Settings2Icon, XIcon, SparklesIcon, Trash2Icon, AlertTriangleIcon, CheckIcon } from '../components/Icons';
import { LoadingSpinner } from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';

const GenerationDetailModal: React.FC<{
    generation: Generation | null;
    onClose: () => void;
    onGeneratePrompt: (imageUrl: string) => void;
    onEditImage: (imageUrl: string) => void;
    onDelete: (id: number) => void;
    isGeneratingPrompt: boolean;
}> = ({ generation, onClose, onGeneratePrompt, onEditImage, onDelete, isGeneratingPrompt }) => {
    if (!generation) return null;

    const [copyStatus, setCopyStatus] = React.useState('Copy');

    const handleCopyPrompt = () => {
        if (generation.prompt) {
            navigator.clipboard.writeText(generation.prompt);
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus('Copy'), 2000);
        }
    };

    const handleShare = () => {
        alert('Sharing to community is a feature coming soon!');
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = generation.image_url;
        link.download = `generation-${generation.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="generation-detail-title">
            <div className="image-modal-backdrop" onClick={onClose}></div>
            <div className="image-modal-content">
                <div className="neo-card w-auto max-w-[95vw] max-h-[90vh] flex flex-col lg:flex-row animate-fade-in relative overflow-hidden">
                    <button onClick={onClose} className="absolute top-3 right-3 z-10 neo-button neo-icon-button neo-button-secondary"><XIcon /></button>
                    <div className="flex-1 bg-[var(--nb-bg)] flex items-center justify-center p-4 min-h-0 lg:min-w-0">
                        <img 
                            src={generation.image_url} 
                            alt={generation.prompt || `Generation ${generation.id}`}
                            className="max-w-full max-h-full object-contain rounded-md"
                        />
                    </div>

                    <div className="w-full lg:w-96 flex-shrink-0 p-6 flex flex-col space-y-4 overflow-y-auto border-t lg:border-t-0 lg:border-l border-[var(--nb-border)]">
                        <h2 id="generation-detail-title" className="text-2xl font-bold">Details</h2>
                        {generation.prompt && (
                            <div className="space-y-2">
                                <label className="font-semibold text-sm opacity-80">Original Prompt</label>
                                <div className="relative">
                                    <textarea
                                        readOnly
                                        value={generation.prompt}
                                        className="neo-textarea w-full !bg-[var(--nb-surface-alt)] h-24"
                                    />
                                    <button onClick={handleCopyPrompt} className="absolute top-2 right-2 neo-button neo-button-secondary text-xs !py-1 !px-2">
                                        <CopyIcon className="w-4 h-4" /> {copyStatus}
                                    </button>
                                </div>
                            </div>
                        )}
                         <div className="space-y-2">
                            <h3 className="font-semibold text-sm opacity-80">Info</h3>
                            <div className="text-sm p-3 bg-[var(--nb-surface-alt)] rounded-lg space-y-1">
                                <p><strong>Created:</strong> {new Date(generation.created_at).toLocaleString()}</p>
                                {generation.type && <p><strong>Type:</strong> <span className="capitalize">{generation.type.replace('-', ' ')}</span></p>}
                                {generation.model_used && <p><strong>Model:</strong> {generation.model_used}</p>}
                                {generation.api_provider && <p><strong>Provider:</strong> <span className="capitalize">{generation.api_provider}</span></p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm opacity-80">Actions</h3>
                            <div className="space-y-2">
                                <button onClick={() => onGeneratePrompt(generation.image_url)} className="w-full neo-button neo-button-secondary" disabled={isGeneratingPrompt}>
                                    {isGeneratingPrompt ? 'Analyzing...' : <><SparklesIcon /> Generate Prompt</>}
                                </button>
                                <button onClick={() => onEditImage(generation.image_url)} className="w-full neo-button neo-button-secondary"><EditIcon /> Edit in Studio</button>
                                <button onClick={handleDownload} className="w-full neo-button neo-button-secondary"><DownloadIcon /> Download</button>
                                <button onClick={handleShare} className="w-full neo-button neo-button-accent"><Share2Icon /> Share to Community</button>
                                <button onClick={() => handleDeleteSingle(generation.id)} className="w-full neo-button neo-button-danger"><Trash2Icon /> Delete</button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <h3 className="font-semibold text-sm opacity-80 flex items-center gap-2"><Settings2Icon/> Generation Data</h3>
                            {generation.settings ? (
                                <pre className="text-xs p-3 bg-[var(--nb-surface-alt)] rounded-lg overflow-x-auto">
                                    <code>{JSON.stringify(generation.settings, null, 2)}</code>
                                </pre>
                            ) : (
                                <div className="text-sm p-3 bg-[var(--nb-surface-alt)] rounded-lg opacity-60">
                                    <p>No detailed settings were saved for this generation.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyGenerationsPage: React.FC = () => {
    const { 
        generations, loading, selectedGen, isNavigating, isGeneratingPrompt, error,
        selectedGenerationIds, isDeleting,
        fetchGenerations, setSelectedGen, handleGeneratePromptFromImage, 
        handleEditImage, handleDeleteGeneration,
        toggleGenerationSelection, clearSelection, handleDeleteSelectedGenerations
    } = useGenerationsStore();
    
    const { handleBackToDashboard } = useAppStore(state => state.actions);
    const { storageUsageBytes } = useAppStore();
    const { fetchStorageUsage } = useAppStore(state => state.actions);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = React.useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmText?: string;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    React.useEffect(() => {
        fetchGenerations();
        fetchStorageUsage();
        // Clear selection when the component unmounts or user navigates away
        return () => {
            clearSelection();
        }
    }, [fetchGenerations, clearSelection, fetchStorageUsage]);

    const isSelectionMode = selectedGenerationIds.length > 0;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleDeleteSelected = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Selected Images',
            message: `Are you sure you want to permanently delete ${selectedGenerationIds.length} image(s)? This action cannot be undone.`,
            onConfirm: () => {
                handleDeleteSelectedGenerations();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            },
            confirmText: 'Delete'
        });
    };

    const handleDeleteSingle = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Image',
            message: 'Are you sure you want to permanently delete this image? This action cannot be undone.',
            onConfirm: () => {
                handleDeleteGeneration(id);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            },
            confirmText: 'Delete'
        });
    };

    const STORAGE_LIMIT_MB = 200;
    const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_MB * 1024 * 1024;
    const usagePercentage = storageUsageBytes ? (storageUsageBytes / STORAGE_LIMIT_BYTES) * 100 : 0;
    const usageMB = storageUsageBytes ? (storageUsageBytes / 1024 / 1024).toFixed(2) : '0.00';

    return (
        <div className="h-full w-full bg-[var(--nb-bg)] text-[var(--nb-text)] animate-fade-in flex flex-col">
            <header className="sticky top-0 bg-[var(--nb-surface)]/80 backdrop-blur-md z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {isSelectionMode ? (
                        <div className="flex items-center justify-between h-16 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <button onClick={clearSelection} className="neo-button neo-button-secondary">
                                    <XIcon /> Cancel
                                </button>
                                <span className="font-semibold">{selectedGenerationIds.length} selected</span>
                            </div>
                            <button onClick={handleDeleteSelected} disabled={isDeleting} className="neo-button neo-button-danger">
                                <Trash2Icon /> {isDeleting ? 'Deleting...' : 'Delete Selected'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between h-16">
                            <button onClick={handleBackToDashboard} className="neo-button neo-button-secondary flex items-center gap-2">
                                <ArrowLeftIcon />
                                <span className="hidden sm:inline">Back to Dashboard</span>
                                <span className="sm:hidden">Back</span>
                            </button>
                            <h1 className="text-xl font-bold">My Generations</h1>
                             <div className="hidden sm:block w-52">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-semibold">Storage</span>
                                    <span className="text-xs font-medium">{usageMB} / {STORAGE_LIMIT_MB} MB</span>
                                </div>
                                <div className="w-full bg-[var(--nb-surface-alt)] rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full ${usagePercentage > 90 ? 'bg-red-500' : 'bg-[var(--nb-primary)]'}`} 
                                        style={{ width: `${usagePercentage > 100 ? 100 : usagePercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {loading ? (
                        <div className="text-center py-16">
                             <svg className="animate-spin h-12 w-12 text-[var(--nb-primary)] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-4 font-semibold text-lg">Images are Encrypted under Mangomind, Decrypting now</p>
                        </div>
                    ) : generations.length === 0 ? (
                        <div className="text-center py-16 neo-card">
                            <h2 className="text-2xl font-bold">No Generations Found</h2>
                            <p className="mt-2 opacity-70">Start creating in the studio and your images will appear here!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {generations.map((gen) => {
                                const isSelected = selectedGenerationIds.includes(gen.id);
                                return (
                                <div key={gen.id} className="relative group">
                                    <button 
                                        className={`neo-card text-left w-full h-full transition-all duration-200 ${isSelected ? 'transform scale-95 shadow-lg' : ''}`}
                                        onClick={() => isSelectionMode ? toggleGenerationSelection(gen.id) : setSelectedGen(gen)}
                                    >
                                        <div className={`aspect-square bg-[var(--nb-surface-alt)] transition-opacity duration-200 ${isSelected ? 'opacity-70' : ''}`}>
                                            <img 
                                                src={gen.image_url} 
                                                alt={gen.prompt || `Generation ${gen.id}`} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs font-semibold opacity-70">{formatDate(gen.created_at)}</p>
                                        </div>
                                    </button>
                                     <div 
                                        role="checkbox"
                                        aria-checked={isSelected}
                                        tabIndex={0}
                                        className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 border-2 
                                            ${isSelected ? 'bg-[var(--nb-primary)] border-[var(--nb-primary)]' : 'bg-black/40 border-white/50 backdrop-blur-sm group-hover:opacity-100 opacity-0'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleGenerationSelection(gen.id);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === ' ' || e.key === 'Enter') {
                                                e.preventDefault();
                                                toggleGenerationSelection(gen.id);
                                            }
                                        }}
                                    >
                                        {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </main>
            {selectedGen && (
                <GenerationDetailModal
                    generation={selectedGen}
                    onClose={() => setSelectedGen(null)}
                    onGeneratePrompt={handleGeneratePromptFromImage}
                    onEditImage={handleEditImage}
                    onDelete={handleDeleteSingle}
                    isGeneratingPrompt={isGeneratingPrompt}
                />
            )}
             {(isNavigating || isGeneratingPrompt) && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center backdrop-blur-sm">
                    <LoadingSpinner message={isNavigating ? "Loading Studio..." : "Analyzing Image..."} />
                </div>
            )}
            {error && (
                <div className="fixed top-5 right-5 z-[70] error-card max-w-sm !py-3 !px-5" onClick={() => useGenerationsStore.getState().setError(null)}>
                    <div className="flex items-center gap-3">
                        <AlertTriangleIcon />
                        <p className="text-sm font-semibold">{error}</p>
                    </div>
                </div>
            )}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                isDestructive={true}
            />
        </div>
    );
};

export default MyGenerationsPage;