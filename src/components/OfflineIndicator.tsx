import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showToast && isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-fadeIn">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium shadow-lg backdrop-blur-md border ${
        isOnline 
          ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
          : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
      }`}>
        {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
        <span>{isOnline ? 'Studio Reconnected · Cloud Synced' : 'Offline Mode · Saving Locally to Device'}</span>
      </div>
    </div>
  );
};
