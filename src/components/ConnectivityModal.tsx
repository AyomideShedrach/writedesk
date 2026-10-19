import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Globe, 
  Zap, 
  X, 
  Sparkles, 
  FileText, 
  BookOpen, 
  Clock, 
  Download, 
  Film, 
  Layers,
  AlertCircle
} from 'lucide-react';

interface ConnectivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectivityModal: React.FC<ConnectivityModalProps> = ({ isOpen, onClose }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [aiStatus, setAiStatus] = useState<{ available: boolean; model?: string; checking: boolean }>({
    available: false,
    checking: true,
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check AI server status
    const checkAi = async () => {
      try {
        const res = await fetch('/api/ai/status');
        if (res.ok) {
          const data = await res.json();
          setAiStatus({ available: !!data.available, model: data.model, checking: false });
        } else {
          setAiStatus({ available: false, checking: false });
        }
      } catch (e) {
        setAiStatus({ available: false, checking: false });
      }
    };

    if (isOpen) {
      checkAi();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-left flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isOnline ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Studio Connectivity & Features Guide</span>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                  isOnline 
                    ? 'bg-lime-500/20 text-lime-300 border border-lime-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Understand which parts of Liime Words work 100% offline vs. require an internet connection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout Banner */}
        <div className="my-4 p-3.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
            <span className="text-neutral-200">
              Network: <strong className="text-white">{isOnline ? 'Connected to Internet' : 'Disconnected (Offline)'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Cloud AI:</span>
            <span className={`font-mono text-[11px] font-semibold ${
              aiStatus.available ? 'text-lime-300' : 'text-neutral-400'
            }`}>
              {aiStatus.checking ? 'Checking...' : aiStatus.available ? 'Connected' : 'Offline / Standby'}
            </span>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 100% Offline Column */}
            <div className="rounded-xl bg-black/40 border border-lime-500/30 p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-lime-500/20">
                <Zap className="w-4 h-4 text-lime-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-lime-300">
                  100% Offline (No Internet Required)
                </h3>
              </div>
              <ul className="space-y-2.5 text-xs text-neutral-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">Manuscript Writing & Editing</strong>
                    <span className="text-[11px] text-neutral-400">Word canvas, typography, focus mode, and live counters.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">Autosave & Local Storage</strong>
                    <span className="text-[11px] text-neutral-400">All manuscripts persist in browser storage on your device.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">Local Story Engine & Auto-Extraction</strong>
                    <span className="text-[11px] text-neutral-400">Heuristic engine automatically scans dialogue & entities on-device.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">Story Bible & Worldbuilding</strong>
                    <span className="text-[11px] text-neutral-400">Characters, locations, events, objects, and relationships.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">Chronology Timeline & Kanban</strong>
                    <span className="text-[11px] text-neutral-400">Act structure, story milestones, and scene sequencing.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">Local Continuity Auditor</strong>
                    <span className="text-[11px] text-neutral-400">Eye/hair color contradictions and cast presence audits.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">Complete File Export</strong>
                    <span className="text-[11px] text-neutral-400">Export .liw project files, Markdown, Plaintext, Fountain & JSON.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Online Required Column */}
            <div className="rounded-xl bg-black/40 border border-blue-500/30 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/20">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-blue-300">
                    Optional Cloud Features (Requires Internet)
                  </h3>
                </div>
                <ul className="space-y-3 text-xs text-neutral-300">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-medium">Deep Cloud AI Prose Analysis</strong>
                      <span className="text-[11px] text-neutral-400 leading-relaxed block">
                        Server-side LLM extraction for detecting subtle narrative subtext and complex character arcs.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Film className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-medium">AI Hollywood Screenplay Adaptation</strong>
                      <span className="text-[11px] text-neutral-400 leading-relaxed block">
                        Deep AI prose-to-script conversion with professional dialogue polish and scene beat breakdown.
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-200">
                <span className="font-semibold block mb-0.5">Offline Guarantee:</span>
                If you lose internet while traveling, Liime Words automatically switches to the offline heuristic engine with zero data loss.
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            Liime Words · Developed by LIIME
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
