import React from 'react';
import { StopIcon } from './Icons';

// Enhanced Spinner SVG
const Spinner: React.FC = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-white">
        <style>{`.spinner_V8m1{transform-origin:center;animation:spinner_zKoa 2s linear infinite}.spinner_V8m1 circle{stroke-linecap:round;animation:spinner_YpZS 1.5s ease-in-out infinite}@keyframes spinner_zKoa{100%{transform:rotate(360deg)}}@keyframes spinner_YpZS{0%{stroke-dasharray:0 150;stroke-dashoffset:0}47.5%{stroke-dasharray:42 150;stroke-dashoffset:-16}95%,100%{stroke-dasharray:42 150;stroke-dashoffset:-59}}`}</style>
        <g className="spinner_V8m1">
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="3"></circle>
        </g>
    </svg>
);


export const LoadingSpinner: React.FC<{ message?: string; onStop?: () => void; }> = ({ message = 'Generating...', onStop }) => {
  return (
    <div className="flex flex-col justify-center items-center p-4 text-center text-white">
      <Spinner />
      <p className="mt-4 font-semibold text-lg tracking-wide">{message}</p>
      <p className="mt-2 text-sm text-white/70 max-w-xs">This may take a moment. You can navigate away and your creation will be saved to "My Generations" when finished.</p>
      {onStop && (
          <button onClick={onStop} className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-600/80 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors backdrop-blur-sm border border-white/20">
              <StopIcon /> Stop
          </button>
      )}
    </div>
  );
};
