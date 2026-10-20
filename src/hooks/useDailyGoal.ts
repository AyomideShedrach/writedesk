import { useState, useEffect } from 'react';
import { Project } from '../types/story';

export function useDailyGoal(project: Project) {
  const [sessionWords, setSessionWords] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(project.dailyWordGoal || 1000);

  useEffect(() => {
    if (project.dailyWordGoal) {
      setDailyGoal(project.dailyWordGoal);
    }
  }, [project.dailyWordGoal]);

  const updateGoal = (newGoal: number) => {
    setDailyGoal(newGoal);
  };

  return {
    dailyGoal,
    sessionWords,
    updateGoal,
  };
}
