import { BiomeType, WorldObject, WorldMonster, Monster } from '../types/rpg';

export const WORLD_WIDTH = 80; // tiles
export const WORLD_HEIGHT = 80; // tiles
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
  | 'swamp_mud';

export interface WorldMapData {
  tiles: TileType[][];
  objects: WorldObject[];
}

export function getBiomeAt(x: number, y: number): BiomeType {
  if (x >= 52 && y >= 60) return 'caldera';
  if (x >= 40 && y >= 38) return 'mire';
  if (y >= 36 && x <= 38) return 'ruins';
  if (x >= 30 && y <= 36) return 'wildwood';
  return 'oakhaven';
}

/**
 * Procedurally generates the 80x80 open world map
 */
export function generateOpenWorld(): WorldMapData {
  const tiles: TileType[][] = [];

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      // World boundary walls
      if (x === 0 || y === 0 || x === WORLD_WIDTH - 1 || y === WORLD_HEIGHT - 1) {
        row.push('wall');
        continue;
      }

      const biome = getBiomeAt(x, y);

      if (biome === 'oakhaven') {
        // Village paths & buildings
        if ((x >= 14 && x <= 22 && (y === 18 || y === 19)) || (y >= 14 && y <= 24 && (x === 18 || x === 19))) {
          row.push('cobblestone');
        } else if ((x >= 12 && x <= 16 && y >= 12 && y <= 15) || (x >= 21 && x <= 25 && y >= 12 && y <= 15)) {
          // Houses
          if (x === 12 || x === 16 || y === 12 || (x === 21 || x === 25 || y === 12)) {
            row.push('wall');
          } else {
            row.push('wood_plank');
          }
        } else if (Math.random() < 0.05) {
          row.push('tree');
        } else {
          row.push('grass');
        }
      } else if (biome === 'wildwood') {
        // Forest with dirt trails and clustered trees
        const isPath = (x + Math.sin(y * 0.4) * 3) > 42 && (x + Math.sin(y * 0.4) * 3) < 46;
        if (isPath) {
          row.push('dirt');
        } else if (Math.random() < 0.18) {
          row.push('tree');
        } else {
          row.push('grass');
        }
      } else if (biome === 'ruins') {
        // Ancient Valdor Fortress
        if (Math.random() < 0.08) {
          row.push('ruin_pillar');
        } else if ((x % 7 === 0 || y % 7 === 0) && Math.random() < 0.7) {
          row.push('wall');
        } else {
          row.push('stone_slab');
        }
      } else if (biome === 'mire') {
        // Swamp bogs & water pools
        const noise = Math.sin(x * 0.3) + Math.cos(y * 0.3);
        if (noise > 1.1) {
          row.push('water');
        } else if (noise > 0.5) {
          row.push('swamp_mud');
        } else if (Math.random() < 0.1) {
          row.push('tree');
        } else {
          row.push('dirt');
        }
      } else {
        // Caldera: Molten lava and scorched earth
        const lavaNoise = Math.sin(x * 0.5) * Math.cos(y * 0.5);
        if (lavaNoise > 0.4) {
          row.push('lava');
        } else if (Math.random() < 0.07) {
          row.push('ruin_pillar');
        } else {
          row.push('stone_slab');
        }
      }
    }
    tiles.push(row);
  }

  // Predefined interactive world objects
  const objects: WorldObject[] = [
    // Oakhaven Village NPCs & Features
    {
      id: 'obj_elder_cedric',
      type: 'npc',
      x: 17,
      y: 17,
      name: 'Elder Cedric',
      icon: '🧙‍♂️',
      biome: 'oakhaven',
      description: 'The wise elder of Oakhaven Village.',
      interactionPrompt: 'Press [E] to talk to Elder Cedric',
      dialogue: [
        'Greetings, brave wanderer! Welcome to the haven of Oakhaven.',
        'The ancient ruins to the south have grown treacherous. Fell beasts stir in the Caldera.',
        'Gather your allies over LAN multiplayer and reclaim the Runes of Valdor!',
      ],
    },
    {
      id: 'obj_blacksmith',
      type: 'npc',
      x: 23,
      y: 17,
      name: 'Garek the Blacksmith',
      icon: '⚒️',
      biome: 'oakhaven',
      description: 'Master smith forging runes and heavy battle armor.',
      interactionPrompt: 'Press [E] to inspect Forge',
      dialogue: [
        'Need steel or rune weapons? Keep your blade sharp in the Wildwood!',
        'Every beast felled gives gold for better enchantments.',
      ],
    },
    {
      id: 'obj_alchemist',
      type: 'npc',
      x: 15,
      y: 22,
      name: 'Alchemist Lyra',
      icon: '🧪',
      biome: 'oakhaven',
      description: 'Purveyor of restorative brews and antidotes.',
      interactionPrompt: 'Press [E] to consult Alchemist',
      dialogue: [
        'Watch out for the Gloom Mire serpents—their venom is deadly!',
        'Use Crimson Potions [4] to purge toxins and mend your lifeforce.',
      ],
    },
    {
      id: 'obj_fountain',
      type: 'fountain',
      x: 18,
      y: 18,
      name: 'Fountain of Rejuvenation',
      icon: '⛲',
      biome: 'oakhaven',
      description: 'Enchanted waters bubbling with pure vitality.',
      interactionPrompt: 'Press [E] or touch to drink and restore full HP/Mana',
    },
    {
      id: 'obj_campfire_village',
      type: 'campfire',
      x: 20,
      y: 22,
      name: 'Sacred Campfire',
      icon: '🔥',
      biome: 'oakhaven',
      description: 'Warm, crackling hearth offering solace and rest.',
      interactionPrompt: 'Press [E] to rest and save progress',
    },

    // Wildwood Points of Interest
    {
      id: 'chest_wildwood_1',
      type: 'chest',
      x: 48,
      y: 15,
      name: 'Elven Moss Chest',
      icon: '📦',
      opened: false,
      biome: 'wildwood',
      description: 'An ancient chest overgrown with luminescent moss.',
      interactionPrompt: 'Press [E] to open chest',
      loot: { gold: 45, potion: 'Crimson Elixir' },
    },
    {
      id: 'chest_wildwood_2',
      type: 'chest',
      x: 62,
      y: 28,
      name: 'Bandit Cache',
      icon: '📦',
      opened: false,
      biome: 'wildwood',
      description: 'Hidden stash tucked away in the deep canopy.',
      interactionPrompt: 'Press [E] to loot cache',
      loot: { gold: 60, item: 'Hunter Cloak' },
    },
    {
      id: 'shrine_wildwood',
      type: 'shrine',
      x: 55,
      y: 20,
      name: 'Shrine of the Sylvan Goddess',
      icon: '⛩️',
      biome: 'wildwood',
      description: 'A quiet carved monolith humming with nature mana.',
      interactionPrompt: 'Press [E] to receive nature blessing (+Mana)',
    },

    // Ruins of Valdor
    {
      id: 'chest_ruins_1',
      type: 'chest',
      x: 22,
      y: 48,
      name: 'Ancient Valdor Reliquary',
      icon: '🪙',
      opened: false,
      biome: 'ruins',
      description: 'A reinforced coffer bearing the Royal Crest of Valdor.',
      interactionPrompt: 'Press [E] to unlock Reliquary',
      loot: { gold: 120, item: 'Rune Blade' },
    },
    {
      id: 'chest_ruins_2',
      type: 'chest',
      x: 32,
      y: 65,
      name: 'Crypt Sarcophagus',
      icon: '📦',
      opened: false,
      biome: 'ruins',
      description: 'Heavy granite sarcophagus containing entombed relics.',
      interactionPrompt: 'Press [E] to open sarcophagus',
      loot: { gold: 150, potion: 'Mana Nectar' },
    },
    {
      id: 'shrine_ruins',
      type: 'shrine',
      x: 18,
      y: 58,
      name: 'Monolith of the Arch-Magi',
      icon: '🔮',
      biome: 'ruins',
      description: 'Inscribed with forgotten arcane equations from the First Age.',
      interactionPrompt: 'Press [E] to absorb Arcane Surge',
    },

    // Gloom Mire
    {
      id: 'chest_mire',
      type: 'chest',
      x: 52,
      y: 48,
      name: 'Sunken Iron Strongbox',
      icon: '📦',
      opened: false,
      biome: 'mire',
      description: 'Tarnished chest retrieved from the bog waters.',
      interactionPrompt: 'Press [E] to pry open strongbox',
      loot: { gold: 90, potion: 'Antidote Draught' },
    },

    // Molten Caldera
    {
      id: 'chest_caldera_dragon',
      type: 'chest',
      x: 70,
      y: 70,
      name: 'Dragon Horde Chest',
      icon: '👑',
      opened: false,
      biome: 'caldera',
      description: 'Glittering vault guarded by the Nether Dragon.',
      interactionPrompt: 'Press [E] to open the Dragon Horde',
      loot: { gold: 500, item: 'Valdor Crown of Valor' },
    },
    {
      id: 'obj_campfire_caldera',
      type: 'campfire',
      x: 58,
      y: 65,
      name: 'Obsidian Waystation Campfire',
      icon: '🔥',
      biome: 'caldera',
      description: 'Shielded campfire protected from volcanic heat.',
      interactionPrompt: 'Press [E] to rest before the Dragon encounter',
    },
  ];

  return { tiles, objects };
}

/**
 * Checks if a tile coordinate blocks movement
 */
export function isTileCollidable(tiles: TileType[][], x: number, y: number): boolean {
  if (x < 0 || y < 0 || y >= tiles.length || x >= tiles[0].length) {
    return true;
  }
  const tile = tiles[y][x];
  return tile === 'wall' || tile === 'tree' || tile === 'ruin_pillar' || tile === 'water' || tile === 'lava';
}

/**
 * Spawns initial open-world monsters based on the bestiary XML templates
 */
export function spawnOpenWorldMonsters(bestiary: Monster[]): WorldMonster[] {
  if (!bestiary || bestiary.length === 0) return [];

  const mobs: WorldMonster[] = [];

  // Helper to find bestiary mob by id or fallback
  const findMob = (id: string): Monster => {
    return bestiary.find((m) => m.id === id) || bestiary[0];
  };

  const spawnDefs: Array<{
    templateId: string;
    x: number;
    y: number;
    biome: BiomeType;
    patrolRadius: number;
    level: number;
  }> = [
    // Wildwood mobs (Level 1-3)
    { templateId: 'goblin', x: 38, y: 16, biome: 'wildwood', patrolRadius: 4, level: 1 },
    { templateId: 'goblin_spearman', x: 44, y: 18, biome: 'wildwood', patrolRadius: 5, level: 2 },
    { templateId: 'dire_wolf', x: 50, y: 14, biome: 'wildwood', patrolRadius: 6, level: 2 },
    { templateId: 'woodland_sprite', x: 58, y: 22, biome: 'wildwood', patrolRadius: 4, level: 3 },
    { templateId: 'orc_warrior', x: 64, y: 20, biome: 'wildwood', patrolRadius: 5, level: 3 },
    { templateId: 'bandit_rogue', x: 46, y: 26, biome: 'wildwood', patrolRadius: 5, level: 2 },

    // Ruins of Valdor (Level 3-5)
    { templateId: 'skeleton', x: 18, y: 42, biome: 'ruins', patrolRadius: 4, level: 3 },
    { templateId: 'skeleton_archer', x: 26, y: 46, biome: 'ruins', patrolRadius: 5, level: 4 },
    { templateId: 'phantom_knight', x: 16, y: 54, biome: 'ruins', patrolRadius: 5, level: 4 },
    { templateId: 'abyssal_cultist', x: 28, y: 56, biome: 'ruins', patrolRadius: 4, level: 5 },
    { templateId: 'gargoyle_sentinel', x: 34, y: 50, biome: 'ruins', patrolRadius: 3, level: 5 },
    { templateId: 'lich', x: 22, y: 64, biome: 'ruins', patrolRadius: 5, level: 6 },

    // Gloom Mire (Level 4-6)
    { templateId: 'venom_spitter', x: 46, y: 44, biome: 'mire', patrolRadius: 4, level: 4 },
    { templateId: 'swamp_hydra', x: 56, y: 46, biome: 'mire', patrolRadius: 5, level: 5 },
    { templateId: 'bog_horror', x: 64, y: 48, biome: 'mire', patrolRadius: 6, level: 5 },
    { templateId: 'toxic_sludge', x: 52, y: 54, biome: 'mire', patrolRadius: 4, level: 4 },

    // Molten Caldera (Level 6-8, Dragon Boss)
    { templateId: 'magma_golem', x: 58, y: 68, biome: 'caldera', patrolRadius: 4, level: 6 },
    { templateId: 'fire_elemental', x: 64, y: 64, biome: 'caldera', patrolRadius: 5, level: 7 },
    { templateId: 'orc_berserker', x: 62, y: 72, biome: 'caldera', patrolRadius: 4, level: 6 },
    { templateId: 'dragon', x: 68, y: 68, biome: 'caldera', patrolRadius: 6, level: 9 }, // BOSS!
  ];

  spawnDefs.forEach((def, idx) => {
    const template = findMob(def.templateId);
    mobs.push({
      ...template,
      instanceId: `mob_${def.templateId}_${idx}`,
      x: def.x,
      y: def.y,
      startX: def.x,
      startY: def.y,
      patrolTargetX: def.x,
      patrolTargetY: def.y,
      biome: def.biome,
      state: 'patrol',
      targetPlayerId: null,
      lastAttackTime: 0,
      level: def.level,
      aggroRadius: def.templateId === 'dragon' ? 7 : 5,
      attackRange: 1.4,
      speed: def.templateId === 'dire_wolf' ? 2.2 : 1.2,
      maxHp: template.maxHp + (def.level - 1) * 15,
      hp: template.maxHp + (def.level - 1) * 15,
      atk: template.atk + (def.level - 1) * 3,
      isDefending: false,
      patrolRadius: def.patrolRadius,
    });
  });

  return mobs;
}
