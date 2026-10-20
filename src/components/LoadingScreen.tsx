import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onFinish,
  minDuration = 1200,
}) => {
  const [progress, setProgress] = useState(15);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const delta = Math.floor(Math.random() * 25) + 15;
        return Math.min(prev + delta, 100);
      });
    }, 120);

    const timer = setTimeout(() => {
      setProgress(100);
      setIsFadingOut(true);
      const closeTimer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 350);
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
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="relative mb-6">
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src="/logo-64.png"
              alt="Liime Words Logo"
              width={64}
              height={64}
              className="w-16 h-16 object-contain drop-shadow-[0_0_18px_rgba(14,168,40,0.55)]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-1.5">
          <span className="text-lime-400 font-extrabold">Liime</span>
          <span>Words</span>
        </h1>

        <div className="flex items-center gap-2 mb-6">
          <div className="h-[1px] w-6 bg-lime-500/30" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.25em] text-lime-400">
            Dedicated to Studio Writers
          </span>
          <div className="h-[1px] w-6 bg-lime-500/30" />
        </div>

        <div className="w-48 h-1 bg-neutral-800/80 rounded-full overflow-hidden p-[1px] border border-neutral-700/50">
          <div
            className="h-full bg-gradient-to-r from-lime-500 via-lime-400 to-lime-300 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
