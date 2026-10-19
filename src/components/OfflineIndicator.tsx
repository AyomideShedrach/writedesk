import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-8 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-neutral-900/95 dark:bg-neutral-800/95 backdrop-blur-md border border-lime-500/40 px-4 py-2.5 text-xs font-medium text-white shadow-2xl animate-in slide-in-from-bottom duration-300 select-none">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500"></span>
      </span>
      <WifiOff className="w-4 h-4 text-lime-400 shrink-0" />
      <div>
        <span className="font-semibold text-white block">Offline Mode Active</span>
        <span className="text-[11px] text-neutral-300">
          Writing, Story Bible, Timeline & Export are 100% functional. Cloud AI resumes when online.
        </span>
      </div>
    </div>
  );
};
