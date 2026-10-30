import { useEffect, useRef, useState, useCallback } from 'react';

export interface GamepadState {
  connected: boolean;
  id: string;
  isXbox: boolean;
}

interface UseGamepadOptions {
  onMove: (dx: number, dy: number, direction: 'up' | 'down' | 'left' | 'right') => void;
  onAction: (action: 'attack' | 'fireball' | 'thunder' | 'potion') => void;
  onInteract: () => void;
  onCycleTarget?: () => void;
  onToggleInventory: () => void;
  onToggleTech: () => void;
  enabled?: boolean;
}

export function useGamepad({
  onMove,
  onAction,
  onInteract,
  onCycleTarget,
  onToggleInventory,
  onToggleTech,
  enabled = true,
}: UseGamepadOptions) {
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    connected: false,
    id: '',
    isXbox: false,
  });

  // Track button states for edge triggering (pressed this frame, not held)
  const prevButtonsRef = useRef<boolean[]>([]);
  const lastMoveTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Vibrate / haptic feedback
  const triggerRumble = useCallback((durationMs = 120, weakMagnitude = 0.5, strongMagnitude = 0.5) => {
    try {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (gp && gp.vibrationActuator) {
          gp.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: durationMs,
            weakMagnitude,
            strongMagnitude,
          }).catch(() => {});
        }
      }
    } catch {
      // Ignore if not supported
    }
  }, []);

  useEffect(() => {
    const handleConnected = (e: GamepadEvent) => {
      const id = e.gamepad.id;
      const isXbox = /xbox|x-box|microsoft|xinput/i.test(id) || e.gamepad.mapping === 'standard';
      setGamepadState({
        connected: true,
        id,
        isXbox,
      });
      triggerRumble(150, 0.4, 0.4);
    };

    const handleDisconnected = () => {
      // Check if any other gamepad is still connected
      const gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      if (gamepads.length === 0) {
        setGamepadState({ connected: false, id: '', isXbox: false });
      } else {
        const first = gamepads[0]!;
        const isXbox = /xbox|x-box|microsoft|xinput/i.test(first.id) || first.mapping === 'standard';
        setGamepadState({ connected: true, id: first.id, isXbox });
      }
    };

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    // Initial check
    const initialGps = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    if (initialGps.length > 0) {
      const first = initialGps[0]!;
      const isXbox = /xbox|x-box|microsoft|xinput/i.test(first.id) || first.mapping === 'standard';
      setGamepadState({ connected: true, id: first.id, isXbox });
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
    };
  }, [triggerRumble]);

  useEffect(() => {
    if (!enabled) return;

    const DEADZONE = 0.18;
    const MOVE_COOLDOWN = 110; // ms between movement steps when stick is tilted

    const pollGamepad = (now: number) => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads.find((g) => g && g.connected);

      if (gp) {
        if (!gamepadState.connected) {
          const isXbox = /xbox|x-box|microsoft|xinput/i.test(gp.id) || gp.mapping === 'standard';
          setGamepadState({ connected: true, id: gp.id, isXbox });
        }

        // Axes: 0 = Left Stick X, 1 = Left Stick Y
        let axisX = gp.axes[0] ?? 0;
        let axisY = gp.axes[1] ?? 0;

        // Apply deadzone
        if (Math.abs(axisX) < DEADZONE) axisX = 0;
        if (Math.abs(axisY) < DEADZONE) axisY = 0;

        // Standard D-Pad buttons: 12 = Up, 13 = Down, 14 = Left, 15 = Right
        const dpadUp = gp.buttons[12]?.pressed ?? false;
        const dpadDown = gp.buttons[13]?.pressed ?? false;
        const dpadLeft = gp.buttons[14]?.pressed ?? false;
        const dpadRight = gp.buttons[15]?.pressed ?? false;

        if (dpadUp) axisY = -1;
        if (dpadDown) axisY = 1;
        if (dpadLeft) axisX = -1;
        if (dpadRight) axisX = 1;

        // Analog or D-pad movement
        const hasMovement = Math.abs(axisX) > 0 || Math.abs(axisY) > 0;
        if (hasMovement && now - lastMoveTimeRef.current > MOVE_COOLDOWN) {
          lastMoveTimeRef.current = now;

          // Normalize & determine primary direction
          let dir: 'up' | 'down' | 'left' | 'right' = 'down';
          if (Math.abs(axisX) > Math.abs(axisY)) {
            dir = axisX > 0 ? 'right' : 'left';
          } else {
            dir = axisY > 0 ? 'down' : 'up';
          }

          const speed = 0.42;
          const mag = Math.hypot(axisX, axisY);
          const nx = (axisX / (mag || 1)) * speed;
          const ny = (axisY / (mag || 1)) * speed;

          onMove(nx, ny, dir);
        }

        // Standard Xbox / Gamepad buttons:
        // 0: A (Bottom) -> Strike / Primary Attack
        // 1: B (Right)  -> Crimson Potion
        // 2: X (Left)   -> Fireball Spell
        // 3: Y (Top)    -> Thunder Spell
        // 4: LB (Left Bumper) -> Cycle Target
        // 5: RB (Right Bumper) -> Interact
        // 6: LT (Left Trigger)
        // 7: RT (Right Trigger) -> Interact / Strike
        // 8: Back / View -> Tech Modal
        // 9: Start / Menu -> Inventory
        const isPressed = (index: number) => {
          const btn = gp.buttons[index];
          return typeof btn === 'object' ? btn.pressed : btn === 1.0;
        };

        const prev = prevButtonsRef.current;
        const justPressed = (index: number) => isPressed(index) && !prev[index];

        if (justPressed(0)) {
          // A button: Primary Strike
          onAction('attack');
          triggerRumble(60, 0.3, 0.4);
        } else if (justPressed(1)) {
          // B button: Crimson Potion
          onAction('potion');
          triggerRumble(80, 0.2, 0.5);
        } else if (justPressed(2)) {
          // X button: Fireball
          onAction('fireball');
          triggerRumble(100, 0.5, 0.6);
        } else if (justPressed(3)) {
          // Y button: Thunder
          onAction('thunder');
          triggerRumble(120, 0.7, 0.8);
        }

        // RB or RT: Interact
        if (justPressed(5) || justPressed(7)) {
          onInteract();
          triggerRumble(50, 0.3, 0.3);
        }

        // LB: Cycle Target
        if (justPressed(4)) {
          onCycleTarget?.();
          triggerRumble(40, 0.2, 0.2);
        }

        // Start button: Toggle Inventory
        if (justPressed(9)) {
          onToggleInventory();
        }

        // Back / View button: Toggle Tech Inspector
        if (justPressed(8)) {
          onToggleTech();
        }

        // Store current buttons for edge trigger detection
        prevButtonsRef.current = gp.buttons.map((b) => (typeof b === 'object' ? b.pressed : b === 1.0));
      }

      animFrameRef.current = requestAnimationFrame(pollGamepad);
    };

    animFrameRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    enabled,
    gamepadState.connected,
    onMove,
    onAction,
    onInteract,
    onCycleTarget,
    onToggleInventory,
    onToggleTech,
    triggerRumble,
  ]);

  return {
    gamepadState,
    triggerRumble,
  };
}
