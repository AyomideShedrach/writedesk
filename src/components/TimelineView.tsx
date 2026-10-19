import React, { useState } from 'react';
import { Project, StoryEvent, Scene } from '../types/story';
import { 
  Clock, 
  MapPin, 
  Users, 
  Flag, 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  ArrowDownUp, 
  ExternalLink,
  Plus
} from 'lucide-react';

interface TimelineViewProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
  onNavigateToScene: (sceneId: string) => void;
}

type TimelineGranularity = 'STORY_ORDER' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
type TimelineMode = 'STORY_CHRONOLOGICAL' | 'MANUSCRIPT_ORDER';

export const TimelineView: React.FC<TimelineViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToScene,
}) => {
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('STORY_CHRONOLOGICAL');
  const [granularity, setGranularity] = useState<TimelineGranularity>('STORY_ORDER');
  const [filterMilestonesOnly, setFilterMilestonesOnly] = useState(false);

  const characters = project.storyBible?.characters || [];
  const locations = project.storyBible?.locations || [];
  const events = project.storyBible?.events || [];

  // Build timeline items according to selected mode
  let timelineItems: {
    id: string;
    title: string;
    description: string;
    orderIndex: number;
    orderLabel: string;
    timeLabel: string;
    locationName?: string;
    characterNames: string[];
    isMilestone?: boolean;
    consequences?: string;
    sceneId?: string;
    isFlashback?: boolean;
  }[] = [];

  if (timelineMode === 'STORY_CHRONOLOGICAL') {
    // True in-universe timeline
    const sortedEvents = [...events].sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);
    timelineItems = sortedEvents.map((evt, idx) => {
      const loc = locations.find(l => l.id === evt.locationId);
      const chars = characters.filter(c => evt.charactersInvolved?.includes(c.id)).map(c => c.name);
      const scene = project.scenes.find(s => s.id === evt.manuscriptSceneId);
      const chap = scene ? project.chapters.find(c => c.id === scene.chapterId) : undefined;

      // Check if this is a flashback (e.g. higher chapter number appearing early in chronological timeline)
      const isFlashback = chap && chap.number > 1 && idx === 0;

      return {
        id: evt.id,
        title: evt.name,
        description: evt.description,
        orderIndex: evt.chronologicalOrder,
        orderLabel: `Event #${String(evt.chronologicalOrder).padStart(2, '0')}`,
        timeLabel: evt.timeLabel || `Phase ${evt.chronologicalOrder}`,
        locationName: loc?.name,
        characterNames: chars,
        isMilestone: evt.isMilestone,
        consequences: evt.consequences,
        sceneId: evt.manuscriptSceneId,
        isFlashback: !!isFlashback,
      };
    });
  } else {
    // Manuscript order: scenes as they unfold for the reader chapter by chapter
    const sortedScenes = [...project.scenes].sort((a, b) => a.order - b.order);
    timelineItems = sortedScenes.map(sc => {
      const chap = project.chapters.find(c => c.id === sc.chapterId);
      const loc = locations.find(l => l.id === sc.locationId);
      const chars = characters.filter(c => sc.characterIds.includes(c.id)).map(c => c.name);
      const isFlashback = sc.storyOrder < sc.order;

      return {
        id: sc.id,
        title: sc.title,
        description: sc.content.substring(0, 160) + (sc.content.length > 160 ? '...' : ''),
        orderIndex: sc.order,
        orderLabel: `Ch ${chap?.number || '?'}: Scene ${sc.order}`,
        timeLabel: sc.time || 'Unspecified Time',
        locationName: loc?.name,
        characterNames: chars,
        isMilestone: sc.status === 'polished' || sc.status === 'final',
        consequences: sc.emotionalBeat,
        sceneId: sc.id,
        isFlashback,
      };
    });
  }

  if (filterMilestonesOnly) {
    timelineItems = timelineItems.filter(item => item.isMilestone);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 select-none">
      {/* Top Filter and Mode Switcher */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Toggle Manuscript Order vs Story Chronological Order */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Perspective:</span>
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
            <button
              onClick={() => setTimelineMode('STORY_CHRONOLOGICAL')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                timelineMode === 'STORY_CHRONOLOGICAL'
                  ? 'bg-[#185abd] text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Story Chronological Order</span>
            </button>
            <button
              onClick={() => setTimelineMode('MANUSCRIPT_ORDER')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                timelineMode === 'MANUSCRIPT_ORDER'
                  ? 'bg-[#185abd] text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>Manuscript Reader Order</span>
            </button>
          </div>
        </div>

        {/* View Granularity Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg text-xs font-medium">
            {(['STORY_ORDER', 'DAY', 'WEEK', 'MONTH', 'YEAR'] as TimelineGranularity[]).map(g => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  granularity === g
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {g.replace('_', ' ')}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
            <input
              type="checkbox"
              checked={filterMilestonesOnly}
              onChange={e => setFilterMilestonesOnly(e.target.checked)}
              className="rounded border-neutral-300 text-[#185abd] focus:ring-0"
            />
            <span>Major Milestones Only</span>
          </label>
        </div>
      </div>

      {/* Mode Explanation Banner */}
      <div className="bg-[#185abd]/10 border-b border-[#185abd]/20 px-6 py-2 text-xs text-[#185abd] dark:text-blue-300 flex items-center justify-between">
        <div>
          {timelineMode === 'STORY_CHRONOLOGICAL' ? (
            <span>
              <strong>Story Chronological Order:</strong> Displays historical causality. Flashbacks (such as Chapter 3, three years prior) are placed at their true in-universe timestamp before Chapter 1.
            </span>
          ) : (
            <span>
              <strong>Manuscript Order:</strong> Displays the narrative journey as the reader turns the pages from Chapter 1 Scene 1 to the end.
            </span>
          )}
        </div>
        <div className="text-[11px] font-mono text-neutral-500">
          {timelineItems.length} Key Milestones Visualized
        </div>
      </div>

      {/* Main Visual Timeline Canvas */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 select-text">
        <div className="max-w-4xl mx-auto relative">
          {/* Vertical Track Spine */}
          <div className="absolute left-6 md:left-8 top-4 bottom-4 w-0.5 bg-neutral-300 dark:bg-neutral-800" />

          {/* Timeline Nodes */}
          <div className="space-y-8 relative">
            {timelineItems.map((item, idx) => {
              return (
                <div key={item.id} className="relative flex items-start gap-4 md:gap-6 group">
                  {/* Spine Node Marker */}
                  <div className="relative z-10">
                    <div
                      className={`w-12 h-12 md:w-16 md:h-16 rounded-xl flex flex-col items-center justify-center font-mono text-xs font-bold border-2 transition-all shadow-sm ${
                        item.isFlashback
                          ? 'bg-purple-500 text-white border-purple-400'
                          : item.isMilestone
                          ? 'bg-[#185abd] text-white border-blue-400 ring-4 ring-[#185abd]/20'
                          : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-normal opacity-80">
                        {item.isFlashback ? 'Past' : 'Seq'}
                      </span>
                      <span className="text-sm md:text-base">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Event Details Card */}
                  <div className="flex-1 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-400 font-semibold">
                          {item.orderLabel}
                        </span>
                        {item.isFlashback && (
                          <span className="text-[10px] font-semibold uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                            Flashback / Historical
                          </span>
                        )}
                        {item.isMilestone && (
                          <span className="text-[10px] font-semibold uppercase bg-[#eef5fc] dark:bg-blue-950/60 text-[#185abd] dark:text-blue-300 px-2 py-0.5 rounded">
                            Key Milestone
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.timeLabel}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                      {item.title}
                    </h3>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {item.consequences && (
                      <div className="text-xs bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 mb-3 text-neutral-700 dark:text-neutral-300">
                        <span className="font-semibold text-[#185abd] dark:text-blue-300">Consequences / Fallout: </span>
                        <span>{item.consequences}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
                      <div className="flex flex-wrap items-center gap-4">
                        {item.locationName && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-neutral-700 dark:text-neutral-300">{item.locationName}</span>
                          </div>
                        )}
                        {item.characterNames.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-neutral-700 dark:text-neutral-300">
                              {item.characterNames.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {item.sceneId && (
                        <button
                          onClick={() => onNavigateToScene(item.sceneId!)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded font-medium transition-colors"
                        >
                          <span>Open Scene in Writer</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
