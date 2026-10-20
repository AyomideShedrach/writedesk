import React, { useState } from 'react';
import { X, Target, Trophy, Flame } from 'lucide-react';

interface DailyGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: number;
  sessionWords: number;
  onUpdateGoal: (newGoal: number) => void;
}

export const DailyGoalModal: React.FC<DailyGoalModalProps> = ({
  isOpen,
  onClose,
  currentGoal,
  sessionWords,
  onUpdateGoal,
}) => {
  const [goalInput, setGoalInput] = useState(currentGoal.toString());

  if (!isOpen) return null;

  const handleSave = () => {
    const parsed = parseInt(goalInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateGoal(parsed);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-neutral-100 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-lime-400" />
            <h3 className="font-bold text-sm">Daily Writing Sprint Goal</h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Target Words Per Day</label>
            <input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-sm font-mono text-lime-300 focus:outline-hidden focus:border-lime-500"
              placeholder="1000"
            />
          </div>

          <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Current Session Words</span>
            <span className="font-mono font-bold text-lime-400">{sessionWords} words</span>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold text-xs"
          >
            Save Goal
          </button>
        </div>
      </div>
    </div>
  );
};
