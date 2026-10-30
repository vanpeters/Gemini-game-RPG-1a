export type GameScreen = 'TITLE' | 'PLAYING' | 'GAMEOVER';

export type BiomeType = 'oakhaven' | 'wildwood' | 'ruins' | 'mire' | 'caldera';

export interface Player {
  id: number;
  name: string;
  class: string;
  styleId?: string;
  sprite?: string;
  level: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  gold: number;
  xp: number;
  wins: number;
  deaths: number;
  source?: string;
  // World spatial coordinates
  x?: number;
  y?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  isMoving?: boolean;
  activeQuestId?: string;
  quests?: Quest[];
  completedQuestIds?: string[];
  exploredBiomes?: BiomeType[];
  exploredTiles?: string[];
  equipped?: EquippedGear;
  baseMaxHp?: number;
  baseMaxMana?: number;
}

export type EquipmentSlot = 'weapon' | 'shield' | 'armor' | 'relic';

export interface EquippedGear {
  weapon?: InventoryItem | null;
  shield?: InventoryItem | null;
  armor?: InventoryItem | null;
  relic?: InventoryItem | null;
}

export interface HeroVisualArchetype {
  id: string;
  name: string;
  className: string;
  sprite: string;
  badge: string;
  hp: number;
  mana: number;
  description: string;
  perk: string;
  accentColor: string;
  borderClass: string;
  bgGradient: string;
}

export interface Monster {
  id: string;
  name: string;
  maxHp: number;
  hp: number;
  atk: number;
  gold: number;
  sprite: string;
  element: string;
  weakness: string;
  specialMove: string;
  specialAbility: string; // 'poison' | 'defensive_stance' | 'life_drain' | 'burn' | 'berserk' | 'none'
  expReward: number;
  lore: string;
  isDefending?: boolean;
}

export interface WorldMonster extends Monster {
  instanceId: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  biome: BiomeType;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'cooldown';
  targetPlayerId?: string | null;
  lastAttackTime: number;
  patrolTargetX: number;
  patrolTargetY: number;
  level: number;
  aggroRadius: number;
  attackRange: number;
  speed: number;
  patrolRadius: number;
  deadAt?: number;
  respawnAt?: number;
  wanderCooldown?: number;
}

export interface CombatVerificationResult {
  verified: boolean;
  action: string;
  damageDealt: number;
  damageTaken: number;
  healAmount: number;
  critical: boolean;
  manaCost: number;
  playerHp: number;
  playerMana: number;
  enemyHp: number;
  calculationId: number;
  abilityTriggered?: string;
  enterDefensiveStance?: boolean;
  damageMitigated?: boolean;
  poisonInflicted?: boolean;
  lifeDrained?: number;
  engineMessage: string;
}

export interface CppTelemetry {
  serverStatus?: string;
  combatCalculationsRun?: number;
  databaseQueriesTotal?: number;
  uptimeSeconds?: number;
  memoryUsageMb?: number;
  engine?: string;
  sqliteVersion?: string;
  combatCalculations?: number;
}

export interface WorldObject {
  id: string;
  type: 'chest' | 'campfire' | 'fountain' | 'shrine' | 'portal' | 'npc';
  x: number;
  y: number;
  name: string;
  icon: string;
  opened?: boolean;
  biome: BiomeType;
  description: string;
  interactionPrompt: string;
  dialogue?: string[];
  loot?: {
    gold?: number;
    potion?: string;
    item?: string;
  };
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  type: 'fireball' | 'frost' | 'arrow' | 'poison_orb';
  ownerId: string;
  radius: number;
  color: string;
}

export interface WorldLootDrop {
  id: string;
  x: number;
  y: number;
  type: 'gold' | 'potion' | 'xp';
  amount: number;
  label: string;
  icon: string;
  createdAt: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x?: number;
  y?: number;
  target?: 'player' | 'enemy';
  type: 'damage' | 'crit' | 'heal' | 'poison' | 'mana' | 'defense' | 'gold' | 'xp' | 'level';
}

export interface StatusEffects {
  poisonTurns: number;
  burnTurns: number;
  shieldTurns?: number;
  speedBuffTurns?: number;
}

export interface RewardPreview {
  id: string;
  gold: number;
  xp: number;
  monsterName: string;
  isLevelUp?: boolean;
  newLevel?: number;
}

export interface CombatLogEntry {
  id: string;
  text: string;
  type:
    | 'info'
    | 'player_atk'
    | 'enemy_atk'
    | 'spell'
    | 'heal'
    | 'crit'
    | 'victory'
    | 'defeat'
    | 'cpp_engine'
    | 'db_save'
    | 'poison'
    | 'defensive_stance'
    | 'burn'
    | 'multiplayer'
    | 'chat';
  timestamp: string;
  sender?: string;
}

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface InventoryItem {
  id: number;
  itemId: string;
  name: string;
  type: 'weapon' | 'shield' | 'armor' | 'potion' | 'relic';
  power: number;
  quantity: number;
  description?: string;
  icon?: string;
  rarity?: ItemRarity;
  lore?: string;
  isUniqueQuestReward?: boolean;
  atkBonus?: number;
  hpBonus?: number;
  defBonus?: number;
  manaBonus?: number;
}

export type QuestCategory = 'main' | 'bounty' | 'exploration' | 'heroic';
export type QuestStatus = 'locked' | 'available' | 'active' | 'completed' | 'claimed';

export type QuestObjectiveType =
  | 'kill'
  | 'kill_group'
  | 'explore_biome'
  | 'interact_object'
  | 'reach_level';

export interface QuestObjective {
  id: string;
  description: string;
  type: QuestObjectiveType;
  targetId?: string;
  targetGroup?: string[];
  targetCount: number;
  currentCount: number;
  completed: boolean;
}

export interface QuestReward {
  xp: number;
  gold: number;
  uniqueItem: InventoryItem;
}

export interface Quest {
  id: string;
  title: string;
  subtitle: string;
  lore: string;
  giverName: string;
  giverIcon: string;
  chapter: number;
  category: QuestCategory;
  recommendedLevel: number;
  objectives: QuestObjective[];
  reward: QuestReward;
  status: QuestStatus;
  claimedAt?: number;
}

export interface NetworkPeer {
  id: string;
  name: string;
  className: string;
  styleId: string;
  sprite: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  level: number;
  isHost: boolean;
  lastSeen: number;
  lastAttackAction?: {
    type: 'attack' | 'fireball' | 'thunder' | 'heal';
    time: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface MultiplayerMessage {
  type:
    | 'JOIN'
    | 'LEAVE'
    | 'HEARTBEAT'
    | 'ATTACK'
    | 'MOB_HIT'
    | 'MOB_STATE_SYNC'
    | 'CHAT'
    | 'CHEST_OPENED'
    | 'REVIVE';
  senderId: string;
  senderName: string;
  payload: any;
  timestamp: number;
}
