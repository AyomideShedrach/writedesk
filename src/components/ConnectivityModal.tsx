import React from 'react';
import { X, Wifi, HardDrive, ShieldCheck, RefreshCw } from 'lucide-react';

interface ConnectivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectivityModal: React.FC<ConnectivityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-neutral-100 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-lime-400" />
            <h3 className="font-bold text-sm">Storage & Offline Integrity</h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs text-neutral-300">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/80">
            <HardDrive className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Local-First Storage Active</p>
              <p className="text-neutral-400 mt-0.5">Your manuscript, story bible, and scenes auto-save locally to your device with every keystroke.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/80">
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Zero Cloud Lock-in</p>
              <p className="text-neutral-400 mt-0.5">Full offline editing capability. You can write on airplanes, trains, or off-grid retreats with no connection required.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
