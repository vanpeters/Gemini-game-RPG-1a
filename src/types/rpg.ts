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
    | 'burn';
  timestamp: string;
}

export interface InventoryItem {
  id: number;
  itemId: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'relic';
  power: number;
  quantity: number;
}

export interface CppTelemetry {
  status: string;
  engine: string;
  sqliteVersion: string;
  pid: number;
  uptimeSeconds: number;
  memoryRssKb: number;
  combatCalculations: number;
  port: number;
}

export interface FloatingText {
  id: string;
  text: string;
  type: 'damage' | 'heal' | 'crit' | 'mana' | 'poison' | 'defense';
  target: 'player' | 'enemy';
}

export interface StatusEffects {
  poisonTurns: number;
  burnTurns: number;
}

export interface RewardPreview {
  id: string;
  gold: number;
  xp: number;
  monsterName: string;
  isLevelUp: boolean;
  newLevel?: number;
}

export type GameScreen = 'TITLE' | 'CHARACTER_CREATION' | 'PLAYING' | 'PAUSED' | 'VICTORY_SCREEN' | 'DEFEAT_SCREEN';
