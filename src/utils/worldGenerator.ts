import { BiomeType, WorldObject, WorldMonster, Monster } from '../types/rpg';
import { getRealmById, REALMS } from './realmsData';

export const WORLD_WIDTH = 100; // expanded to 100x100 tiles
export const WORLD_HEIGHT = 100; // expanded to 100x100 tiles
export const TILE_SIZE = 48; // px

export type TileType =
  | 'grass'
  | 'dirt'
  | 'cobblestone'
  | 'stone_slab'
  | 'wood_plank'
  | 'water'
  | 'deep_water'
  | 'lava'
  | 'wall'
  | 'tree'
  | 'ruin_pillar'
  | 'swamp_mud'
  | 'snow'
  | 'ice'
  | 'sand'
  | 'sandstone'
  | 'obsidian'
  | 'void_stone'
  | 'crystal'
  | 'dungeon_floor'
  | 'dungeon_wall';

export interface WorldMapData {
  tiles: TileType[][];
  objects: WorldObject[];
}

export function getBiomeAt(x: number, y: number): BiomeType {
  if (x >= 65 && y >= 65) return 'caldera';
  if (x >= 50 && y >= 45) return 'mire';
  if (y >= 45 && x <= 48) return 'ruins';
  if (x >= 40 && y <= 45) return 'wildwood';
  return 'oakhaven';
}

/**
 * Procedurally generates the 100x100 open world map for a given Realm (1 to 12)
 * Each realm features:
 * - Its own distinct Town with Town Elder, Blacksmith, Alchemist, Rejuvenation Fountain,
 *   Sacred Campfire, Realm Portal Gateway, and PVP Duel War Ring.
 * - Expansive themed wilderness terrain.
 * - An ominous Dungeon Sector with stone walls, elite guards, a grand Boss Sanctum, and a Realm Vault coffer!
 */
export function generateRealmWorld(realmId: number = 1): WorldMapData {
  const realm = getRealmById(realmId);
  const tiles: TileType[][] = [];

  // Theme-specific base tiles
  let naturalFloor: TileType = 'grass';
  let naturalPillar: TileType = 'tree';
  let naturalPath: TileType = 'dirt';
  let naturalLiquid: TileType = 'water';
  let townStreet: TileType = 'cobblestone';

  switch (realm.theme) {
    case 'glacial':
      naturalFloor = 'snow';
      naturalPillar = 'crystal';
      naturalPath = 'stone_slab';
      naturalLiquid = 'ice';
      townStreet = 'stone_slab';
      break;
    case 'volcanic':
      naturalFloor = 'dirt';
      naturalPillar = 'ruin_pillar';
      naturalPath = 'stone_slab';
      naturalLiquid = 'lava';
      townStreet = 'stone_slab';
      break;
    case 'oceanic':
      naturalFloor = 'sand';
      naturalPillar = 'ruin_pillar';
      naturalPath = 'wood_plank';
      naturalLiquid = 'water';
      townStreet = 'wood_plank';
      break;
    case 'sylvan':
      naturalFloor = 'grass';
      naturalPillar = 'tree';
      naturalPath = 'dirt';
      naturalLiquid = 'water';
      townStreet = 'wood_plank';
      break;
    case 'necropolis':
      naturalFloor = 'stone_slab';
      naturalPillar = 'ruin_pillar';
      naturalPath = 'dirt';
      naturalLiquid = 'swamp_mud';
      townStreet = 'stone_slab';
      break;
    case 'celestial':
      naturalFloor = 'stone_slab';
      naturalPillar = 'crystal';
      naturalPath = 'cobblestone';
      naturalLiquid = 'water';
      townStreet = 'cobblestone';
      break;
    case 'swamp':
      naturalFloor = 'swamp_mud';
      naturalPillar = 'tree';
      naturalPath = 'dirt';
      naturalLiquid = 'water';
      townStreet = 'wood_plank';
      break;
    case 'desert':
      naturalFloor = 'sand';
      naturalPillar = 'ruin_pillar';
      naturalPath = 'sandstone';
      naturalLiquid = 'water';
      townStreet = 'sandstone';
      break;
    case 'obsidian':
      naturalFloor = 'obsidian';
      naturalPillar = 'ruin_pillar';
      naturalPath = 'stone_slab';
      naturalLiquid = 'lava';
      townStreet = 'obsidian';
      break;
    case 'astral':
      naturalFloor = 'void_stone';
      naturalPillar = 'crystal';
      naturalPath = 'stone_slab';
      naturalLiquid = 'deep_water';
      townStreet = 'stone_slab';
      break;
    case 'abyss':
      naturalFloor = 'obsidian';
      naturalPillar = 'ruin_pillar';
      naturalPath = 'stone_slab';
      naturalLiquid = 'lava';
      townStreet = 'obsidian';
      break;
    default:
      naturalFloor = 'grass';
      naturalPillar = 'tree';
      naturalPath = 'dirt';
      naturalLiquid = 'water';
      townStreet = 'cobblestone';
      break;
  }

  // 1. Generate Base Terrain & Town/Dungeon Zones
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      // Outer World boundary walls
      if (x === 0 || y === 0 || x === WORLD_WIDTH - 1 || y === WORLD_HEIGHT - 1) {
        row.push('wall');
        continue;
      }

      // Town Zone (x: 14 to 38, y: 14 to 38)
      const inTown = x >= 14 && x <= 38 && y >= 14 && y <= 38;
      if (inTown) {
        // Town outer defensive perimeter walls with gates
        if (
          (x === 14 || x === 38 || y === 14 || y === 38) &&
          !(y >= 24 && y <= 27 && (x === 14 || x === 38)) &&
          !(x >= 24 && x <= 27 && (y === 14 || y === 38))
        ) {
          row.push('wall');
          continue;
        }

        // Town Main Streets (Crossroads)
        const isMainAvenueX = y >= 24 && y <= 26;
        const isMainAvenueY = x >= 24 && x <= 26;
        if (isMainAvenueX || isMainAvenueY) {
          row.push(townStreet);
          continue;
        }

        // Town Buildings
        // Elder's Lodge (x: 18-22, y: 18-22)
        if (x >= 18 && x <= 22 && y >= 18 && y <= 22) {
          if (x === 18 || x === 22 || y === 18 || (y === 22 && x !== 20)) {
            row.push('wall');
          } else {
            row.push('wood_plank');
          }
          continue;
        }

        // Blacksmith Forge (x: 29-33, y: 18-22)
        if (x >= 29 && x <= 33 && y >= 18 && y <= 22) {
          if (x === 29 || x === 33 || y === 18 || (y === 22 && x !== 31)) {
            row.push('wall');
          } else {
            row.push('stone_slab');
          }
          continue;
        }

        // Alchemist Apothecary (x: 18-22, y: 29-33)
        if (x >= 18 && x <= 22 && y >= 29 && y <= 33) {
          if (x === 18 || x === 22 || y === 33 || (y === 29 && x !== 20)) {
            row.push('wall');
          } else {
            row.push('wood_plank');
          }
          continue;
        }

        // PVP Duel Arena Ring in Town (x: 29-35, y: 29-35)
        if (x >= 29 && x <= 35 && y >= 29 && y <= 35) {
          if (x === 29 || x === 35 || y === 29 || y === 35) {
            row.push('stone_slab');
          } else {
            row.push('dirt');
          }
          continue;
        }

        // Town plaza open space
        row.push(townStreet);
        continue;
      }

      // Dungeon Sector (x: 62 to 94, y: 62 to 94)
      const inDungeon = x >= 62 && x <= 94 && y >= 62 && y <= 94;
      if (inDungeon) {
        // Dungeon Outer Fortress Wall
        if (
          (x === 62 || x === 94 || y === 62 || y === 94) &&
          !(x === 64 && y === 62) &&
          !(y === 64 && x === 62)
        ) {
          row.push('dungeon_wall');
          continue;
        }

        // Boss Sanctum Chamber (x: 80 to 92, y: 80 to 92)
        const inBossRoom = x >= 80 && x <= 92 && y >= 80 && y <= 92;
        if (inBossRoom) {
          if (
            (x === 80 || x === 92 || y === 80 || y === 92) &&
            !(x >= 85 && x <= 87 && y === 80)
          ) {
            row.push('dungeon_wall');
          } else {
            row.push('dungeon_floor');
          }
          continue;
        }

        // Dungeon Corridor & Vault Grid Pattern
        const isWallGrid = (x % 6 === 0 || y % 6 === 0) && Math.sin(x * 1.5 + y) > -0.2;
        if (isWallGrid && Math.hypot(x - 64, y - 64) > 3) {
          row.push('dungeon_wall');
        } else {
          row.push('dungeon_floor');
        }
        continue;
      }

      // Wilderness Procedural Landscaping
      const noiseA = Math.sin(x * 0.18) + Math.cos(y * 0.18);
      const noiseB = Math.cos(x * 0.4) * Math.sin(y * 0.4);

      // Liquid pools / rivers
      if (noiseA > 1.35) {
        row.push(naturalLiquid);
      } else if (noiseB > 0.65) {
        row.push(naturalPillar);
      } else if (Math.sin(x * 0.1 + y * 0.1) > 0.7) {
        row.push(naturalPath);
      } else {
        row.push(naturalFloor);
      }
    }
    tiles.push(row);
  }

  // 2. Predefined Interactive World Objects for this Realm
  const town = realm.town;
  const dung = realm.dungeon;

  const objects: WorldObject[] = [
    // Town NPCs
    {
      id: `obj_elder_${realm.id}`,
      type: 'npc',
      x: 20,
      y: 20,
      name: `${town.elderName}`,
      icon: town.elderIcon,
      biome: 'oakhaven',
      description: `${town.elderTitle} of ${town.name}.`,
      interactionPrompt: `Press [E] to speak with ${town.elderName}`,
      dialogue: [
        `Welcome to ${town.name}, traveler of the Twelve Realms!`,
        realm.lore,
        `Beware ${dung.name} to the southeast. ${dung.bossName} stirs within!`,
        `Use the Ancient Realm Gateway in town square to travel between discovered worlds.`,
      ],
    },
    {
      id: `obj_smith_${realm.id}`,
      type: 'npc',
      x: 31,
      y: 20,
      name: town.smithName,
      icon: '⚒️',
      biome: 'oakhaven',
      description: 'Master armorer and weapon forger.',
      interactionPrompt: `Press [E] to consult Forge`,
      dialogue: [
        `Looking for heavy armor or sharper steel for ${realm.name}?`,
        `Slay the beasts in ${dung.name} and bring back their cores!`,
      ],
    },
    {
      id: `obj_alchemist_${realm.id}`,
      type: 'npc',
      x: 20,
      y: 31,
      name: town.alchemistName,
      icon: '🧪',
      biome: 'oakhaven',
      description: 'Purveyor of health tonics, mana elixirs, and cures.',
      interactionPrompt: `Press [E] to browse Tonics`,
      dialogue: [
        `The beasts of ${realm.name} are unforgiving. Stock up on Crimson Potions [4]!`,
        `Our sacred rejuvenation spring in town will instantly restore full health and mana.`,
      ],
    },

    // Town Plaza Features
    {
      id: `obj_fountain_${realm.id}`,
      type: 'fountain',
      x: 25,
      y: 24,
      name: `Rejuvenation Spring of ${town.name}`,
      icon: '⛲',
      biome: 'oakhaven',
      description: 'Enchanted waters bubbling with revitalizing mana.',
      interactionPrompt: 'Press [E] to drink and restore full HP & Mana',
    },
    {
      id: `obj_campfire_${realm.id}`,
      type: 'campfire',
      x: 25,
      y: 27,
      name: `Sacred Hearth of ${town.name}`,
      icon: '🔥',
      biome: 'oakhaven',
      description: 'A crackling communal campfire offering respite and saving your progress.',
      interactionPrompt: 'Press [E] to rest and save progress',
    },

    // Realm Fast Travel Gateway Portal
    {
      id: `obj_portal_gateway_${realm.id}`,
      type: 'portal',
      x: 25,
      y: 21,
      name: `Ancient Realm Gateway [World ${realm.id}/12]`,
      icon: '🌀',
      biome: 'oakhaven',
      description: 'Humming celestial portal connecting the Twelve Realms of the Multiverse.',
      interactionPrompt: 'Press [E] to activate Realm Travel Gateway',
    },

    // PVP War Ring Banner / Duelist
    {
      id: `obj_pvp_ring_${realm.id}`,
      type: 'shrine',
      x: 32,
      y: 32,
      name: 'PVP War Ring & Duel Arena',
      icon: '⚔️',
      biome: 'oakhaven',
      description: 'The town dueling circle. Challenge gladiator champions or toggle PVP mode.',
      interactionPrompt: 'Press [E] to enter PVP Duels & Arena',
    },

    // Wilderness POIs & Chests
    {
      id: `chest_wild_${realm.id}_1`,
      type: 'chest',
      x: 48,
      y: 24,
      name: `${realm.name} Explorer Cache`,
      icon: '📦',
      opened: false,
      biome: 'wildwood',
      description: 'A weathered strongbox tucked in the wild.',
      interactionPrompt: 'Press [E] to unlock cache',
      loot: { gold: 50 * realm.id, potion: 'Crimson Elixir' },
    },
    {
      id: `chest_wild_${realm.id}_2`,
      type: 'chest',
      x: 24,
      y: 58,
      name: `${realm.name} Forgotten Coffer`,
      icon: '📦',
      opened: false,
      biome: 'wildwood',
      description: 'An ancient coffer overgrown by local flora.',
      interactionPrompt: 'Press [E] to open coffer',
      loot: { gold: 75 * realm.id, potion: 'Mana Draught' },
    },
    {
      id: `shrine_wild_${realm.id}`,
      type: 'shrine',
      x: 52,
      y: 52,
      name: `Monolith of ${realm.name}`,
      icon: '⛩️',
      biome: 'ruins',
      description: 'An ancient monolith pulsating with primordial elemental energy.',
      interactionPrompt: 'Press [E] to commune with the Monolith',
    },

    // Dungeon Complex POIs
    {
      id: `obj_dungeon_gate_${realm.id}`,
      type: 'portal',
      x: 64,
      y: 64,
      name: `Dungeon Gate: ${dung.name}`,
      icon: '🚪',
      biome: 'ruins',
      description: `${dung.subtitle}. Enter at your own peril!`,
      interactionPrompt: `Press [E] to inspect Dungeon Gate (${dung.name})`,
    },
    {
      id: `chest_dungeon_${realm.id}_vault`,
      type: 'chest',
      x: 88,
      y: 84,
      name: `Grand Vault of ${dung.bossName}`,
      icon: '👑',
      opened: false,
      biome: 'caldera',
      description: `Guarded by ${dung.bossName}! Contains the legendary [${dung.uniqueLootName}].`,
      interactionPrompt: 'Press [E] to plunder the Grand Vault',
      loot: { gold: dung.bossGold, item: dung.uniqueLootName },
    },
    {
      id: `obj_dungeon_exit_portal_${realm.id}`,
      type: 'portal',
      x: 82,
      y: 84,
      name: `Sanctum Teleport Glyph (Return to ${town.name})`,
      icon: '💠',
      biome: 'caldera',
      description: 'Ancient arcane glyph that teleports back to the town square.',
      interactionPrompt: `Press [E] to teleport to ${town.name}`,
    },
  ];

  return { tiles, objects };
}

/**
 * Backwards compatibility for single-world callers
 */
export function generateOpenWorld(): WorldMapData {
  return generateRealmWorld(1);
}

/**
 * Checks if a tile coordinate blocks movement
 */
export function isTileCollidable(tiles: TileType[][], x: number, y: number): boolean {
  if (x < 0 || y < 0 || y >= tiles.length || x >= tiles[0].length) {
    return true;
  }
  const tile = tiles[y][x];
  return (
    tile === 'wall' ||
    tile === 'tree' ||
    tile === 'ruin_pillar' ||
    tile === 'water' ||
    tile === 'deep_water' ||
    tile === 'lava' ||
    tile === 'dungeon_wall' ||
    tile === 'crystal'
  );
}

/**
 * Spawns monsters for a given Realm based on bestiary XML templates and realm difficulty level
 */
export function spawnRealmMonsters(realmId: number = 1, bestiary: Monster[]): WorldMonster[] {
  if (!bestiary || bestiary.length === 0) return [];

  const realm = getRealmById(realmId);
  const dung = realm.dungeon;
  const mobs: WorldMonster[] = [];

  const findMob = (id: string): Monster => {
    return bestiary.find((m) => m.id === id) || bestiary[0];
  };

  // 1. Wilderness wandering monsters (scaled by realm recommended level)
  const wildernessDefs = [
    { templateId: 'goblin', x: 44, y: 22, patrolRadius: 5 },
    { templateId: 'goblin_spearman', x: 48, y: 28, patrolRadius: 6 },
    { templateId: 'dire_wolf', x: 54, y: 20, patrolRadius: 6 },
    { templateId: 'woodland_sprite', x: 58, y: 32, patrolRadius: 5 },
    { templateId: 'bandit_rogue', x: 42, y: 44, patrolRadius: 5 },
    { templateId: 'venom_spitter', x: 54, y: 48, patrolRadius: 5 },
    { templateId: 'skeleton', x: 34, y: 56, patrolRadius: 5 },
    { templateId: 'skeleton_archer', x: 46, y: 62, patrolRadius: 6 },
    { templateId: 'toxic_sludge', x: 56, y: 60, patrolRadius: 5 },
  ];

  wildernessDefs.forEach((def, idx) => {
    const template = findMob(def.templateId);
    const lvl = realm.recommendedLevel + Math.floor(idx / 3);
    const hp = template.maxHp + (lvl - 1) * 22;
    const atk = template.atk + (lvl - 1) * 4;

    mobs.push({
      ...template,
      instanceId: `mob_r${realmId}_w_${def.templateId}_${idx}`,
      x: def.x,
      y: def.y,
      startX: def.x,
      startY: def.y,
      patrolTargetX: def.x,
      patrolTargetY: def.y,
      biome: 'wildwood',
      state: 'patrol',
      targetPlayerId: null,
      lastAttackTime: 0,
      level: lvl,
      aggroRadius: 5.5,
      attackRange: 1.4,
      speed: def.templateId === 'dire_wolf' ? 2.0 : 1.2,
      maxHp: hp,
      hp: hp,
      atk: atk,
      gold: template.gold + lvl * 8,
      expReward: template.expReward + lvl * 12,
      isDefending: false,
      patrolRadius: def.patrolRadius,
    });
  });

  // 2. Dungeon Sector Elite Guardians
  const dungeonDefs = [
    { templateId: 'orc_warrior', x: 68, y: 66, patrolRadius: 4 },
    { templateId: 'phantom_knight', x: 74, y: 66, patrolRadius: 4 },
    { templateId: 'abyssal_cultist', x: 74, y: 74, patrolRadius: 5 },
    { templateId: 'gargoyle_sentinel', x: 80, y: 70, patrolRadius: 3 },
    { templateId: 'orc_berserker', x: 70, y: 80, patrolRadius: 4 },
    { templateId: 'magma_golem', x: 78, y: 82, patrolRadius: 4 },
    { templateId: 'fire_elemental', x: 86, y: 76, patrolRadius: 4 },
  ];

  dungeonDefs.forEach((def, idx) => {
    const template = findMob(def.templateId);
    const lvl = dung.bossLevel - 2 + (idx % 2);
    const hp = template.maxHp + (lvl - 1) * 30;
    const atk = template.atk + (lvl - 1) * 5;

    mobs.push({
      ...template,
      instanceId: `mob_r${realmId}_d_${def.templateId}_${idx}`,
      x: def.x,
      y: def.y,
      startX: def.x,
      startY: def.y,
      patrolTargetX: def.x,
      patrolTargetY: def.y,
      biome: 'ruins',
      state: 'patrol',
      targetPlayerId: null,
      lastAttackTime: 0,
      level: lvl,
      aggroRadius: 6,
      attackRange: 1.4,
      speed: 1.1,
      maxHp: hp,
      hp: hp,
      atk: atk,
      gold: template.gold + lvl * 14,
      expReward: template.expReward + lvl * 18,
      isDefending: false,
      patrolRadius: def.patrolRadius,
    });
  });

  // 3. Dungeon Realm Boss
  const baseBossTemplate = findMob('dragon');
  mobs.push({
    ...baseBossTemplate,
    id: dung.bossId,
    name: `${dung.bossName} [BOSS]`,
    instanceId: `boss_r${realmId}_${dung.bossId}`,
    sprite: dung.bossIcon,
    x: dung.bossX,
    y: dung.bossY,
    startX: dung.bossX,
    startY: dung.bossY,
    patrolTargetX: dung.bossX,
    patrolTargetY: dung.bossY,
    biome: 'caldera',
    state: 'patrol',
    targetPlayerId: null,
    lastAttackTime: 0,
    level: dung.bossLevel,
    aggroRadius: 8,
    attackRange: 1.8,
    speed: 1.4,
    maxHp: dung.bossHp,
    hp: dung.bossHp,
    atk: dung.bossAtk,
    gold: dung.bossGold,
    expReward: dung.bossExp,
    isDefending: false,
    patrolRadius: 5,
    lore: `${dung.bossTitle} - Rules ${dung.name} in ${realm.name}.`,
    specialAbility: 'berserk',
    specialMove: 'Cataclysmic Ruin',
  });

  return mobs;
}

/**
 * Backwards compatibility for single-world callers
 */
export function spawnOpenWorldMonsters(bestiary: Monster[]): WorldMonster[] {
  return spawnRealmMonsters(1, bestiary);
}
