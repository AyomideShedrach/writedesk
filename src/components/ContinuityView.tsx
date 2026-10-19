import React, { useState } from 'react';
import { Project, ContinuityIssue } from '../types/story';
import { 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  Eye, 
  Clock, 
  MapPin, 
  HelpCircle,
  Wand2,
  Trash2
} from 'lucide-react';
import { StoryEngine } from '../services/storyEngine';

interface ContinuityViewProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
  onNavigateToScene: (sceneId: string) => void;
}

export const ContinuityView: React.FC<ContinuityViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToScene,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'dismissed'>('open');

  const issues = project.continuityIssues || [];

  // Run Continuity Audit
  const handleRunAudit = () => {
    setIsScanning(true);
    setTimeout(() => {
      onUpdateProject((prev: Project) => {
        const auditedIssues = StoryEngine.auditContinuity(prev);
        return {
          ...prev,
          continuityIssues: auditedIssues,
        };
      });
      setIsScanning(false);
    }, 400);
  };

  // Dismiss / Mark Intentional
  const handleToggleDismiss = (issueId: string) => {
    onUpdateProject((prev: Project) => {
      const curIssues = prev.continuityIssues || [];
      const updated = curIssues.map(i =>
        i.id === issueId ? { ...i, dismissed: !i.dismissed } : i
      );
      return { ...prev, continuityIssues: updated };
    });
  };

  // Delete issue
  const handleDeleteIssue = (issueId: string) => {
    onUpdateProject((prev: Project) => {
      const curIssues = prev.continuityIssues || [];
      const updated = curIssues.filter(i => i.id !== issueId);
      return { ...prev, continuityIssues: updated };
    });
  };

  const filteredIssues = issues.filter(i => {
    if (filter === 'open') return !i.dismissed;
    if (filter === 'dismissed') return i.dismissed;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 select-none">
      {/* Header & Controls */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Story Continuity & Coherence</span>
          </div>

          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setFilter('open')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'open' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500'
              }`}
            >
              Pending Flags ({issues.filter(i => !i.dismissed).length})
            </button>
            <button
              onClick={() => setFilter('dismissed')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'dismissed' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500'
              }`}
            >
              Intentional / Resolved ({issues.filter(i => i.dismissed).length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'all' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500'
              }`}
            >
              All
            </button>
          </div>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={isScanning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#185abd] hover:bg-[#124896] text-white rounded transition-colors shadow-xs disabled:opacity-50"
        >
          <Wand2 className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Auditing Manuscript...' : 'Audit Continuity'}</span>
        </button>
      </div>

      {/* Explanation Banner */}
      <div className="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 px-6 py-2.5 text-xs text-neutral-600 dark:text-neutral-400">
        Continuity flags are advisory observations to assist your editorial workflow. You maintain absolute creative authority to decide what is an inconsistency versus an intentional narrative choice.
      </div>

      {/* Main Issues List */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 select-text">
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredIssues.length > 0 ? (
            filteredIssues.map(issue => {
              const isDismissed = issue.dismissed;

              return (
                <div
                  key={issue.id}
                  className={`p-5 rounded-xl border transition-all shadow-xs ${
                    isDismissed
                      ? 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 opacity-60'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {issue.type === 'character_trait' && <Eye className="w-4 h-4 text-blue-500" />}
                      {issue.type === 'timeline_jump' && <Clock className="w-4 h-4 text-purple-500" />}
                      {issue.type === 'location_anomaly' && <MapPin className="w-4 h-4 text-emerald-500" />}
                      {issue.type === 'unresolved_thread' && <HelpCircle className="w-4 h-4 text-amber-500" />}

                      <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {issue.title}
                      </h3>
                      <span className="text-[10px] font-mono uppercase bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-500">
                        {issue.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleDismiss(issue.id)}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                          isDismissed
                            ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                            : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        {isDismissed ? 'Re-open Flag' : 'Mark Intentional / Resolved'}
                      </button>
                      <button
                        onClick={() => handleDeleteIssue(issue.id)}
                        className="p-1 text-neutral-400 hover:text-red-500 rounded"
                        title="Delete flag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                    {issue.description}
                  </p>

                  {/* Connected Scenes */}
                  {issue.sceneIds && issue.sceneIds.length > 0 && (
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-neutral-500 text-[11px]">Related Scenes:</span>
                      {issue.sceneIds.map(sid => {
                        const scene = project.scenes.find(s => s.id === sid);
                        if (!scene) return null;
                        return (
                          <button
                            key={sid}
                            onClick={() => onNavigateToScene(sid)}
                            className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded flex items-center gap-1 transition-colors"
                          >
                            <span>{scene.title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-neutral-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-60" />
              <h4 className="text-sm font-semibold mb-1 text-neutral-800 dark:text-neutral-200">
                No Continuity Issues Detected
              </h4>
              <p className="text-xs max-w-sm mx-auto mb-4">
                Your character profiles, timelines, and scenes match the current story rules.
              </p>
              <button
                onClick={handleRunAudit}
                className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded text-xs font-semibold"
              >
                Run Scan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
