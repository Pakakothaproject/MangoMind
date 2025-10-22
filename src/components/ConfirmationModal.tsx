import React from 'react';
import { XIcon, AlertTriangleIcon } from './Icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
    cancelButtonClass?: string;
    icon?: React.ReactNode;
    isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonClass,
    cancelButtonClass,
    icon,
    isDestructive = true
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const defaultConfirmClass = isDestructive 
        ? 'neo-button neo-button-danger' 
        : 'neo-button neo-button-primary';

    const defaultCancelClass = 'neo-button neo-button-secondary';

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
        >
            <div className="neo-card w-full max-w-md animate-scale-in">
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            {icon || <AlertTriangleIcon className="w-6 h-6 text-[var(--nb-danger)]" />}
                        </div>
                        <div className="flex-1">
                            <h3 id="confirmation-title" className="text-lg font-semibold">
                                {title}
                            </h3>
                            <p className="text-sm opacity-80 mt-1">
                                {message}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className={cancelButtonClass || defaultCancelClass}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={confirmButtonClass || defaultConfirmClass}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;