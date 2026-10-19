import React from 'react';
import { Project } from '../types/story';
import { StorageService } from '../services/storage';
import { 
  Download, 
  FileText, 
  Film, 
  Database, 
  X, 
  Printer 
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header (Microsoft Word styled title) */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-[#f8fafc] dark:bg-[#151921]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#185abd] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              W
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Export & Save As
              </h3>
              <p className="text-xs text-neutral-500">
                Export your novel manuscript, adapted screenplay, or portable Liime Words project archive.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Options Grid */}
        <div className="p-6 space-y-4">
          {/* 1. Novel Manuscript */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#185abd]" />
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Novel Manuscript
                </h4>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                {project.chapters.length} chapters · {project.scenes.length} scenes
              </span>
            </div>
            <p className="text-xs text-neutral-500 mb-3">
              Export complete manuscript formatted with chapters, scenes, and word counts.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  StorageService.exportManuscript(project, 'markdown');
                  onClose();
                }}
                className="px-3 py-1.5 bg-[#eef5fc] dark:bg-blue-950/40 text-[#185abd] dark:text-blue-300 hover:bg-blue-100 border border-[#c2daf5] dark:border-blue-900 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Markdown (.md)</span>
              </button>
              <button
                onClick={() => {
                  StorageService.exportManuscript(project, 'txt');
                  onClose();
                }}
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors flex items-center gap-1.5 border border-neutral-300 dark:border-neutral-600"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Plain Text (.txt)</span>
              </button>
            </div>
          </div>

          {/* 2. Screenplay Adaptation */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#185abd]" />
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Screenplay Adaptation
                </h4>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                {(project.screenplay || []).length} script scenes
              </span>
            </div>
            <p className="text-xs text-neutral-500 mb-3">
              Export standard screenplay layout compatible with Final Draft, Highland, and Fade In.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  StorageService.exportScreenplay(project, project.screenplay || []);
                  onClose();
                }}
                className="px-3 py-1.5 bg-[#eef5fc] dark:bg-blue-950/40 text-[#185abd] dark:text-blue-300 hover:bg-blue-100 border border-[#c2daf5] dark:border-blue-900 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Fountain Format (.fountain)</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                  onClose();
                }}
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors flex items-center gap-1.5 border border-neutral-300 dark:border-neutral-600"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>

          {/* 3. Complete Liime Words Project Archive (.liw) */}
          <div className="p-4 rounded-xl border border-lime-500/30 dark:border-lime-500/20 bg-lime-50/50 dark:bg-lime-950/15 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Full Liime Words Project Archive (.liw)
                </h4>
              </div>
              <span className="text-[10px] font-mono uppercase bg-lime-500 text-neutral-950 px-2 py-0.5 rounded font-bold">
                Dedicated Format
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-3 leading-relaxed">
              Contains the complete manuscript, all Story Bible entities (characters, locations, events, objects, relationships), timeline, and screenplay adaptations saved as a dedicated <code>.liw</code> project file.
            </p>
            <button
              onClick={() => {
                StorageService.exportProjectAsLiw(project);
                onClose();
              }}
              className="px-4 py-2 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-neutral-950 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Project File (.liw)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
