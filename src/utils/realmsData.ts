import { Player } from '../types/rpg';

export interface RealmTown {
  name: string;
  subtitle: string;
  elderName: string;
  elderIcon: string;
  elderTitle: string;
  smithName: string;
  alchemistName: string;
  description: string;
  spawnX: number;
  spawnY: number;
}

export interface RealmDungeon {
  name: string;
  subtitle: string;
  description: string;
  bossId: string;
  bossName: string;
  bossTitle: string;
  bossIcon: string;
  bossLevel: number;
  bossHp: number;
  bossAtk: number;
  bossExp: number;
  bossGold: number;
  entranceX: number;
  entranceY: number;
  bossX: number;
  bossY: number;
  uniqueLootId: string;
  uniqueLootName: string;
  uniqueLootPower: number;
  uniqueLootIcon: string;
}

export interface RealmDefinition {
  id: number; // 1 to 12
  name: string;
  subtitle: string;
  theme:
    | 'verdant'
    | 'glacial'
    | 'volcanic'
    | 'oceanic'
    | 'sylvan'
    | 'necropolis'
    | 'celestial'
    | 'swamp'
    | 'desert'
    | 'obsidian'
    | 'astral'
    | 'abyss';
  accentColor: string;
  badge: string;
  bgGradient: string;
  borderClass: string;
  recommendedLevel: number;
  levelBracket: string;
  lore: string;
  town: RealmTown;
  dungeon: RealmDungeon;
  ambientColor: string;
  floorColor: string;
  wallColor: string;
}

export const REALMS: RealmDefinition[] = [
  {
    id: 1,
    name: 'Realm of Valdor',
    subtitle: 'The Cradle of the Runes',
    theme: 'verdant',
    accentColor: 'text-emerald-400',
    badge: '🌿 REALM I',
    bgGradient: 'from-emerald-950/80 via-slate-900 to-black',
    borderClass: 'border-emerald-500/50',
    recommendedLevel: 1,
    levelBracket: 'Lv. 1 - 5',
    lore: 'The historic homeland of the Rune Knights. Rolling green meadows, towering ancient oaks, and forgotten stone fortifications where humanity first harnessed runic magic.',
    town: {
      name: 'Oakhaven Hamlet',
      subtitle: 'Peaceful Sanctuary of the First Knights',
      elderName: 'Elder Cedric',
      elderIcon: '🧙‍♂️',
      elderTitle: 'Keeper of the Ancient Chronicles',
      smithName: 'Garek the Blacksmith',
      alchemistName: 'Alchemist Lyra',
      description: 'A fortified village with cobblestone paths, a sacred restoration fountain, and a roaring campfire hearth.',
      spawnX: 20,
      spawnY: 22,
    },
    dungeon: {
      name: 'The Sunken Crypts of Valdor',
      subtitle: 'Entombed Royal Sepulcher',
      description: 'Subterranean labyrinth guarded by restless skeletal phantoms and royal gargoyles.',
      bossId: 'boss_crypt_lich',
      bossName: 'Crypt Lich King',
      bossTitle: 'Undying Monarch of Valdor',
      bossIcon: '💀',
      bossLevel: 6,
      bossHp: 380,
      bossAtk: 24,
      bossExp: 180,
      bossGold: 220,
      entranceX: 68,
      entranceY: 66,
      bossX: 84,
      bossY: 84,
      uniqueLootId: 'relic_valdor_crown',
      uniqueLootName: 'Valdor Crown of Valor',
      uniqueLootPower: 26,
      uniqueLootIcon: '👑',
    },
    ambientColor: 'rgba(20, 80, 40, 0.08)',
    floorColor: '#164e22',
    wallColor: '#1e293b',
  },
  {
    id: 2,
    name: 'Frostpeak Glaciers',
    subtitle: 'The Eternal Permafrost',
    theme: 'glacial',
    accentColor: 'text-cyan-400',
    badge: '❄️ REALM II',
    bgGradient: 'from-cyan-950/80 via-slate-900 to-black',
    borderClass: 'border-cyan-500/50',
    recommendedLevel: 5,
    levelBracket: 'Lv. 5 - 8',
    lore: 'A treacherous expanse of sheer ice spires, howling blizzard drifts, and frozen mountain passes where crystalline elementals roam.',
    town: {
      name: 'Nivea Sanctuary',
      subtitle: 'Fjord Outpost of the North',
      elderName: 'Chieftain Frostbeard',
      elderIcon: '🎅',
      elderTitle: 'Jarl of the Frozen Fjord',
      smithName: 'Brann Ice-Smith',
      alchemistName: 'Herbalist Freyja',
      description: 'Carved inside a colossal hollow glacier, heated by blue geo-thermal springs and runic braziers.',
      spawnX: 22,
      spawnY: 24,
    },
    dungeon: {
      name: 'Glacial Spire of Frostwyrm',
      subtitle: 'The Icebound Pinnacle',
      description: 'Slick ice ramps and razor-sharp crystal formations guarded by yeti marauders and frost wraiths.',
      bossId: 'boss_frostwyrm',
      bossName: 'Ancient Frostwyrm',
      bossTitle: 'Scourge of the Polar Winds',
      bossIcon: '🐉',
      bossLevel: 9,
      bossHp: 560,
      bossAtk: 32,
      bossExp: 280,
      bossGold: 340,
      entranceX: 72,
      entranceY: 68,
      bossX: 86,
      bossY: 86,
      uniqueLootId: 'sword_frostbite',
      uniqueLootName: 'Frostbite Glacier Cleaver',
      uniqueLootPower: 34,
      uniqueLootIcon: '🗡️',
    },
    ambientColor: 'rgba(56, 189, 248, 0.12)',
    floorColor: '#0c4a6e',
    wallColor: '#38bdf8',
  },
  {
    id: 3,
    name: 'Ashfall Badlands',
    subtitle: 'Cinder Wastes & Molten Crags',
    theme: 'volcanic',
    accentColor: 'text-amber-500',
    badge: '🔥 REALM III',
    bgGradient: 'from-orange-950/80 via-slate-900 to-black',
    borderClass: 'border-amber-500/50',
    recommendedLevel: 8,
    levelBracket: 'Lv. 8 - 12',
    lore: 'Charred rock and active fissure fields spitting smoke and sparks. Fire drakes nest atop black basalt ridges overlooking lakes of boiling mud.',
    town: {
      name: 'Pyrehold Bastion',
      subtitle: 'Iron Fortress of Cinders',
      elderName: 'Warmaster Ignis',
      elderIcon: '🧙',
      elderTitle: 'Marshal of the Flame Vanguard',
      smithName: 'Forgemaster Kor',
      alchemistName: 'Ember Alchemist Vala',
      description: 'Constructed from volcanic brick and iron girders, boasting the world\'s hottest weapon forges.',
      spawnX: 20,
      spawnY: 22,
    },
    dungeon: {
      name: 'The Brimstone Foundry',
      subtitle: 'Subterranean Lava Forge',
      description: 'River of liquid brimstone spanned by rusted iron chains and defended by magma golems.',
      bossId: 'boss_magma_behemoth',
      bossName: 'Infernal Magma Behemoth',
      bossTitle: 'Living Heart of the Volcano',
      bossIcon: '👹',
      bossLevel: 13,
      bossHp: 780,
      bossAtk: 42,
      bossExp: 420,
      bossGold: 480,
      entranceX: 70,
      entranceY: 70,
      bossX: 85,
      bossY: 85,
      uniqueLootId: 'axe_pyreforged',
      uniqueLootName: 'Pyre-Forged Great-Axe',
      uniqueLootPower: 45,
      uniqueLootIcon: '🪓',
    },
    ambientColor: 'rgba(234, 88, 12, 0.12)',
    floorColor: '#431407',
    wallColor: '#7c2d12',
  },
  {
    id: 4,
    name: 'Sunken Abyss',
    subtitle: 'Drowned Reefs & Tidal Trenches',
    theme: 'oceanic',
    accentColor: 'text-blue-400',
    badge: '🌊 REALM IV',
    bgGradient: 'from-blue-950/80 via-slate-900 to-black',
    borderClass: 'border-blue-500/50',
    recommendedLevel: 12,
    levelBracket: 'Lv. 12 - 15',
    lore: 'A sunken coastal continent submerged beneath the azure tides. Coral reefs flourish amidst drowned temples and bioluminescent kelp forests.',
    town: {
      name: 'Aqualis Harbor',
      subtitle: 'Stilt Haven of the Tides',
      elderName: 'Captain Triton',
      elderIcon: '🧜‍♂️',
      elderTitle: 'Admiral of the Pearl Fleet',
      smithName: 'Tide-Smith Marina',
      alchemistName: 'Pearl Apothecary Delmar',
      description: 'Built upon elevated wooden docks above crystal tide pools, sheltered by ancient leviathan ribcages.',
      spawnX: 22,
      spawnY: 20,
    },
    dungeon: {
      name: 'Temple of the Drowned Leviathan',
      subtitle: 'Flooded Arcane Basilica',
      description: 'Submerged stone colonnades teeming with abyssal sirens, electric eels, and sunken terrors.',
      bossId: 'boss_tideweaver_leviathan',
      bossName: 'Tideweaver Leviathan',
      bossTitle: 'Emperor of the Trench',
      bossIcon: '🦑',
      bossLevel: 16,
      bossHp: 980,
      bossAtk: 50,
      bossExp: 550,
      bossGold: 620,
      entranceX: 72,
      entranceY: 66,
      bossX: 86,
      bossY: 84,
      uniqueLootId: 'polearm_trident',
      uniqueLootName: 'Trident of the Drowned King',
      uniqueLootPower: 54,
      uniqueLootIcon: '🔱',
    },
    ambientColor: 'rgba(30, 58, 138, 0.15)',
    floorColor: '#082f49',
    wallColor: '#0369a1',
  },
  {
    id: 5,
    name: 'Whispering Sylvan',
    subtitle: 'Ancient Grove of Redwood Giants',
    theme: 'sylvan',
    accentColor: 'text-lime-400',
    badge: '🌲 REALM V',
    bgGradient: 'from-lime-950/80 via-slate-900 to-black',
    borderClass: 'border-lime-500/50',
    recommendedLevel: 15,
    levelBracket: 'Lv. 15 - 18',
    lore: 'Megalithic redwood trees so vast their trunks span entire villages. Fairy circles and luminescent fungal clusters illuminate the dim forest floor.',
    town: {
      name: 'Elderwood Glen',
      subtitle: 'Canopy Village of the Druids',
      elderName: 'Arch-Druid Melissa',
      elderIcon: '🧝‍♀️',
      elderTitle: 'Voice of the Living Wood',
      smithName: 'Sylvan Fletcher Thorne',
      alchemistName: 'Dryad Healer Willow',
      description: 'Interconnected rope bridges and hollowed burls nestled safely high within the ancient redwoods.',
      spawnX: 24,
      spawnY: 22,
    },
    dungeon: {
      name: 'The Hollow Redwood Labyrinth',
      subtitle: 'Living Heart of Rot and Spores',
      description: 'A twisting maze carved within a corrupted ancient treant, populated by spore fiends and feral woodland beasts.',
      bossId: 'boss_corrupted_treant',
      bossName: 'Corrupted Arch-Treant',
      bossTitle: 'Root of Blight',
      bossIcon: '🌳',
      bossLevel: 19,
      bossHp: 1250,
      bossAtk: 58,
      bossExp: 720,
      bossGold: 780,
      entranceX: 74,
      entranceY: 72,
      bossX: 88,
      bossY: 88,
      uniqueLootId: 'shield_heartwood',
      uniqueLootName: 'Heartwood Aegis of Renewal',
      uniqueLootPower: 62,
      uniqueLootIcon: '🛡️',
    },
    ambientColor: 'rgba(101, 163, 13, 0.1)',
    floorColor: '#14532d',
    wallColor: '#15803d',
  },
  {
    id: 6,
    name: 'Dread Necropolis',
    subtitle: 'The City of the Unresting Dead',
    theme: 'necropolis',
    accentColor: 'text-purple-400',
    badge: '💀 REALM VI',
    bgGradient: 'from-purple-950/80 via-slate-900 to-black',
    borderClass: 'border-purple-500/50',
    recommendedLevel: 18,
    levelBracket: 'Lv. 18 - 21',
    lore: 'Endless obsidian mausoleums, cracked headstones, and purple ghostly fog. The earth here has been bled dry of lifeforce, leaving only necrotic residue.',
    town: {
      name: 'Mortis Rest',
      subtitle: 'Solemn Bastion of the Mourners',
      elderName: 'Gravekeeper Yorick',
      elderIcon: '🕯️',
      elderTitle: 'Warden of the Final Sleep',
      smithName: 'Bone-Smith Theron',
      alchemistName: 'Necrotic Apothecary Vesper',
      description: 'A consecrated sanctuary walled by blessed runic tombstones that hold the walking dead at bay.',
      spawnX: 20,
      spawnY: 24,
    },
    dungeon: {
      name: 'Sepulcher of the Undying Lich',
      subtitle: 'Throne of the Nether Regent',
      description: 'Deep catacombs lined with sarcophagi of forgotten kings, patrolled by dread revenants and wraith sorcerers.',
      bossId: 'boss_dread_lich_lord',
      bossName: 'Dread Overlord Thanatos',
      bossTitle: 'Herald of the Eternal Night',
      bossIcon: '🧙‍♂️',
      bossLevel: 22,
      bossHp: 1550,
      bossAtk: 68,
      bossExp: 900,
      bossGold: 950,
      entranceX: 72,
      entranceY: 70,
      bossX: 85,
      bossY: 85,
      uniqueLootId: 'relic_soul_reaper',
      uniqueLootName: 'Soul-Reaper Scythe of Mortis',
      uniqueLootPower: 74,
      uniqueLootIcon: '⚔️',
    },
    ambientColor: 'rgba(147, 51, 234, 0.12)',
    floorColor: '#2e1065',
    wallColor: '#581c87',
  },
  {
    id: 7,
    name: 'Caelum Skyrealm',
    subtitle: 'Floating Islands of Aether',
    theme: 'celestial',
    accentColor: 'text-sky-300',
    badge: '⚡ REALM VII',
    bgGradient: 'from-sky-950/80 via-slate-900 to-black',
    borderClass: 'border-sky-500/50',
    recommendedLevel: 21,
    levelBracket: 'Lv. 21 - 25',
    lore: 'Shattered continents drifting above the troposphere, suspended by concentrated aether crystals. Lightning cascades between clouds in dazzling tempests.',
    town: {
      name: 'Zephyr Bastion',
      subtitle: 'Aerodrome of the Cloud Knights',
      elderName: 'Sky-Captain Aella',
      elderIcon: '🦅',
      elderTitle: 'Grand Wing Commander',
      smithName: 'Aether-Smith Gale',
      alchemistName: 'Cloud Brewer Zephyr',
      description: 'Anchored to three gigantic anti-gravity crystals, featuring airship docks and wind-funnel energy generators.',
      spawnX: 22,
      spawnY: 22,
    },
    dungeon: {
      name: 'Stormkeep Citadel',
      subtitle: 'Spire of the Thunder Emperor',
      description: 'Lethal electrified sky platforms, lightning coil traps, and storm harpies defending the central battery.',
      bossId: 'boss_storm_lord',
      bossName: 'Thunder Lord Raiden',
      bossTitle: 'Voice of the Hurricane',
      bossIcon: '⚡',
      bossLevel: 26,
      bossHp: 1900,
      bossAtk: 78,
      bossExp: 1150,
      bossGold: 1200,
      entranceX: 74,
      entranceY: 68,
      bossX: 87,
      bossY: 86,
      uniqueLootId: 'bow_stormbow',
      uniqueLootName: 'Tempest Storm-Bow of Caelum',
      uniqueLootPower: 86,
      uniqueLootIcon: '🏹',
    },
    ambientColor: 'rgba(56, 189, 248, 0.14)',
    floorColor: '#075985',
    wallColor: '#bae6fd',
  },
  {
    id: 8,
    name: 'Mirkvale Marshes',
    subtitle: 'The Toxic Venom Bog',
    theme: 'swamp',
    accentColor: 'text-emerald-500',
    badge: '🧪 REALM VIII',
    bgGradient: 'from-emerald-950/80 via-slate-900 to-black',
    borderClass: 'border-emerald-600/50',
    recommendedLevel: 25,
    levelBracket: 'Lv. 25 - 28',
    lore: 'Stagnant emerald waters veiled in poisonous miasma. Giant carnivorous flora, venomous hydras, and bog hags lurk beneath the surface.',
    town: {
      name: 'Bogwater Hollow',
      subtitle: 'Refuge of the Poison Wardens',
      elderName: 'Witch-Doctor Zula',
      elderIcon: '🧙‍♀️',
      elderTitle: 'High Shaman of the Bog',
      smithName: 'Poison-Smith Vane',
      alchemistName: 'Mire Brewer Kael',
      description: 'Stands on petrified cypress stilts, shielded from corrosive vapors by purifying incense braziers.',
      spawnX: 20,
      spawnY: 24,
    },
    dungeon: {
      name: 'The Gorgon Hydra Lair',
      subtitle: 'Den of the Multi-Headed Queen',
      description: 'Subterranean muddy caverns covered in toxic slime and calcified petrified statues of past adventurers.',
      bossId: 'boss_gorgon_hydra',
      bossName: 'Nine-Headed Gorgon Hydra',
      bossTitle: 'Empress of the Black Mire',
      bossIcon: '🐍',
      bossLevel: 29,
      bossHp: 2350,
      bossAtk: 88,
      bossExp: 1400,
      bossGold: 1500,
      entranceX: 70,
      entranceY: 72,
      bossX: 85,
      bossY: 88,
      uniqueLootId: 'armor_hydra_scale',
      uniqueLootName: 'Venom-Scale Hydra Cuirass',
      uniqueLootPower: 98,
      uniqueLootIcon: '🥋',
    },
    ambientColor: 'rgba(5, 150, 105, 0.12)',
    floorColor: '#022c22',
    wallColor: '#065f46',
  },
  {
    id: 9,
    name: 'Golden Dune Sea',
    subtitle: 'The Scorching Sands of Ra-Kresh',
    theme: 'desert',
    accentColor: 'text-yellow-400',
    badge: '☀️ REALM IX',
    bgGradient: 'from-amber-950/80 via-slate-900 to-black',
    borderClass: 'border-yellow-500/50',
    recommendedLevel: 28,
    levelBracket: 'Lv. 28 - 32',
    lore: 'An ocean of blinding golden sand dunes, sun-bleached colossi ruins, and subterranean tomb entrances uncovered by howling desert khamsins.',
    town: {
      name: 'Solaria Oasis',
      subtitle: 'Jewel of the Sun Sands',
      elderName: 'Sultan Farooq',
      elderIcon: '👳',
      elderTitle: 'Guardian of the Sun Well',
      smithName: 'Sand-Smith Tariq',
      alchemistName: 'Spice Merchant Yasmin',
      description: 'Lush date palms surrounding an emerald freshwater lagoon with marble colonnades and bustling bazaars.',
      spawnX: 22,
      spawnY: 22,
    },
    dungeon: {
      name: 'Sunken Pyramid of the Sun Pharaoh',
      subtitle: 'The Gilded Tomb of Ra-Kresh',
      description: 'A colossal pyramid subterranean complex filled with gold-leaf sarcophagi, scarab swarms, and jackal sentinels.',
      bossId: 'boss_pharaoh_rakresh',
      bossName: 'Pharaoh Ra-Kresh',
      bossTitle: 'The Eternal Sun God',
      bossIcon: '⚱️',
      bossLevel: 33,
      bossHp: 2900,
      bossAtk: 98,
      bossExp: 1750,
      bossGold: 2200,
      entranceX: 74,
      entranceY: 70,
      bossX: 88,
      bossY: 85,
      uniqueLootId: 'staff_sun_pharaoh',
      uniqueLootName: 'Solar Scepter of Ra-Kresh',
      uniqueLootPower: 110,
      uniqueLootIcon: '🪄',
    },
    ambientColor: 'rgba(234, 179, 8, 0.14)',
    floorColor: '#78350f',
    wallColor: '#b45309',
  },
  {
    id: 10,
    name: 'Obsidian Caldera',
    subtitle: 'The Nether Dragon\'s Throne',
    theme: 'obsidian',
    accentColor: 'text-red-500',
    badge: '🌋 REALM X',
    bgGradient: 'from-red-950/80 via-slate-900 to-black',
    borderClass: 'border-red-600/50',
    recommendedLevel: 32,
    levelBracket: 'Lv. 32 - 38',
    lore: 'Jagged spires of pure black obsidian surrounded by cascading rivers of white-hot magma. The ancestral breeding ground of ancient elder wyrms.',
    town: {
      name: 'Vulcan Stronghold',
      subtitle: 'Obsidian Bastion of the Dragon Hunters',
      elderName: 'Commander Volcan',
      elderIcon: '🛡️',
      elderTitle: 'High Master of the Dragon Slayers',
      smithName: 'Shadow-Smith Grim',
      alchemistName: 'Pyromancer Ignatia',
      description: 'A fortified bastion carved into solid basalt rock, reinforced with dragon scales and fire suppression glyphs.',
      spawnX: 20,
      spawnY: 22,
    },
    dungeon: {
      name: 'The Dragon\'s Infernal Maw',
      subtitle: 'Inner Core of the Great Volcano',
      description: 'Boiling magma geysers and gold heaps guarded by elder wyverns, pyro-elementals, and dragonkin warlords.',
      bossId: 'boss_nether_dragon_king',
      bossName: 'Ancient Nether Dragon Ignisrex',
      bossTitle: 'Scourge of the Ten Thousand Worlds',
      bossIcon: '🐉',
      bossLevel: 39,
      bossHp: 3800,
      bossAtk: 118,
      bossExp: 2400,
      bossGold: 3500,
      entranceX: 72,
      entranceY: 72,
      bossX: 86,
      bossY: 88,
      uniqueLootId: 'armor_dragonscale_battleplate',
      uniqueLootName: 'Ignisrex Dragonscale Battleplate',
      uniqueLootPower: 128,
      uniqueLootIcon: '🛡️',
    },
    ambientColor: 'rgba(220, 38, 38, 0.16)',
    floorColor: '#1c1917',
    wallColor: '#450a0a',
  },
  {
    id: 11,
    name: 'Astral Void',
    subtitle: 'The Shattered Cosmic Continuum',
    theme: 'astral',
    accentColor: 'text-indigo-400',
    badge: '✨ REALM XI',
    bgGradient: 'from-indigo-950/80 via-slate-900 to-black',
    borderClass: 'border-indigo-500/50',
    recommendedLevel: 38,
    levelBracket: 'Lv. 38 - 45',
    lore: 'Reality fractures into radiant stardust and floating cosmic fragments. Time bends and gravity shifts unpredictably as void horrors devour dying stars.',
    town: {
      name: 'Nexus of Echoes',
      subtitle: 'Crossroads of the Multiverse',
      elderName: 'Star-Watcher Orion',
      elderIcon: '🌌',
      elderTitle: 'Archivist of Infinite Timelines',
      smithName: 'Void-Smith Chronos',
      alchemistName: 'Astral Healer Nova',
      description: 'Floating crystalline sanctuary tethered to a dormant pulsar, humming with pure cosmic resonance.',
      spawnX: 22,
      spawnY: 20,
    },
    dungeon: {
      name: 'The Cosmic Singularity Rift',
      subtitle: 'Event Horizon of the Void',
      description: 'Collapsing dimensional corridors where void specters and dark matter beasts warp space itself.',
      bossId: 'boss_void_eater',
      bossName: 'Void-Eater Paradox',
      bossTitle: 'Devourer of Starlight',
      bossIcon: '🪐',
      bossLevel: 46,
      bossHp: 4900,
      bossAtk: 140,
      bossExp: 3300,
      bossGold: 5000,
      entranceX: 74,
      entranceY: 70,
      bossX: 87,
      bossY: 86,
      uniqueLootId: 'relic_astral_singularity',
      uniqueLootName: 'Astral Singularity Ring',
      uniqueLootPower: 145,
      uniqueLootIcon: '💍',
    },
    ambientColor: 'rgba(99, 102, 241, 0.15)',
    floorColor: '#1e1b4b',
    wallColor: '#4338ca',
  },
  {
    id: 12,
    name: 'Abyssal Chaos',
    subtitle: 'The Final Frontier of Pandemonium',
    theme: 'abyss',
    accentColor: 'text-rose-500',
    badge: '👑 REALM XII',
    bgGradient: 'from-rose-950/80 via-slate-900 to-black',
    borderClass: 'border-rose-600/50',
    recommendedLevel: 45,
    levelBracket: 'Lv. 45 - 50+',
    lore: 'The apex pinnacle of all dimensions where primordial chaos rules supreme. The final battleground for the legendary championship of the multiverse.',
    town: {
      name: 'Doomwatch Citadel',
      subtitle: 'The Last Stand of Creation',
      elderName: 'Lord High Templar Vane',
      elderIcon: '⚔️',
      elderTitle: 'Vanguard of the Final Accord',
      smithName: 'Chaos-Smith Malakor',
      alchemistName: 'Saint Beatrice of Light',
      description: 'The outermost battlements holding the edge of existence, surrounded by radiant barrier warding stones.',
      spawnX: 20,
      spawnY: 22,
    },
    dungeon: {
      name: 'Throne of Chaos Primordial',
      subtitle: 'The End of All Things',
      description: 'Fractured obsidian glass platforms floating over the infinite void, guarded by arch-demons and chaos avatars.',
      bossId: 'boss_chaos_overlord',
      bossName: 'Chaos Overlord Malakor',
      bossTitle: 'The Primordial World-Breaker',
      bossIcon: '👹',
      bossLevel: 55,
      bossHp: 6500,
      bossAtk: 175,
      bossExp: 5000,
      bossGold: 10000,
      entranceX: 72,
      entranceY: 72,
      bossX: 88,
      bossY: 88,
      uniqueLootId: 'weapon_world_breaker',
      uniqueLootName: 'Apocalypse: Blade of the World-Breaker',
      uniqueLootPower: 180,
      uniqueLootIcon: '🗡️',
    },
    ambientColor: 'rgba(225, 29, 72, 0.18)',
    floorColor: '#4c0519',
    wallColor: '#be123c',
  },
];

export function getRealmById(realmId: number = 1): RealmDefinition {
  return REALMS.find((r) => r.id === realmId) || REALMS[0];
}

export function getAllRealms(): RealmDefinition[] {
  return REALMS;
}

export function isRealmUnlocked(player: Player, realmId: number): boolean {
  if (realmId === 1) return true;
  // Realm is unlocked if player has discovered it or reached level threshold
  if (player.discoveredRealms && player.discoveredRealms.includes(realmId)) return true;
  const def = getRealmById(realmId);
  return player.level >= def.recommendedLevel;
}

export interface PvPRankInfo {
  title: string;
  badge: string;
  minHonor: number;
  bonusAtk: number;
  bonusHp: number;
  color: string;
}

export const PVP_RANKS: PvPRankInfo[] = [
  { title: 'Recruit', badge: '🔰', minHonor: 0, bonusAtk: 0, bonusHp: 0, color: 'text-slate-400' },
  { title: 'Gladiator', badge: '⚔️', minHonor: 100, bonusAtk: 4, bonusHp: 20, color: 'text-emerald-400' },
  { title: 'Centurion', badge: '🛡️', minHonor: 300, bonusAtk: 8, bonusHp: 45, color: 'text-cyan-400' },
  { title: 'Champion', badge: '⭐', minHonor: 700, bonusAtk: 14, bonusHp: 80, color: 'text-amber-400' },
  { title: 'Warlord', badge: '🔥', minHonor: 1500, bonusAtk: 22, bonusHp: 130, color: 'text-purple-400' },
  { title: 'Grand Marshal', badge: '👑', minHonor: 3000, bonusAtk: 35, bonusHp: 200, color: 'text-rose-400' },
];

export function getPvPRank(honor: number = 0): PvPRankInfo {
  for (let i = PVP_RANKS.length - 1; i >= 0; i--) {
    if (honor >= PVP_RANKS[i].minHonor) {
      return PVP_RANKS[i];
    }
  }
  return PVP_RANKS[0];
}
