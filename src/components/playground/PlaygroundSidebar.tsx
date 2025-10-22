import React, { useState, useRef } from 'react';
import { usePlaygroundStore, PlaygroundModeConfig } from '../../store/playgroundStore';

const SidebarButton: React.FC<{
    config: PlaygroundModeConfig;
    isActive: boolean;
    onClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    isDragging: boolean;
    isDragOver: boolean;
}> = ({ config, isActive, onClick, onDragStart, onDragEnter, onDragEnd, onDrop, isDragging, isDragOver }) => (
    <div
        draggable="true"
        onDragStart={onDragStart}
        onDragEnter={onDragEnter}
        onDragEnd={onDragEnd}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`relative w-full rounded-lg transition-all duration-200 ${isDragging ? 'opacity-30' : 'opacity-100'}`}
    >
        {isDragOver && <div className="absolute inset-0 ring-2 ring-[#F8C644] rounded-lg" />}
        {isActive && !isDragging && <div className="absolute -left-3.5 top-1/4 bottom-1/4 w-1 bg-[#F8C644] rounded-r-full transition-all duration-300" />}
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-1 w-full p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-[#3f3f3f] text-white' : 'text-[var(--nb-text-secondary)] hover:bg-[#3a3a3a] hover:text-white'}`}
            title={config.label}
        >
            <span className="material-symbols-outlined !text-2xl">{config.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{config.label}</span>
        </button>
    </div>
);

const PlaygroundSidebar: React.FC = () => {
    const { activeMode, setActiveMode, sidebarModes, setSidebarModes } = usePlaygroundStore();
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const [dragging, setDragging] = useState(false);
    
    const handleDragStart = (e: React.DragEvent, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => setDragging(true), 0);
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        dragOverItem.current = index;
    };
    
    const handleDrop = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            const newModes = [...sidebarModes];
            const draggedItemContent = newModes.splice(dragItem.current, 1)[0];
            newModes.splice(dragOverItem.current, 0, draggedItemContent);
            setSidebarModes(newModes);
        }
        handleDragEnd();
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
        setDragging(false);
    };

    return (
        <div className="h-full flex-shrink-0 p-4 pl-4 pb-6">
            <aside 
                className="w-20 h-full bg-[#2C2C2C] p-2 pb-6 flex flex-col items-center gap-0.5 rounded-t-xl border-t border-x border-white/30 shadow-2xl"
            >
                {sidebarModes.map((modeConfig, index) => (
                    <SidebarButton 
                        key={modeConfig.id}
                        config={modeConfig}
                        isActive={activeMode === modeConfig.id}
                        onClick={() => setActiveMode(modeConfig.id)}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        isDragging={dragging && dragItem.current === index}
                        isDragOver={dragging && dragOverItem.current === index && dragItem.current !== index}
                    />
                ))}
            </aside>
        </div>
    );
};

export default PlaygroundSidebar;