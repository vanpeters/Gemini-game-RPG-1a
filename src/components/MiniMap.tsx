import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
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
  X,
  Compass,
  Star,
  ShoppingBag,
  Sparkles,
  MapPin,
  Flame,
  Shield,
  Layers,
} from 'lucide-react';
import { sound } from '../utils/audio';

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
  const cornerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScreenExpanded, setIsScreenExpanded] = useState(false);
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

  // Active Quest Resolution
  const activeQuest = useMemo(() => {
    return (player.quests || []).find(
      (q) => q.id === player.activeQuestId && q.status !== 'completed' && q.status !== 'claimed'
    );
  }, [player.quests, player.activeQuestId]);

  // Objective Matching Helpers
  const isMobQuestTarget = useCallback(
    (mob: WorldMonster): boolean => {
      if (!activeQuest) return false;
      const uncompleted = activeQuest.objectives.filter((o) => !o.completed);
      for (const obj of uncompleted) {
        if (obj.type === 'kill' && obj.targetId === mob.id) return true;
        if (obj.type === 'kill_group' && obj.targetGroup) {
          if (obj.targetGroup.includes(mob.id)) return true;
          const nameLow = mob.name.toLowerCase();
          if (obj.targetGroup.some((tg) => nameLow.includes(tg.replace('_', ' ')))) return true;
        }
      }
      return false;
    },
    [activeQuest]
  );

  const isObjectQuestTarget = useCallback(
    (obj: WorldObject): boolean => {
      if (!activeQuest) return false;
      const uncompleted = activeQuest.objectives.filter((o) => !o.completed);
      for (const o of uncompleted) {
        if (o.type === 'interact_object') {
          if (o.targetId === obj.id) return true;
          if (o.targetId === 'fountain_or_campfire' && (obj.type === 'fountain' || obj.type === 'campfire')) {
            return true;
          }
          if (o.targetId === 'chest_ruins_1' && obj.id.startsWith('chest_ruins')) {
            return true;
          }
        }
      }
      return false;
    },
    [activeQuest]
  );

  const isMerchantNPC = (obj: WorldObject) => {
    return (
      obj.type === 'npc' &&
      (obj.id === 'obj_blacksmith' ||
        obj.id === 'obj_alchemist' ||
        obj.name.toLowerCase().includes('merchant') ||
        obj.name.toLowerCase().includes('blacksmith') ||
        obj.name.toLowerCase().includes('alchemist'))
    );
  };

  const isElderNPC = (obj: WorldObject) => {
    return (
      obj.type === 'npc' &&
      (obj.id === 'obj_elder' ||
        obj.name.toLowerCase().includes('elder') ||
        obj.name.toLowerCase().includes('sage') ||
        obj.name.toLowerCase().includes('archmage'))
    );
  };

  // Support hotkey 'M' toggle via custom event & ESC to close fullscreen
  useEffect(() => {
    const handleToggleEvent = () => {
      if (isScreenExpanded) {
        setIsScreenExpanded(false);
      } else {
        setIsScreenExpanded(true);
      }
    };
    window.addEventListener('valdor:toggle-minimap', handleToggleEvent);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isScreenExpanded) {
        setIsScreenExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('valdor:toggle-minimap', handleToggleEvent);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isScreenExpanded]);

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

  // Master Canvas Drawing Routine supporting both Corner and Fullscreen
  const renderMapToCanvas = useCallback(
    (canvas: HTMLCanvasElement | null, isFull: boolean) => {
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

        // Circular radar clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, width / 2 - 2, 0, Math.PI * 2);
        ctx.clip();

        // Shrouded dark void
        ctx.fillStyle = '#060913';
        ctx.fillRect(0, 0, width, height);

        // Draw terrain tiles with Fog of War
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
            const tileSize = scale + 0.6;

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

              // Shroud memory fog if outside active sight
              if (dist > FOG_VISION_RADIUS) {
                ctx.fillStyle = 'rgba(6, 9, 19, 0.58)';
                ctx.fillRect(screenX, screenY, tileSize, tileSize);
              }
            } else {
              // Unexplored shroud
              ctx.fillStyle = '#070a14';
              ctx.fillRect(screenX, screenY, tileSize, tileSize);
            }
          }
        }

        // Radar grid rings
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1;
        [0.33, 0.66, 1.0].forEach((ratio) => {
          ctx.beginPath();
          ctx.arc(centerX, centerY, (width / 2 - 4) * ratio, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Active Line of Sight Radius Ring
        const visionPx = FOG_VISION_RADIUS * scale;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
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

        // ==========================================
        // 1. RENDER WORLD OBJECTS & MERCHANTS
        // ==========================================
        objects.forEach((obj) => {
          const dx = obj.x - playerX;
          const dy = obj.y - playerY;
          const dist = Math.hypot(dx, dy);
          if (dist > RADAR_DETECTION_RADIUS) return;

          const objKey = tileKey(Math.round(obj.x), Math.round(obj.y));
          const isExplored = exploredSet.has(objKey) || dist <= FOG_VISION_RADIUS;
          if (!isExplored) return;

          const screenX = centerX + dx * scale;
          const screenY = centerY + dy * scale;
          const isQuestObj = isObjectQuestTarget(obj);
          const isMerchant = isMerchantNPC(obj);
          const isElder = isElderNPC(obj);

          ctx.save();

          // Active Quest Target Object (Pulsing Gold Star Beacon)
          if (isQuestObj) {
            const pulseR = (isFull ? 7 : 5) + Math.sin(sweepAngle * 4) * 1.5;
            ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, pulseR + 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fbbf24';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(screenX, screenY, pulseR, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Gold exclamation mark
            ctx.fillStyle = '#0f172a';
            ctx.font = `bold ${isFull ? 10 : 8}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', screenX, screenY);
          } else if (isMerchant) {
            // MERCHANT NPC: Distinct Emerald Green Badge with Gold Coin Rim
            const r = isFull ? 6 : 4.5;
            ctx.fillStyle = '#10b981';
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Center coin glyph
            ctx.fillStyle = '#fef08a';
            ctx.font = `bold ${isFull ? 8 : 6}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', screenX, screenY);
          } else if (isElder) {
            // FRIENDLY ELDER / LORE NPC: Azure / Violet Sage Beacon
            const r = isFull ? 5.5 : 4;
            ctx.fillStyle = '#818cf8';
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (obj.type === 'chest') {
            // CHEST: Golden Coffer
            ctx.fillStyle = obj.opened ? '#94a3b8' : '#eab308';
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.rect(screenX - 3.5, screenY - 3, 7, 6);
            ctx.fill();
            ctx.stroke();
          } else if (obj.type === 'campfire') {
            // CAMPFIRE: Fiery Orange Hearth
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(screenX, screenY, isFull ? 4.5 : 3.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (obj.type === 'fountain') {
            // FOUNTAIN: Sapphire Blue Rejuvenation
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(screenX, screenY, isFull ? 4.5 : 3.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // SHRINE / MONOLITH: Arcane Purple
            ctx.fillStyle = '#a855f7';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        });

        // ==========================================
        // 2. RENDER LAN ALLIES / PEERS
        // ==========================================
        peers.forEach((peer) => {
          const dx = peer.x - playerX;
          const dy = peer.y - playerY;
          const dist = Math.hypot(dx, dy);
          if (dist > RADAR_DETECTION_RADIUS) return;

          const screenX = centerX + dx * scale;
          const screenY = centerY + dy * scale;

          ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 5.5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3.2, 0, Math.PI * 2);
          ctx.fill();
        });

        // ==========================================
        // 3. RENDER DETECTED MOBS & ACTIVE QUEST TARGETS
        // ==========================================
        nearbyMobs.forEach((mob) => {
          if (mob.dist > RADAR_DETECTION_RADIUS) return;

          const mobKey = tileKey(Math.round(mob.x), Math.round(mob.y));
          const inActiveVision = mob.dist <= FOG_VISION_RADIUS;
          const inExploredTerritory = exploredSet.has(mobKey);

          // Concealed in unexplored shroud outside direct vision
          if (!inActiveVision && !inExploredTerritory) return;

          const dx = mob.x - playerX;
          const dy = mob.y - playerY;
          const screenX = centerX + dx * scale;
          const screenY = centerY + dy * scale;

          const isTargeted = targetEnemy?.instanceId === mob.instanceId;
          const isDragon = mob.id === 'dragon' || mob.name.toLowerCase().includes('dragon');
          const isAggro = mob.state === 'chase' || mob.dist < mob.aggroRadius;
          const isQuestTarget = isMobQuestTarget(mob);

          ctx.save();

          if (isQuestTarget) {
            // ACTIVE QUEST TARGET MOB: Glowing Pulsing Golden Star & Alert Diamond
            const pulseR = (isFull ? 7.5 : 5.5) + Math.sin(sweepAngle * 4) * 1.5;

            // Outer radiant amber aura
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, pulseR + 4, 0, Math.PI * 2);
            ctx.fill();

            // Golden Diamond
            ctx.fillStyle = '#fbbf24';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY - pulseR);
            ctx.lineTo(screenX + pulseR, screenY);
            ctx.lineTo(screenX, screenY + pulseR);
            ctx.lineTo(screenX - pulseR, screenY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inner red threat core
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (isDragon) {
            // Boss Dragon: Pulsing crimson-purple dragon diamond
            ctx.fillStyle = '#ef4444';
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, isFull ? 7 : 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (isAggro) {
            // Hostile chasing: Vibrant Red dot with warning aura
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(screenX, screenY, isFull ? 4.5 : 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(screenX, screenY, isFull ? 7.5 : 6, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            // Patrolling/Idle: Amber dot
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(screenX, screenY, isFull ? 4 : 3, 0, Math.PI * 2);
            ctx.fill();
          }

          // Active target reticle
          if (isTargeted) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.8;
            ctx.strokeRect(screenX - 7, screenY - 7, 14, 14);
          }

          ctx.restore();
        });

        // ==========================================
        // 4. RENDER PLAYER (Distinct Cyan & Gold Directional Arrow)
        // ==========================================
        ctx.save();
        ctx.translate(centerX, centerY);

        // Player Outer Cyan Ambient Pulse
        ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, isFull ? 12 : 9, 0, Math.PI * 2);
        ctx.fill();

        let angle = 0;
        if (player.direction === 'up') angle = -Math.PI / 2;
        else if (player.direction === 'right') angle = 0;
        else if (player.direction === 'down') angle = Math.PI / 2;
        else if (player.direction === 'left') angle = Math.PI;

        ctx.rotate(angle);

        // Player High-Contrast Directional Arrow
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(isFull ? 9 : 7, 0);
        ctx.lineTo(isFull ? -6 : -5, isFull ? -5 : -4);
        ctx.lineTo(isFull ? -3 : -2, 0);
        ctx.lineTo(isFull ? -6 : -5, isFull ? 5 : 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Center Cyan Core
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();

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

        // Render explored tiles
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

        // Draw Objects & Merchants
        objects.forEach((obj) => {
          const key = tileKey(Math.round(obj.x), Math.round(obj.y));
          if (!exploredSet.has(key)) return;

          const sx = obj.x * scaleX;
          const sy = obj.y * scaleY;
          const isQuestObj = isObjectQuestTarget(obj);
          const isMerchant = isMerchantNPC(obj);
          const isElder = isElderNPC(obj);

          if (isQuestObj) {
            // Quest Target: Pulsing Gold Star Beacon
            ctx.fillStyle = '#fbbf24';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, isFull ? 5 : 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (isMerchant) {
            // MERCHANT NPC: Distinct Emerald Green Dot with Gold Border
            ctx.fillStyle = '#10b981';
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, isFull ? 4.5 : 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (isElder) {
            // FRIENDLY ELDER NPC: Azure/Violet Dot
            ctx.fillStyle = '#818cf8';
            ctx.beginPath();
            ctx.arc(sx, sy, isFull ? 4 : 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle =
              obj.type === 'chest' ? '#eab308' : obj.type === 'campfire' ? '#f97316' : '#38bdf8';
            ctx.fillRect(sx - 1.5, sy - 1.5, isFull ? 4 : 3, isFull ? 4 : 3);
          }
        });

        // Draw Mobs & Active Quest Targets
        mobs.forEach((mob) => {
          if (mob.hp <= 0) return;
          const key = tileKey(Math.round(mob.x), Math.round(mob.y));
          if (!exploredSet.has(key)) return;

          const sx = mob.x * scaleX;
          const sy = mob.y * scaleY;
          const isQuest = isMobQuestTarget(mob);

          if (isQuest) {
            // Pulsing Gold Diamond
            ctx.fillStyle = '#fbbf24';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, isFull ? 5 : 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillStyle = mob.id === 'dragon' ? '#ef4444' : '#f59e0b';
            ctx.fillRect(sx - 1.5, sy - 1.5, isFull ? 3.5 : 3, isFull ? 3.5 : 3);
          }
        });

        // Draw LAN Peers
        peers.forEach((peer) => {
          const sx = peer.x * scaleX;
          const sy = peer.y * scaleY;
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(sx, sy, isFull ? 4 : 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw Player Position & Active Vision Halo
        const px = playerX * scaleX;
        const py = playerY * scaleY;

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, FOG_VISION_RADIUS * scaleX, 0, Math.PI * 2);
        ctx.stroke();

        // Player Dot: White with Cyan & Red Accent
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, isFull ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Border
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
      }
    },
    [
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
      isMobQuestTarget,
      isObjectQuestTarget,
    ]
  );

  // Render corner canvas
  useEffect(() => {
    renderMapToCanvas(cornerCanvasRef.current, false);
  }, [renderMapToCanvas, isExpanded]);

  // Render fullscreen canvas
  useEffect(() => {
    if (isScreenExpanded) {
      renderMapToCanvas(fullscreenCanvasRef.current, true);
    }
  }, [renderMapToCanvas, isScreenExpanded]);

  const cornerSize = isExpanded ? 220 : 150;
  const fullscreenSize = 520;

  // ==========================================
  // --- REDUCED SMALL WORLD ICON BUTTON ---
  // ==========================================
  if (isCollapsed && !isScreenExpanded) {
    return (
      <div className="pointer-events-auto flex flex-col items-end">
        <button
          onClick={() => setIsCollapsed(false)}
          className="relative group p-2.5 bg-slate-950/80 hover:bg-slate-900/95 backdrop-blur-md border border-amber-500/60 hover:border-amber-400 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
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

          {/* Hover Tooltip */}
          <span className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/95 border border-slate-700/80 rounded-lg text-[10px] font-mono text-slate-200 whitespace-nowrap shadow-xl pointer-events-none z-20">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Click to Expand [M]</span>
            <span className="text-amber-400 font-bold">{stats.percent}% Mapped</span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ======================================================== */}
      {/* 1. TOP CORNER MINIMAP                                    */}
      {/* ======================================================== */}
      <div className="pointer-events-auto flex flex-col items-end gap-1.5 animate-fade-in">
        <div className="relative bg-slate-950/80 backdrop-blur-md border border-slate-700/80 hover:border-amber-500/60 rounded-xl p-2 shadow-2xl overflow-hidden transition-all duration-300 group">
          {/* Header toolbar */}
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800/80 text-[11px] font-mono">
            <div
              onClick={() => setIsScreenExpanded(true)}
              className="flex items-center gap-1 text-amber-400 font-bold cursor-pointer hover:text-amber-300 transition"
              title="Click to Expand Fullscreen Map (M)"
            >
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-[10px] tracking-tight">
                {mapMode === 'radar' ? 'RADAR' : 'WORLD'}
              </span>
              <span className="text-[9px] text-slate-400">
                ({Math.round(playerX)},{Math.round(playerY)})
              </span>
              <span
                className="text-[9px] px-1 py-0.2 bg-amber-950/70 text-amber-300 border border-amber-600/50 rounded font-bold ml-0.5"
                title={`${stats.count} of ${stats.total} tiles explored`}
              >
                {stats.percent}%
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Mode switch */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMapMode((m) => (m === 'radar' ? 'world' : 'radar'));
                }}
                title={mapMode === 'radar' ? 'Switch to Full World Map' : 'Switch to Radar View'}
                className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition cursor-pointer"
              >
                {mapMode === 'radar' ? 'WORLD' : 'RADAR'}
              </button>

              {/* Expand to Fullscreen Modal */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setIsScreenExpanded(true);
                }}
                title="Expand to Fullscreen Map (M)"
                className="p-1 text-amber-400 hover:text-amber-200 transition cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Collapse to Small World Icon Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(true);
                }}
                title="Reduce to World Icon"
                className="p-1 text-slate-400 hover:text-amber-400 transition cursor-pointer"
              >
                <Globe className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Clickable Canvas Container (Expands to screen when clicked) */}
          <div
            onClick={() => {
              sound.playClick();
              setIsScreenExpanded(true);
            }}
            className="flex justify-center items-center cursor-pointer relative"
            title="Click minimap to open Fullscreen Realm Map (M)"
          >
            <canvas
              ref={cornerCanvasRef}
              width={cornerSize}
              height={cornerSize}
              className="rounded-lg shadow-inner bg-slate-950/90 transition-transform group-hover:scale-[1.01]"
            />
            {/* Click overlay indicator on hover */}
            <div className="absolute inset-0 bg-slate-950/20 hover:bg-slate-950/10 rounded-lg pointer-events-none transition-colors" />
          </div>

          {/* Distinct Color-Coded Mini-Legend */}
          <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-800/80 text-[9px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-0.5" title="Player (Cyan/White Arrow)">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                <span className="text-[8px] text-slate-300">Hero</span>
              </span>
              <span className="flex items-center gap-0.5" title="Active Quest Targets (Gold Star)">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-ping" />
                <span className="text-[8px] text-amber-300 font-bold">Quest</span>
              </span>
              <span className="flex items-center gap-0.5" title="Merchants (Emerald Green Badge)">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span className="text-[8px] text-emerald-300">Shop</span>
              </span>
            </div>

            {nearestMob && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMonster?.(nearestMob);
                }}
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

      {/* ======================================================== */}
      {/* 2. FULL-SCREEN EXPANDED REALM CARTOGRAPHY MODAL          */}
      {/* ======================================================== */}
      {isScreenExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-xl font-mono select-none animate-in fade-in zoom-in-95">
          <div className="relative w-full max-w-5xl rounded-2xl border-2 border-amber-500/80 bg-slate-900 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-amber-500/40 bg-slate-950/90">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-amber-400 animate-spin-slow" />
                <div>
                  <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                    <span>Ruins of Valdor - Realm Cartography & Satellite Radar</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-200">
                      {mapMode.toUpperCase()} VIEW
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Coordinates: ({Math.round(playerX)}, {Math.round(playerY)}) • Biome:{' '}
                    <span className="capitalize text-emerald-400">{currentBiome}</span> • Exploration:{' '}
                    <span className="text-amber-300 font-bold">{stats.percent}% Mapped</span> ({stats.count} / {stats.total} Tiles)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Switch View */}
                <button
                  onClick={() => setMapMode((m) => (m === 'radar' ? 'world' : 'radar'))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-amber-300 font-bold rounded-lg transition cursor-pointer"
                >
                  {mapMode === 'radar' ? 'Switch to Full Realm (80x80)' : 'Switch to Local Radar'}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsScreenExpanded(false);
                  }}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Close Map [ESC]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Map + Navigation Sidebar */}
            <div className="p-4 flex flex-col lg:flex-row gap-4 overflow-y-auto">
              {/* Left/Center: High-Definition Canvas */}
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/80 border border-slate-800 rounded-xl p-3 shadow-inner relative">
                <canvas
                  ref={fullscreenCanvasRef}
                  width={fullscreenSize}
                  height={fullscreenSize}
                  className="rounded-xl shadow-2xl bg-slate-950 cursor-crosshair max-w-full h-auto"
                />

                <div className="text-[10px] text-slate-500 mt-2 font-mono flex items-center gap-2">
                  <Compass className="w-3 h-3 text-amber-400" />
                  <span>North is Top [Y: 0] • South is Bottom [Y: 79] • Fog of War covers uncharted areas</span>
                </div>
              </div>

              {/* Right Sidebar: Quests, Merchants, and Legend */}
              <div className="w-full lg:w-80 flex flex-col gap-3.5">
                {/* 1. Active Quest Target Navigator */}
                <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-3 shadow-md">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-2 border-b border-slate-800 pb-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>Active Quest Compass</span>
                  </div>

                  {activeQuest ? (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-amber-200">{activeQuest.title}</div>
                      <div className="space-y-1.5">
                        {activeQuest.objectives.map((obj) => (
                          <div
                            key={obj.id}
                            className={`p-2 rounded-lg border text-[11px] ${
                              obj.completed
                                ? 'border-emerald-800/60 bg-emerald-950/20 text-slate-500'
                                : 'border-amber-500/50 bg-amber-950/20 text-amber-100 font-bold'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span className={obj.completed ? 'text-emerald-400' : 'text-amber-400'}>
                                  {obj.completed ? '✓' : '⭐'}
                                </span>
                                <span className={obj.completed ? 'line-through' : ''}>
                                  {obj.description}
                                </span>
                              </span>
                              <span className="font-mono text-[10px] ml-1">
                                {obj.currentCount}/{obj.targetCount}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic p-2">
                      No active quest selected. Open Quest Journal [Q] to begin missions!
                    </div>
                  )}
                </div>

                {/* 2. Merchant & Landmark Directory */}
                <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-3 shadow-md">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-2 border-b border-slate-800 pb-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Town Merchants & Key Landmarks</span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-1.5 rounded bg-slate-900 border border-emerald-600/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-yellow-400" />
                        <div>
                          <div className="font-bold text-slate-200">Garek the Blacksmith</div>
                          <div className="text-[10px] text-slate-400">Shop: Weapons & Plate Armor</div>
                        </div>
                      </div>
                      <span className="font-mono text-emerald-400 text-[10px] font-bold">(23, 17)</span>
                    </div>

                    <div className="p-1.5 rounded bg-slate-900 border border-emerald-600/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-yellow-400" />
                        <div>
                          <div className="font-bold text-slate-200">Alchemist Lyra</div>
                          <div className="text-[10px] text-slate-400">Shop: Potions & Antidotes</div>
                        </div>
                      </div>
                      <span className="font-mono text-emerald-400 text-[10px] font-bold">(15, 22)</span>
                    </div>

                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                        <div>
                          <div className="font-bold text-slate-200">Elder Cedric</div>
                          <div className="text-[10px] text-slate-400">Village Elder & Guidance</div>
                        </div>
                      </div>
                      <span className="font-mono text-slate-400 text-[10px]">(18, 17)</span>
                    </div>

                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                        <div>
                          <div className="font-bold text-slate-200">Fountain of Rejuvenation</div>
                          <div className="text-[10px] text-slate-400">Restore 100% HP & Mana</div>
                        </div>
                      </div>
                      <span className="font-mono text-sky-400 text-[10px]">(18, 18)</span>
                    </div>

                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                        <div>
                          <div className="font-bold text-slate-200">Sacred Campfire</div>
                          <div className="text-[10px] text-slate-400">Rest & Save Progress</div>
                        </div>
                      </div>
                      <span className="font-mono text-orange-400 text-[10px]">(20, 22)</span>
                    </div>
                  </div>
                </div>

                {/* 3. Comprehensive Color-Coded Map Legend */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 shadow-md">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Distinct Map Icon Legend</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-cyan-400 ring-2 ring-yellow-400 flex-shrink-0" />
                      <span className="text-slate-200 font-bold">Hero (Player)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-red-500 animate-pulse flex-shrink-0" />
                      <span className="text-amber-300 font-bold">Quest Target</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-yellow-400 flex-shrink-0" />
                      <span className="text-emerald-300 font-bold">Merchant Shop</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-indigo-400 flex-shrink-0" />
                      <span className="text-indigo-300">Elder / NPC</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                      <span className="text-red-300">Hostile Beast</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-red-500 flex-shrink-0" />
                      <span className="text-purple-300 font-bold">Boss Dragon</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-yellow-500 rounded-sm flex-shrink-0" />
                      <span className="text-yellow-300">Chest / Coffer</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
                      <span className="text-cyan-300 font-bold">LAN Allies</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Press [ESC] or [M] to close map anytime</span>
              <button
                onClick={() => setIsScreenExpanded(false)}
                className="px-4 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition cursor-pointer"
              >
                Return to Game
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
