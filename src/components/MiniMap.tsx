import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Player, WorldMonster, WorldObject, NetworkPeer, BiomeType } from '../types/rpg';
import { WORLD_WIDTH, WORLD_HEIGHT, getBiomeAt, TileType } from '../utils/worldGenerator';
import {
  FOG_VISION_RADIUS,
  RADAR_DETECTION_RADIUS,
  getExplorationStats,
  parseTileKey,
  tileKey,
} from '../utils/fogOfWar';
import {
  Globe,
  Maximize2,
  Minimize2,
  Radio,
  Crosshair,
  Users,
  ChevronUp,
  Map as MapIcon,
  Eye,
} from 'lucide-react';

interface MiniMapProps {
  player: Player;
  worldTiles?: TileType[][];
  mobs: WorldMonster[];
  objects: WorldObject[];
  peers: NetworkPeer[];
  targetEnemy: WorldMonster | null;
  onSelectMonster?: (mob: WorldMonster) => void;
}

const BIOME_CANVAS_COLORS: Record<BiomeType, string> = {
  oakhaven: '#142f1b',
  wildwood: '#0d2816',
  ruins: '#1a1d33',
  mire: '#17221d',
  caldera: '#381412',
};

const TILE_CANVAS_COLORS: Record<string, string> = {
  grass: '#1b3b22',
  dirt: '#443221',
  cobblestone: '#64748b',
  stone_slab: '#475569',
  wood_plank: '#713f12',
  water: '#1e3a8a',
  deep_water: '#172554',
  lava: '#b91c1c',
  wall: '#334155',
  tree: '#14532d',
  ruin_pillar: '#64748b',
  swamp_mud: '#292524',
};

export const MiniMap: React.FC<MiniMapProps> = ({
  player,
  worldTiles,
  mobs,
  objects,
  peers,
  targetEnemy,
  onSelectMonster,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mapMode, setMapMode] = useState<'radar' | 'world'>('radar');
  const [sweepAngle, setSweepAngle] = useState(0);

  const playerX = player.x ?? 18;
  const playerY = player.y ?? 19;
  const currentBiome = getBiomeAt(playerX, playerY);

  // Fast set lookup for explored tiles
  const exploredSet = useMemo(() => {
    return new Set<string>(player.exploredTiles || []);
  }, [player.exploredTiles]);

  // Exploration percentage stats
  const stats = useMemo(() => {
    return getExplorationStats(exploredSet.size);
  }, [exploredSet.size]);

  // Support hotkey 'M' toggle via custom event
  useEffect(() => {
    const handleToggleEvent = () => {
      setIsCollapsed((prev) => !prev);
    };
    window.addEventListener('valdor:toggle-minimap', handleToggleEvent);
    return () => {
      window.removeEventListener('valdor:toggle-minimap', handleToggleEvent);
    };
  }, []);

  // Animate radar sweep line
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setSweepAngle((prev) => (prev + 0.04) % (Math.PI * 2));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Filter nearby entities for radar mode (radius 22 tiles)
  const nearbyMobs = useMemo(() => {
    return mobs
      .filter((m) => m.hp > 0)
      .map((m) => {
        const dist = Math.hypot(m.x - playerX, m.y - playerY);
        return { ...m, dist };
      })
      .sort((a, b) => a.dist - b.dist);
  }, [mobs, playerX, playerY]);

  const nearestMob = nearbyMobs[0] || null;

  // Render on Canvas with Fog of War
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (mapMode === 'radar') {
      // ==========================================
      // --- RADAR MODE (Player Centered) ---
      // ==========================================
      const centerX = width / 2;
      const centerY = height / 2;
      const scale = width / (RADAR_DETECTION_RADIUS * 2);

      // Radar circular clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, width / 2 - 2, 0, Math.PI * 2);
      ctx.clip();

      // Deep dark void for uncharted territory
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, width, height);

      // Draw terrain tiles within radar range
      const minTileX = Math.max(0, Math.floor(playerX - RADAR_DETECTION_RADIUS));
      const maxTileX = Math.min(WORLD_WIDTH - 1, Math.ceil(playerX + RADAR_DETECTION_RADIUS));
      const minTileY = Math.max(0, Math.floor(playerY - RADAR_DETECTION_RADIUS));
      const maxTileY = Math.min(WORLD_HEIGHT - 1, Math.ceil(playerY + RADAR_DETECTION_RADIUS));

      for (let ty = minTileY; ty <= maxTileY; ty++) {
        for (let tx = minTileX; tx <= maxTileX; tx++) {
          const dx = tx - playerX;
          const dy = ty - playerY;
          const dist = Math.hypot(dx, dy);
          if (dist > RADAR_DETECTION_RADIUS) continue;

          const screenX = centerX + (dx - 0.5) * scale;
          const screenY = centerY + (dy - 0.5) * scale;
          const tileSize = scale + 0.6; // slight overlap to prevent seams

          const isTileExplored = exploredSet.has(tileKey(tx, ty));

          if (isTileExplored) {
            const tileType = worldTiles?.[ty]?.[tx];
            const tileBiome = getBiomeAt(tx, ty);
            const baseColor =
              (tileType && TILE_CANVAS_COLORS[tileType]) ||
              BIOME_CANVAS_COLORS[tileBiome] ||
              '#142f1b';

            ctx.fillStyle = baseColor;
            ctx.fillRect(screenX, screenY, tileSize, tileSize);

            // If tile is outside active sight radius (memory fog)
            if (dist > FOG_VISION_RADIUS) {
              ctx.fillStyle = 'rgba(6, 9, 19, 0.58)';
              ctx.fillRect(screenX, screenY, tileSize, tileSize);
            }
          } else {
            // Unexplored tile: subtle grid shrouded in darkness
            ctx.fillStyle = '#070a14';
            ctx.fillRect(screenX, screenY, tileSize, tileSize);
          }
        }
      }

      // Range grid rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      [0.33, 0.66, 1.0].forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (width / 2 - 4) * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Active Vision Radius Ring
      const visionPx = FOG_VISION_RADIUS * scale;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, visionPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Crosshairs
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Radar Sweep Line & Cone
      const sweepX = centerX + Math.cos(sweepAngle) * (width / 2);
      const sweepY = centerY + Math.sin(sweepAngle) * (height / 2);
      const sweepGrad = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, width / 2);
      sweepGrad.addColorStop(0, 'rgba(34, 197, 94, 0.35)');
      sweepGrad.addColorStop(1, 'rgba(34, 197, 94, 0.01)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, width / 2, sweepAngle - 0.32, sweepAngle);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(74, 222, 128, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // Render World Objects (Only if explored or in vision)
      objects.forEach((obj) => {
        const dx = obj.x - playerX;
        const dy = obj.y - playerY;
        const dist = Math.hypot(dx, dy);
        if (dist > RADAR_DETECTION_RADIUS) return;

        // Must be in explored tile or within active vision
        const objKey = tileKey(Math.round(obj.x), Math.round(obj.y));
        const isExplored = exploredSet.has(objKey) || dist <= FOG_VISION_RADIUS;
        if (!isExplored) return;

        const screenX = centerX + dx * scale;
        const screenY = centerY + dy * scale;

        ctx.save();
        if (obj.type === 'chest') {
          ctx.fillStyle = obj.opened ? '#94a3b8' : '#eab308';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === 'campfire') {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === 'fountain') {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Render LAN Peers (Allies with radio beacons emit signal)
      peers.forEach((peer) => {
        const dx = peer.x - playerX;
        const dy = peer.y - playerY;
        const dist = Math.hypot(dx, dy);
        if (dist > RADAR_DETECTION_RADIUS) return;

        const screenX = centerX + dx * scale;
        const screenY = centerY + dy * scale;

        // Peer outer pulse ring
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Detected Mobs (Only if inside active vision OR inside explored radar territory)
      nearbyMobs.forEach((mob) => {
        if (mob.dist > RADAR_DETECTION_RADIUS) return;

        const mobKey = tileKey(Math.round(mob.x), Math.round(mob.y));
        const inActiveVision = mob.dist <= FOG_VISION_RADIUS;
        const inExploredTerritory = exploredSet.has(mobKey);

        // Hostiles in unexplored shroud outside direct vision are hidden!
        if (!inActiveVision && !inExploredTerritory) return;

        const dx = mob.x - playerX;
        const dy = mob.y - playerY;
        const screenX = centerX + dx * scale;
        const screenY = centerY + dy * scale;

        const isTargeted = targetEnemy?.instanceId === mob.instanceId;
        const isDragon = mob.id === 'dragon' || mob.name.toLowerCase().includes('dragon');
        const isAggro = mob.state === 'chase' || mob.dist < mob.aggroRadius;

        ctx.save();
        if (isDragon) {
          // Boss Dragon: Pulsing crimson diamond
          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (isAggro) {
          // Hostile chasing: Vibrant Red dot with warning aura
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Patrolling/Idle: Amber dot
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Target reticle if active
        if (isTargeted) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(screenX - 6, screenY - 6, 12, 12);
        }
        ctx.restore();
      });

      // Render Player Marker at Center
      ctx.save();
      ctx.translate(centerX, centerY);
      let angle = 0;
      if (player.direction === 'up') angle = -Math.PI / 2;
      else if (player.direction === 'right') angle = 0;
      else if (player.direction === 'down') angle = Math.PI / 2;
      else if (player.direction === 'left') angle = Math.PI;

      ctx.rotate(angle);

      // Player Directional Arrow
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, -4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Outer bezel ring
      ctx.restore(); // remove clip
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width / 2 - 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // ==========================================
      // --- FULL WORLD OVERVIEW MODE (80x80 Grid) ---
      // ==========================================
      const scaleX = width / WORLD_WIDTH;
      const scaleY = height / WORLD_HEIGHT;

      // Uncharted darkness for entire world
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, width, height);

      // Render only explored tiles from the persistent exploration set
      exploredSet.forEach((key) => {
        const [tx, ty] = parseTileKey(key);
        if (tx < 0 || tx >= WORLD_WIDTH || ty < 0 || ty >= WORLD_HEIGHT) return;

        const tileType = worldTiles?.[ty]?.[tx];
        const tileBiome = getBiomeAt(tx, ty);
        const color =
          (tileType && TILE_CANVAS_COLORS[tileType]) ||
          BIOME_CANVAS_COLORS[tileBiome] ||
          '#142f1b';

        ctx.fillStyle = color;
        ctx.fillRect(tx * scaleX, ty * scaleY, scaleX + 0.5, scaleY + 0.5);
      });

      // Draw Objects (Only if explored)
      objects.forEach((obj) => {
        const key = tileKey(Math.round(obj.x), Math.round(obj.y));
        if (!exploredSet.has(key)) return;

        const sx = obj.x * scaleX;
        const sy = obj.y * scaleY;
        ctx.fillStyle =
          obj.type === 'chest' ? '#eab308' : obj.type === 'campfire' ? '#f97316' : '#38bdf8';
        ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
      });

      // Draw Mobs (Only if in explored region)
      mobs.forEach((mob) => {
        if (mob.hp <= 0) return;
        const key = tileKey(Math.round(mob.x), Math.round(mob.y));
        if (!exploredSet.has(key)) return;

        const sx = mob.x * scaleX;
        const sy = mob.y * scaleY;
        ctx.fillStyle = mob.id === 'dragon' ? '#ef4444' : '#f59e0b';
        ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
      });

      // Draw Peers
      peers.forEach((peer) => {
        const sx = peer.x * scaleX;
        const sy = peer.y * scaleY;
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Player Position & Active Vision Halo
      const px = playerX * scaleX;
      const py = playerY * scaleY;

      // Active Vision Aura
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, FOG_VISION_RADIUS * scaleX, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Border
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);
    }
  }, [
    mapMode,
    playerX,
    playerY,
    player.direction,
    currentBiome,
    sweepAngle,
    nearbyMobs,
    mobs,
    objects,
    peers,
    targetEnemy,
    exploredSet,
    worldTiles,
  ]);

  const mapSize = isExpanded ? 210 : 140;

  // ==========================================
  // --- REDUCED SMALL WORLD ICON BUTTON ---
  // ==========================================
  if (isCollapsed) {
    return (
      <div className="pointer-events-auto flex flex-col items-end">
        <button
          onClick={() => setIsCollapsed(false)}
          className="relative group p-2.5 bg-slate-950/80 hover:bg-slate-900/95 backdrop-blur-md border border-amber-500/60 hover:border-amber-400 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
          title={`Expand World Map & Radar (M) • ${stats.percent}% Explored`}
          aria-label="Expand Mini-Map"
        >
          {/* Subtle spinning glow aura */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-cyan-500/20 to-emerald-500/20 animate-spin-slow opacity-60 group-hover:opacity-100 transition-opacity" />

          {/* World Icon */}
          <Globe className="w-5 h-5 text-amber-300 group-hover:text-amber-200 relative z-10 transition-transform group-hover:rotate-12" />

          {/* Active Radar Ping Dot */}
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-950" />
          </span>

          {/* Hover Tooltip / Quick Stats */}
          <span className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/95 border border-slate-700/80 rounded-lg text-[10px] font-mono text-slate-200 whitespace-nowrap shadow-xl pointer-events-none z-20">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Map [M]</span>
            <span className="text-amber-400 font-bold">{stats.percent}% Mapped</span>
          </span>
        </button>
      </div>
    );
  }

  // ==========================================
  // --- FULL EXPANDED MINIMAP HUD ---
  // ==========================================
  return (
    <div className="pointer-events-auto flex flex-col items-end gap-1.5 animate-fade-in">
      <div className="relative bg-slate-950/75 backdrop-blur-md border border-slate-700/80 hover:border-slate-600 rounded-xl p-2 shadow-2xl overflow-hidden transition-all duration-300">
        {/* Header toolbar */}
        <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800/80 text-[11px] font-mono">
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] tracking-tight">{mapMode === 'radar' ? 'RADAR' : 'WORLD'}</span>
            <span className="text-[9px] text-slate-400">
              ({Math.round(playerX)},{Math.round(playerY)})
            </span>
            {/* Fog of war exploration percentage */}
            <span
              className="text-[9px] px-1 py-0.2 bg-amber-950/70 text-amber-300 border border-amber-600/50 rounded font-bold ml-0.5"
              title={`${stats.count} of ${stats.total} realm tiles explored`}
            >
              {stats.percent}%
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Mode switch */}
            <button
              onClick={() => setMapMode((m) => (m === 'radar' ? 'world' : 'radar'))}
              title={mapMode === 'radar' ? 'Switch to Full World Map' : 'Switch to Radar View'}
              className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition"
            >
              {mapMode === 'radar' ? 'WORLD' : 'RADAR'}
            </button>

            {/* Expand / Shrink */}
            <button
              onClick={() => setIsExpanded((e) => !e)}
              title={isExpanded ? 'Shrink Minimap' : 'Enlarge Minimap'}
              className="p-1 text-slate-400 hover:text-white transition"
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>

            {/* Collapse to World Icon */}
            <button
              onClick={() => setIsCollapsed(true)}
              title="Reduce to World Icon (M)"
              className="p-1 text-slate-400 hover:text-amber-400 transition"
            >
              <Globe className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Canvas Radar / World with Fog of War */}
        <div className="flex justify-center items-center">
          <canvas
            ref={canvasRef}
            width={mapSize}
            height={mapSize}
            className="cursor-crosshair rounded-lg shadow-inner bg-slate-950/90"
          />
        </div>

        {/* Legend / Status row */}
        <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-800/80 text-[9px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              <span>Hostile</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              <span>Patrol</span>
            </span>
            {peers.length > 0 && (
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-ping" />
                <span>LAN({peers.length})</span>
              </span>
            )}
          </div>

          {nearestMob && (
            <div
              onClick={() => onSelectMonster?.(nearestMob)}
              className="flex items-center gap-1 text-[9px] text-red-300 cursor-pointer hover:underline font-mono"
              title="Click to target nearest threat"
            >
              <Crosshair className="w-2.5 h-2.5 text-red-400" />
              <span>{Math.round(nearestMob.dist)}m</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
