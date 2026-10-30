import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Player, WorldMonster, WorldObject, NetworkPeer, BiomeType } from '../types/rpg';
import { WORLD_WIDTH, WORLD_HEIGHT, getBiomeAt } from '../utils/worldGenerator';
import { Compass, Maximize2, Minimize2, Radio, Crosshair, Users } from 'lucide-react';

interface MiniMapProps {
  player: Player;
  mobs: WorldMonster[];
  objects: WorldObject[];
  peers: NetworkPeer[];
  targetEnemy: WorldMonster | null;
  onSelectMonster?: (mob: WorldMonster) => void;
}

const BIOME_CANVAS_COLORS: Record<BiomeType, string> = {
  oakhaven: '#142918',
  wildwood: '#0d2413',
  ruins: '#171a2b',
  mire: '#12231c',
  caldera: '#2b1210',
};

export const MiniMap: React.FC<MiniMapProps> = ({
  player,
  mobs,
  objects,
  peers,
  targetEnemy,
  onSelectMonster,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapMode, setMapMode] = useState<'radar' | 'world'>('radar');
  const [sweepAngle, setSweepAngle] = useState(0);

  const playerX = player.x ?? 18;
  const playerY = player.y ?? 19;
  const currentBiome = getBiomeAt(playerX, playerY);

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
  const RADAR_RADIUS = 22;

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

  // Render on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (mapMode === 'radar') {
      // --- RADAR MODE (Player Centered) ---
      const centerX = width / 2;
      const centerY = height / 2;
      const scale = width / (RADAR_RADIUS * 2);

      // Radar circular clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, width / 2 - 2, 0, Math.PI * 2);
      ctx.clip();

      // Background fill based on current biome
      ctx.fillStyle = BIOME_CANVAS_COLORS[currentBiome] || '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Range grid rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      [0.33, 0.66, 1.0].forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (width / 2 - 4) * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Radar Sweep Line & Fade
      const sweepX = centerX + Math.cos(sweepAngle) * (width / 2);
      const sweepY = centerY + Math.sin(sweepAngle) * (height / 2);
      const sweepGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, width / 2);
      sweepGrad.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
      sweepGrad.addColorStop(1, 'rgba(34, 197, 94, 0.02)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, width / 2, sweepAngle - 0.3, sweepAngle);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // Render World Objects (Chests, Campfires, Fountains)
      objects.forEach((obj) => {
        const dx = obj.x - playerX;
        const dy = obj.y - playerY;
        const dist = Math.hypot(dx, dy);
        if (dist > RADAR_RADIUS) return;

        const screenX = centerX + dx * scale;
        const screenY = centerY + dy * scale;

        ctx.save();
        if (obj.type === 'chest') {
          ctx.fillStyle = obj.opened ? '#94a3b8' : '#eab308';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === 'campfire') {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === 'fountain') {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Render LAN Peers
      peers.forEach((peer) => {
        const dx = peer.x - playerX;
        const dy = peer.y - playerY;
        const dist = Math.hypot(dx, dy);
        if (dist > RADAR_RADIUS) return;

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

      // Render Detected Mobs
      nearbyMobs.forEach((mob) => {
        if (mob.dist > RADAR_RADIUS) return;

        const dx = mob.x - playerX;
        const dy = mob.y - playerY;
        const screenX = centerX + dx * scale;
        const screenY = centerY + dy * scale;

        const isTargeted = targetEnemy?.instanceId === mob.instanceId;
        const isDragon = mob.id === 'dragon' || mob.name.toLowerCase().includes('dragon');
        const isAggro = mob.state === 'chase' || mob.dist < mob.aggroRadius;

        ctx.save();
        if (isDragon) {
          // Boss Dragon: Pulsing purple/crimson diamond
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
      // Direction pointer
      ctx.translate(centerX, centerY);
      let angle = 0;
      if (player.direction === 'up') angle = -Math.PI / 2;
      else if (player.direction === 'right') angle = 0;
      else if (player.direction === 'down') angle = Math.PI / 2;
      else if (player.direction === 'left') angle = Math.PI;

      ctx.rotate(angle);

      // Player Arrow
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
      // --- FULL WORLD OVERVIEW MODE (80x80 Grid) ---
      const scaleX = width / WORLD_WIDTH;
      const scaleY = height / WORLD_HEIGHT;

      // Draw biome gradient zones
      ctx.fillStyle = '#0b1329';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle biome regions
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)'; // Oakhaven
      ctx.fillRect(0, 0, width * 0.45, height * 0.45);

      ctx.fillStyle = 'rgba(21, 128, 61, 0.25)'; // Wildwood
      ctx.fillRect(width * 0.45, 0, width * 0.55, height * 0.5);

      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)'; // Ruins
      ctx.fillRect(0, height * 0.45, width * 0.5, height * 0.55);

      ctx.fillStyle = 'rgba(132, 204, 22, 0.2)'; // Mire
      ctx.fillRect(width * 0.5, height * 0.5, width * 0.5, height * 0.5);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)'; // Caldera (Center East)
      ctx.beginPath();
      ctx.arc(width * 0.72, height * 0.65, width * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Draw Objects
      objects.forEach((obj) => {
        const sx = obj.x * scaleX;
        const sy = obj.y * scaleY;
        ctx.fillStyle = obj.type === 'chest' ? '#eab308' : obj.type === 'campfire' ? '#f97316' : '#38bdf8';
        ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
      });

      // Draw Mobs
      mobs.forEach((mob) => {
        if (mob.hp <= 0) return;
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

      // Draw Player Position
      const px = playerX * scaleX;
      const py = playerY * scaleY;

      // Radar visibility circle on world map
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, RADAR_RADIUS * scaleX, 0, Math.PI * 2);
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
  ]);

  const mapSize = isExpanded ? 220 : 150;

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-1.5">
      {/* Minimap Frame Box */}
      <div className="relative bg-slate-950/95 backdrop-blur-md border-2 border-amber-600/80 rounded-xl p-2 shadow-2xl overflow-hidden transition-all duration-300">
        {/* Header toolbar */}
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>RADAR</span>
            <span className="text-[10px] text-slate-400">
              ({Math.round(playerX)}, {Math.round(playerY)})
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Mode switch */}
            <button
              onClick={() => setMapMode((m) => (m === 'radar' ? 'world' : 'radar'))}
              title={mapMode === 'radar' ? 'Switch to Full World Map' : 'Switch to Radar View'}
              className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
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
          </div>
        </div>

        {/* Canvas Radar */}
        <div className="flex justify-center items-center">
          <canvas
            ref={canvasRef}
            width={mapSize}
            height={mapSize}
            className="cursor-crosshair rounded-lg shadow-inner bg-slate-950"
          />
        </div>

        {/* Legend / Status row */}
        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-800 text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span>Hostile</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>Patrol</span>
            </span>
            {peers.length > 0 && (
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-ping" />
                <span>LAN ({peers.length})</span>
              </span>
            )}
          </div>

          {nearestMob && (
            <div
              onClick={() => onSelectMonster?.(nearestMob)}
              className="flex items-center gap-1 text-[10px] text-red-300 cursor-pointer hover:underline font-mono"
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
