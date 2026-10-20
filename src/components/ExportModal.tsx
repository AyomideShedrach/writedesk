import React, { useState } from 'react';
import { X, FileDown, FileText, Code, Check } from 'lucide-react';
import { Project } from '../types/story';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, project }) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    let md = `# ${project.title}\n*By ${project.author}*\n\n`;
    for (const chap of project.chapters) {
      md += `## ${chap.title}\n\n`;
      const scenes = project.scenes.filter(s => s.chapterId === chap.id);
      for (const scene of scenes) {
        md += `### ${scene.title}\n\n${scene.content}\n\n`;
      }
    }
    downloadFile(`${project.title.toLowerCase().replace(/\s+/g, '_')}.md`, md, 'text/markdown');
  };

  const exportJSON = () => {
    downloadFile(`${project.title.toLowerCase().replace(/\s+/g, '_')}.json`, JSON.stringify(project, null, 2), 'application/json');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-neutral-100 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-lime-400" />
            <h3 className="font-bold text-sm">Export Manuscript & Story Assets</h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <button
            onClick={exportMarkdown}
            className="w-full p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-lime-500/50 flex items-center justify-between text-xs transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-lime-400" />
              <div>
                <p className="font-semibold text-white">Markdown Manuscript (.md)</p>
                <p className="text-neutral-400 text-[11px]">Formatted book chapters and scenes ready for Scrivener, Obsidian, or publishing.</p>
              </div>
            </div>
            <FileDown className="w-4 h-4 text-neutral-400" />
          </button>

          <button
            onClick={exportJSON}
            className="w-full p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-lime-500/50 flex items-center justify-between text-xs transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <Code className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">Full Project Studio Backup (.json)</p>
                <p className="text-neutral-400 text-[11px]">Includes all scenes, Story Bible, characters, screenplay, and timeline.</p>
              </div>
            </div>
            <FileDown className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
