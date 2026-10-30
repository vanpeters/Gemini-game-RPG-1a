import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Player, WorldObject } from '../types/rpg';
import { Flame, Zap, Heart, Shield, Sparkles } from 'lucide-react';

interface TouchControlsProps {
  player: Player;
  nearbyObject: WorldObject | null;
  onMove: (dx: number, dy: number, direction: 'up' | 'down' | 'left' | 'right') => void;
  onAction: (action: 'attack' | 'fireball' | 'thunder' | 'potion') => void;
  onInteract: () => void;
  onToggleInventory?: () => void;
  visible?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  player,
  nearbyObject,
  onMove,
  onAction,
  onInteract,
  onToggleInventory,
  visible = true,
}) => {
  const [joystickActive, setJoystickActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'analog' | 'dpad'>('analog');

  const baseRef = useRef<HTMLDivElement | null>(null);
  const touchIdRef = useRef<number | null>(null);
  const moveVectorRef = useRef<{ dx: number; dy: number; dir: 'up' | 'down' | 'left' | 'right' } | null>(null);
  const animLoopRef = useRef<number | null>(null);

  const JOYSTICK_MAX_RADIUS = 42;

  // Haptic feedback helper
  const triggerHaptic = (ms = 20) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      // Ignore
    }
  };

  // Continuous movement loop while thumb is pressed
  useEffect(() => {
    let lastTime = 0;
    const loop = (now: number) => {
      if (moveVectorRef.current && now - lastTime > 90) {
        lastTime = now;
        onMove(
          moveVectorRef.current.dx,
          moveVectorRef.current.dy,
          moveVectorRef.current.dir
        );
      }
      animLoopRef.current = requestAnimationFrame(loop);
    };

    animLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (animLoopRef.current) cancelAnimationFrame(animLoopRef.current);
    };
  }, [onMove]);

  // Touch Handlers for Virtual Analog Joystick
  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setJoystickActive(true);
    triggerHaptic(15);
    updateJoystickFromTouch(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateJoystickFromTouch(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setJoystickActive(false);
        setKnobPos({ x: 0, y: 0 });
        moveVectorRef.current = null;
        break;
      }
    }
  };

  const updateJoystickFromTouch = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawDx = clientX - centerX;
    const rawDy = clientY - centerY;
    const dist = Math.hypot(rawDx, rawDy);

    let clampedX = rawDx;
    let clampedY = rawDy;
    if (dist > JOYSTICK_MAX_RADIUS) {
      clampedX = (rawDx / dist) * JOYSTICK_MAX_RADIUS;
      clampedY = (rawDy / dist) * JOYSTICK_MAX_RADIUS;
    }

    setKnobPos({ x: clampedX, y: clampedY });

    if (dist > 8) {
      let dir: 'up' | 'down' | 'left' | 'right' = 'down';
      if (Math.abs(clampedX) > Math.abs(clampedY)) {
        dir = clampedX > 0 ? 'right' : 'left';
      } else {
        dir = clampedY > 0 ? 'down' : 'up';
      }

      const speed = 0.4;
      const mag = Math.hypot(clampedX, clampedY);
      const nx = (clampedX / (mag || 1)) * speed;
      const ny = (clampedY / (mag || 1)) * speed;

      moveVectorRef.current = { dx: nx, dy: ny, dir };
    } else {
      moveVectorRef.current = null;
    }
  };

  // D-Pad single tap handlers
  const handleDpadPress = (dx: number, dy: number, dir: 'up' | 'down' | 'left' | 'right') => {
    triggerHaptic(20);
    onMove(dx, dy, dir);
  };

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 select-none overflow-hidden touch-none">
      {/* LEFT: Virtual Movement Joystick / D-Pad */}
      <div className="absolute bottom-6 left-6 pointer-events-auto flex flex-col items-center">
        {/* Toggle Mode (Analog vs D-Pad) */}
        <button
          onClick={() => setMode((m) => (m === 'analog' ? 'dpad' : 'analog'))}
          className="mb-2 px-2 py-0.5 text-[9px] font-mono font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded shadow backdrop-blur"
        >
          {mode === 'analog' ? 'STICK' : 'D-PAD'}
        </button>

        {mode === 'analog' ? (
          // Analog Stick
          <div
            ref={baseRef}
            onTouchStart={handleJoystickTouchStart}
            onTouchMove={handleJoystickTouchMove}
            onTouchEnd={handleJoystickTouchEnd}
            onTouchCancel={handleJoystickTouchEnd}
            className={`relative w-32 h-32 rounded-full border-2 ${
              joystickActive
                ? 'bg-slate-900/80 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : 'bg-slate-950/60 border-slate-700/80'
            } backdrop-blur-md flex items-center justify-center`}
          >
            {/* Cardinal direction guides */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30 text-amber-300 font-mono text-[10px]">
              <span className="absolute top-1 font-bold">▲</span>
              <span className="absolute bottom-1 font-bold">▼</span>
              <span className="absolute left-1.5 font-bold">◀</span>
              <span className="absolute right-1.5 font-bold">▶</span>
            </div>

            {/* Inner draggable thumb knob */}
            <div
              style={{
                transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                transition: joystickActive ? 'none' : 'transform 0.15s ease-out',
              }}
              className={`w-14 h-14 rounded-full border-2 ${
                joystickActive
                  ? 'bg-gradient-to-br from-amber-500 to-amber-700 border-yellow-300 shadow-lg scale-105'
                  : 'bg-slate-800/90 border-slate-600'
              } flex items-center justify-center text-xl shadow-2xl`}
            >
              🕹️
            </div>
          </div>
        ) : (
          // Retro 4-Way D-Pad
          <div className="relative w-32 h-32 bg-slate-950/70 backdrop-blur-md border border-slate-700 rounded-2xl p-1 flex flex-col justify-between items-center shadow-2xl">
            {/* UP */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                handleDpadPress(0, -0.4, 'up');
              }}
              className="w-10 h-10 bg-slate-800 active:bg-amber-600 border border-slate-600 active:border-amber-400 rounded-lg flex items-center justify-center text-white font-black text-sm transition"
            >
              ▲
            </button>
            {/* MIDDLE ROW (LEFT / CENTER / RIGHT) */}
            <div className="w-full flex justify-between items-center px-1">
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleDpadPress(-0.4, 0, 'left');
                }}
                className="w-10 h-10 bg-slate-800 active:bg-amber-600 border border-slate-600 active:border-amber-400 rounded-lg flex items-center justify-center text-white font-black text-sm transition"
              >
                ◀
              </button>
              <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] text-amber-500 font-bold">
                ●
              </div>
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleDpadPress(0.4, 0, 'right');
                }}
                className="w-10 h-10 bg-slate-800 active:bg-amber-600 border border-slate-600 active:border-amber-400 rounded-lg flex items-center justify-center text-white font-black text-sm transition"
              >
                ▶
              </button>
            </div>
            {/* DOWN */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                handleDpadPress(0, 0.4, 'down');
              }}
              className="w-10 h-10 bg-slate-800 active:bg-amber-600 border border-slate-600 active:border-amber-400 rounded-lg flex items-center justify-center text-white font-black text-sm transition"
            >
              ▼
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Action Touch Buttons Cluster */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end gap-2.5">
        {/* Contextual Interact Button [USE / TALK / OPEN] */}
        {nearbyObject && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic(30);
              onInteract();
            }}
            onClick={() => onInteract()}
            className="w-28 h-12 bg-gradient-to-r from-yellow-500 to-amber-500 active:from-yellow-400 active:to-amber-400 text-slate-950 font-black text-xs rounded-xl border-2 border-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.6)] flex items-center justify-center gap-2 animate-pulse active:scale-95 transition"
          >
            <span className="text-xl">{nearbyObject.icon}</span>
            <span>USE [E]</span>
          </button>
        )}

        {/* Diamond / Arc Combat Buttons */}
        <div className="relative w-44 h-44 bg-slate-950/60 backdrop-blur-md rounded-full border border-slate-800/80 p-2 shadow-2xl flex items-center justify-center">
          {/* Top: Thunder (⚡ 20 MP) */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic(25);
              onAction('thunder');
            }}
            onClick={() => onAction('thunder')}
            disabled={player.mana < 20}
            className={`absolute top-1.5 w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center text-xs font-bold transition active:scale-95 shadow-md ${
              player.mana >= 20
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 active:bg-cyan-600'
                : 'bg-slate-900 border-slate-700 text-slate-600 opacity-50'
            }`}
          >
            <span className="text-lg">⚡</span>
            <span className="text-[9px] font-mono">20 MP</span>
          </button>

          {/* Left: Fireball (🔥 15 MP) */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic(25);
              onAction('fireball');
            }}
            onClick={() => onAction('fireball')}
            disabled={player.mana < 15}
            className={`absolute left-1.5 w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center text-xs font-bold transition active:scale-95 shadow-md ${
              player.mana >= 15
                ? 'bg-orange-950/90 border-orange-400 text-orange-200 active:bg-orange-600'
                : 'bg-slate-900 border-slate-700 text-slate-600 opacity-50'
            }`}
          >
            <span className="text-lg">🔥</span>
            <span className="text-[9px] font-mono">15 MP</span>
          </button>

          {/* Right: Potion (🧪) */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic(20);
              onAction('potion');
            }}
            onClick={() => onAction('potion')}
            className="absolute right-1.5 w-14 h-14 rounded-full bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200 active:bg-emerald-600 flex flex-col items-center justify-center text-xs font-bold transition active:scale-95 shadow-md"
          >
            <span className="text-lg">🧪</span>
            <span className="text-[9px] font-mono">+50 HP</span>
          </button>

          {/* Bottom / Center Primary: Strike (🗡️) */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic(30);
              onAction('attack');
            }}
            onClick={() => onAction('attack')}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-amber-600 active:from-red-500 active:to-amber-500 border-2 border-amber-300 text-white flex flex-col items-center justify-center text-xs font-black transition active:scale-90 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          >
            <span className="text-2xl">🗡️</span>
            <span className="text-[10px] tracking-tight">STRIKE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
