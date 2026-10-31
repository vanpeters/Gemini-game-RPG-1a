/**
 * Ruins of Valdor - Open World Client-Side RPG with LAN Multiplayer
 *
 * Technologies:
 * 1. HTML & CSS: Retro HUD, pixel health bars, CRT scanline shader, modal dialogs
 * 2. JavaScript / TypeScript: 60 FPS Canvas 2D engine, game loop, Web Audio synth
 * 3. XML Bestiary: 38 monster definitions loaded from enemies.xml via native DOMParser
 * 4. Relational Database: Client-side persistent storage and relational SQL table schema
 * 5. LAN Multiplayer: Real-time peer-to-peer sync via BroadcastChannel & WebRTC DataChannels
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { OpenWorldCanvas } from './components/OpenWorldCanvas';
import { OpenWorldHUD } from './components/OpenWorldHUD';
import { LanMultiplayerModal } from './components/LanMultiplayerModal';
import { CharacterCreationModal } from './components/CharacterCreationModal';
import { TechInspectorModal } from './components/TechInspectorModal';
import { InventoryModal } from './components/InventoryModal';
import { WorldNPCModal } from './components/WorldNPCModal';
import { TouchControls } from './components/TouchControls';
import { QuestLogModal } from './components/QuestLogModal';
import { RealmTravelModal } from './components/RealmTravelModal';
import { PvpArenaModal, GladiatorChampion } from './components/PvpArenaModal';
import { SaveDataModal } from './components/SaveDataModal';
import { useGamepad } from './hooks/useGamepad';
import {
  Player,
  Monster,
  WorldMonster,
  WorldObject,
  NetworkPeer,
  Projectile,
  WorldLootDrop,
  CombatLogEntry,
  FloatingText,
  StatusEffects,
  RewardPreview,
  InventoryItem,
  GameScreen,
  Quest,
  QuestObjective,
  EquipmentSlot,
  CombatAction,
} from './types/rpg';
import {
  generateOpenWorld,
  generateRealmWorld,
  isTileCollidable,
  spawnOpenWorldMonsters,
  spawnRealmMonsters,
  TILE_SIZE,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  getBiomeAt,
  WorldMapData,
} from './utils/worldGenerator';
import { parseBestiaryXML } from './utils/xmlParser';
import { calculateCombatAction } from './utils/combatEngine';
import { sound } from './utils/audio';
import {
  loadSavedPlayer,
  savePlayerToStorage,
  loadSavedWorldObjects,
  saveWorldObjectsState,
  loadSavedInventory,
  saveInventoryToStorage,
} from './utils/storage';
import { revealFogOfWar, getInitialExploredTiles } from './utils/fogOfWar';
import { getRealmById, getPvPRank } from './utils/realmsData';
import { equipItemToPlayer, unequipItemFromPlayer } from './utils/equipment';
import {
  unlockOrUpgradeSkill,
  respecSkillPoints,
  getSkillRankInfo,
} from './utils/skillData';
import { lanMultiplayer } from './services/lanMultiplayer';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [player, setPlayer] = useState<Player>(loadSavedPlayer);
  const playerRef = useRef<Player>(player);
  playerRef.current = player;

  // World Data & Realm System (1 of 12 Worlds)
  const [currentRealmId, setCurrentRealmId] = useState<number>(() => player.currentRealmId || 1);
  const [worldMap, setWorldMap] = useState<WorldMapData>(() =>
    generateRealmWorld(player.currentRealmId || 1)
  );
  const [objects, setObjects] = useState<WorldObject[]>(() =>
    loadSavedWorldObjects(worldMap.objects)
  );
  const [bestiary, setBestiary] = useState<Monster[]>([]);
  const [mobs, setMobs] = useState<WorldMonster[]>([]);
  const mobsRef = useRef<WorldMonster[]>(mobs);
  mobsRef.current = mobs;

  // Combat & Entities
  const [targetEnemy, setTargetEnemy] = useState<WorldMonster | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [lootDrops, setLootDrops] = useState<WorldLootDrop[]>([]);
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [statusEffects, setStatusEffects] = useState<StatusEffects>({
    poisonTurns: 0,
    burnTurns: 0,
  });
  const [rewardPreview, setRewardPreview] = useState<RewardPreview | null>(null);

  // LAN Multiplayer State
  const [peers, setPeers] = useState<NetworkPeer[]>([]);
  const [roomCode, setRoomCode] = useState<string>('VALDOR-LAN');
  const [isHost, setIsHost] = useState<boolean>(true);
  const [ping, setPing] = useState<number>(2);

  // Modals & UI
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState(false);
  const [isCharacterCreationOpen, setIsCharacterCreationOpen] = useState(false);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [isRealmTravelOpen, setIsRealmTravelOpen] = useState(false);
  const [isPvpArenaOpen, setIsPvpArenaOpen] = useState(false);
  const [isSaveDataOpen, setIsSaveDataOpen] = useState(false);
  const [activeNpcObject, setActiveNpcObject] = useState<WorldObject | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [touchControlsEnabled, setTouchControlsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
    );
  });
  const triggerRumbleRef = useRef<(duration?: number, weak?: number, strong?: number) => void>(() => {});

  // Logging Helper
  const addLog = useCallback(
    (text: string, type: CombatLogEntry['type'] = 'info', sender?: string) => {
      const entry: CombatLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        text,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        sender,
      };
      setLogs((prev) => [...prev.slice(-50), entry]);
    },
    []
  );

  // Floating Text Spawner
  const spawnFloatingText = useCallback(
    (text: string, x?: number, y?: number, type: FloatingText['type'] = 'damage') => {
      const id = Math.random().toString(36).substring(2, 9);
      setFloatingTexts((prev) => [...prev, { id, text, x, y, type }]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, 1200);
    },
    []
  );

  // Helper to evaluate and advance quest objectives
  const updateQuestProgress = useCallback(
    (matcher: (obj: QuestObjective, quest: Quest) => boolean, amount: number = 1) => {
      setPlayer((prevPlayer) => {
        let anyChanged = false;
        let completedAnyQuest = false;
        let completedQuestTitle = '';

        const updatedQuests = (prevPlayer.quests || []).map((q) => {
          if (q.status === 'completed' || q.status === 'claimed') return q;

          let questUpdated = false;
          const updatedObjectives = q.objectives.map((obj) => {
            if (obj.completed) return obj;

            if (matcher(obj, q)) {
              const nextCount = Math.min(obj.targetCount, obj.currentCount + amount);
              if (nextCount !== obj.currentCount) {
                questUpdated = true;
                anyChanged = true;
                const isNowDone = nextCount >= obj.targetCount;
                return {
                  ...obj,
                  currentCount: nextCount,
                  completed: isNowDone,
                };
              }
            }
            return obj;
          });

          if (questUpdated) {
            const allDone = updatedObjectives.every((o) => o.completed);
            if (allDone) {
              completedAnyQuest = true;
              completedQuestTitle = q.title;
              return {
                ...q,
                objectives: updatedObjectives,
                status: 'completed' as const,
              };
            }
            return {
              ...q,
              objectives: updatedObjectives,
              status: q.status === 'available' ? ('active' as const) : q.status,
            };
          }
          return q;
        });

        if (!anyChanged) return prevPlayer;

        if (completedAnyQuest) {
          sound.playQuestFanfare();
          spawnFloatingText('⭐ QUEST COMPLETED!', prevPlayer.x, prevPlayer.y, 'level');
          addLog(
            `📜 QUEST COMPLETED: [${completedQuestTitle}]! Open Quest Journal [Q] to claim unique gear!`,
            'victory'
          );
        } else {
          sound.playQuestProgress();
        }

        const updated = {
          ...prevPlayer,
          quests: updatedQuests,
        };
        savePlayerToStorage(updated);
        playerRef.current = updated;
        return updated;
      });
    },
    [addLog, spawnFloatingText]
  );

  // Claim Quest Reward & Grant Unique Inventory Items
  const handleClaimQuestReward = useCallback(
    (questId: string) => {
      const cur = playerRef.current;
      const quest = (cur.quests || []).find((q) => q.id === questId);
      if (!quest || quest.status !== 'completed') return;

      sound.playQuestFanfare();

      const xpGained = quest.reward.xp;
      const goldGained = quest.reward.gold;
      const uniqueItem = quest.reward.uniqueItem;

      // Add unique item to saved inventory
      const inv = loadSavedInventory();
      const existing = inv.find((i) => i.itemId === uniqueItem.itemId);
      let updatedInv: InventoryItem[];
      if (existing) {
        updatedInv = inv.map((i) =>
          i.itemId === uniqueItem.itemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        updatedInv = [...inv, uniqueItem];
      }
      saveInventoryToStorage(updatedInv);

      // Check player level-up
      const nextXp = cur.xp + xpGained;
      const nextGold = cur.gold + goldGained;
      let nextLevel = cur.level;
      let nextMaxHp = cur.maxHp;
      let nextHp = cur.hp;
      let nextMaxMana = cur.maxMana;
      let nextMana = cur.mana;
      let nextSkillPoints = cur.skillPoints ?? 0;
      const didLevelUp = nextXp >= nextLevel * 100;

      if (didLevelUp) {
        nextLevel += 1;
        nextMaxHp += 25;
        nextHp = nextMaxHp;
        nextMaxMana += 15;
        nextMana = nextMaxMana;
        nextSkillPoints += 1;
        spawnFloatingText(`⭐ LEVEL UP! (Lv.${nextLevel}) +1 SP`, cur.x, cur.y, 'level');
        addLog(`⭐ LEVEL UP! ${cur.name} advanced to Level ${nextLevel}! Attributes surged and +1 Skill Point earned!`, 'heal');
      }

      // Mark quest as claimed
      const updatedQuests = (cur.quests || []).map((q) =>
        q.id === questId ? { ...q, status: 'claimed' as const, claimedAt: Date.now() } : q
      );

      // Activate next available quest
      const nextActive = updatedQuests.find((q) => q.status === 'active' || q.status === 'available');

      const updatedHero: Player = {
        ...cur,
        xp: nextXp,
        gold: nextGold,
        level: nextLevel,
        hp: nextHp,
        maxHp: nextMaxHp,
        mana: nextMana,
        maxMana: nextMaxMana,
        skillPoints: nextSkillPoints,
        quests: updatedQuests,
        activeQuestId: nextActive ? nextActive.id : cur.activeQuestId,
        completedQuestIds: [...(cur.completedQuestIds || []), questId],
      };

      setPlayer(updatedHero);
      playerRef.current = updatedHero;
      savePlayerToStorage(updatedHero);

      spawnFloatingText(`+${uniqueItem.name}`, cur.x, cur.y, 'gold');
      addLog(
        `🏆 Claimed Quest Reward: [${uniqueItem.name}] (${uniqueItem.rarity?.toUpperCase()}), +${goldGained} Gold & +${xpGained} XP! Unique gear stored in Knapsack [B].`,
        'victory'
      );
    },
    [addLog, spawnFloatingText]
  );

  // 1. Fetch XML Bestiary and spawn initial mobs
  const loadBestiaryFromXml = useCallback(async () => {
    try {
      const res = await fetch('/enemies.xml');
      if (!res.ok) throw new Error('Could not load enemies.xml');
      const xmlText = await res.text();
      const parsed = parseBestiaryXML(xmlText);
      setBestiary(parsed);
      const spawned = spawnRealmMonsters(playerRef.current.currentRealmId || 1, parsed);
      setMobs(spawned);
      addLog(`Loaded ${parsed.length} monster archetypes from enemies.xml via DOMParser.`, 'info');
    } catch (err: any) {
      addLog(`Failed to load XML Bestiary: ${err.message}`, 'info');
    }
  }, [addLog]);

  // 2. Initialize Multiplayer & URL Room check
  useEffect(() => {
    loadBestiaryFromXml();

    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room') || 'VALDOR-LAN';
    const isUrlHost = !params.has('room');

    setRoomCode(urlRoom);
    setIsHost(isUrlHost);
    lanMultiplayer.connect(urlRoom, isUrlHost);

    addLog(`Connected to LAN Multiplayer Session [${urlRoom}]. Ready for co-op!`, 'multiplayer');

    // Subscribe to incoming network messages
    const unsubscribe = lanMultiplayer.onMessage((msg) => {
      if (msg.type === 'CHAT') {
        sound.playClick();
        addLog(msg.payload.text, 'chat', msg.payload.senderName);
      } else if (msg.type === 'ATTACK') {
        sound.playSlash();
        const action = msg.payload.action;
        addLog(`${msg.senderName} unleashed [${action.toUpperCase()}]!`, 'multiplayer');
      } else if (msg.type === 'MOB_HIT') {
        const { instanceId, damage, attackerName } = msg.payload;
        setMobs((prev) =>
          prev.map((m) => {
            if (m.instanceId === instanceId) {
              const nextHp = Math.max(0, m.hp - damage);
              return { ...m, hp: nextHp };
            }
            return m;
          })
        );
        addLog(`${attackerName} struck an enemy for ${damage} DMG!`, 'player_atk');
      } else if (msg.type === 'MOB_STATE_SYNC' && !isHost) {
        // Sync mob positions from host
        const syncedList = msg.payload.mobs as Array<{ instanceId: string; x: number; y: number; hp: number; isDefending?: boolean }>;
        setMobs((prev) =>
          prev.map((localMob) => {
            const found = syncedList.find((s) => s.instanceId === localMob.instanceId);
            if (found) {
              return { ...localMob, x: found.x, y: found.y, hp: found.hp, isDefending: found.isDefending };
            }
            return localMob;
          })
        );
      } else if (msg.type === 'PVP_ATTACK') {
        const { targetPeerId, damage, attackerName, actionName } = msg.payload;
        if (targetPeerId === lanMultiplayer.getPeerId()) {
          sound.playEnemyHit();
          triggerRumbleRef.current(180, 0.7, 0.8);
          spawnFloatingText(`-${damage} PVP`, playerRef.current.x, playerRef.current.y, 'damage');
          addLog(`⚔️ ${attackerName} assaulted you with [${actionName.toUpperCase()}] for ${damage} DMG!`, 'enemy_atk');

          setPlayer((p) => {
            const nextHp = Math.max(0, p.hp - damage);
            if (nextHp <= 0) {
              sound.playDefeat();
              lanMultiplayer.sendPvpKill(lanMultiplayer.getPeerId(), p.name, attackerName);
              const currentRealm = getRealmById(p.currentRealmId || 1);
              spawnFloatingText('💀 PVP CASUALTY', p.x, p.y, 'damage');
              addLog(`💀 You were slain by ${attackerName} in PVP! Respawning at ${currentRealm.town.name}...`, 'defeat');
              const respawned: Player = {
                ...p,
                hp: p.maxHp,
                mana: p.maxMana,
                x: currentRealm.town.spawnX,
                y: currentRealm.town.spawnY,
                pvpDeaths: (p.pvpDeaths || 0) + 1,
              };
              playerRef.current = respawned;
              savePlayerToStorage(respawned);
              return respawned;
            }
            return { ...p, hp: nextHp };
          });
        }
      } else if (msg.type === 'PVP_KILL') {
        const { victimName, killerName } = msg.payload;
        sound.playCrit();
        addLog(`⚔️ [PVP] ${killerName} defeated ${victimName} in honorable combat!`, 'victory');
        if (killerName === playerRef.current.name) {
          sound.playVictory();
          setPlayer((p) => {
            const nextHonor = (p.pvpHonor || 0) + 50;
            const nextKills = (p.pvpKills || 0) + 1;
            const rank = getPvPRank(nextHonor);
            const updated: Player = {
              ...p,
              pvpKills: nextKills,
              pvpHonor: nextHonor,
              pvpRank: rank.title,
            };
            playerRef.current = updated;
            savePlayerToStorage(updated);
            spawnFloatingText(`⭐ PVP KILL! +50 HONOR (${rank.title})`, p.x, p.y, 'level');
            return updated;
          });
        }
      }
    });

    return () => {
      unsubscribe();
      lanMultiplayer.disconnect();
    };
  }, [loadBestiaryFromXml, addLog, spawnFloatingText]);

  // 3. Heartbeat loop to broadcast player presence to LAN peers
  useEffect(() => {
    const interval = setInterval(() => {
      const p = playerRef.current;
      lanMultiplayer.sendHeartbeat({
        name: p.name,
        className: p.class,
        styleId: p.styleId || 'knight',
        sprite: p.sprite || '🛡️',
        x: p.x ?? 18,
        y: p.y ?? 19,
        direction: p.direction || 'down',
        isMoving: Boolean(p.isMoving),
        hp: p.hp,
        maxHp: p.maxHp,
        mana: p.mana,
        maxMana: p.maxMana,
        level: p.level,
        realmId: p.currentRealmId || 1,
        pvpEnabled: Boolean(p.pvpEnabled),
      });

      setPeers(lanMultiplayer.getPeers());
      setPing(lanMultiplayer.getPing());

      // If host, sync mobs to other peers periodically
      if (isHost && mobsRef.current.length > 0) {
        lanMultiplayer.syncWorldMobs(mobsRef.current);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [isHost]);

  // 4. Save player state periodically
  const saveState = useCallback(
    (updatedPlayer?: Player) => {
      const toSave = updatedPlayer || playerRef.current;
      savePlayerToStorage(toSave);
      saveWorldObjectsState(objects);
    },
    [objects]
  );

  // Realm Travel Handler (Teleport between the 12 Worlds)
  const handleTravelToRealm = useCallback(
    (newRealmId: number) => {
      const realmDef = getRealmById(newRealmId);
      const newMap = generateRealmWorld(newRealmId);
      setWorldMap(newMap);
      setObjects(loadSavedWorldObjects(newMap.objects));
      setCurrentRealmId(newRealmId);

      if (bestiary.length > 0) {
        setMobs(spawnRealmMonsters(newRealmId, bestiary));
      }
      setTargetEnemy(null);

      const cur = playerRef.current;
      const discovered = Array.from(new Set([...(cur.discoveredRealms || [1]), newRealmId]));

      // Save previous realm explored fog
      const realmFogMap = { ...(cur.realmExploredTiles || {}) };
      realmFogMap[cur.currentRealmId || 1] = cur.exploredTiles || [];

      // Load or initialize fog of war for the new realm
      const newRealmExplored =
        realmFogMap[newRealmId] ||
        getInitialExploredTiles(realmDef.town.spawnX, realmDef.town.spawnY, 8);
      realmFogMap[newRealmId] = newRealmExplored;

      const updatedHero: Player = {
        ...cur,
        currentRealmId: newRealmId,
        discoveredRealms: discovered,
        realmExploredTiles: realmFogMap,
        exploredTiles: newRealmExplored,
        x: realmDef.town.spawnX,
        y: realmDef.town.spawnY,
      };

      setPlayer(updatedHero);
      playerRef.current = updatedHero;
      saveState(updatedHero);

      sound.playVictory();
      spawnFloatingText(
        `🌌 TRANSFERRED TO ${realmDef.name.toUpperCase()}`,
        realmDef.town.spawnX,
        realmDef.town.spawnY,
        'level'
      );
      addLog(
        `🌌 Activated the Ancient Realm Gateway! Arrived in [${realmDef.name}] at ${realmDef.town.name}.`,
        'victory'
      );
    },
    [bestiary, saveState, spawnFloatingText, addLog]
  );

  // Toggle PVP Mode
  const handleTogglePvp = useCallback(
    (enabled: boolean) => {
      sound.playClick();
      const updatedHero: Player = {
        ...playerRef.current,
        pvpEnabled: enabled,
      };
      setPlayer(updatedHero);
      playerRef.current = updatedHero;
      saveState(updatedHero);

      if (enabled) {
        sound.playSlash();
        spawnFloatingText('⚔️ PVP MODE ENGAGED', updatedHero.x, updatedHero.y, 'crit');
        addLog(
          '⚔️ Flagged for PVP Combat! Spells and attacks can now strike other PVP-flagged players.',
          'victory'
        );
      } else {
        spawnFloatingText('🕊️ PEACEFUL STANCE', updatedHero.x, updatedHero.y, 'heal');
        addLog('🕊️ PVP Disabled. You are now protected in peaceful exploration mode.', 'info');
      }
    },
    [saveState, spawnFloatingText, addLog]
  );

  // Colosseum Gladiator Duels (Solo/Practice)
  const handleStartGladiatorDuel = useCallback(
    (champ: GladiatorChampion) => {
      const cur = playerRef.current;
      sound.playSlash();
      addLog(`⚔️ Entering Colosseum Duel against ${champ.name} (${champ.title})!`, 'player_atk');

      const playerPower = cur.level * 10 + cur.maxHp / 5 + (cur.equipped?.weapon?.power || 14);
      const champPower = champ.level * 9 + champ.hp / 6 + champ.atk;

      const victoryChance = Math.min(0.95, Math.max(0.15, playerPower / (playerPower + champPower)));
      const won = Math.random() < victoryChance;

      setTimeout(() => {
        if (won) {
          sound.playVictory();
          triggerRumbleRef.current(200, 0.8, 0.9);
          const honorGained = champ.honorReward;
          const goldGained = champ.goldReward;
          const nextHonor = (cur.pvpHonor || 0) + honorGained;
          const nextKills = (cur.pvpKills || 0) + 1;
          const nextGold = cur.gold + goldGained;
          const rank = getPvPRank(nextHonor);

          const updated: Player = {
            ...cur,
            gold: nextGold,
            pvpKills: nextKills,
            pvpHonor: nextHonor,
            pvpRank: rank.title,
          };
          setPlayer(updated);
          playerRef.current = updated;
          saveState(updated);

          spawnFloatingText(`🏆 ARENA VICTORY! +${honorGained} Honor`, cur.x, cur.y, 'level');
          addLog(
            `🏆 ARENA VICTORY! You vanquished ${champ.name}! Awarded +${honorGained} Honor Points and +${goldGained} Gold! Rank: ${rank.title}.`,
            'victory'
          );
        } else {
          sound.playDefeat();
          triggerRumbleRef.current(180, 0.6, 0.6);
          const dmgTaken = Math.min(cur.hp - 1, Math.round(champ.atk * 1.5));
          const nextDeaths = (cur.pvpDeaths || 0) + 1;
          const updated: Player = {
            ...cur,
            hp: Math.max(1, cur.hp - dmgTaken),
            pvpDeaths: nextDeaths,
          };
          setPlayer(updated);
          playerRef.current = updated;
          saveState(updated);
          spawnFloatingText(`DEFEAT in Arena! -${dmgTaken} HP`, cur.x, cur.y, 'damage');
          addLog(
            `💀 ${champ.name} countered with [${champ.specialMove}]! Rest at the hearth to recover.`,
            'defeat'
          );
        }
      }, 500);
    },
    [addLog, saveState, spawnFloatingText]
  );

  // Import Save Data
  const handleImportSave = useCallback(
    (
      importedPlayer: Player,
      importedInventory: InventoryItem[],
      importedObjects: WorldObject[]
    ) => {
      setPlayer(importedPlayer);
      playerRef.current = importedPlayer;
      const rId = importedPlayer.currentRealmId || 1;
      setCurrentRealmId(rId);
      const newMap = generateRealmWorld(rId);
      setWorldMap(newMap);
      setObjects(importedObjects && importedObjects.length > 0 ? importedObjects : newMap.objects);
      if (bestiary.length > 0) {
        setMobs(spawnRealmMonsters(rId, bestiary));
      }
      setIsSaveDataOpen(false);
      addLog(
        `💾 Successfully loaded save state for ${importedPlayer.name} (Lv.${importedPlayer.level} ${importedPlayer.class})!`,
        'victory'
      );
    },
    [bestiary, addLog]
  );

  // 5. Player Movement Handler
  const movePlayer = useCallback(
    (dx: number, dy: number, direction: 'up' | 'down' | 'left' | 'right') => {
      const cur = playerRef.current;
      const targetX = (cur.x ?? 18) + dx;
      const targetY = (cur.y ?? 19) + dy;

      // Check tile collision
      const tileCol = Math.round(targetX);
      const tileRow = Math.round(targetY);

      if (isTileCollidable(worldMap.tiles, tileCol, tileRow)) {
        return;
      }

      const updated = {
        ...cur,
        x: targetX,
        y: targetY,
        direction,
        isMoving: true,
      };

      // Check biome discovery & exploration quests
      const curBiome = getBiomeAt(targetX, targetY);
      const explored = cur.exploredBiomes || ['oakhaven'];
      let biomeDiscovered = false;
      if (!explored.includes(curBiome)) {
        const nextExplored = [...explored, curBiome];
        updated.exploredBiomes = nextExplored;
        biomeDiscovered = true;
        updateQuestProgress((obj) => {
          if (obj.type === 'explore_biome' && obj.targetId === curBiome) return true;
          if (obj.type === 'reach_level' && obj.id === 'obj_visit_all_biomes') return true;
          return false;
        });
        spawnFloatingText(`DISCOVERED ${curBiome.toUpperCase()}`, targetX, targetY, 'gold');
        addLog(`🗺️ Discovered new realm biome: ${curBiome.toUpperCase()}!`, 'info');
      }

      // Check fog of war exploration and persist revealed tiles
      const { updatedTiles, hasNew: hasNewFog } = revealFogOfWar(
        cur.exploredTiles,
        targetX,
        targetY
      );
      if (hasNewFog) {
        updated.exploredTiles = updatedTiles;
      }

      if (biomeDiscovered || hasNewFog) {
        saveState(updated);
      }

      setPlayer(updated);
      playerRef.current = updated;

      // Check nearby interactive objects
      const nearObj = objects.find(
        (obj) => Math.hypot(obj.x - targetX, obj.y - targetY) < 1.3
      );
      if (nearObj && nearObj.type === 'fountain') {
        // Auto-heal at fountain
        if (cur.hp < cur.maxHp || cur.mana < cur.maxMana) {
          sound.playPotion();
          const healed = { ...cur, hp: cur.maxHp, mana: cur.maxMana };
          setPlayer(healed);
          setStatusEffects({ poisonTurns: 0, burnTurns: 0 });
          spawnFloatingText('REJUVENATED', targetX, targetY, 'heal');
          addLog('Bathed in the Fountain of Rejuvenation! Full HP/MP restored.', 'heal');
        }
      }

      // Check loot drop collection
      setLootDrops((prev) => {
        const remaining: WorldLootDrop[] = [];
        prev.forEach((drop) => {
          if (Math.hypot(drop.x - targetX, drop.y - targetY) < 1.2) {
            sound.playCrit();
            if (drop.type === 'gold') {
              const nextGold = cur.gold + drop.amount;
              setPlayer((p) => ({ ...p, gold: nextGold }));
              spawnFloatingText(`+${drop.amount} Gold`, targetX, targetY, 'gold');
              addLog(`Retrieved ${drop.amount} Gold from fallen beast.`, 'info');
            } else if (drop.type === 'potion') {
              spawnFloatingText('+1 Crimson Potion', targetX, targetY, 'heal');
              addLog('Picked up Crimson Potion.', 'heal');
            }
          } else {
            remaining.push(drop);
          }
        });
        return remaining;
      });
    },
    [worldMap.tiles, objects, spawnFloatingText, addLog]
  );

  // Skill Unlock & Upgrade Handlers for Tech Inspector
  const handleUnlockOrUpgradeSkill = useCallback(
    (skillId: string) => {
      const result = unlockOrUpgradeSkill(playerRef.current, skillId);
      if (result.success) {
        sound.playVictory();
        setPlayer(result.updatedPlayer);
        playerRef.current = result.updatedPlayer;
        saveState(result.updatedPlayer);
        spawnFloatingText(result.message, result.updatedPlayer.x, result.updatedPlayer.y, 'level');
        addLog(result.message, 'victory');
      } else {
        sound.playEnemyHit();
        addLog(`Cannot unlock or upgrade: ${result.message}`, 'enemy_atk');
      }
    },
    [addLog, saveState, spawnFloatingText]
  );

  const handleRespecSkills = useCallback(() => {
    const result = respecSkillPoints(playerRef.current);
    if (result.refundedPoints > 0) {
      sound.playPotion();
      setPlayer(result.updatedPlayer);
      playerRef.current = result.updatedPlayer;
      saveState(result.updatedPlayer);
      spawnFloatingText(`Reset Skills: +${result.refundedPoints} SP`, result.updatedPlayer.x, result.updatedPlayer.y, 'heal');
      addLog(`Re-specced all combat abilities. Refunded ${result.refundedPoints} Skill Points!`, 'heal');
    } else {
      addLog('No allocated skill points to refund.', 'info');
    }
  }, [addLog, saveState, spawnFloatingText]);

  // 6. Combat Execution (Melee Strike, Spells, Potions, Unlocked Active Skills)
  const handleCombatAction = useCallback(
    (action: CombatAction) => {
      const cur = playerRef.current;
      if (cur.hp <= 0) return;

      // Restorative Potion
      if (action === 'potion') {
        sound.playPotion();
        const healedHp = Math.min(cur.maxHp, cur.hp + 50);
        setStatusEffects({ poisonTurns: 0, burnTurns: 0 });
        const updated = { ...cur, hp: healedHp };
        setPlayer(updated);
        saveState(updated);
        spawnFloatingText('+50 HP', cur.x, cur.y, 'heal');
        addLog('Quaffed Crimson Potion! Restored +50 HP and cured poison.', 'heal');
        return;
      }

      // Iron Bastion: Divine Fortification & Cleansing (Self-Cast Buff)
      if (action === 'iron_bastion') {
        const rankLevel = cur.unlockedSkills?.iron_bastion || 0;
        if (rankLevel <= 0) {
          addLog('Iron Bastion is locked! Allocate Skill Points in Tech Inspector [T].', 'info');
          return;
        }
        const rankInfo = getSkillRankInfo('iron_bastion', rankLevel);
        const manaCost = rankInfo?.manaCost ?? 20;
        if (cur.mana < manaCost) {
          spawnFloatingText('LOW MANA', cur.x, cur.y, 'damage');
          addLog(`Not enough Mana for Iron Bastion (${manaCost} MP required)!`, 'enemy_atk');
          return;
        }

        sound.playPotion();
        triggerRumbleRef.current(150, 0.5, 0.8);
        const healVal = rankLevel === 3 ? 90 : rankLevel === 2 ? 55 : 30;
        const nextHp = Math.min(cur.maxHp, cur.hp + healVal);
        const nextMana = Math.max(0, cur.mana - manaCost);
        setStatusEffects({ poisonTurns: 0, burnTurns: 0 });
        const updatedHero: Player = { ...cur, hp: nextHp, mana: nextMana };
        setPlayer(updatedHero);
        playerRef.current = updatedHero;
        saveState(updatedHero);
        spawnFloatingText(`🛡️ BASTION +${healVal} HP`, cur.x, cur.y, 'heal');
        addLog(
          `🛡️ Cast Iron Bastion (Rank ${rankLevel})! Restored +${healVal} HP, purged toxic afflictions, and bolstered defenses!`,
          'heal'
        );
        return;
      }

      // Check for PVP strikes against nearby LAN peers
      if (cur.pvpEnabled && peers.length > 0) {
        const hostilePeers = peers.filter(
          (p) =>
            p.pvpEnabled &&
            (p.realmId || 1) === (cur.currentRealmId || 1) &&
            Math.hypot(p.x - (cur.x ?? 20), p.y - (cur.y ?? 22)) <= (action === 'attack' ? 3.0 : 6.0)
        );

        if (hostilePeers.length > 0) {
          const victim = hostilePeers[0];
          const atkBonus = cur.equipped?.weapon?.power || 14;
          const pvpDmg = Math.max(16, Math.round(cur.level * 8 + atkBonus + Math.random() * 10));
          lanMultiplayer.sendPvpAttack(victim.id, pvpDmg, cur.name, action);
          spawnFloatingText(`-${pvpDmg} PVP`, victim.x, victim.y, 'crit');
          addLog(`⚔️ [PVP] You landed [${action.toUpperCase()}] on ${victim.name} for ${pvpDmg} DMG!`, 'player_atk');
        }
      }

      // Whirlwind: 360° Cleaving Melee Strike (AOE)
      if (action === 'whirlwind') {
        const rankLevel = cur.unlockedSkills?.whirlwind || 0;
        if (rankLevel <= 0) {
          addLog('Whirlwind is locked! Allocate Skill Points in Tech Inspector [T].', 'info');
          return;
        }
        const rankInfo = getSkillRankInfo('whirlwind', rankLevel);
        const manaCost = rankInfo?.manaCost ?? 18;
        if (cur.mana < manaCost) {
          spawnFloatingText('LOW MANA', cur.x, cur.y, 'damage');
          addLog(`Not enough Mana for Whirlwind (${manaCost} MP required)!`, 'enemy_atk');
          return;
        }

        sound.playSlash();
        triggerRumbleRef.current(180, 0.7, 0.8);
        spawnFloatingText('🌪️ WHIRLWIND!', cur.x, cur.y, 'crit');

        const aoeRadius = 3.8;
        const nearbyMobs = mobsRef.current.filter(
          (m) => m.hp > 0 && Math.hypot(m.x - (cur.x ?? 18), m.y - (cur.y ?? 19)) <= aoeRadius
        );

        const nextMana = Math.max(0, cur.mana - manaCost);
        if (nearbyMobs.length === 0) {
          addLog(`🌪️ Whirlwind sliced a full 360° circle! No beasts were within ${aoeRadius} tiles.`, 'info');
          const updatedHero: Player = { ...cur, mana: nextMana };
          setPlayer(updatedHero);
          saveState(updatedHero);
          return;
        }

        let totalXpGained = 0;
        let totalGoldGained = 0;
        let anyKilled = false;
        let lastKilledName = '';
        const defeatedMobIds: string[] = [];

        setMobs((prev) =>
          prev.map((m) => {
            const inRange = nearbyMobs.find((n) => n.instanceId === m.instanceId);
            if (!inRange) return m;

            const res = calculateCombatAction({ action: 'whirlwind', player: cur, monster: m });
            spawnFloatingText(`-${res.damageDealt}`, m.x, m.y, res.critical ? 'crit' : 'damage');
            lanMultiplayer.notifyMobHit(m.instanceId, res.damageDealt, cur.name);

            if (res.enemyHp <= 0) {
              anyKilled = true;
              lastKilledName = m.name;
              defeatedMobIds.push(m.id);
              totalGoldGained += m.gold || 30;
              totalXpGained += m.expReward || 40;
              const respawnDuration = m.id === 'dragon' ? 35000 : 18000;
              return {
                ...m,
                hp: 0,
                deadAt: Date.now(),
                respawnAt: Date.now() + respawnDuration,
              };
            }

            return { ...m, hp: res.enemyHp };
          })
        );

        if (defeatedMobIds.length > 0) {
          defeatedMobIds.forEach((mId) => {
            updateQuestProgress((obj) => {
              if (obj.type === 'kill' && obj.targetId === mId) return true;
              if (obj.type === 'kill_group' && obj.targetGroup?.includes(mId)) return true;
              return false;
            });
          });
        }

        const nextXp = cur.xp + totalXpGained;
        const nextGold = cur.gold + totalGoldGained;
        let nextLevel = cur.level;
        let nextMaxHp = cur.maxHp;
        let nextMaxMana = cur.maxMana;
        let nextHp = cur.hp;
        let nextSkillPoints = cur.skillPoints ?? 0;
        const didLevelUp = nextXp >= nextLevel * 100;

        if (didLevelUp) {
          nextLevel += 1;
          nextMaxHp += 25;
          nextHp = nextMaxHp;
          nextMaxMana += 15;
          nextSkillPoints += 1;
          spawnFloatingText(`⭐ LEVEL UP! (Lv.${nextLevel}) +1 SP`, cur.x, cur.y, 'level');
          addLog(`⭐ LEVEL UP! ${cur.name} advanced to Level ${nextLevel}! Attributes surged and +1 Skill Point earned!`, 'heal');
        }

        if (anyKilled) {
          sound.playVictory();
          setRewardPreview({
            id: Math.random().toString(36).substring(2, 9),
            gold: totalGoldGained,
            xp: totalXpGained,
            monsterName: lastKilledName,
            isLevelUp: didLevelUp,
            newLevel: didLevelUp ? nextLevel : undefined,
          });
          setTimeout(() => setRewardPreview(null), 2500);
        }

        addLog(`🌪️ Whirlwind cleaves ${nearbyMobs.length} nearby monsters for martial damage! (${nextMana} MP remaining)`, 'crit');

        const updatedHero: Player = {
          ...cur,
          hp: nextHp,
          maxHp: nextMaxHp,
          mana: nextMana,
          maxMana: nextMaxMana,
          gold: nextGold,
          xp: nextXp,
          level: nextLevel,
          wins: cur.wins + (anyKilled ? 1 : 0),
          skillPoints: nextSkillPoints,
        };
        setPlayer(updatedHero);
        saveState(updatedHero);
        return;
      }

      // Frost Nova: Radial Blizzard & Chill (AOE)
      if (action === 'frost_nova') {
        const rankLevel = cur.unlockedSkills?.frost_nova || 0;
        if (rankLevel <= 0) {
          addLog('Frost Nova is locked! Allocate Skill Points in Tech Inspector [T].', 'info');
          return;
        }
        const rankInfo = getSkillRankInfo('frost_nova', rankLevel);
        const manaCost = rankInfo?.manaCost ?? 22;
        if (cur.mana < manaCost) {
          spawnFloatingText('LOW MANA', cur.x, cur.y, 'damage');
          addLog(`Not enough Mana for Frost Nova (${manaCost} MP required)!`, 'enemy_atk');
          return;
        }

        sound.playThunder();
        triggerRumbleRef.current(170, 0.6, 0.9);
        spawnFloatingText('❄️ FROST NOVA!', cur.x, cur.y, 'crit');

        const aoeRadius = 4.5;
        const nearbyMobs = mobsRef.current.filter(
          (m) => m.hp > 0 && Math.hypot(m.x - (cur.x ?? 18), m.y - (cur.y ?? 19)) <= aoeRadius
        );

        const nextMana = Math.max(0, cur.mana - manaCost);
        if (nearbyMobs.length === 0) {
          addLog(`❄️ Frost Nova unleashed a sub-zero vortex! No monsters within ${aoeRadius} tiles.`, 'info');
          const updatedHero: Player = { ...cur, mana: nextMana };
          setPlayer(updatedHero);
          saveState(updatedHero);
          return;
        }

        let totalXpGained = 0;
        let totalGoldGained = 0;
        let anyKilled = false;
        let lastKilledName = '';
        const defeatedMobIds: string[] = [];

        setMobs((prev) =>
          prev.map((m) => {
            const inRange = nearbyMobs.find((n) => n.instanceId === m.instanceId);
            if (!inRange) return m;

            const res = calculateCombatAction({ action: 'frost_nova', player: cur, monster: m });
            spawnFloatingText(`-${res.damageDealt} FROST`, m.x, m.y, 'crit');
            lanMultiplayer.notifyMobHit(m.instanceId, res.damageDealt, cur.name);

            if (res.enemyHp <= 0) {
              anyKilled = true;
              lastKilledName = m.name;
              defeatedMobIds.push(m.id);
              totalGoldGained += m.gold || 30;
              totalXpGained += m.expReward || 40;
              const respawnDuration = m.id === 'dragon' ? 35000 : 18000;
              return {
                ...m,
                hp: 0,
                deadAt: Date.now(),
                respawnAt: Date.now() + respawnDuration,
              };
            }

            return { ...m, hp: res.enemyHp };
          })
        );

        if (defeatedMobIds.length > 0) {
          defeatedMobIds.forEach((mId) => {
            updateQuestProgress((obj) => {
              if (obj.type === 'kill' && obj.targetId === mId) return true;
              if (obj.type === 'kill_group' && obj.targetGroup?.includes(mId)) return true;
              return false;
            });
          });
        }

        const nextXp = cur.xp + totalXpGained;
        const nextGold = cur.gold + totalGoldGained;
        let nextLevel = cur.level;
        let nextMaxHp = cur.maxHp;
        let nextMaxMana = cur.maxMana;
        let nextHp = cur.hp;
        let nextSkillPoints = cur.skillPoints ?? 0;
        const didLevelUp = nextXp >= nextLevel * 100;

        if (didLevelUp) {
          nextLevel += 1;
          nextMaxHp += 25;
          nextHp = nextMaxHp;
          nextMaxMana += 15;
          nextSkillPoints += 1;
          spawnFloatingText(`⭐ LEVEL UP! (Lv.${nextLevel}) +1 SP`, cur.x, cur.y, 'level');
          addLog(`⭐ LEVEL UP! ${cur.name} advanced to Level ${nextLevel}! Attributes surged and +1 Skill Point earned!`, 'heal');
        }

        if (anyKilled) {
          sound.playVictory();
          setRewardPreview({
            id: Math.random().toString(36).substring(2, 9),
            gold: totalGoldGained,
            xp: totalXpGained,
            monsterName: lastKilledName,
            isLevelUp: didLevelUp,
            newLevel: didLevelUp ? nextLevel : undefined,
          });
          setTimeout(() => setRewardPreview(null), 2500);
        }

        addLog(`❄️ Frost Nova flash-froze ${nearbyMobs.length} enemies in glacial ice! (${nextMana} MP remaining)`, 'crit');

        const updatedHero: Player = {
          ...cur,
          hp: nextHp,
          maxHp: nextMaxHp,
          mana: nextMana,
          maxMana: nextMaxMana,
          gold: nextGold,
          xp: nextXp,
          level: nextLevel,
          wins: cur.wins + (anyKilled ? 1 : 0),
          skillPoints: nextSkillPoints,
        };
        setPlayer(updatedHero);
        saveState(updatedHero);
        return;
      }

      // Check unlock status for targeted skills (Thunder Smite)
      if (action === 'thunder_smite') {
        const rankLevel = cur.unlockedSkills?.thunder_smite || 0;
        if (rankLevel <= 0) {
          addLog('Thunder Smite is locked! Allocate Skill Points in Tech Inspector [T].', 'info');
          return;
        }
        const rankInfo = getSkillRankInfo('thunder_smite', rankLevel);
        const manaCost = rankInfo?.manaCost ?? 25;
        if (cur.mana < manaCost) {
          spawnFloatingText('LOW MANA', cur.x, cur.y, 'damage');
          addLog(`Not enough Mana for Thunder Smite (${manaCost} MP required)!`, 'enemy_atk');
          return;
        }
      }

      // Find nearest enemy in front/range for single-target actions
      const activeMobs = mobsRef.current.filter((m) => m.hp > 0);
      let target = targetEnemy;

      if (!target || target.hp <= 0) {
        // Auto-target nearest
        let closestDist = 999;
        for (const m of activeMobs) {
          const dist = Math.hypot(m.x - (cur.x ?? 18), m.y - (cur.y ?? 19));
          if (dist < closestDist) {
            closestDist = dist;
            target = m;
          }
        }
      }

      if (!target) {
        addLog('No monsters in range! Explore the biomes to find beasts.', 'info');
        return;
      }

      const dist = Math.hypot(target.x - (cur.x ?? 18), target.y - (cur.y ?? 19));

      // Range check
      if (action === 'attack' && dist > 2.8) {
        addLog(`${target.name} is out of melee range! Move closer.`, 'info');
        return;
      }
      if (action === 'thunder_smite' && dist > 6.5) {
        addLog(`${target.name} is out of Thunder Smite range (6.5 tiles)! Move closer.`, 'info');
        return;
      }

      // Play Sound
      if (action === 'attack') sound.playSlash();
      else if (action === 'fireball') sound.playFireball();
      else if (action === 'thunder' || action === 'thunder_smite') sound.playThunder();

      // Spawn projectile visual for spells & thunder smite
      if (action === 'fireball' || action === 'thunder' || action === 'thunder_smite') {
        const projId = 'proj_' + Math.random().toString(36).substring(2, 9);
        setProjectiles((prev) => [
          ...prev,
          {
            id: projId,
            x: cur.x ?? 18,
            y: cur.y ?? 19,
            startX: cur.x ?? 18,
            startY: cur.y ?? 19,
            targetX: target!.x,
            targetY: target!.y,
            speed: action === 'thunder_smite' ? 8 : 5,
            damage: action === 'thunder_smite' ? 45 : 25,
            type: action === 'fireball' ? 'fireball' : 'frost',
            ownerId: 'player',
            radius: action === 'thunder_smite' ? 8 : 7,
            color: action === 'fireball' ? '#f97316' : action === 'thunder_smite' ? '#facc15' : '#38bdf8',
          },
        ]);

        setTimeout(() => {
          setProjectiles((p) => p.filter((x) => x.id !== projId));
        }, 350);
      }

      // Notify LAN peers of attack
      lanMultiplayer.sendAttackAction(action, { x: target.x, y: target.y });

      // Run Combat Engine Calculation
      const result = calculateCombatAction({
        action,
        player: cur,
        monster: target,
      });

      // Defensive stance mitigated
      if (result.damageMitigated) {
        spawnFloatingText('BLOCKED (-50%)', target.x, target.y, 'defense');
        addLog(`🛡️ ${target.name}'s Defensive Stance absorbed 50% damage!`, 'defensive_stance');
      }

      // Floating damage & sounds
      if (result.critical) {
        sound.playCrit();
        triggerRumbleRef.current(160, 0.7, 0.9);
        spawnFloatingText(`CRIT! -${result.damageDealt}`, target.x, target.y, 'crit');
        addLog(`CRITICAL HIT! You strike ${target.name} for ${result.damageDealt} DMG!`, 'crit');
      } else if (result.damageDealt > 0) {
        triggerRumbleRef.current(80, 0.3, 0.4);
        spawnFloatingText(`-${result.damageDealt}`, target.x, target.y, 'damage');
        addLog(`You strike ${target.name} for ${result.damageDealt} DMG.`, 'player_atk');
      }

      // Notify LAN peers of mob damage
      lanMultiplayer.notifyMobHit(target.instanceId, result.damageDealt, cur.name);

      // Handle enemy special abilities
      if (result.poisonInflicted) {
        setStatusEffects((prev) => ({ ...prev, poisonTurns: 3 }));
        spawnFloatingText('POISONED!', cur.x, cur.y, 'poison');
        addLog(`🤢 ${target.name} delivered venomous poison! You will take damage over time.`, 'poison');
      }

      if (result.enterDefensiveStance) {
        addLog(`🛡️ ${target.name} enters a fortified Defensive Stance! Incoming damage halved.`, 'defensive_stance');
      }

      // Update Mob HP
      const updatedMobHp = result.enemyHp;
      setMobs((prev) =>
        prev.map((m) =>
          m.instanceId === target!.instanceId
            ? { ...m, hp: updatedMobHp, isDefending: result.enterDefensiveStance }
            : m
        )
      );

      // Update Target Enemy reference
      setTargetEnemy((prev) =>
        prev && prev.instanceId === target!.instanceId
          ? { ...prev, hp: updatedMobHp, isDefending: result.enterDefensiveStance }
          : prev
      );

      // Mob Defeated check
      if (updatedMobHp <= 0) {
        sound.playVictory();
        const goldGained = target.gold || 30;
        const xpGained = target.expReward || 40;

        // Schedule monster respawn
        const respawnDuration = target.id === 'dragon' ? 35000 : 18000;
        const respawnTimestamp = Date.now() + respawnDuration;

        setMobs((prev) =>
          prev.map((m) =>
            m.instanceId === target!.instanceId
              ? {
                  ...m,
                  hp: 0,
                  isDefending: false,
                  deadAt: Date.now(),
                  respawnAt: respawnTimestamp,
                }
              : m
          )
        );

        // Advance Quest Kill Objectives
        updateQuestProgress((obj) => {
          if (obj.type === 'kill' && obj.targetId === target.id) return true;
          if (obj.type === 'kill_group' && obj.targetGroup?.includes(target.id)) return true;
          return false;
        });

        // Spawn world loot drops
        setLootDrops((prev) => [
          ...prev,
          {
            id: 'loot_' + Math.random().toString(36).substring(2, 9),
            x: target!.x,
            y: target!.y,
            type: 'gold',
            amount: goldGained,
            label: `+${goldGained} Gold`,
            icon: '💰',
            createdAt: Date.now(),
          },
        ]);

        const nextXp = cur.xp + xpGained;
        const nextGold = cur.gold + goldGained;
        const nextWins = cur.wins + 1;
        let nextLevel = cur.level;
        let nextMaxHp = cur.maxHp;
        let nextHp = result.playerHp;
        let nextMaxMana = cur.maxMana;
        let nextMana = result.playerMana;
        let nextSkillPoints = cur.skillPoints ?? 0;
        const didLevelUp = nextXp >= nextLevel * 100;

        if (didLevelUp) {
          nextLevel += 1;
          nextMaxHp += 25;
          nextHp = nextMaxHp;
          nextMaxMana += 15;
          nextMana = nextMaxMana;
          nextSkillPoints += 1;
          spawnFloatingText(`⭐ LEVEL UP! (Lv.${nextLevel}) +1 SP`, cur.x, cur.y, 'level');
          addLog(`⭐ LEVEL UP! ${cur.name} advanced to Level ${nextLevel}! Attributes surged and +1 Skill Point earned!`, 'heal');
        }

        // Trigger reward preview
        setRewardPreview({
          id: Math.random().toString(36).substring(2, 9),
          gold: goldGained,
          xp: xpGained,
          monsterName: target.name,
          isLevelUp: didLevelUp,
          newLevel: didLevelUp ? nextLevel : undefined,
        });

        setTimeout(() => setRewardPreview(null), 2500);

        addLog(`🏆 Defeated ${target.name}! Gained +${goldGained} Gold & +${xpGained} XP.`, 'victory');

        const updatedHero: Player = {
          ...cur,
          hp: nextHp,
          maxHp: nextMaxHp,
          mana: nextMana,
          maxMana: nextMaxMana,
          gold: nextGold,
          xp: nextXp,
          level: nextLevel,
          wins: nextWins,
          skillPoints: nextSkillPoints,
        };

        setPlayer(updatedHero);
        saveState(updatedHero);
        setTargetEnemy(null);
        return;
      }

      // Enemy Counterattack
      if (result.damageTaken > 0) {
        setTimeout(() => {
          sound.playEnemyHit();
          triggerRumbleRef.current(140, 0.6, 0.6);
          spawnFloatingText(`-${result.damageTaken}`, cur.x, cur.y, 'damage');
          addLog(`${target!.name} retaliates for ${result.damageTaken} DMG!`, 'enemy_atk');

          setPlayer((p) => {
            const nextHp = Math.max(0, p.hp - result.damageTaken);
            if (nextHp <= 0) {
              sound.playDefeat();
              addLog('💀 You succumbed to wounds! Reviving at Oakhaven Hamlet campfire...', 'defeat');
              return {
                ...p,
                hp: p.maxHp,
                mana: p.maxMana,
                x: 18,
                y: 19,
                deaths: p.deaths + 1,
              };
            }
            return { ...p, hp: nextHp };
          });
        }, 200);
      }
    },
    [targetEnemy, spawnFloatingText, addLog, saveState, updateQuestProgress]
  );

  // 7. Open World Mob AI, Wandering & Respawn Loop
  useEffect(() => {
    const aiInterval = setInterval(() => {
      const cur = playerRef.current;
      setMobs((prev) =>
        prev.map((mob) => {
          // Check Respawning for dead mobs
          if (mob.hp <= 0) {
            if (mob.respawnAt && Date.now() >= mob.respawnAt) {
              sound.playClick();
              spawnFloatingText('⚡ RESPAWNED', mob.startX, mob.startY, 'gold');
              addLog(`✨ A ${mob.name} has reformed and respawned in ${mob.biome.toUpperCase()}!`, 'info');
              return {
                ...mob,
                hp: mob.maxHp,
                x: mob.startX,
                y: mob.startY,
                state: 'patrol',
                isDefending: false,
                patrolTargetX: mob.startX,
                patrolTargetY: mob.startY,
                deadAt: undefined,
                respawnAt: undefined,
              };
            }
            return mob;
          }

          // Distance to local player
          const distToPlayer = Math.hypot(mob.x - (cur.x ?? 18), mob.y - (cur.y ?? 19));

          // If within aggro radius, chase player!
          if (distToPlayer <= mob.aggroRadius) {
            const angle = Math.atan2((cur.y ?? 19) - mob.y, (cur.x ?? 18) - mob.x);
            const step = 0.075 * (mob.speed || 1);
            const newX = mob.x + Math.cos(angle) * step;
            const newY = mob.y + Math.sin(angle) * step;

            // Tile collision check for chasing mob
            if (!isTileCollidable(worldMap.tiles, Math.round(newX), Math.round(newY))) {
              return {
                ...mob,
                state: 'chase',
                x: newX,
                y: newY,
                targetPlayerId: 'local_player',
              };
            }
          }

          // Organic Wandering / Patrol pacing
          let targetX = mob.patrolTargetX || mob.startX;
          let targetY = mob.patrolTargetY || mob.startY;

          // Periodically or upon reaching current destination, pick a new non-collidable target
          const distToPatrol = Math.hypot(targetX - mob.x, targetY - mob.y);
          if (distToPatrol < 0.35 || Math.random() < 0.04) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 0.8 + Math.random() * (mob.patrolRadius || 4);
            const candX = Math.max(1, Math.min(WORLD_WIDTH - 2, mob.startX + Math.cos(angle) * dist));
            const candY = Math.max(1, Math.min(WORLD_HEIGHT - 2, mob.startY + Math.sin(angle) * dist));

            if (!isTileCollidable(worldMap.tiles, Math.round(candX), Math.round(candY))) {
              targetX = candX;
              targetY = candY;
            }
          }

          // Move smoothly towards patrol target
          const angle = Math.atan2(targetY - mob.y, targetX - mob.x);
          const step = 0.032 * (mob.speed || 1);
          const nextX = mob.x + Math.cos(angle) * step;
          const nextY = mob.y + Math.sin(angle) * step;

          if (!isTileCollidable(worldMap.tiles, Math.round(nextX), Math.round(nextY))) {
            return {
              ...mob,
              state: 'patrol',
              x: nextX,
              y: nextY,
              patrolTargetX: targetX,
              patrolTargetY: targetY,
            };
          } else {
            // Blocked by tile collision, redirect towards home
            return {
              ...mob,
              patrolTargetX: mob.startX,
              patrolTargetY: mob.startY,
            };
          }
        })
      );
    }, 120);

    return () => clearInterval(aiInterval);
  }, [worldMap.tiles, spawnFloatingText, addLog]);

  // 8. Status Ailments Ticking (Poison & Burn)
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatusEffects((prev) => {
        if (prev.poisonTurns === 0 && prev.burnTurns === 0) return prev;

        const cur = playerRef.current;
        let damage = 0;
        let newPoison = prev.poisonTurns;
        let newBurn = prev.burnTurns;

        if (newPoison > 0) {
          damage += 6;
          spawnFloatingText('-6 POISON', cur.x, cur.y, 'poison');
          addLog(`🤢 Poison ticks for 6 DMG! (${newPoison - 1} turns remaining)`, 'poison');
          newPoison -= 1;
        }

        if (newBurn > 0) {
          damage += 7;
          spawnFloatingText('-7 BURN', cur.x, cur.y, 'damage');
          addLog(`🔥 Burn ticks for 7 DMG! (${newBurn - 1} turns remaining)`, 'burn');
          newBurn -= 1;
        }

        if (damage > 0) {
          setPlayer((p) => {
            const nextHp = Math.max(0, p.hp - damage);
            if (nextHp <= 0) {
              sound.playDefeat();
              addLog('💀 Succumbed to poison and burn! Reviving at Oakhaven Hamlet...', 'defeat');
              return {
                ...p,
                hp: p.maxHp,
                mana: p.maxMana,
                x: 18,
                y: 19,
                deaths: p.deaths + 1,
              };
            }
            return { ...p, hp: nextHp };
          });
        }

        return { poisonTurns: newPoison, burnTurns: newBurn };
      });
    }, 3000);

    return () => clearInterval(statusInterval);
  }, [spawnFloatingText, addLog]);

  // 9. Object Interaction (Chests, NPCs, Campfires, Fountains)
  const handleInteractObject = useCallback(
    (obj: WorldObject) => {
      sound.playClick();

      if (obj.type === 'chest') {
        if (obj.opened) {
          addLog(`${obj.name} is already opened and emptied.`, 'info');
          return;
        }
        sound.playVictory();
        const gold = obj.loot?.gold || 50;
        setObjects((prev) =>
          prev.map((o) => (o.id === obj.id ? { ...o, opened: true } : o))
        );
        setPlayer((p) => {
          const updated = { ...p, gold: p.gold + gold };
          saveState(updated);
          return updated;
        });
        spawnFloatingText(`+${gold} Gold`, obj.x, obj.y, 'gold');
        addLog(`Unlocked ${obj.name}! Discovered +${gold} Gold & Ancient Artifacts!`, 'victory');
        return;
      }

      if (obj.type === 'campfire') {
        sound.playPotion();
        setPlayer((p) => {
          const updated = { ...p, hp: p.maxHp, mana: p.maxMana };
          saveState(updated);
          return updated;
        });
        setStatusEffects({ poisonTurns: 0, burnTurns: 0 });
        spawnFloatingText('RESTED & SAVED', obj.x, obj.y, 'heal');
        addLog('Rested by the Sacred Campfire. Full vitality restored and progress saved!', 'heal');
        return;
      }

      if (obj.type === 'fountain') {
        sound.playPotion();
        setPlayer((p) => {
          const updated = { ...p, hp: p.maxHp, mana: p.maxMana };
          saveState(updated);
          return updated;
        });
        setStatusEffects({ poisonTurns: 0, burnTurns: 0 });
        spawnFloatingText('PURIFIED', obj.x, obj.y, 'heal');
        addLog('Drank from enchanted fountain. All status ailments purged!', 'heal');
        return;
      }

      // Realm Travel Gateway
      if (obj.type === 'portal' || obj.id.includes('portal') || obj.id.includes('gateway')) {
        sound.playVictory();
        setIsRealmTravelOpen(true);
        return;
      }

      // PVP Duel Arena War Ring
      if (obj.id.includes('pvp_ring')) {
        sound.playSlash();
        setIsPvpArenaOpen(true);
        return;
      }

      // Advance Quest Object Interaction Objectives
      updateQuestProgress((o) => {
        if (o.type === 'interact_object') {
          if (o.targetId === obj.id) return true;
          if (o.targetId === 'fountain_or_campfire' && (obj.type === 'fountain' || obj.type === 'campfire')) return true;
          if (o.targetId === 'chest_ruins_1' && (obj.id === 'chest_ruins_1' || obj.id === 'chest_ruins_2')) return true;
        }
        return false;
      });

      // NPC / Shrine dialog modal
      setActiveNpcObject(obj);
    },
    [spawnFloatingText, addLog, saveState, updateQuestProgress]
  );

  // Check nearby object for HUD interaction prompt
  const nearbyObject = objects.find(
    (obj) => Math.hypot(obj.x - (player.x ?? 18), obj.y - (player.y ?? 19)) < 1.8
  ) || null;

  // Target cycle for controller / keyboard Tab
  const handleCycleTargetEnemy = useCallback(() => {
    const cur = playerRef.current;
    const activeMobs = mobsRef.current
      .filter((m) => m.hp > 0)
      .map((m) => ({ mob: m, dist: Math.hypot(m.x - (cur.x ?? 18), m.y - (cur.y ?? 19)) }))
      .filter((m) => m.dist < 18)
      .sort((a, b) => a.dist - b.dist);

    if (activeMobs.length === 0) return;
    const currentIndex = activeMobs.findIndex((m) => m.mob.instanceId === targetEnemy?.instanceId);
    const nextIndex = (currentIndex + 1) % activeMobs.length;
    setTargetEnemy(activeMobs[nextIndex].mob);
    sound.playClick();
  }, [targetEnemy]);

  // Xbox Gamepad and standard controller integration
  const { gamepadState, triggerRumble } = useGamepad({
    enabled: screen === 'PLAYING',
    onMove: movePlayer,
    onAction: handleCombatAction,
    onInteract: () => {
      if (nearbyObject) handleInteractObject(nearbyObject);
    },
    onCycleTarget: handleCycleTargetEnemy,
    onToggleInventory: () => setIsInventoryOpen((prev) => !prev),
    onToggleTech: () => setIsTechModalOpen((prev) => !prev),
    onToggleQuestLog: () => setIsQuestLogOpen((prev) => !prev),
  });

  useEffect(() => {
    triggerRumbleRef.current = triggerRumble;
  }, [triggerRumble]);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Tab cycles targets
      if (e.key === 'Tab') {
        e.preventDefault();
        handleCycleTargetEnemy();
        return;
      }

      // Movement
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        movePlayer(0, -0.4, 'up');
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        movePlayer(0, 0.4, 'down');
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        movePlayer(-0.4, 0, 'left');
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        movePlayer(0.4, 0, 'right');
      }

      // Combat Hotkeys
      else if (e.key === '1') handleCombatAction('attack');
      else if (e.key === '2') handleCombatAction('fireball');
      else if (e.key === '3') handleCombatAction('thunder');
      else if (e.key === '4') handleCombatAction('potion');
      else if (e.key === '5') handleCombatAction('whirlwind');
      else if (e.key === '6') handleCombatAction('frost_nova');
      else if (e.key === '7') handleCombatAction('thunder_smite');
      else if (e.key === '8') handleCombatAction('iron_bastion');

      // Interacting with nearby object
      else if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        if (nearbyObject) handleInteractObject(nearbyObject);
      }

      // Modals & Map
      else if (e.key === 'q' || e.key === 'Q') setIsQuestLogOpen((prev) => !prev);
      else if (e.key === 'c' || e.key === 'C') setIsCharacterCreationOpen(true);
      else if (e.key === 'b' || e.key === 'B') setIsInventoryOpen(true);
      else if (e.key === 't' || e.key === 'T') setIsTechModalOpen(true);
      else if (e.key === 'm' || e.key === 'M') {
        window.dispatchEvent(new CustomEvent('valdor:toggle-minimap'));
      }
      else if (e.key === 'l' || e.key === 'L') setIsMultiplayerModalOpen(true);
      else if (e.key === 'r' || e.key === 'R') setIsRealmTravelOpen((prev) => !prev);
      else if (e.key === 'p' || e.key === 'P') setIsPvpArenaOpen((prev) => !prev);
      else if (e.key === 'o' || e.key === 'O') setIsSaveDataOpen((prev) => !prev);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        setPlayer((p) => ({ ...p, isMoving: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [movePlayer, handleCombatAction, nearbyObject, handleInteractObject]);

  // Chat message submission
  const handleSendChat = (text: string) => {
    lanMultiplayer.sendChatMessage(player.name, text);
    addLog(text, 'chat', `${player.name} (You)`);
  };

  // Join or Host LAN Room
  const handleJoinRoom = (newRoomCode: string, asHost: boolean) => {
    setRoomCode(newRoomCode);
    setIsHost(asHost);
    lanMultiplayer.connect(newRoomCode, asHost);
    addLog(`Switched LAN session to room [${newRoomCode}].`, 'multiplayer');
  };

  // Audio Toggle
  const handleToggleMute = () => {
    sound.muted = !sound.muted;
    setIsMuted(sound.muted);
  };

  // Character Created Handler
  const handleCharacterCreated = (newHero: Player) => {
    setPlayer(newHero);
    playerRef.current = newHero;
    saveState(newHero);
    setIsCharacterCreationOpen(false);
    setScreen('PLAYING');
    addLog(`Hero ${newHero.name} forged! Welcome to Oakhaven Hamlet.`, 'heal');
  };

  // Merchant Buy Handler
  const handleBuyItem = (item: InventoryItem, cost: number) => {
    if (player.gold < cost) return;
    sound.playPotion();
    const updatedGold = player.gold - cost;
    const inv = loadSavedInventory();
    const existing = inv.find((i) => i.itemId === item.itemId);
    let updatedInv: InventoryItem[];
    if (existing) {
      updatedInv = inv.map((i) =>
        i.itemId === item.itemId ? { ...i, quantity: i.quantity + item.quantity } : i
      );
    } else {
      updatedInv = [...inv, item];
    }

    saveInventoryToStorage(updatedInv);
    setPlayer((p) => {
      const updated = { ...p, gold: updatedGold };
      saveState(updated);
      return updated;
    });

    spawnFloatingText(`-${cost}g`, player.x, player.y, 'gold');
    addLog(`Acquired ${item.name} for ${cost} Gold.`, 'info');
  };

  // Equipment Slot System Handlers
  const handleEquipItem = useCallback(
    (item: InventoryItem) => {
      setPlayer((prev) => {
        const { updatedPlayer } = equipItemToPlayer(prev, item);
        saveState(updatedPlayer);
        playerRef.current = updatedPlayer;
        sound.playVictory();
        spawnFloatingText(`EQUIPPED ${item.name}`, updatedPlayer.x, updatedPlayer.y, 'gold');
        addLog(
          `⚔️ Equipped [${item.name}]! Attributes amplified: Max HP ${updatedPlayer.maxHp}, Max MP ${updatedPlayer.maxMana}.`,
          'victory'
        );
        return updatedPlayer;
      });
    },
    [saveState, spawnFloatingText, addLog]
  );

  const handleUnequipItem = useCallback(
    (slot: EquipmentSlot) => {
      setPlayer((prev) => {
        const { updatedPlayer, unequippedItem } = unequipItemFromPlayer(prev, slot);
        saveState(updatedPlayer);
        playerRef.current = updatedPlayer;
        if (unequippedItem) {
          addLog(`Unequipped [${unequippedItem.name}].`, 'info');
        }
        return updatedPlayer;
      });
    },
    [saveState, addLog]
  );

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-950 font-mono select-none">
      {screen === 'TITLE' ? (
        <TitleScreen
          onStart={() => setScreen('PLAYING')}
          player={player}
          onOpenCharacterCreation={() => setIsCharacterCreationOpen(true)}
          onOpenTechModal={() => setIsTechModalOpen(true)}
          onOpenMultiplayer={() => setIsMultiplayerModalOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      ) : (
        <div className="relative w-full h-full overflow-hidden">
          {/* 2D Canvas Open World Renderer */}
          <OpenWorldCanvas
            player={player}
            mobs={mobs}
            objects={objects}
            peers={peers}
            projectiles={projectiles}
            lootDrops={lootDrops}
            floatingTexts={floatingTexts}
            tiles={worldMap.tiles}
            onInteractObject={handleInteractObject}
            onTargetMob={(mob) => setTargetEnemy(mob)}
            crtEnabled={crtEnabled}
          />

          {/* Open World HUD & Controls */}
          <OpenWorldHUD
            player={player}
            worldTiles={worldMap.tiles}
            targetEnemy={targetEnemy}
            mobs={mobs}
            objects={objects}
            logs={logs}
            statusEffects={statusEffects}
            rewardPreview={rewardPreview}
            peers={peers}
            isHost={isHost}
            roomCode={roomCode}
            ping={ping}
            onAction={handleCombatAction}
            onOpenMultiplayer={() => setIsMultiplayerModalOpen(true)}
            onOpenInventory={() => setIsInventoryOpen(true)}
            onOpenCharacterCreation={() => setIsCharacterCreationOpen(true)}
            onOpenTechModal={() => setIsTechModalOpen(true)}
            onOpenQuestLog={() => setIsQuestLogOpen(true)}
            onClaimQuestReward={handleClaimQuestReward}
            onToggleMute={handleToggleMute}
            isMuted={isMuted}
            crtEnabled={crtEnabled}
            onToggleCrt={() => setCrtEnabled(!crtEnabled)}
            onSendChat={handleSendChat}
            nearbyObject={nearbyObject}
            onInteract={() => nearbyObject && handleInteractObject(nearbyObject)}
            onSelectMonster={(mob) => setTargetEnemy(mob)}
            gamepadConnected={gamepadState.connected}
            gamepadName={gamepadState.id}
            touchControlsEnabled={touchControlsEnabled}
            onToggleTouchControls={() => setTouchControlsEnabled((prev) => !prev)}
            onOpenRealmTravel={() => setIsRealmTravelOpen(true)}
            onOpenPvpArena={() => setIsPvpArenaOpen(true)}
            onOpenSaveData={() => setIsSaveDataOpen(true)}
          />

          {/* Android Virtual Touch Controls */}
          <TouchControls
            player={player}
            nearbyObject={nearbyObject}
            onMove={movePlayer}
            onAction={handleCombatAction}
            onInteract={() => nearbyObject && handleInteractObject(nearbyObject)}
            onToggleInventory={() => setIsInventoryOpen((prev) => !prev)}
            visible={touchControlsEnabled}
          />
        </div>
      )}

      {/* LAN Multiplayer Modal */}
      <LanMultiplayerModal
        isOpen={isMultiplayerModalOpen}
        onClose={() => setIsMultiplayerModalOpen(false)}
        peers={peers}
        roomCode={roomCode}
        isHost={isHost}
        ping={ping}
        onJoinRoom={handleJoinRoom}
      />

      {/* Character Creation Modal */}
      <CharacterCreationModal
        isOpen={isCharacterCreationOpen}
        onClose={() => setIsCharacterCreationOpen(false)}
        onCharacterCreated={handleCharacterCreated}
        currentPlayer={player}
      />

      {/* Tech & Architecture Inspector Modal */}
      <TechInspectorModal
        isOpen={isTechModalOpen}
        player={player}
        onClose={() => setIsTechModalOpen(false)}
        onReloadXml={loadBestiaryFromXml}
        onUnlockOrUpgradeSkill={handleUnlockOrUpgradeSkill}
        onRespecSkills={handleRespecSkills}
      />

      {/* Inventory Knapsack & Equipment Modal */}
      <InventoryModal
        isOpen={isInventoryOpen}
        player={player}
        onClose={() => setIsInventoryOpen(false)}
        onEquipItem={handleEquipItem}
        onUnequipItem={handleUnequipItem}
        onUseItem={(item) => {
          if (item.type === 'potion') {
            setPlayer((p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + item.power) }));
            setStatusEffects({ poisonTurns: 0, burnTurns: 0 });
            spawnFloatingText(`+${item.power} HP`, player.x, player.y, 'heal');
            addLog(`Quaffed ${item.name}! Restored +${item.power} HP and purified toxins.`, 'heal');
          }
        }}
      />

      {/* World NPC & Object Interaction Modal */}
      <WorldNPCModal
        object={activeNpcObject}
        player={player}
        onClose={() => setActiveNpcObject(null)}
        onRest={() => {
          setPlayer((p) => ({ ...p, hp: p.maxHp, mana: p.maxMana }));
          setStatusEffects({ poisonTurns: 0, burnTurns: 0 });
          saveState();
          spawnFloatingText('RESTED', player.x, player.y, 'heal');
          addLog('Rested by the Sacred Campfire. Progress saved to client database.', 'heal');
        }}
        onDrinkFountain={() => {
          setPlayer((p) => ({ ...p, hp: p.maxHp, mana: p.maxMana }));
          setStatusEffects({ poisonTurns: 0, burnTurns: 0 });
          spawnFloatingText('PURIFIED', player.x, player.y, 'heal');
          addLog('Drank from sacred fountain. Full vitality restored!', 'heal');
        }}
        onBuyItem={handleBuyItem}
      />

      {/* Quest Chronicles & Tracking Journal Modal */}
      <QuestLogModal
        isOpen={isQuestLogOpen}
        onClose={() => setIsQuestLogOpen(false)}
        quests={player.quests || []}
        activeQuestId={player.activeQuestId}
        onSelectTrackedQuest={(qId) => {
          setPlayer((p) => {
            const updated = { ...p, activeQuestId: qId };
            saveState(updated);
            return updated;
          });
        }}
        onClaimReward={handleClaimQuestReward}
      />

      {/* 12 Realms Multiverse Travel Modal */}
      <RealmTravelModal
        isOpen={isRealmTravelOpen}
        currentRealmId={currentRealmId}
        player={player}
        onClose={() => setIsRealmTravelOpen(false)}
        onTravelToRealm={handleTravelToRealm}
      />

      {/* PVP Arena & Gladiator Colosseum Modal */}
      <PvpArenaModal
        isOpen={isPvpArenaOpen}
        player={player}
        onClose={() => setIsPvpArenaOpen(false)}
        onTogglePvp={handleTogglePvp}
        onStartDuel={handleStartGladiatorDuel}
      />

      {/* Save Data Export & Import Modal */}
      <SaveDataModal
        isOpen={isSaveDataOpen}
        player={player}
        inventory={loadSavedInventory()}
        worldObjects={objects}
        onClose={() => setIsSaveDataOpen(false)}
        onImportSave={handleImportSave}
      />
    </div>
  );
}
