/**
 * Ruins of Valdor - Full-Stack Web RPG
 *
 * Actively integrates:
 * 1. HTML & CSS: UI HUD, Battle Arena, pixel-art health bars, CRT scanlines
 * 2. JavaScript: Client game loop, DOMParser XML extraction, Web Audio synth
 * 3. XML: enemies.xml bestiary configuration (38 monsters)
 * 4. Database: Persistent SQLite (rpg.db) for player stats and inventory
 * 5. C++: Native REST API server for combat roll verification & DB transactions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { BattleArena } from './components/BattleArena';
import { TechInspectorModal } from './components/TechInspectorModal';
import { InventoryModal } from './components/InventoryModal';
import { CharacterCreationModal } from './components/CharacterCreationModal';
import {
  Player,
  Monster,
  CombatLogEntry,
  FloatingText,
  CppTelemetry,
  GameScreen,
  InventoryItem,
  StatusEffects,
  RewardPreview,
} from './types/rpg';
import { parseBestiaryXML } from './utils/xmlParser';
import { sound } from './utils/audio';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [player, setPlayer] = useState<Player>({
    id: 1,
    name: 'Valen the Brave',
    class: 'Rune Knight',
    styleId: 'knight',
    sprite: '🛡️',
    level: 1,
    hp: 100,
    maxHp: 100,
    mana: 50,
    maxMana: 50,
    gold: 25,
    xp: 0,
    wins: 0,
    deaths: 0,
    source: 'Loading...',
  });

  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [currentEnemy, setCurrentEnemy] = useState<Monster | null>(null);
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [statusEffects, setStatusEffects] = useState<StatusEffects>({
    poisonTurns: 0,
    burnTurns: 0,
  });
  const [rewardPreview, setRewardPreview] = useState<RewardPreview | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [cppStats, setCppStats] = useState<CppTelemetry | null>(null);

  // Modals & settings
  const [isCharacterCreationOpen, setIsCharacterCreationOpen] = useState(false);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(true);

  const addLog = useCallback(
    (text: string, type: CombatLogEntry['type'] = 'info') => {
      const entry: CombatLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        text,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      };
      setLogs((prev) => [...prev.slice(-40), entry]);
    },
    []
  );

  const spawnFloatingText = useCallback(
    (text: string, target: 'player' | 'enemy', type: FloatingText['type'] = 'damage') => {
      const id = Math.random().toString(36).substring(2, 9);
      setFloatingTexts((prev) => [...prev, { id, text, target, type }]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, 1000);
    },
    []
  );

  // 1. Fetch Player from SQLite via C++ API
  const loadPlayer = useCallback(async () => {
    try {
      const res = await fetch('/api/player');
      if (res.ok) {
        const data = await res.json();
        setPlayer((prev) => ({
          ...prev,
          id: data.id || prev.id,
          name: data.name || prev.name,
          class: data.class || prev.class,
          styleId: data.styleId || prev.styleId || 'knight',
          sprite: data.sprite || prev.sprite || '🛡️',
          level: data.level || prev.level,
          hp: data.hp ?? prev.hp,
          maxHp: data.maxHp ?? prev.maxHp,
          mana: data.mana ?? prev.mana,
          maxMana: data.maxMana ?? prev.maxMana,
          gold: data.gold ?? prev.gold,
          xp: data.xp ?? prev.xp,
          wins: data.wins ?? prev.wins,
          deaths: data.deaths ?? prev.deaths,
          source: data.source || 'SQLite3 (rpg.db)',
        }));
        addLog('Loaded player hero profile from persistent SQLite via C++ backend.', 'db_save');
      }
    } catch {
      addLog('C++ backend unreachable, continuing with memory state.', 'info');
    }
  }, [addLog]);

  // 2. Fetch and parse enemies.xml with DOMParser
  const loadMonstersFromXML = useCallback(async () => {
    try {
      const res = await fetch('/api/xml/bestiary');
      if (!res.ok) throw new Error('XML endpoint returned status ' + res.status);
      const xmlText = await res.text();
      const parsed = parseBestiaryXML(xmlText);
      setMonsters(parsed);
      addLog(`Extracted ${parsed.length} monster archetypes from enemies.xml via DOMParser.`, 'info');

      // Pick random enemy
      if (parsed.length > 0) {
        const randomMob = parsed[Math.floor(Math.random() * parsed.length)];
        setCurrentEnemy({ ...randomMob, hp: randomMob.maxHp, isDefending: false });
      }
    } catch (err: any) {
      addLog(`Failed to parse XML: ${err.message}`, 'info');
    }
  }, [addLog]);

  // 3. Save Game State to SQLite via C++ POST
  const saveGame = useCallback(
    async (overridePlayer?: Partial<Player>) => {
      const p = { ...player, ...overridePlayer };
      try {
        const payload = `name=${encodeURIComponent(p.name)}&class=${encodeURIComponent(
          p.class
        )}&styleId=${encodeURIComponent(p.styleId || 'knight')}&sprite=${encodeURIComponent(
          p.sprite || '🛡️'
        )}&hp=${p.hp}&maxHp=${p.maxHp}&mana=${p.mana}&maxMana=${p.maxMana}&gold=${p.gold}&xp=${
          p.xp
        }&level=${p.level}&wins=${p.wins}&deaths=${p.deaths}`;

        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload,
        });
        if (res.ok) {
          sound.playClick();
          addLog('Game state successfully saved to SQLite database via C++ backend!', 'db_save');
          spawnFloatingText('SAVED TO DB', 'player', 'mana');
        }
      } catch {
        addLog('Failed to persist to SQLite backend.', 'info');
      }
    },
    [player, addLog, spawnFloatingText]
  );

  // 4. Fetch C++ Telemetry
  const fetchCppTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/cpp/status');
      if (res.ok) {
        const data = await res.json();
        setCppStats(data);
      }
    } catch {}
  }, []);

  // Initial load
  useEffect(() => {
    loadPlayer();
    loadMonstersFromXML();
    fetchCppTelemetry();
    const interval = setInterval(fetchCppTelemetry, 5000);
    return () => clearInterval(interval);
  }, [loadPlayer, loadMonstersFromXML, fetchCppTelemetry]);

  // Spawn enemy helper
  const spawnNewEnemy = useCallback(() => {
    if (monsters.length === 0) return;
    const template = monsters[Math.floor(Math.random() * monsters.length)];
    const newEnemy = { ...template, hp: template.maxHp, isDefending: false };
    setCurrentEnemy(newEnemy);
    addLog(
      `A wild ${newEnemy.name} (${newEnemy.element}) emerges! Special: [${newEnemy.specialAbility}]`,
      'info'
    );
  }, [monsters, addLog]);

  // Combat Action Execution through C++ REST API
  const handleCombatAction = useCallback(
    async (action: 'attack' | 'fireball' | 'thunder' | 'potion') => {
      if (isActing || !currentEnemy || currentEnemy.hp <= 0) return;
      setIsActing(true);

      // Play initiation sound
      if (action === 'attack') sound.playSlash();
      else if (action === 'fireball') sound.playFireball();
      else if (action === 'thunder') sound.playThunder();
      else if (action === 'potion') sound.playPotion();

      try {
        const payload = `action=${action}&monsterName=${encodeURIComponent(
          currentEnemy.name
        )}&monsterAbility=${encodeURIComponent(
          currentEnemy.specialAbility || 'none'
        )}&isEnemyDefending=${currentEnemy.isDefending ? 'true' : 'false'}&playerHp=${
          player.hp
        }&playerMaxHp=${player.maxHp}&playerMana=${player.mana}&enemyHp=${
          currentEnemy.hp
        }&enemyMaxHp=${currentEnemy.maxHp}&enemyAtk=${currentEnemy.atk}`;

        const res = await fetch('/api/combat/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload,
        });

        if (res.ok) {
          const result = await res.json();

          // Defensive stance absorption notification
          if (result.damageMitigated) {
            spawnFloatingText('BLOCKED (-50%)', 'enemy', 'defense');
            addLog(`🛡️ ${currentEnemy.name}'s Defensive Stance absorbed 50% damage!`, 'defensive_stance');
          }

          // Sound and floating text for player action
          if (result.critical) {
            sound.playCrit();
            spawnFloatingText(`CRITICAL! -${result.damageDealt}`, 'enemy', 'crit');
            addLog(`CRITICAL HIT! You strike ${currentEnemy.name} for ${result.damageDealt} DMG!`, 'crit');
          } else if (result.healAmount > 0) {
            spawnFloatingText(`+${result.healAmount} HP`, 'player', 'heal');
            addLog(`Quaffed Crimson Potion! Restored ${result.healAmount} HP and purified toxins.`, 'heal');
            // Potion cures poison and burn!
            setStatusEffects({ poisonTurns: 0, burnTurns: 0 });
          } else if (result.damageDealt > 0) {
            spawnFloatingText(`-${result.damageDealt}`, 'enemy', 'damage');
            addLog(`You strike ${currentEnemy.name} for ${result.damageDealt} DMG.`, 'player_atk');
          }

          addLog(`[C++ Roll #${result.calculationId}]: ${result.engineMessage}`, 'cpp_engine');

          // Handle special monster abilities returned by C++ verification
          let nextEnemyDefending = false;
          if (result.enterDefensiveStance) {
            nextEnemyDefending = true;
            addLog(`🛡️ ${currentEnemy.name} enters an impenetrable Defensive Stance! Incoming damage halved next turn.`, 'defensive_stance');
            spawnFloatingText('DEFENSIVE STANCE', 'enemy', 'defense');
          }

          if (result.poisonInflicted) {
            setStatusEffects((prev) => ({ ...prev, poisonTurns: 3 }));
            spawnFloatingText('POISONED!', 'player', 'poison');
            addLog(`🤢 ${currentEnemy.name} delivered virulent poison! You will suffer damage over time.`, 'poison');
          }

          if (result.abilityTriggered === 'burn') {
            setStatusEffects((prev) => ({ ...prev, burnTurns: 2 }));
            spawnFloatingText('BURNING!', 'player', 'damage');
            addLog(`🔥 ${currentEnemy.name} ignited your armor! Suffering burn damage.`, 'burn');
          }

          if (result.lifeDrained > 0) {
            spawnFloatingText(`+${result.lifeDrained} HP`, 'enemy', 'heal');
            addLog(`🩸 ${currentEnemy.name} siphoned lifeforce and restored +${result.lifeDrained} HP!`, 'heal');
          }

          // Update enemy state
          setCurrentEnemy((prev) =>
            prev ? { ...prev, hp: result.enemyHp, isDefending: nextEnemyDefending } : null
          );

          // Update player HP & Mana from C++ roll
          let updatedPlayerHp = result.playerHp;
          setPlayer((prev) => ({
            ...prev,
            hp: updatedPlayerHp,
            mana: result.playerMana,
          }));

          // Enemy defeated check
          if (result.enemyHp <= 0) {
            sound.playVictory();
            setStatusEffects({ poisonTurns: 0, burnTurns: 0 }); // Cleanse on victory

            const xpGained = currentEnemy.expReward || 35;
            const goldGained = currentEnemy.gold || 20;

            const nextXp = player.xp + xpGained;
            const nextGold = player.gold + goldGained;
            const nextWins = player.wins + 1;
            let nextLevel = player.level;
            let nextMaxHp = player.maxHp;
            let nextHp = updatedPlayerHp;
            let nextMaxMana = player.maxMana;
            let nextMana = result.playerMana;
            const didLevelUp = nextXp >= nextLevel * 100;

            if (didLevelUp) {
              nextLevel += 1;
              nextMaxHp += 20;
              nextHp = nextMaxHp;
              nextMaxMana += 10;
              nextMana = nextMaxMana;
              addLog(`⭐ LEVEL UP! ${player.name} is now Level ${nextLevel}! Stats enhanced.`, 'heal');
            }

            // Trigger reward preview floating animation inside log window
            setRewardPreview({
              id: Math.random().toString(36).substring(2, 9),
              gold: goldGained,
              xp: xpGained,
              monsterName: currentEnemy.name,
              isLevelUp: didLevelUp,
              newLevel: didLevelUp ? nextLevel : undefined,
            });

            setTimeout(() => {
              setRewardPreview(null);
            }, 2600);

            addLog(
              `🏆 Defeated ${currentEnemy.name}! Gained +${goldGained} Gold and +${xpGained} XP.`,
              'victory'
            );

            const updatedPlayer = {
              ...player,
              hp: nextHp,
              maxHp: nextMaxHp,
              mana: nextMana,
              maxMana: nextMaxMana,
              gold: nextGold,
              xp: nextXp,
              level: nextLevel,
              wins: nextWins,
            };

            setPlayer(updatedPlayer);
            saveGame(updatedPlayer);
            fetchCppTelemetry();

            setTimeout(() => {
              spawnNewEnemy();
              setIsActing(false);
            }, 1200);
            return;
          }

          // Retaliation and Status Damage processing
          setTimeout(() => {
            if (result.damageTaken > 0) {
              sound.playEnemyHit();
              spawnFloatingText(`-${result.damageTaken}`, 'player', 'damage');
              addLog(`${currentEnemy.name} retaliates for ${result.damageTaken} DMG!`, 'enemy_atk');
            }

            // Process Poison & Burn damage tick
            setStatusEffects((prev) => {
              let nextHp = updatedPlayerHp;
              let newPoison = prev.poisonTurns;
              let newBurn = prev.burnTurns;

              if (newPoison > 0) {
                const poisonDmg = 6;
                nextHp = Math.max(0, nextHp - poisonDmg);
                spawnFloatingText(`-${poisonDmg} POISON`, 'player', 'poison');
                addLog(`🤢 Poison ticks for -${poisonDmg} HP! (${newPoison - 1} turns left)`, 'poison');
                newPoison -= 1;
              }

              if (newBurn > 0) {
                const burnDmg = 7;
                nextHp = Math.max(0, nextHp - burnDmg);
                spawnFloatingText(`-${burnDmg} BURN`, 'player', 'damage');
                addLog(`🔥 Burn ticks for -${burnDmg} HP! (${newBurn - 1} turns left)`, 'burn');
                newBurn -= 1;
              }

              if (nextHp !== updatedPlayerHp) {
                setPlayer((p) => ({ ...p, hp: nextHp }));
              }

              // Check if hero succumbed
              if (nextHp <= 0) {
                sound.playDefeat();
                addLog('💀 You succumbed to wounds and status toxins! Reviving at campfire...', 'defeat');
                const defeatPlayer = {
                  ...player,
                  hp: player.maxHp,
                  mana: player.maxMana,
                  deaths: player.deaths + 1,
                  gold: Math.max(0, player.gold - 10),
                };
                setPlayer(defeatPlayer);
                saveGame(defeatPlayer);

                setTimeout(() => {
                  spawnNewEnemy();
                  setIsActing(false);
                }, 1500);
              } else {
                setIsActing(false);
              }

              return { poisonTurns: newPoison, burnTurns: newBurn };
            });
          }, 450);
        }
      } catch (err: any) {
        addLog(`Network combat error: ${err.message}`, 'info');
        setIsActing(false);
      }
    },
    [isActing, currentEnemy, player, spawnFloatingText, addLog, saveGame, fetchCppTelemetry, spawnNewEnemy]
  );

  // Campfire Rest
  const handleFlee = useCallback(() => {
    sound.playPotion();
    setStatusEffects({ poisonTurns: 0, burnTurns: 0 });
    setPlayer((prev) => ({
      ...prev,
      hp: prev.maxHp,
      mana: prev.maxMana,
    }));
    addLog('Rested at the sacred campfire. HP, Mana, and status ailments fully restored.', 'heal');
    spawnFloatingText('RESTED', 'player', 'heal');
    spawnNewEnemy();
  }, [addLog, spawnFloatingText, spawnNewEnemy]);

  // Character Created Handler
  const handleCharacterCreated = useCallback(
    (newPlayer: Player) => {
      setPlayer(newPlayer);
      setStatusEffects({ poisonTurns: 0, burnTurns: 0 });
      setIsCharacterCreationOpen(false);
      setScreen('PLAYING');
      addLog(`Forged new hero profile: ${newPlayer.name} (${newPlayer.class}) persisted in SQLite.`, 'db_save');
      spawnNewEnemy();
    },
    [addLog, spawnNewEnemy]
  );

  // Use inventory item
  const handleUseItem = useCallback(
    (item: InventoryItem) => {
      if (item.type === 'potion') {
        setStatusEffects({ poisonTurns: 0, burnTurns: 0 });
        setPlayer((prev) => ({
          ...prev,
          hp: Math.min(prev.maxHp, prev.hp + item.power),
        }));
        spawnFloatingText(`+${item.power} HP`, 'player', 'heal');
        addLog(`Drank ${item.name}! Restored ${item.power} HP and cured all status ailments.`, 'heal');
      }
    },
    [spawnFloatingText, addLog]
  );

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    sound.muted = !sound.muted;
    setIsMuted(sound.muted);
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        setIsCharacterCreationOpen(true);
      }

      if (screen === 'PLAYING') {
        if (e.key === '1') handleCombatAction('attack');
        else if (e.key === '2') handleCombatAction('fireball');
        else if (e.key === '3') handleCombatAction('thunder');
        else if (e.key === '4') handleCombatAction('potion');
        else if (e.key === 's' || e.key === 'S') saveGame();
        else if (e.key === 'f' || e.key === 'F') handleFlee();
        else if (e.key === 't' || e.key === 'T') setIsTechModalOpen((prev) => !prev);
        else if (e.key === 'b' || e.key === 'B') setIsInventoryOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, handleCombatAction, saveGame, handleFlee]);

  return (
    <div className="w-full min-h-screen bg-slate-950 font-mono">
      {screen === 'TITLE' ? (
        <TitleScreen
          onStart={() => setScreen('PLAYING')}
          player={player}
          onOpenCharacterCreation={() => setIsCharacterCreationOpen(true)}
          onOpenTechModal={() => setIsTechModalOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      ) : (
        <BattleArena
          player={player}
          enemy={currentEnemy}
          logs={logs}
          floatingTexts={floatingTexts}
          statusEffects={statusEffects}
          rewardPreview={rewardPreview}
          isActing={isActing}
          cppStats={cppStats}
          onAction={handleCombatAction}
          onSave={() => saveGame()}
          onFlee={handleFlee}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onOpenCharacterCreation={() => setIsCharacterCreationOpen(true)}
          onOpenTechModal={() => setIsTechModalOpen(true)}
          onReturnTitle={() => setScreen('TITLE')}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          crtEnabled={crtEnabled}
          onToggleCrt={() => setCrtEnabled(!crtEnabled)}
        />
      )}

      {/* Character Creation Modal */}
      <CharacterCreationModal
        isOpen={isCharacterCreationOpen}
        onClose={() => setIsCharacterCreationOpen(false)}
        onCharacterCreated={handleCharacterCreated}
        currentPlayer={player}
      />

      {/* 6-Tech Architecture Console Modal */}
      <TechInspectorModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        onReloadXml={loadMonstersFromXML}
      />

      {/* SQLite Inventory Modal */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        onUseItem={handleUseItem}
      />
    </div>
  );
}
