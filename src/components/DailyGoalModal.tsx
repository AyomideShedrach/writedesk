import React, { useState } from 'react';
import { 
  Target, 
  X, 
  RotateCcw, 
  Flame, 
  Trophy, 
  Check, 
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface DailyGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: number;
  sessionWords: number;
  totalWords: number;
  baselineWords: number;
  onUpdateGoal: (newGoal: number) => void;
  onResetSession: () => void;
}

const PRESET_GOALS = [
  { value: 250, label: '250w', desc: 'Warmup Sprint' },
  { value: 500, label: '500w', desc: 'Daily Habit' },
  { value: 1000, label: '1,000w', desc: 'Standard Studio' },
  { value: 1667, label: '1,667w', desc: 'NaNoWriMo Pace' },
  { value: 2000, label: '2,000w', desc: 'Deep Focus' },
  { value: 3000, label: '3,000w', desc: 'Marathon Day' },
];

export const DailyGoalModal: React.FC<DailyGoalModalProps> = ({
  isOpen,
  onClose,
  currentGoal,
  sessionWords,
  totalWords,
  baselineWords,
  onUpdateGoal,
  onResetSession,
}) => {
  const [goalInput, setGoalInput] = useState<number>(currentGoal || 1000);
  const [hasSaved, setHasSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.max(0, Math.round((sessionWords / (goalInput || 1)) * 100)));
  const isGoalMet = sessionWords >= (goalInput || 1) && goalInput > 0;
  const wordsRemaining = Math.max(0, (goalInput || 0) - sessionWords);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalInput > 0) {
      onUpdateGoal(goalInput);
      setHasSaved(true);
      setTimeout(() => {
        setHasSaved(false);
        onClose();
      }, 500);
    }
  };

  const handleSelectPreset = (value: number) => {
    setGoalInput(value);
    onUpdateGoal(value);
  };

  const handleResetSessionConfirmed = () => {
    onResetSession();
    setShowResetConfirm(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#0c1610] border border-neutral-200 dark:border-[#223d29] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-[#1a3320] bg-neutral-50 dark:bg-[#080f0b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-lime-500/15 border border-lime-500/30 flex items-center justify-center text-lime-600 dark:text-lime-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
                Daily Writing Goal
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Track words written during today's session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Progress Card */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#101f16] border border-neutral-200 dark:border-[#1f3a27] space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Current Session Progress
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-bold font-mono text-lime-600 dark:text-lime-400 tracking-tight">
                    {sessionWords.toLocaleString()}
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                    / {goalInput.toLocaleString()} words
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                  {progressPercent}%
                </span>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                  {isGoalMet ? 'Goal Reached!' : `${wordsRemaining.toLocaleString()} remaining`}
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-3 bg-neutral-200 dark:bg-black/40 rounded-full overflow-hidden p-0.5 border border-neutral-300 dark:border-white/10 relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isGoalMet
                    ? 'bg-gradient-to-r from-lime-500 to-emerald-400 shadow-[0_0_12px_rgba(163,230,53,0.8)]'
                    : 'bg-lime-500 dark:bg-lime-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Achievement notice */}
            {isGoalMet && (
              <div className="flex items-center gap-2 p-2.5 bg-lime-500/10 border border-lime-500/25 rounded-lg text-xs text-lime-700 dark:text-lime-300 font-medium animate-in fade-in duration-300">
                <Sparkles className="w-4 h-4 text-lime-500 shrink-0" />
                <span>Outstanding writing session! You've met or surpassed your daily target.</span>
              </div>
            )}
          </div>

          {/* Session Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#101f16] border border-neutral-200 dark:border-[#1a3320] flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-neutral-500 dark:text-neutral-400 font-medium text-[11px]">Net Words Added</div>
                <div className="font-semibold font-mono text-sm text-neutral-900 dark:text-white">
                  +{sessionWords.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#101f16] border border-neutral-200 dark:border-[#1a3320] flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-neutral-500 dark:text-neutral-400 font-medium text-[11px]">Total Manuscript</div>
                <div className="font-semibold font-mono text-sm text-neutral-900 dark:text-white">
                  {totalWords.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Set New Goal Section */}
          <form onSubmit={handleSave} className="space-y-3">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Set Daily Target (words)
            </label>

            {/* Custom Input with Stepper */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="50"
                  max="50000"
                  step="50"
                  value={goalInput}
                  onChange={(e) => setGoalInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 pl-9 bg-neutral-50 dark:bg-[#070e0a] border border-neutral-300 dark:border-[#223d29] rounded-lg text-sm font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-lime-500 text-neutral-900 dark:text-neutral-100"
                />
                <Target className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400 dark:text-neutral-500" />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-lime-600 hover:bg-lime-500 active:bg-lime-700 text-neutral-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {hasSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <span>Apply Goal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Presets Grid */}
            <div>
              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                Quick Presets:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_GOALS.map((preset) => {
                  const isSelected = goalInput === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleSelectPreset(preset.value)}
                      className={`px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-lime-500 bg-lime-500/15 text-lime-700 dark:text-lime-300 font-semibold'
                          : 'border-neutral-200 dark:border-[#1a3320] bg-neutral-50 dark:bg-[#0b140e] hover:border-neutral-300 dark:hover:border-[#2a4d33] text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="font-mono text-xs">{preset.label}</div>
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                        {preset.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Sprint / Session Management */}
          <div className="pt-3 border-t border-neutral-200 dark:border-[#1a3320]">
            {!showResetConfirm ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">
                  Starting a fresh writing sprint?
                </span>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors cursor-pointer text-xs font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-lime-500" />
                  <span>Reset Session Counter</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg space-y-2 text-xs animate-in fade-in duration-150">
                <div className="font-medium text-amber-700 dark:text-amber-300">
                  Reset session baseline to current word count ({totalWords.toLocaleString()} words)?
                </div>
                <div className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                  This starts a new session count from 0 without changing your manuscript content.
                </div>
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSessionConfirmed}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium shadow-xs"
                  >
                    Yes, Reset Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 dark:bg-[#080f0b] border-t border-neutral-200 dark:border-[#1a3320] flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span>Baseline: {baselineWords.toLocaleString()}w</span>
            <span>·</span>
            <span>Now: {totalWords.toLocaleString()}w</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
