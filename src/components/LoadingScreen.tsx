import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onFinish,
  minDuration = 1600,
}) => {
  const [progress, setProgress] = useState(15);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Smooth progress increment
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const delta = Math.floor(Math.random() * 25) + 12;
        return Math.min(prev + delta, 100);
      });
    }, 180);

    const timer = setTimeout(() => {
      setProgress(100);
      setIsFadingOut(true);
      const closeTimer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 450);
      return () => clearTimeout(closeTimer);
    }, minDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [minDuration, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070d09] text-white transition-opacity duration-500 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Liime Words Loading Screen"
      role="dialog"
      aria-modal="true"
    >
      {/* Ambient background lime aura */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[480px] h-[480px] rounded-full bg-lime-500/10 blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Crisp LIIME Words Logo (64x64 with no background) */}
        <div className="relative mb-6">
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src="./logo-64.png"
              alt="Liime Words Logo"
              width={64}
              height={64}
              className="w-16 h-16 object-contain drop-shadow-[0_0_18px_rgba(14,168,40,0.55)] transition-transform duration-700 ease-out hover:scale-105"
            />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-1.5">
          <span className="text-lime-400 font-extrabold">Liime</span>
          <span>Words</span>
        </h1>

        {/* Underneath Logo: "Developed by LIIME" */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-[1px] w-6 bg-lime-500/30" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.25em] text-lime-400">
            Developed by LIIME
          </span>
          <div className="h-[1px] w-6 bg-lime-500/30" />
        </div>

        {/* Elegant loading progress line */}
        <div className="w-48 h-1 bg-neutral-800/80 rounded-full overflow-hidden p-[1px] border border-neutral-700/50 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-lime-500 via-lime-400 to-lime-300 rounded-full transition-all duration-200 ease-out shadow-[0_0_8px_rgba(163,230,53,0.7)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-4 text-[11px] text-neutral-400 font-medium tracking-wide">
          Dedicated to Studio Writers
        </p>
      </div>

      {/* Subtle skip prompt */}
      <button
        onClick={() => {
          setIsFadingOut(true);
          setTimeout(() => onFinish?.(), 200);
        }}
        className="absolute bottom-6 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-widest"
      >
        Click to enter
      </button>
    </div>
  );
};
