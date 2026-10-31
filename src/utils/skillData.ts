import { Player } from '../types/rpg';

export interface SkillRank {
  rank: number;
  manaCost: number;
  cooldownSeconds: number;
  power: number;
  description: string;
  effectSummary: string;
}

export interface CombatSkillDefinition {
  id: string; // 'whirlwind' | 'frost_nova' | 'thunder_smite' | 'iron_bastion'
  name: string;
  icon: string;
  keybind: string;
  type: 'aoe_physical' | 'aoe_elemental' | 'chain_spell' | 'divine_buff';
  element: 'Physical' | 'Ice' | 'Lightning' | 'Holy';
  accentColor: string;
  borderClass: string;
  tagline: string;
  maxRank: number;
  ranks: SkillRank[];
}

export const COMBAT_SKILLS: CombatSkillDefinition[] = [
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    icon: '🌪️',
    keybind: '[5]',
    type: 'aoe_physical',
    element: 'Physical',
    accentColor: 'text-amber-400',
    borderClass: 'border-amber-500/70',
    tagline: '360° Cleaving Melee Strike',
    maxRank: 3,
    ranks: [
      {
        rank: 1,
        manaCost: 18,
        cooldownSeconds: 3.5,
        power: 42,
        description: 'Spin with martial force, striking all enemies within 3.5 tiles for 42 Physical DMG and knocking them back.',
        effectSummary: '42 AOE DMG • 18 MP • 3.5s CD',
      },
      {
        rank: 2,
        manaCost: 22,
        cooldownSeconds: 3.0,
        power: 70,
        description: 'Vortex momentum intensifies, cleaving all surrounding enemies for 70 Physical DMG with +25% critical chance.',
        effectSummary: '70 AOE DMG • 22 MP • 3.0s CD',
      },
      {
        rank: 3,
        manaCost: 26,
        cooldownSeconds: 2.5,
        power: 105,
        description: 'Mastered blade hurricane delivering 105 Physical DMG to all nearby foes and inflicting a 3s Bleed bleed ailment.',
        effectSummary: '105 AOE DMG + Bleed • 26 MP • 2.5s CD',
      },
    ],
  },
  {
    id: 'frost_nova',
    name: 'Frost Nova',
    icon: '❄️',
    keybind: '[6]',
    type: 'aoe_elemental',
    element: 'Ice',
    accentColor: 'text-cyan-400',
    borderClass: 'border-cyan-500/70',
    tagline: 'Radial Blizzard & Glacial Chill',
    maxRank: 3,
    ranks: [
      {
        rank: 1,
        manaCost: 22,
        cooldownSeconds: 4.5,
        power: 50,
        description: 'Detonate a flash-freeze ring dealing 50 Ice DMG to all targets within 4.2 tiles and slowing their attack speeds by 40%.',
        effectSummary: '50 Ice DMG + 40% Slow • 22 MP • 4.5s CD',
      },
      {
        rank: 2,
        manaCost: 26,
        cooldownSeconds: 4.0,
        power: 82,
        description: 'Expands arctic crystal field, dealing 82 Ice DMG with an intensified 60% frost chill.',
        effectSummary: '82 Ice DMG + 60% Slow • 26 MP • 4.0s CD',
      },
      {
        rank: 3,
        manaCost: 30,
        cooldownSeconds: 3.5,
        power: 125,
        description: 'Glacial absolute-zero shockwave dealing 125 Ice DMG and freezing surrounding monsters solid in frost for 2 seconds.',
        effectSummary: '125 Ice DMG + 2s Freeze • 30 MP • 3.5s CD',
      },
    ],
  },
  {
    id: 'thunder_smite',
    name: 'Thunder Smite',
    icon: '⚡',
    keybind: '[7]',
    type: 'chain_spell',
    element: 'Lightning',
    accentColor: 'text-yellow-400',
    borderClass: 'border-yellow-500/70',
    tagline: 'Chain Celestial Electrocution',
    maxRank: 3,
    ranks: [
      {
        rank: 1,
        manaCost: 25,
        cooldownSeconds: 4.0,
        power: 65,
        description: 'Call down a bolt of celestial storm lightning on the target for 65 Shock DMG that arcs to 2 nearby enemies.',
        effectSummary: '65 Shock DMG (Arcs to 2) • 25 MP • 4.0s CD',
      },
      {
        rank: 2,
        manaCost: 30,
        cooldownSeconds: 3.5,
        power: 100,
        description: 'Supercharged thunderstorm dealing 100 Shock DMG, arcing to 3 nearby enemies with high critical strike rate.',
        effectSummary: '100 Shock DMG (Arcs to 3) • 30 MP • 3.5s CD',
      },
      {
        rank: 3,
        manaCost: 35,
        cooldownSeconds: 3.0,
        power: 150,
        description: 'Wrath of the Tempest: 150 Shock DMG chain blast arcing to all enemies in sight with a 50% stun chance.',
        effectSummary: '150 Shock DMG (Full Chain) • 35 MP • 3.0s CD',
      },
    ],
  },
  {
    id: 'iron_bastion',
    name: 'Iron Bastion',
    icon: '🛡️',
    keybind: '[8]',
    type: 'divine_buff',
    element: 'Holy',
    accentColor: 'text-emerald-400',
    borderClass: 'border-emerald-500/70',
    tagline: 'Aegis Ward & Self-Restoration',
    maxRank: 3,
    ranks: [
      {
        rank: 1,
        manaCost: 20,
        cooldownSeconds: 7.0,
        power: 60,
        description: 'Conjure a shimmering runic shield that absorbs 60% of all incoming damage for 6 seconds and heals +30 HP.',
        effectSummary: '60% Barrier +30 HP • 20 MP • 7.0s CD',
      },
      {
        rank: 2,
        manaCost: 24,
        cooldownSeconds: 6.5,
        power: 75,
        description: 'Fortifies the runic aegis, absorbing 75% of incoming damage for 7 seconds, purging toxins and healing +55 HP.',
        effectSummary: '75% Barrier +55 HP • 24 MP • 6.5s CD',
      },
      {
        rank: 3,
        manaCost: 28,
        cooldownSeconds: 6.0,
        power: 90,
        description: 'Divine sanctuary granting near-invulnerability (90% damage mitigation) for 8 seconds and restoring +90 HP.',
        effectSummary: '90% Barrier +90 HP • 28 MP • 6.0s CD',
      },
    ],
  },
];

export function getSkillDefinition(skillId: string): CombatSkillDefinition | undefined {
  return COMBAT_SKILLS.find((s) => s.id === skillId);
}

export function getSkillRankInfo(skillId: string, level: number): SkillRank | undefined {
  const def = getSkillDefinition(skillId);
  if (!def || level <= 0) return undefined;
  return def.ranks[Math.min(level, def.maxRank) - 1];
}

export function canUnlockOrUpgradeSkill(player: Player, skillId: string): boolean {
  const availablePoints = player.skillPoints ?? 0;
  if (availablePoints <= 0) return false;

  const def = getSkillDefinition(skillId);
  if (!def) return false;

  const currentLevel = player.unlockedSkills?.[skillId] ?? 0;
  return currentLevel < def.maxRank;
}

export function unlockOrUpgradeSkill(
  player: Player,
  skillId: string
): { updatedPlayer: Player; success: boolean; message: string } {
  if (!canUnlockOrUpgradeSkill(player, skillId)) {
    return {
      updatedPlayer: player,
      success: false,
      message: 'Not enough skill points or skill already at max rank.',
    };
  }

  const def = getSkillDefinition(skillId)!;
  const currentLevel = player.unlockedSkills?.[skillId] ?? 0;
  const nextLevel = currentLevel + 1;
  const remainingPoints = (player.skillPoints ?? 0) - 1;

  const nextSkills: Record<string, number> = {
    ...(player.unlockedSkills || {}),
    [skillId]: nextLevel,
  };

  const updatedPlayer: Player = {
    ...player,
    skillPoints: remainingPoints,
    unlockedSkills: nextSkills,
  };

  const actionWord = currentLevel === 0 ? 'Unlocked' : 'Upgraded';
  const message = `✨ ${actionWord} [${def.name}] to Rank ${nextLevel}!`;

  return { updatedPlayer, success: true, message };
}

export function respecSkillPoints(player: Player): {
  updatedPlayer: Player;
  refundedPoints: number;
} {
  const currentSkills = player.unlockedSkills || {};
  let totalInvested = 0;
  for (const skillId in currentSkills) {
    totalInvested += currentSkills[skillId] || 0;
  }

  const newTotalPoints = (player.skillPoints ?? 0) + totalInvested;

  const updatedPlayer: Player = {
    ...player,
    skillPoints: newTotalPoints,
    unlockedSkills: {},
  };

  return { updatedPlayer, refundedPoints: totalInvested };
}
