import React, { useEffect, useState, useRef } from 'react';
import { X, Clock, CheckCircle2 } from 'lucide-react';

interface LiimeSuitePopupProps {
  onClose?: () => void;
  durationSeconds?: number;
}

export const LiimeSuitePopup: React.FC<LiimeSuitePopupProps> = ({
  onClose,
  durationSeconds = 4,
}) => {
  const TARGET_URL = 'https://liimesuite.pages.dev/';
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);
  const [canClose, setCanClose] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    const totalMs = durationSeconds * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingMs = Math.max(0, totalMs - elapsed);
      const remainingSec = Math.ceil(remainingMs / 1000);
      setTimeLeft(remainingSec);

      if (remainingMs <= 0) {
        clearInterval(interval);
        setCanClose(true);
        setTimeLeft(0);
        // Does not close on its own — user decides after 4 seconds
      }
    }, 100);

    return () => clearInterval(interval);
  }, [durationSeconds]);

  const handleClose = () => {
    if (!canClose) return;
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 250);
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md transition-opacity duration-300 select-none ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-fadeIn'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Liime Suite Window"
    >
      {/* Popup Window Container */}
      <div 
        className={`w-full max-w-4xl h-[86vh] max-h-[700px] bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col text-neutral-100 relative transition-transform duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100'
        }`}
      >
        {/* Top Progress Track during 4-second period */}
        {!canClose && (
          <div className="h-1.5 w-full bg-neutral-800 overflow-hidden relative shrink-0">
            <div 
              className="h-full bg-linear-to-r from-lime-500 via-emerald-400 to-lime-300 transition-all ease-linear"
              style={{
                animation: `shrinkWidth ${durationSeconds}s linear forwards`,
                width: '100%',
              }}
            />
          </div>
        )}

        {/* Top Control Bar: Only the 4 seconds timer and the Close button after it ends */}
        <div className="px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
          
          {/* Left: Window status label */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full transition-colors ${canClose ? 'bg-red-500 cursor-pointer' : 'bg-neutral-600'}`} onClick={canClose ? handleClose : undefined} />
              <span className="w-3 h-3 rounded-full bg-neutral-700" />
              <span className="w-3 h-3 rounded-full bg-neutral-700" />
            </div>

            <span className="text-xs font-semibold text-neutral-300 pl-2 border-l border-neutral-800">
              Liime Suite
            </span>
          </div>

          {/* Right: Only the 4 seconds and the Close button after it ends */}
          <div className="flex items-center gap-2.5">
            {!canClose ? (
              /* Countdown Badge for the 4 seconds */
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-lime-500/40 text-lime-400 font-mono text-xs font-bold tracking-tight shadow-inner">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>{timeLeft}s</span>
              </div>
            ) : (
              /* Close Button Appears After 4 Seconds */
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-1.5 rounded-xl bg-lime-500 hover:bg-lime-400 active:scale-95 text-neutral-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-lime-500/25 cursor-pointer animate-fadeIn"
              >
                <span>Close</span>
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

        </div>

        {/* Clean Web View Body */}
        <div className="relative flex-1 w-full bg-neutral-950 overflow-hidden">
          <iframe
            src={TARGET_URL}
            title="Liime Suite"
            className="w-full h-full border-0 bg-neutral-950"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
          />
        </div>

      </div>

      {/* Embedded CSS for smooth progress bar animation */}
      <style>{`
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};
