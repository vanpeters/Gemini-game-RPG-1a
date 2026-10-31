import React, { useRef, useEffect, useCallback } from 'react';
import {
  Player,
  WorldMonster,
  WorldObject,
  NetworkPeer,
  Projectile,
  WorldLootDrop,
  FloatingText,
  BiomeType,
} from '../types/rpg';
import { TileType, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, getBiomeAt } from '../utils/worldGenerator';

interface OpenWorldCanvasProps {
  player: Player;
  mobs: WorldMonster[];
  objects: WorldObject[];
  peers: NetworkPeer[];
  projectiles: Projectile[];
  lootDrops: WorldLootDrop[];
  floatingTexts: FloatingText[];
  tiles: TileType[][];
  onInteractObject: (obj: WorldObject) => void;
  onTargetMob: (mob: WorldMonster) => void;
  crtEnabled: boolean;
}

export const OpenWorldCanvas: React.FC<OpenWorldCanvasProps> = ({
  player,
  mobs,
  objects,
  peers,
  projectiles,
  lootDrops,
  floatingTexts,
  tiles,
  onInteractObject,
  onTargetMob,
  crtEnabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef({ x: (player.x ?? 18) * TILE_SIZE, y: (player.y ?? 19) * TILE_SIZE });
  const animFrameRef = useRef<number | null>(null);

  // Click on canvas to target mob or interact
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickScreenX = e.clientX - rect.left;
      const clickScreenY = e.clientY - rect.top;

      const worldX = (clickScreenX - canvas.width / 2 + cameraRef.current.x) / TILE_SIZE;
      const worldY = (clickScreenY - canvas.height / 2 + cameraRef.current.y) / TILE_SIZE;

      // Check if clicked near an enemy
      for (const mob of mobs) {
        if (mob.hp <= 0) continue;
        const dist = Math.hypot(mob.x - worldX, mob.y - worldY);
        if (dist < 1.4) {
          onTargetMob(mob);
          return;
        }
      }

      // Check if clicked near an interactive object
      for (const obj of objects) {
        const dist = Math.hypot(obj.x - worldX, obj.y - worldY);
        if (dist < 1.4) {
          onInteractObject(obj);
          return;
        }
      }
    },
    [mobs, objects, onTargetMob, onInteractObject]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.03;

      // Update canvas resolution to match client display
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const screenWidth = canvas.width;
      const screenHeight = canvas.height;

      // Smooth camera interpolation towards player world coordinates
      const targetCamX = (player.x ?? 18) * TILE_SIZE + TILE_SIZE / 2;
      const targetCamY = (player.y ?? 19) * TILE_SIZE + TILE_SIZE / 2;
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.15;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.15;

      const camX = cameraRef.current.x;
      const camY = cameraRef.current.y;

      ctx.clearRect(0, 0, screenWidth, screenHeight);

      // Determine visible tile range
      const minTileX = Math.max(0, Math.floor((camX - screenWidth / 2) / TILE_SIZE) - 1);
      const maxTileX = Math.min(WORLD_WIDTH - 1, Math.ceil((camX + screenWidth / 2) / TILE_SIZE) + 1);
      const minTileY = Math.max(0, Math.floor((camY - screenHeight / 2) / TILE_SIZE) - 1);
      const maxTileY = Math.min(WORLD_HEIGHT - 1, Math.ceil((camY + screenHeight / 2) / TILE_SIZE) + 1);

      // 1. Draw Tiles
      for (let y = minTileY; y <= maxTileY; y++) {
        for (let x = minTileX; x <= maxTileX; x++) {
          const tile = tiles[y]?.[x] || 'grass';
          const drawX = Math.round(x * TILE_SIZE - camX + screenWidth / 2);
          const drawY = Math.round(y * TILE_SIZE - camY + screenHeight / 2);

          // Tile Backgrounds
          switch (tile) {
            case 'grass':
              ctx.fillStyle = '#164e22';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              // Grass fleck detail
              ctx.fillStyle = '#226b31';
              ctx.fillRect(drawX + 8, drawY + 12, 3, 5);
              ctx.fillRect(drawX + 26, drawY + 28, 3, 6);
              break;

            case 'cobblestone':
              ctx.fillStyle = '#475569';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#334155';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(drawX + 2, drawY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
              break;

            case 'dirt':
              ctx.fillStyle = '#452b1b';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#5c3a24';
              ctx.fillRect(drawX + 12, drawY + 16, 4, 3);
              break;

            case 'stone_slab':
              ctx.fillStyle = '#333842';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#22262e';
              ctx.strokeRect(drawX + 1, drawY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
              break;

            case 'wood_plank':
              ctx.fillStyle = '#54371e';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#3f2814';
              ctx.fillRect(drawX, drawY + 14, TILE_SIZE, 2);
              ctx.fillRect(drawX, drawY + 32, TILE_SIZE, 2);
              break;

            case 'water':
              ctx.fillStyle = '#0f4c81';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              // Animated ripple
              ctx.fillStyle = '#38bdf8';
              const wave = Math.sin(time + x + y) * 4;
              ctx.fillRect(drawX + 10 + wave, drawY + 18, 14, 2);
              break;

            case 'swamp_mud':
              ctx.fillStyle = '#293318';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#1c2410';
              ctx.beginPath();
              ctx.arc(drawX + 24, drawY + 24, 8, 0, Math.PI * 2);
              ctx.fill();
              break;

            case 'lava':
              ctx.fillStyle = '#991b1b';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#f97316';
              const glow = Math.sin(time * 2 + x) * 3;
              ctx.fillRect(drawX + 8, drawY + 8, 16 + glow, 14 + glow);
              break;

            case 'wall':
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 2;
              ctx.strokeRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              // Brick line
              ctx.fillStyle = '#334155';
              ctx.fillRect(drawX + 4, drawY + 8, TILE_SIZE - 8, 8);
              ctx.fillRect(drawX + 4, drawY + 24, TILE_SIZE - 8, 8);
              break;

            case 'tree':
              // Grass base
              ctx.fillStyle = '#164e22';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              // Trunk
              ctx.fillStyle = '#451a03';
              ctx.fillRect(drawX + 20, drawY + 28, 8, 16);
              // Foliage
              ctx.fillStyle = '#15803d';
              ctx.beginPath();
              ctx.arc(drawX + 24, drawY + 18, 18, 0, Math.PI * 2);
              ctx.fill();
              break;

            case 'ruin_pillar':
              ctx.fillStyle = '#333842';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#64748b';
              ctx.fillRect(drawX + 12, drawY + 6, 24, 34);
              ctx.fillStyle = '#94a3b8';
              ctx.fillRect(drawX + 10, drawY + 4, 28, 6);
              ctx.fillRect(drawX + 10, drawY + 36, 28, 6);
              break;

            case 'snow':
              ctx.fillStyle = '#f1f5f9';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#e2e8f0';
              ctx.fillRect(drawX + 8, drawY + 8, 4, 4);
              ctx.fillRect(drawX + 28, drawY + 24, 5, 4);
              break;

            case 'ice':
              ctx.fillStyle = '#7dd3fc';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#bae6fd';
              ctx.fillRect(drawX + 4, drawY + 12, TILE_SIZE - 8, 2);
              ctx.fillRect(drawX + 16, drawY + 30, TILE_SIZE - 20, 2);
              break;

            case 'sand':
              ctx.fillStyle = '#d97706';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#b45309';
              ctx.fillRect(drawX + 6, drawY + 14, 18, 2);
              ctx.fillRect(drawX + 22, drawY + 32, 20, 2);
              break;

            case 'sandstone':
              ctx.fillStyle = '#b45309';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#78350f';
              ctx.strokeRect(drawX + 2, drawY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
              break;

            case 'obsidian':
              ctx.fillStyle = '#1c1917';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#450a0a';
              ctx.fillRect(drawX + 10, drawY + 10, 8, 8);
              break;

            case 'void_stone':
              ctx.fillStyle = '#1e1b4b';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#818cf8';
              ctx.fillRect(drawX + 12, drawY + 16, 2, 2);
              ctx.fillRect(drawX + 32, drawY + 28, 3, 3);
              break;

            case 'crystal':
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#c084fc';
              ctx.beginPath();
              ctx.moveTo(drawX + 24, drawY + 4);
              ctx.lineTo(drawX + 38, drawY + 44);
              ctx.lineTo(drawX + 10, drawY + 44);
              ctx.closePath();
              ctx.fill();
              break;

            case 'dungeon_floor':
              ctx.fillStyle = '#334155';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#1e293b';
              ctx.strokeRect(drawX + 1, drawY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
              break;

            case 'dungeon_wall':
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#334155';
              ctx.lineWidth = 2;
              ctx.strokeRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#475569';
              ctx.fillRect(drawX + 6, drawY + 8, TILE_SIZE - 12, 6);
              ctx.fillRect(drawX + 6, drawY + 24, TILE_SIZE - 12, 6);
              break;

            default:
              ctx.fillStyle = '#164e22';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
          }
        }
      }

      // 2. Draw Interactive World Objects
      for (const obj of objects) {
        const drawX = Math.round(obj.x * TILE_SIZE - camX + screenWidth / 2);
        const drawY = Math.round(obj.y * TILE_SIZE - camY + screenHeight / 2);

        // Check if on screen
        if (drawX < -TILE_SIZE || drawX > screenWidth + TILE_SIZE || drawY < -TILE_SIZE || drawY > screenHeight + TILE_SIZE) {
          continue;
        }

        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (obj.type === 'chest') {
          // Glow if unopened
          if (!obj.opened) {
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;
          }
          ctx.fillText(obj.opened ? '📦' : '🎁', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
          ctx.shadowBlur = 0;
        } else if (obj.type === 'fountain') {
          // Pulsing water effect
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.fillText('⛲', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
          ctx.shadowBlur = 0;
        } else if (obj.type === 'campfire') {
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 14;
          ctx.fillText('🔥', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillText(obj.icon || '📍', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
        }

        // Object label & interaction hint if close to player
        const distToPlayer = Math.hypot(obj.x - (player.x ?? 18), obj.y - (player.y ?? 19));
        if (distToPlayer < 2.2) {
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#fbbf24';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          ctx.strokeText(`[E] ${obj.name}`, drawX + TILE_SIZE / 2, drawY - 6);
          ctx.fillText(`[E] ${obj.name}`, drawX + TILE_SIZE / 2, drawY - 6);
        } else {
          ctx.font = '10px monospace';
          ctx.fillStyle = '#cbd5e1';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeText(obj.name, drawX + TILE_SIZE / 2, drawY - 4);
          ctx.fillText(obj.name, drawX + TILE_SIZE / 2, drawY - 4);
        }
      }

      // 3. Draw Loot Drops
      for (const loot of lootDrops) {
        const drawX = Math.round(loot.x * TILE_SIZE - camX + screenWidth / 2);
        const drawY = Math.round(loot.y * TILE_SIZE - camY + screenHeight / 2);
        const bounce = Math.abs(Math.sin(time * 3 + loot.x)) * 6;

        ctx.font = '18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(loot.icon, drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2 - bounce);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(loot.label, drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2 - bounce - 12);
        ctx.fillText(loot.label, drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2 - bounce - 12);
      }

      // 4. Draw Wandering Monsters & Respawning Portals
      for (const mob of mobs) {
        const drawX = Math.round(mob.x * TILE_SIZE - camX + screenWidth / 2);
        const drawY = Math.round(mob.y * TILE_SIZE - camY + screenHeight / 2);

        if (drawX < -TILE_SIZE || drawX > screenWidth + TILE_SIZE || drawY < -TILE_SIZE || drawY > screenHeight + TILE_SIZE) {
          continue;
        }

        // If dead, check if within respawn window to show forming portal
        if (mob.hp <= 0) {
          if (mob.respawnAt && mob.respawnAt > Date.now()) {
            const timeLeft = Math.max(1, Math.ceil((mob.respawnAt - Date.now()) / 1000));
            // Show respawn rift
            ctx.save();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2, 16 + Math.sin(time * 6) * 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = '16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('🌀', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#7dd3fc';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(`Reviving (${timeLeft}s)`, drawX + TILE_SIZE / 2, drawY - 6);
            ctx.fillText(`Reviving (${timeLeft}s)`, drawX + TILE_SIZE / 2, drawY - 6);
            ctx.restore();
          }
          continue;
        }

        // Gentle walking bob animation when moving or patrolling
        const isMoving = mob.state === 'chase' || mob.state === 'patrol';
        const walkBob = isMoving ? Math.abs(Math.sin(time * 5 + mob.x * 3 + mob.y * 3)) * 3 : 0;

        // Aggro / Combat aura
        if (mob.state === 'chase' || mob.state === 'attack') {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2 - walkBob, 22, 0, Math.PI * 2);
          ctx.stroke();

          // Exclamation indicator
          ctx.font = 'bold 14px monospace';
          ctx.fillStyle = '#ef4444';
          ctx.fillText('!', drawX + TILE_SIZE / 2, drawY - 14 - walkBob);
        }

        // Defensive Stance Aura
        if (mob.isDefending) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2 - walkBob, 20, 0, Math.PI * 2);
          ctx.stroke();
          ctx.font = '12px monospace';
          ctx.fillText('🛡️', drawX + TILE_SIZE - 4, drawY + 8 - walkBob);
        }

        // Draw Monster Sprite
        ctx.font = mob.id === 'dragon' ? '38px monospace' : '26px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(mob.sprite || '👾', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2 - walkBob);

        // Monster Name & Level
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = mob.id === 'dragon' ? '#f87171' : '#f1f5f9';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(`Lv.${mob.level} ${mob.name}`, drawX + TILE_SIZE / 2, drawY - 6 - walkBob);
        ctx.fillText(`Lv.${mob.level} ${mob.name}`, drawX + TILE_SIZE / 2, drawY - 6 - walkBob);

        // Mini HP Bar
        const barWidth = 32;
        const barHeight = 4;
        const barX = drawX + (TILE_SIZE - barWidth) / 2;
        const barY = drawY + TILE_SIZE + 2;
        const hpPercent = Math.max(0, mob.hp / mob.maxHp);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(barX, barY, Math.round(barWidth * hpPercent), barHeight);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
      }

      // 5. Draw LAN Multiplayer Peers
      for (const peer of peers) {
        const drawX = Math.round(peer.x * TILE_SIZE - camX + screenWidth / 2);
        const drawY = Math.round(peer.y * TILE_SIZE - camY + screenHeight / 2);

        // LAN Peer Glow Aura
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 8;
        ctx.font = '28px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(peer.sprite || '🛡️', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
        ctx.shadowBlur = 0;

        // Peer Attack Animation if active
        if (peer.lastAttackAction && Date.now() - peer.lastAttackAction.time < 350) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2, 26, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Peer Name & LAN badge
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = peer.pvpEnabled ? '#f87171' : '#67e8f9';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const pvpTag = peer.pvpEnabled ? ' ⚔️[PVP]' : '';
        const peerTitle = `${peer.isHost ? '⭐ ' : ''}${peer.name} (Lv.${peer.level})${pvpTag}`;
        ctx.strokeText(peerTitle, drawX + TILE_SIZE / 2, drawY - 6);
        ctx.fillText(peerTitle, drawX + TILE_SIZE / 2, drawY - 6);

        // Peer Mini HP Bar
        const barWidth = 32;
        const barX = drawX + (TILE_SIZE - barWidth) / 2;
        const barY = drawY + TILE_SIZE + 2;
        const hpPercent = Math.max(0, peer.hp / peer.maxHp);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(barX, barY, barWidth, 4);
        ctx.fillStyle = peer.pvpEnabled ? '#ef4444' : '#38bdf8';
        ctx.fillRect(barX, barY, Math.round(barWidth * hpPercent), 4);
      }

      // 6. Draw Local Player
      const playerDrawX = Math.round((player.x ?? 18) * TILE_SIZE - camX + screenWidth / 2);
      const playerDrawY = Math.round((player.y ?? 19) * TILE_SIZE - camY + screenHeight / 2);
      const walkBob = player.isMoving ? Math.abs(Math.sin(time * 6)) * 4 : 0;

      // Selection / Target ring under player
      ctx.strokeStyle = player.pvpEnabled ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = player.pvpEnabled ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.ellipse(playerDrawX + TILE_SIZE / 2, playerDrawY + TILE_SIZE - 4, 16, 8, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Player Sprite
      ctx.font = '30px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.sprite || '🛡️', playerDrawX + TILE_SIZE / 2, playerDrawY + TILE_SIZE / 2 - walkBob);

      // Player Name Overhead
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = player.pvpEnabled ? '#f87171' : '#fef08a';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      const myPvpText = player.pvpEnabled ? ' ⚔️[PVP ON]' : '';
      ctx.strokeText(`${player.name} (You)${myPvpText}`, playerDrawX + TILE_SIZE / 2, playerDrawY - 8);
      ctx.fillText(`${player.name} (You)${myPvpText}`, playerDrawX + TILE_SIZE / 2, playerDrawY - 8);

      // Player Mini HP Bar
      const playerBarWidth = 36;
      const playerBarX = playerDrawX + (TILE_SIZE - playerBarWidth) / 2;
      const playerBarY = playerDrawY + TILE_SIZE + 2;
      const playerHpPct = Math.max(0, player.hp / player.maxHp);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(playerBarX, playerBarY, playerBarWidth, 4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(playerBarX, playerBarY, Math.round(playerBarWidth * playerHpPct), 4);

      // 7. Draw Flying Projectiles
      for (const proj of projectiles) {
        const drawX = Math.round(proj.x * TILE_SIZE - camX + screenWidth / 2);
        const drawY = Math.round(proj.y * TILE_SIZE - camY + screenHeight / 2);

        ctx.fillStyle = proj.color || '#f97316';
        ctx.beginPath();
        ctx.arc(drawX, drawY, proj.radius || 6, 0, Math.PI * 2);
        ctx.fill();

        // Projectile Glow
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 8. Draw Floating Damage & Reward Texts
      for (const ft of floatingTexts) {
        const drawX = ft.x !== undefined ? Math.round(ft.x * TILE_SIZE - camX + screenWidth / 2) : screenWidth / 2;
        const drawY = ft.y !== undefined ? Math.round(ft.y * TILE_SIZE - camY + screenHeight / 2) : screenHeight / 2 - 30;

        ctx.font = ft.type === 'crit' || ft.type === 'level' ? 'bold 16px monospace' : 'bold 13px monospace';
        ctx.textAlign = 'center';

        if (ft.type === 'crit') ctx.fillStyle = '#facc15';
        else if (ft.type === 'heal') ctx.fillStyle = '#4ade80';
        else if (ft.type === 'mana') ctx.fillStyle = '#60a5fa';
        else if (ft.type === 'poison') ctx.fillStyle = '#a855f7';
        else if (ft.type === 'gold') ctx.fillStyle = '#fde047';
        else if (ft.type === 'xp') ctx.fillStyle = '#38bdf8';
        else if (ft.type === 'defense') ctx.fillStyle = '#93c5fd';
        else ctx.fillStyle = '#ef4444';

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, drawX, drawY);
        ctx.fillText(ft.text, drawX, drawY);
      }

      // Biome Ambient Overlay (e.g., Caldera Heat Tint, Mire Gloom)
      const currentBiome = getBiomeAt(player.x ?? 18, player.y ?? 19);
      if (currentBiome === 'caldera') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
        ctx.fillRect(0, 0, screenWidth, screenHeight);
      } else if (currentBiome === 'mire') {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.07)';
        ctx.fillRect(0, 0, screenWidth, screenHeight);
      } else if (currentBiome === 'ruins') {
        ctx.fillStyle = 'rgba(99, 102, 241, 0.06)';
        ctx.fillRect(0, 0, screenWidth, screenHeight);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [player, mobs, objects, peers, projectiles, lootDrops, floatingTexts, tiles]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-crosshair"
      />
      {crtEnabled && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.6)_100%)] [background-size:100%_4px] bg-repeat-y opacity-30" />
      )}
    </div>
  );
};
