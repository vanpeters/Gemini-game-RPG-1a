import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Player, WorldObject } from '../types/rpg';
import {
  Move,
  Maximize2,
  Minimize2,
  RotateCcw,
  Check,
  Settings2,
  Sliders,
  Eye,
  RefreshCw,
  X,
  Smartphone,
  ChevronRight,
  Sparkles,
  GripHorizontal,
  GripVertical,
} from 'lucide-react';

export interface TouchLayoutConfig {
  scale: number; // 0.7 to 1.5
  opacity: number; // 0.2 to 1.0
  joystickOffset: { x: number; y: number }; // offset in px from default anchor
  actionsOffset: { x: number; y: number }; // offset in px from default anchor
  swapSides: boolean; // if true, joystick on right, actions on left
  mode: 'analog' | 'dpad';
}

const DEFAULT_LAYOUT: TouchLayoutConfig = {
  scale: 1.0,
  opacity: 0.9,
  joystickOffset: { x: 0, y: 0 },
  actionsOffset: { x: 0, y: 0 },
  swapSides: false,
  mode: 'analog',
};

const STORAGE_KEY = 'valdor_touch_controls_layout_v2';

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
  // Config state with persistent storage
  const [config, setConfig] = useState<TouchLayoutConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_LAYOUT, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_LAYOUT;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Active dragging entity in edit mode: 'joystick' | 'actions' | null
  const [draggingEntity, setDraggingEntity] = useState<'joystick' | 'actions' | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialOffset: { x: number; y: number } }>({
    clientX: 0,
    clientY: 0,
    initialOffset: { x: 0, y: 0 },
  });

  // Movable Settings Window state
  const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const modalDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  // Movable Edit Mode Toolbar state
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const toolbarDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const handleModalHeaderPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDraggingModal(true);
    const defaultX = Math.max(16, (window.innerWidth - 420) / 2);
    const defaultY = Math.max(20, (window.innerHeight - 560) / 2);
    const currentX = modalPos ? modalPos.x : defaultX;
    const currentY = modalPos ? modalPos.y : defaultY;
    modalDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
    };
  };

  const handleModalHeaderPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingModal) return;
    const dx = e.clientX - modalDragRef.current.startX;
    const dy = e.clientY - modalDragRef.current.startY;
    const newX = Math.max(8, Math.min(window.innerWidth - 120, modalDragRef.current.initialX + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - 80, modalDragRef.current.initialY + dy));
    setModalPos({ x: newX, y: newY });
  };

  const handleModalHeaderPointerUp = (e: React.PointerEvent) => {
    if (isDraggingModal) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDraggingModal(false);
    }
  };

  const handleToolbarPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDraggingToolbar(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    toolbarDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: toolbarPos ? toolbarPos.x : rect.left,
      initialY: toolbarPos ? toolbarPos.y : rect.top,
    };
  };

  const handleToolbarPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingToolbar) return;
    const dx = e.clientX - toolbarDragRef.current.startX;
    const dy = e.clientY - toolbarDragRef.current.startY;
    const newX = Math.max(10, Math.min(window.innerWidth - 150, toolbarDragRef.current.initialX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - 60, toolbarDragRef.current.initialY + dy));
    setToolbarPos({ x: newX, y: newY });
  };

  const handleToolbarPointerUp = (e: React.PointerEvent) => {
    if (isDraggingToolbar) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDraggingToolbar(false);
    }
  };

  // Joystick game input state
  const [joystickActive, setJoystickActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  const baseRef = useRef<HTMLDivElement | null>(null);
  const touchIdRef = useRef<number | null>(null);
  const moveVectorRef = useRef<{ dx: number; dy: number; dir: 'up' | 'down' | 'left' | 'right' } | null>(null);
  const animLoopRef = useRef<number | null>(null);

  const JOYSTICK_MAX_RADIUS = 42;

  // Listen for global triggers to open settings or edit mode
  useEffect(() => {
    const handleOpenSettings = () => setShowSettingsModal(true);
    const handleStartEdit = () => setIsEditing(true);
    window.addEventListener('valdor:open-touch-settings', handleOpenSettings);
    window.addEventListener('valdor:edit-touch-layout', handleStartEdit);
    return () => {
      window.removeEventListener('valdor:open-touch-settings', handleOpenSettings);
      window.removeEventListener('valdor:edit-touch-layout', handleStartEdit);
    };
  }, []);

  // Save config changes to localStorage
  const updateConfig = useCallback((updater: Partial<TouchLayoutConfig> | ((prev: TouchLayoutConfig) => TouchLayoutConfig)) => {
    setConfig((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage full or unavailable
      }
      return next;
    });
  }, []);

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
    if (isEditing) return;
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
  }, [onMove, isEditing]);

  // Touch Handlers for Virtual Analog Joystick
  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isEditing) return;
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setJoystickActive(true);
    triggerHaptic(15);
    updateJoystickFromTouch(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isEditing) return;
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
    if (isEditing) return;
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
    if (isEditing) return;
    triggerHaptic(20);
    onMove(dx, dy, dir);
  };

  // Dragging logic for Move / Reposition in Edit Mode
  const startDrag = (entity: 'joystick' | 'actions', clientX: number, clientY: number) => {
    setDraggingEntity(entity);
    const initialOffset = entity === 'joystick' ? config.joystickOffset : config.actionsOffset;
    dragStartRef.current = {
      clientX,
      clientY,
      initialOffset: { ...initialOffset },
    };
    triggerHaptic(30);
  };

  const handlePointerDownDrag = (entity: 'joystick' | 'actions', e: React.PointerEvent) => {
    if (!isEditing) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startDrag(entity, e.clientX, e.clientY);
  };

  const handlePointerMoveDrag = (entity: 'joystick' | 'actions', e: React.PointerEvent) => {
    if (!isEditing || draggingEntity !== entity) return;
    e.stopPropagation();
    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = dragStartRef.current.clientY - e.clientY; // Invert Y because offset is from bottom

    // Clamp bounds so controls don't vanish off screen
    const maxBoundX = typeof window !== 'undefined' ? window.innerWidth - 80 : 600;
    const maxBoundY = typeof window !== 'undefined' ? window.innerHeight - 80 : 500;

    const rawNewX = dragStartRef.current.initialOffset.x + (entity === 'actions' ? -deltaX : deltaX);
    const rawNewY = dragStartRef.current.initialOffset.y + deltaY;

    const clampedX = Math.max(-100, Math.min(maxBoundX, rawNewX));
    const clampedY = Math.max(-40, Math.min(maxBoundY, rawNewY));

    updateConfig((prev) => ({
      ...prev,
      [entity === 'joystick' ? 'joystickOffset' : 'actionsOffset']: {
        x: clampedX,
        y: clampedY,
      },
    }));
  };

  const handlePointerUpDrag = (e: React.PointerEvent) => {
    if (draggingEntity) {
      setDraggingEntity(null);
      triggerHaptic(20);
    }
  };

  // Reset to Factory Defaults
  const handleReset = () => {
    updateConfig(DEFAULT_LAYOUT);
    triggerHaptic(40);
  };

  // Preset Layouts
  const applyPreset = (presetName: 'default' | 'raised' | 'mid' | 'compact' | 'swapped') => {
    triggerHaptic(25);
    if (presetName === 'default') {
      updateConfig({
        scale: 1.0,
        opacity: 0.9,
        joystickOffset: { x: 0, y: 0 },
        actionsOffset: { x: 0, y: 0 },
        swapSides: false,
      });
    } else if (presetName === 'raised') {
      // Raised up above home indicators / bottom navigation bars
      updateConfig({
        scale: 1.0,
        opacity: 0.9,
        joystickOffset: { x: 10, y: 55 },
        actionsOffset: { x: 10, y: 55 },
        swapSides: false,
      });
    } else if (presetName === 'mid') {
      // Tablet ergonomic mid-height thumb position
      updateConfig({
        scale: 1.15,
        opacity: 0.85,
        joystickOffset: { x: 15, y: 140 },
        actionsOffset: { x: 15, y: 140 },
        swapSides: false,
      });
    } else if (presetName === 'compact') {
      // Minimal compact footprint
      updateConfig({
        scale: 0.8,
        opacity: 0.75,
        joystickOffset: { x: 0, y: 0 },
        actionsOffset: { x: 0, y: 0 },
        swapSides: false,
      });
    } else if (presetName === 'swapped') {
      // Left-handed inverted
      updateConfig((prev) => ({
        ...prev,
        swapSides: !prev.swapSides,
      }));
    }
  };

  if (!visible) return null;

  // Calculate coordinates with swap support
  const isSwapped = config.swapSides;
  const joystickStyle: React.CSSProperties = {
    bottom: `${Math.max(10, 24 + config.joystickOffset.y)}px`,
    ...(isSwapped
      ? { right: `${Math.max(10, 24 + config.joystickOffset.x)}px` }
      : { left: `${Math.max(10, 24 + config.joystickOffset.x)}px` }),
    transform: `scale(${config.scale})`,
    transformOrigin: isSwapped ? 'bottom right' : 'bottom left',
    opacity: isEditing ? 1 : config.opacity,
    transition: draggingEntity === 'joystick' ? 'none' : 'transform 0.1s ease-out',
  };

  const actionsStyle: React.CSSProperties = {
    bottom: `${Math.max(10, 24 + config.actionsOffset.y)}px`,
    ...(isSwapped
      ? { left: `${Math.max(10, 24 + config.actionsOffset.x)}px` }
      : { right: `${Math.max(10, 24 + config.actionsOffset.x)}px` }),
    transform: `scale(${config.scale})`,
    transformOrigin: isSwapped ? 'bottom left' : 'bottom right',
    opacity: isEditing ? 1 : config.opacity,
    transition: draggingEntity === 'actions' ? 'none' : 'transform 0.1s ease-out',
  };

  return (
    <>
      {/* FULLSCREEN TOUCH LAYER */}
      <div className="pointer-events-none fixed inset-0 z-40 select-none overflow-hidden touch-none">
        {/* EDIT MODE TOP BANNER */}
        {isEditing && (
          <div className="pointer-events-auto absolute top-14 left-1/2 -translate-x-1/2 bg-amber-950/95 border-2 border-amber-400 text-amber-200 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-fade-in z-50">
            <Move className="w-5 h-5 text-amber-400 animate-bounce" />
            <div className="text-xs">
              <span className="font-bold text-white block">TOUCH CONTROLS EDIT MODE</span>
              <span className="text-[11px] text-amber-300">Drag pads to move them • Use bottom toolbar to resize & customize</span>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="ml-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
            >
              <Check className="w-3.5 h-3.5" /> Done
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* MOVEMENT CLUSTER (Virtual Joystick or D-Pad)            */}
        {/* ======================================================== */}
        <div
          style={joystickStyle}
          className={`absolute pointer-events-auto flex flex-col items-center select-none ${
            isEditing ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          onPointerDown={(e) => handlePointerDownDrag('joystick', e)}
          onPointerMove={(e) => handlePointerMoveDrag('joystick', e)}
          onPointerUp={handlePointerUpDrag}
          onPointerCancel={handlePointerUpDrag}
        >
          {/* Top Control Bar for Pad (Stick/D-pad Toggle + Settings / Edit icon) */}
          <div className="mb-2 flex items-center gap-1.5 z-20">
            {/* Toggle Mode (Analog vs D-Pad) */}
            <button
              onClick={() =>
                updateConfig((c) => ({
                  ...c,
                  mode: c.mode === 'analog' ? 'dpad' : 'analog',
                }))
              }
              className="px-2 py-0.5 text-[9px] font-mono font-bold bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-500/80 rounded shadow backdrop-blur transition"
              title="Switch between Analog Thumbstick and 4-Way D-Pad"
            >
              {config.mode === 'analog' ? 'STICK' : 'D-PAD'}
            </button>

            {/* Resize & Move Edit Mode Button */}
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className={`px-2 py-0.5 text-[9px] font-mono font-bold flex items-center gap-1 rounded border shadow backdrop-blur transition ${
                isEditing
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Move & Resize Touch Controls"
            >
              <Move className="w-2.5 h-2.5" />
              <span>{isEditing ? 'EXIT EDIT' : 'MOVE / RESIZE'}</span>
            </button>

            {/* Open Settings Modal Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 rounded shadow backdrop-blur"
              title="Touch Control Layout Settings & Sizing"
            >
              <Settings2 className="w-3 h-3" />
            </button>
          </div>

          {/* EDIT MODE DRAG BADGE */}
          {isEditing && (
            <div className="absolute -top-6 bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow flex items-center gap-1 animate-pulse z-30">
              <Move className="w-2.5 h-2.5" />
              <span>DRAG TO MOVE</span>
            </div>
          )}

          {/* Container outline when editing */}
          <div
            className={`transition-all rounded-3xl ${
              isEditing ? 'border-2 border-dashed border-amber-400 p-1.5 bg-amber-950/20' : ''
            }`}
          >
            {config.mode === 'analog' ? (
              // Analog Thumbstick
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
        </div>

        {/* ======================================================== */}
        {/* ACTION BUTTONS CLUSTER                                  */}
        {/* ======================================================== */}
        <div
          style={actionsStyle}
          className={`absolute pointer-events-auto flex flex-col items-end gap-2.5 select-none ${
            isEditing ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          onPointerDown={(e) => handlePointerDownDrag('actions', e)}
          onPointerMove={(e) => handlePointerMoveDrag('actions', e)}
          onPointerUp={handlePointerUpDrag}
          onPointerCancel={handlePointerUpDrag}
        >
          {/* EDIT MODE DRAG BADGE */}
          {isEditing && (
            <div className="self-center bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow flex items-center gap-1 animate-pulse z-30">
              <Move className="w-2.5 h-2.5" />
              <span>DRAG TO MOVE</span>
            </div>
          )}

          {/* Contextual Interact Button [USE / TALK / OPEN] */}
          {nearbyObject && !isEditing && (
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
          <div
            className={`relative w-44 h-44 bg-slate-950/60 backdrop-blur-md rounded-full border border-slate-800/80 p-2 shadow-2xl flex items-center justify-center ${
              isEditing ? 'border-2 border-dashed border-amber-400 bg-amber-950/20' : ''
            }`}
          >
            {/* Top: Thunder (⚡ 20 MP) */}
            <button
              onTouchStart={(e) => {
                if (isEditing) return;
                e.preventDefault();
                triggerHaptic(25);
                onAction('thunder');
              }}
              onClick={() => !isEditing && onAction('thunder')}
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
                if (isEditing) return;
                e.preventDefault();
                triggerHaptic(25);
                onAction('fireball');
              }}
              onClick={() => !isEditing && onAction('fireball')}
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
                if (isEditing) return;
                e.preventDefault();
                triggerHaptic(20);
                onAction('potion');
              }}
              onClick={() => !isEditing && onAction('potion')}
              className="absolute right-1.5 w-14 h-14 rounded-full bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200 active:bg-emerald-600 flex flex-col items-center justify-center text-xs font-bold transition active:scale-95 shadow-md"
            >
              <span className="text-lg">🧪</span>
              <span className="text-[9px] font-mono">+50 HP</span>
            </button>

            {/* Bottom / Center Primary: Strike (🗡️) */}
            <button
              onTouchStart={(e) => {
                if (isEditing) return;
                e.preventDefault();
                triggerHaptic(30);
                onAction('attack');
              }}
              onClick={() => !isEditing && onAction('attack')}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-amber-600 active:from-red-500 active:to-amber-500 border-2 border-amber-300 text-white flex flex-col items-center justify-center text-xs font-black transition active:scale-90 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            >
              <span className="text-2xl">🗡️</span>
              <span className="text-[10px] tracking-tight">STRIKE</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* EDIT MODE MOVABLE TOOLBAR                                */}
        {/* ======================================================== */}
        {isEditing && (
          <div
            onPointerDown={handleToolbarPointerDown}
            onPointerMove={handleToolbarPointerMove}
            onPointerUp={handleToolbarPointerUp}
            onPointerCancel={handleToolbarPointerUp}
            style={
              toolbarPos
                ? { left: `${toolbarPos.x}px`, top: `${toolbarPos.y}px` }
                : { left: '50%', bottom: '16px', transform: 'translateX(-50%)' }
            }
            className={`pointer-events-auto absolute bg-slate-950/95 border-2 border-amber-500 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-center gap-2.5 max-w-xl w-[92%] z-50 animate-fade-in ${
              isDraggingToolbar ? 'ring-2 ring-amber-400 cursor-grabbing shadow-[0_0_25px_rgba(245,158,11,0.5)]' : ''
            }`}
          >
            {/* Movable Toolbar Grab Handle */}
            <div
              className="cursor-grab active:cursor-grabbing flex items-center gap-1 px-1.5 py-1 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 rounded-lg text-amber-300 select-none"
              title="Click & drag to move this control edit bar anywhere on screen"
            >
              <GripVertical className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-mono font-bold tracking-tight">DRAG BAR</span>
            </div>

            {/* Scale / Size controls */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-slate-400">SIZE:</span>
              <button
                onClick={() => updateConfig((c) => ({ ...c, scale: Math.max(0.7, +(c.scale - 0.1).toFixed(1)) }))}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-sm"
                title="Decrease size"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold text-amber-400 w-11 text-center">
                {Math.round(config.scale * 100)}%
              </span>
              <button
                onClick={() => updateConfig((c) => ({ ...c, scale: Math.min(1.5, +(c.scale + 0.1).toFixed(1)) }))}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-sm"
                title="Increase size"
              >
                +
              </button>
            </div>

            {/* Quick Size Presets */}
            <div className="flex items-center gap-1">
              {[
                { label: 'S', val: 0.8 },
                { label: 'M', val: 1.0 },
                { label: 'L', val: 1.25 },
                { label: 'XL', val: 1.4 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => updateConfig({ scale: p.val })}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                    Math.abs(config.scale - p.val) < 0.05
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Opacity Slider */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-mono text-slate-400">OPACITY:</span>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={config.opacity}
                onChange={(e) => updateConfig({ opacity: parseFloat(e.target.value) })}
                className="w-16 accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-amber-400 w-8 text-right">
                {Math.round(config.opacity * 100)}%
              </span>
            </div>

            {/* Swap Sides (Left-Handed) */}
            <button
              onClick={() => updateConfig((c) => ({ ...c, swapSides: !c.swapSides }))}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1 transition ${
                config.swapSides
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Swap Left/Right Sides (Left-Handed Friendly)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[10px]">{config.swapSides ? 'SWAPPED' : 'SWAP'}</span>
            </button>

            {/* Reset to Default */}
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-red-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
              title="Reset Touch Controls to Factory Default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px]">RESET</span>
            </button>

            {/* Finish Editing */}
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl border border-emerald-400 flex items-center gap-1 shadow-lg transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>DONE</span>
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TOUCH CONTROLS MOVABLE CONFIGURATION & POSITIONING MODAL */}
      {/* ======================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 pointer-events-none select-none">
          {/* Gentle translucent backdrop so player can still see the world underneath */}
          <div
            onClick={() => setShowSettingsModal(false)}
            className="pointer-events-auto absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity cursor-pointer"
            title="Click outside to close"
          />

          <div
            style={
              modalPos
                ? { left: `${modalPos.x}px`, top: `${modalPos.y}px` }
                : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
            }
            className={`pointer-events-auto absolute bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500 rounded-2xl w-[92vw] max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col text-slate-200 transition-shadow ${
              isDraggingModal ? 'ring-2 ring-amber-400 cursor-grabbing shadow-[0_0_30px_rgba(245,158,11,0.6)]' : ''
            }`}
          >
            {/* Draggable Header */}
            <div
              onPointerDown={handleModalHeaderPointerDown}
              onPointerMove={handleModalHeaderPointerMove}
              onPointerUp={handleModalHeaderPointerUp}
              onPointerCancel={handleModalHeaderPointerUp}
              className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950/80 px-4 py-3 border-b border-amber-500/40 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
              title="Click and drag anywhere on this header to move the window"
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="w-5 h-5 text-amber-400/80" />
                <Smartphone className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-xs sm:text-sm text-white tracking-wide">
                  TOUCH CONTROLS SETTINGS
                </h3>
                <span className="text-[10px] font-mono text-amber-300/80 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                  DRAGGABLE
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {modalPos && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalPos(null);
                    }}
                    className="text-[10px] text-amber-300 hover:text-white px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 rounded border border-slate-700 transition"
                    title="Center window on screen"
                  >
                    Center
                  </button>
                )}
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
                  title="Close settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto font-sans">
              {/* Interactive Drag to Move CTA */}
              <div className="bg-amber-950/50 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Move className="w-4 h-4 text-amber-400" />
                    <span>Free Drag & Drop Repositioning</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Drag the joystick & combat buttons anywhere on screen.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    setIsEditing(true);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow transition active:scale-95"
                >
                  START DRAG
                </button>
              </div>

              {/* Sizing Section */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Controls Sizing / Scale</span>
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{Math.round(config.scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  value={config.scale}
                  onChange={(e) => updateConfig({ scale: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { label: 'Small (80%)', val: 0.8 },
                    { label: 'Normal (100%)', val: 1.0 },
                    { label: 'Large (120%)', val: 1.2 },
                    { label: 'Jumbo (140%)', val: 1.4 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => updateConfig({ scale: preset.val })}
                      className={`py-1 text-[10px] font-bold rounded border transition ${
                        Math.abs(config.scale - preset.val) < 0.05
                          ? 'bg-amber-500 text-slate-950 border-amber-300'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>HUD Transparency / Opacity</span>
                  </span>
                  <span className="font-mono text-sky-400 font-bold">{Math.round(config.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={config.opacity}
                  onChange={(e) => updateConfig({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Ghostly (20%)</span>
                  <span>Balanced (70%)</span>
                  <span>Solid (100%)</span>
                </div>
              </div>

              {/* Positioning Offsets */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Fine Position Offsets</span>
                  </span>
                  <button
                    onClick={() =>
                      updateConfig({
                        joystickOffset: { x: 0, y: 0 },
                        actionsOffset: { x: 0, y: 0 },
                      })
                    }
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Reset Offsets
                  </button>
                </div>

                {/* Joystick Vertical Offset */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Movement Pad Height (from bottom):</span>
                    <span className="font-mono text-amber-300">{config.joystickOffset.y}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={config.joystickOffset.y}
                    onChange={(e) =>
                      updateConfig((c) => ({
                        ...c,
                        joystickOffset: { ...c.joystickOffset, y: parseInt(e.target.value) },
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Actions Vertical Offset */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Action Buttons Height (from bottom):</span>
                    <span className="font-mono text-amber-300">{config.actionsOffset.y}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={config.actionsOffset.y}
                    onChange={(e) =>
                      updateConfig((c) => ({
                        ...c,
                        actionsOffset: { ...c.actionsOffset, y: parseInt(e.target.value) },
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Hand Orientation & Layout Presets */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-slate-300">Quick Layout Presets</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => applyPreset('default')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-left transition"
                  >
                    <div className="font-bold text-amber-300">Default Corners</div>
                    <div className="text-[10px] text-slate-400">Standard bottom placement</div>
                  </button>
                  <button
                    onClick={() => applyPreset('raised')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-left transition"
                  >
                    <div className="font-bold text-cyan-300">Raised (Phone Bar)</div>
                    <div className="text-[10px] text-slate-400">+55px above home line</div>
                  </button>
                  <button
                    onClick={() => applyPreset('mid')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-left transition"
                  >
                    <div className="font-bold text-emerald-300">Tablet Mid-Screen</div>
                    <div className="text-[10px] text-slate-400">Higher ergonomic grip</div>
                  </button>
                  <button
                    onClick={() => applyPreset('swapped')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-left transition"
                  >
                    <div className="font-bold text-purple-300">Left-Handed</div>
                    <div className="text-[10px] text-slate-400">
                      {config.swapSides ? 'Currently Active' : 'Swap movement to right'}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-red-300 hover:text-red-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
