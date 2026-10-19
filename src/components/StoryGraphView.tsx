import React, { useState, useMemo } from 'react';
import { Project, Character, Location, StoryEvent, StoryObject } from '../types/story';
import { 
  Network, 
  Users, 
  MapPin, 
  Flag, 
  Box, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  ExternalLink 
} from 'lucide-react';

interface StoryGraphViewProps {
  project: Project;
  onNavigateToScene: (sceneId: string) => void;
}

interface GraphNode {
  id: string;
  type: 'character' | 'location' | 'event' | 'object';
  label: string;
  subtitle?: string;
  x: number;
  y: number;
  color: string;
  raw: any;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
}

export const StoryGraphView: React.FC<StoryGraphViewProps> = ({
  project,
  onNavigateToScene,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'character' | 'location' | 'event' | 'object'>('all');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const characters = project.storyBible?.characters || [];
  const locations = project.storyBible?.locations || [];
  const events = project.storyBible?.events || [];
  const objects = project.storyBible?.objects || [];
  const relationships = project.storyBible?.relationships || [];

  // Build nodes and layout coordinates
  const { nodes, edges } = useMemo(() => {
    const rawNodes: GraphNode[] = [];
    const rawEdges: GraphEdge[] = [];

    // Center coordinates
    const centerX = 550;
    const centerY = 360;

    // 1. Character nodes positioned in inner circle
    const charRadius = 180;
    characters.forEach((char, i) => {
      const angle = (i / Math.max(1, characters.length)) * 2 * Math.PI;
      rawNodes.push({
        id: char.id,
        type: 'character',
        label: char.name,
        subtitle: char.role,
        x: centerX + charRadius * Math.cos(angle),
        y: centerY + charRadius * Math.sin(angle),
        color: char.color || '#3b82f6',
        raw: char,
      });
    });

    // 2. Location nodes in top-right / outer orbit
    const locRadius = 310;
    locations.forEach((loc, i) => {
      const angle = (i / Math.max(1, locations.length)) * Math.PI + Math.PI * 0.2;
      rawNodes.push({
        id: loc.id,
        type: 'location',
        label: loc.name,
        subtitle: 'Setting',
        x: centerX + locRadius * Math.cos(angle),
        y: centerY + locRadius * Math.sin(angle),
        color: '#10b981',
        raw: loc,
      });
    });

    // 3. Event nodes in bottom orbit
    const evtRadius = 320;
    events.forEach((evt, i) => {
      const angle = (i / Math.max(1, events.length)) * Math.PI + Math.PI * 1.1;
      rawNodes.push({
        id: evt.id,
        type: 'event',
        label: evt.name,
        subtitle: evt.timeLabel || `Order #${evt.chronologicalOrder}`,
        x: centerX + evtRadius * Math.cos(angle),
        y: centerY + evtRadius * Math.sin(angle),
        color: '#f59e0b',
        raw: evt,
      });
    });

    // 4. Object nodes in left/right outer orbit
    objects.forEach((obj, i) => {
      const offset = (i + 1) * 140;
      rawNodes.push({
        id: obj.id,
        type: 'object',
        label: obj.name,
        subtitle: 'Key Item',
        x: i % 2 === 0 ? centerX - 330 : centerX + 340,
        y: centerY - 120 + offset,
        color: '#a855f7',
        raw: obj,
      });
    });

    // Build Edges:
    // A. Character <-> Character Relationships
    relationships.forEach(rel => {
      rawEdges.push({
        id: rel.id,
        source: rel.character1Id,
        target: rel.character2Id,
        label: rel.type,
        type: 'relationship',
      });
    });

    // B. Character -> Location appearances
    characters.forEach(char => {
      locations.forEach(loc => {
        const sharesScene = project.scenes.some(
          s => s.locationId === loc.id && (s.characterIds.includes(char.id) || s.povCharacterId === char.id)
        );
        if (sharesScene) {
          rawEdges.push({
            id: `edge-${char.id}-${loc.id}`,
            source: char.id,
            target: loc.id,
            label: 'visits',
            type: 'presence',
          });
        }
      });
    });

    // C. Event -> Location
    events.forEach(evt => {
      if (evt.locationId) {
        rawEdges.push({
          id: `edge-${evt.id}-${evt.locationId}`,
          source: evt.id,
          target: evt.locationId,
          label: 'takes place at',
          type: 'location_event',
        });
      }

      // Event -> Characters involved
      evt.charactersInvolved?.forEach(charId => {
        rawEdges.push({
          id: `edge-${evt.id}-${charId}`,
          source: evt.id,
          target: charId,
          label: 'participates in',
          type: 'participation',
        });
      });
    });

    // D. Object -> Current owner
    objects.forEach(obj => {
      if (obj.currentOwnerId) {
        rawEdges.push({
          id: `edge-${obj.id}-${obj.currentOwnerId}`,
          source: obj.currentOwnerId,
          target: obj.id,
          label: 'holds / possesses',
          type: 'possession',
        });
      }
    });

    return { nodes: rawNodes, edges: rawEdges };
  }, [project]);

  // Determine connected node IDs when a node is selected
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return null;
    const ids = new Set<string>([selectedNodeId]);
    edges.forEach(edge => {
      if (edge.source === selectedNodeId) ids.add(edge.target);
      if (edge.target === selectedNodeId) ids.add(edge.source);
    });
    return ids;
  }, [selectedNodeId, edges]);

  // Selected node entity for details panel
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'rect') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 select-none relative">
      {/* Top Filter Bar */}
      <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            <Network className="w-4 h-4 text-[#185abd]" />
            <span>Story Relationship Graph</span>
          </div>

          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterType === 'all' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500'
              }`}
            >
              All Entities
            </button>
            <button
              onClick={() => setFilterType('character')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterType === 'character' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500'
              }`}
            >
              Characters
            </button>
            <button
              onClick={() => setFilterType('location')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterType === 'location' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500'
              }`}
            >
              Locations
            </button>
            <button
              onClick={() => setFilterType('event')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterType === 'event' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setFilterType('object')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterType === 'object' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500'
              }`}
            >
              Objects
            </button>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.15))}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-neutral-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.15))}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded"
            title="Reset Graph Position"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Graph Visual Canvas */}
      <div
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-neutral-100/50 dark:bg-neutral-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-neutral-200/40 dark:text-neutral-800/40" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edge Connections */}
            {edges.map(edge => {
              const srcNode = nodes.find(n => n.id === edge.source);
              const tgtNode = nodes.find(n => n.id === edge.target);
              if (!srcNode || !tgtNode) return null;

              const isHighlighted =
                connectedNodeIds && (edge.source === selectedNodeId || edge.target === selectedNodeId);
              const isDimmed = connectedNodeIds && !isHighlighted;

              return (
                <g key={edge.id} className="transition-opacity duration-200">
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={tgtNode.x}
                    y2={tgtNode.y}
                    stroke={isHighlighted ? '#f59e0b' : 'currentColor'}
                    className={
                      isHighlighted
                        ? 'stroke-2'
                        : isDimmed
                        ? 'opacity-10 stroke-1 text-neutral-300 dark:text-neutral-800'
                        : 'opacity-40 stroke-1 text-neutral-400 dark:text-neutral-600'
                    }
                    strokeDasharray={edge.type === 'relationship' ? '4 2' : 'none'}
                  />
                  {isHighlighted && (
                    <text
                      x={(srcNode.x + tgtNode.x) / 2}
                      y={(srcNode.y + tgtNode.y) / 2 - 6}
                      fill="#f59e0b"
                      fontSize="10"
                      textAnchor="middle"
                      className="font-mono font-medium select-none"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              if (filterType !== 'all' && node.type !== filterType) return null;

              const isSelected = selectedNodeId === node.id;
              const isConnected = connectedNodeIds?.has(node.id);
              const isDimmed = connectedNodeIds && !isConnected;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(selectedNodeId === node.id ? null : node.id);
                  }}
                  className="cursor-pointer transition-all duration-200 group"
                  opacity={isDimmed ? 0.25 : 1}
                >
                  {/* Outer glow ring when selected */}
                  {isSelected && (
                    <circle
                      r={node.type === 'character' ? 34 : 28}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      className="animate-pulse"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r={node.type === 'character' ? 24 : 18}
                    fill={node.color}
                    className="shadow-md hover:scale-110 transition-transform"
                  />

                  {/* Icon / Initial */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize={node.type === 'character' ? 12 : 10}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {node.label.charAt(0)}
                  </text>

                  {/* Node Label Card */}
                  <g transform={`translate(0, ${node.type === 'character' ? 36 : 30})`}>
                    <text
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="11"
                      fontWeight="600"
                      className="text-neutral-900 dark:text-neutral-100 select-none"
                    >
                      {node.label}
                    </text>
                    {node.subtitle && (
                      <text
                        textAnchor="middle"
                        y="13"
                        fill="currentColor"
                        fontSize="9"
                        className="text-neutral-400 select-none capitalize"
                      >
                        {node.subtitle}
                      </text>
                    )}
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-5 flex flex-col justify-between z-20 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  <span className="text-[10px] uppercase font-mono font-semibold text-neutral-400">
                    {selectedNode.type} Details
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {selectedNode.label}
              </h3>
              <div className="text-xs text-neutral-500 capitalize mb-4">
                {selectedNode.subtitle}
              </div>

              {/* Character Details */}
              {selectedNode.type === 'character' && (
                <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                  {selectedNode.raw.appearance && (
                    <div>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Appearance: </span>
                      {selectedNode.raw.appearance}
                    </div>
                  )}
                  {selectedNode.raw.goals && (
                    <div>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Goal: </span>
                      {selectedNode.raw.goals}
                    </div>
                  )}
                  {selectedNode.raw.characterArc && (
                    <div>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Arc: </span>
                      {selectedNode.raw.characterArc}
                    </div>
                  )}
                </div>
              )}

              {/* Location Details */}
              {selectedNode.type === 'location' && (
                <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <p>{selectedNode.raw.description}</p>
                  {selectedNode.raw.atmosphere && (
                    <div className="italic text-neutral-500">
                      "{selectedNode.raw.atmosphere}"
                    </div>
                  )}
                </div>
              )}

              {/* Event Details */}
              {selectedNode.type === 'event' && (
                <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <p>{selectedNode.raw.description}</p>
                  {selectedNode.raw.consequences && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded text-amber-700 dark:text-amber-300">
                      <strong>Consequences: </strong> {selectedNode.raw.consequences}
                    </div>
                  )}
                </div>
              )}

              {/* Object Details */}
              {selectedNode.type === 'object' && (
                <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <p>{selectedNode.raw.description}</p>
                  {selectedNode.raw.significance && (
                    <div className="bg-purple-50 dark:bg-purple-950/40 p-2 rounded text-purple-700 dark:text-purple-300">
                      <strong>Significance: </strong> {selectedNode.raw.significance}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-400 block mb-2">
                Connected to {Math.max(0, (connectedNodeIds?.size || 1) - 1)} story nodes
              </span>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="w-full py-1 text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
