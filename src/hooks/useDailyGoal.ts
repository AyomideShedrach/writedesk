import { useState, useEffect, useCallback } from 'react';
import { Project } from '../types/story';
import { calculateProjectWordCount } from '../services/storage';

interface SessionRecord {
  date: string; // YYYY-MM-DD
  baselineWords: number;
}

export function useDailyGoal(
  project: Project,
  onUpdateProject?: (updater: Project | ((prev: Project) => Project)) => void
) {
  const totalWords = calculateProjectWordCount(project);
  const dailyGoal = project.settings.dailyWordGoal || 1000;
  const storageKey = `liimewords_session_${project.id}`;

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [baselineWords, setBaselineWords] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const record: SessionRecord = JSON.parse(raw);
        if (record.date === getTodayString()) {
          return record.baselineWords;
        }
      }
    } catch (e) {
      console.warn('Error reading session word record:', e);
    }
    // New day or first run for this project: set baseline to current total words
    const initialBaseline = totalWords;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ date: getTodayString(), baselineWords: initialBaseline })
      );
    } catch (e) {
      console.warn('Error saving session word record:', e);
    }
    return initialBaseline;
  });

  // Keep baseline in sync across project switches or new day
  useEffect(() => {
    const today = getTodayString();
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const record: SessionRecord = JSON.parse(raw);
        if (record.date === today) {
          setBaselineWords(record.baselineWords);
          return;
        }
      }
      // If no valid record for today, set baseline to current total
      const newBaseline = totalWords;
      localStorage.setItem(
        storageKey,
        JSON.stringify({ date: today, baselineWords: newBaseline })
      );
      setBaselineWords(newBaseline);
    } catch (e) {
      console.warn('Error checking session word record:', e);
    }
  }, [project.id]);

  const sessionWords = Math.max(0, totalWords - baselineWords);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((sessionWords / (dailyGoal || 1)) * 100))
  );
  const isGoalMet = sessionWords >= (dailyGoal || 1) && dailyGoal > 0;
  const wordsRemaining = Math.max(0, (dailyGoal || 0) - sessionWords);

  // Update daily goal in project settings
  const handleUpdateGoal = useCallback(
    (newGoal: number) => {
      if (newGoal <= 0) return;
      if (onUpdateProject) {
        onUpdateProject((prev: Project) => ({
          ...prev,
          settings: {
            ...prev.settings,
            dailyWordGoal: newGoal,
          },
        }));
      }
    },
    [onUpdateProject]
  );

  // Reset session counter to current total words (starts a new sprint)
  const handleResetSession = useCallback(() => {
    const current = totalWords;
    setBaselineWords(current);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ date: getTodayString(), baselineWords: current })
      );
    } catch (e) {
      console.warn('Error resetting session word baseline:', e);
    }
  }, [totalWords, storageKey]);

  return {
    dailyGoal,
    sessionWords,
    totalWords,
    baselineWords,
    progressPercent,
    isGoalMet,
    wordsRemaining,
    updateGoal: handleUpdateGoal,
    resetSession: handleResetSession,
  };
}
