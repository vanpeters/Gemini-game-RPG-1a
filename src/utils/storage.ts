import { Player, WorldObject, InventoryItem } from '../types/rpg';
import { DEFAULT_INVENTORY } from './combatEngine';
import { INITIAL_QUESTS } from './questData';

import { getInitialExploredTiles } from './fogOfWar';
import { recalculatePlayerStats } from './equipment';

const PLAYER_STORAGE_KEY = 'valdor_rpg_player_save_v2';
const OBJECTS_STORAGE_KEY = 'valdor_rpg_world_objects_v2';
const INVENTORY_STORAGE_KEY = 'valdor_rpg_inventory_v2';

export const DEFAULT_PLAYER: Player = {
  id: 1,
  name: 'Valen the Brave',
  class: 'Rune Knight',
  styleId: 'knight',
  sprite: '🛡️',
  level: 1,
  baseMaxHp: 100,
  baseMaxMana: 50,
  hp: 136,
  maxHp: 136,
  mana: 50,
  maxMana: 50,
  gold: 30,
  xp: 0,
  wins: 0,
  deaths: 0,
  source: 'Local Client DB (Web Storage)',
  x: 18,
  y: 19,
  direction: 'down',
  isMoving: false,
  activeQuestId: 'quest_wildwood_patrol',
  quests: INITIAL_QUESTS,
  completedQuestIds: [],
  exploredBiomes: ['oakhaven'],
  exploredTiles: getInitialExploredTiles(18, 19, 8),
  equipped: {
    weapon: { id: 1, itemId: 'sword_iron', name: 'Iron Broadsword', type: 'weapon', power: 14, quantity: 1, icon: '⚔️', description: 'Sturdy steel forged in Oakhaven. +14 ATK.' },
    shield: { id: 2, itemId: 'shield_wooden', name: 'Oak Buckler', type: 'shield', power: 6, quantity: 1, icon: '🛡️', description: 'Light wooden shield. +6 DEF, +12 Max HP.' },
    armor: { id: 3, itemId: 'armor_leather', name: 'Traveler Tunic', type: 'armor', power: 8, quantity: 1, icon: '🥋', description: 'Boiled leather jerkin. +6 DEF, +24 Max HP.' },
    relic: null,
  },
  skillPoints: 1,
  unlockedSkills: {},
  currentRealmId: 1,
  discoveredRealms: [1],
  realmExploredTiles: { 1: getInitialExploredTiles(20, 22, 8) },
  pvpEnabled: false,
  pvpKills: 0,
  pvpDeaths: 0,
  pvpHonor: 0,
  pvpRank: 'Recruit',
};

export function loadSavedPlayer(): Player {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge saved quests with any newer initial quests to guarantee up-to-date missions
      let mergedQuests = INITIAL_QUESTS.map((initQ) => {
        const savedQ = (parsed.quests || []).find((q: any) => q.id === initQ.id);
        if (savedQ) {
          return {
            ...initQ,
            ...savedQ,
            reward: initQ.reward, // preserve reward item definitions
          };
        }
        return initQ;
      });

      const initialExplored = getInitialExploredTiles(parsed.x || 20, parsed.y || 22, 8);
      const savedExplored = Array.isArray(parsed.exploredTiles) && parsed.exploredTiles.length > 0
        ? parsed.exploredTiles
        : initialExplored;

      const loaded: Player = {
        ...DEFAULT_PLAYER,
        ...parsed,
        quests: mergedQuests,
        activeQuestId: parsed.activeQuestId || 'quest_wildwood_patrol',
        completedQuestIds: parsed.completedQuestIds || [],
        exploredBiomes: parsed.exploredBiomes || ['oakhaven'],
        exploredTiles: savedExplored,
        equipped: parsed.equipped ?? DEFAULT_PLAYER.equipped,
        baseMaxHp: parsed.baseMaxHp ?? 100 + ((parsed.level || 1) - 1) * 25,
        baseMaxMana: parsed.baseMaxMana ?? 50 + ((parsed.level || 1) - 1) * 15,
        skillPoints: parsed.skillPoints !== undefined ? parsed.skillPoints : 1,
        unlockedSkills: parsed.unlockedSkills || {},
        currentRealmId: parsed.currentRealmId || 1,
        discoveredRealms: Array.isArray(parsed.discoveredRealms) && parsed.discoveredRealms.length > 0
          ? parsed.discoveredRealms
          : [1],
        realmExploredTiles: parsed.realmExploredTiles || { [parsed.currentRealmId || 1]: savedExplored },
        pvpEnabled: Boolean(parsed.pvpEnabled),
        pvpKills: parsed.pvpKills || 0,
        pvpDeaths: parsed.pvpDeaths || 0,
        pvpHonor: parsed.pvpHonor || 0,
        pvpRank: parsed.pvpRank || 'Recruit',
        source: 'Client-Side Persistent DB',
      };
      return recalculatePlayerStats(loaded);
    }
  } catch (e) {
    console.warn('Could not read player from local storage:', e);
  }
  return recalculatePlayerStats({ ...DEFAULT_PLAYER });
}

export function savePlayerToStorage(player: Player): void {
  try {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
  } catch (e) {
    console.warn('Could not save player to local storage:', e);
  }
}

export function loadSavedInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [...DEFAULT_INVENTORY];
}

export function saveInventoryToStorage(items: InventoryItem[]): void {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function loadSavedWorldObjects(defaultObjects: WorldObject[]): WorldObject[] {
  try {
    const raw = localStorage.getItem(OBJECTS_STORAGE_KEY);
    if (raw) {
      const savedOpened = JSON.parse(raw) as Record<string, boolean>;
      return defaultObjects.map((obj) => ({
        ...obj,
        opened: savedOpened[obj.id] ?? obj.opened,
      }));
    }
  } catch {}
  return defaultObjects;
}

export function saveWorldObjectsState(objects: WorldObject[]): void {
  try {
    const map: Record<string, boolean> = {};
    objects.forEach((obj) => {
      if (obj.opened) map[obj.id] = true;
    });
    localStorage.setItem(OBJECTS_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

/**
 * Returns an active SQL relational dump of the player and inventory state
 * providing full SQL visibility without requiring a C++ server process.
 */
export function generateSqlDump(player: Player, inventory: InventoryItem[]): string {
  return `-- Relational Database Schema & State
-- Generated client-side for Ruins of Valdor

CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    hp INTEGER DEFAULT 100,
    max_hp INTEGER DEFAULT 100,
    mana INTEGER DEFAULT 50,
    max_mana INTEGER DEFAULT 50,
    gold INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    x REAL DEFAULT 18.0,
    y REAL DEFAULT 19.0,
    wins INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO characters (id, name, class, level, hp, max_hp, mana, max_mana, gold, xp, x, y, wins, deaths)
VALUES (
    ${player.id},
    '${player.name.replace(/'/g, "''")}',
    '${player.class.replace(/'/g, "''")}',
    ${player.level},
    ${player.hp},
    ${player.maxHp},
    ${player.mana},
    ${player.maxMana},
    ${player.gold},
    ${player.xp},
    ${player.x ?? 18},
    ${player.y ?? 19},
    ${player.wins},
    ${player.deaths}
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY,
    item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    power INTEGER,
    quantity INTEGER
);

${inventory
  .map(
    (item) =>
      `INSERT OR REPLACE INTO inventory (id, item_id, name, type, power, quantity) VALUES (${item.id}, '${item.itemId}', '${item.name}', '${item.type}', ${item.power}, ${item.quantity});`
  )
  .join('\n')}

CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    completed_objectives INTEGER,
    total_objectives INTEGER
);

${(player.quests || [])
  .map(
    (q) => {
      const completedObjs = q.objectives.filter(o => o.completed).length;
      return `INSERT OR REPLACE INTO quests (id, title, category, status, completed_objectives, total_objectives) VALUES ('${q.id}', '${q.title.replace(/'/g, "''")}', '${q.category}', '${q.status}', ${completedObjs}, ${q.objectives.length});`;
    }
  )
  .join('\n')}
`;
}
