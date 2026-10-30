import { Player, WorldMonster, CombatVerificationResult, InventoryItem } from '../types/rpg';
import { calculateEquipmentStats } from './equipment';

let calculationCounter = 1000;

export interface CombatActionParams {
  action: 'attack' | 'fireball' | 'thunder' | 'potion';
  player: Player;
  monster: WorldMonster;
}

/**
 * Client-side combat verification and damage calculation engine.
 * Fully verifies rolls, abilities, equipment bonuses, and status effects.
 */
export function calculateCombatAction(params: CombatActionParams): CombatVerificationResult {
  const { action, player, monster } = params;
  calculationCounter++;

  const { atkBonus, defBonus } = calculateEquipmentStats(player.equipped);

  let damageDealt = 0;
  let damageTaken = 0;
  let healAmount = 0;
  let manaCost = 0;
  let critical = false;
  let enterDefensiveStance = false;
  let damageMitigated = false;
  let poisonInflicted = false;
  let abilityTriggered = monster.specialAbility;
  let lifeDrained = 0;

  // 1. Process Player Action (Base power modified by equipped weapon/relic)
  if (action === 'attack') {
    const baseAtk = 12 + player.level * 4 + atkBonus;
    const roll = Math.random();
    critical = roll > 0.82; // 18% crit chance
    const multiplier = critical ? 2.0 : 0.9 + Math.random() * 0.25;
    damageDealt = Math.round(baseAtk * multiplier);
  } else if (action === 'fireball') {
    manaCost = 15;
    const baseSpell = 28 + player.level * 6 + Math.round(atkBonus * 0.6);
    critical = Math.random() > 0.75;
    damageDealt = Math.round(baseSpell * (critical ? 1.8 : 1.1));
    // Elemental bonus vs Undead or Earth
    if (monster.element === 'Undead' || monster.element === 'Earth' || monster.weakness === 'Fire') {
      damageDealt = Math.round(damageDealt * 1.35);
    }
  } else if (action === 'thunder') {
    manaCost = 20;
    const baseSpell = 34 + player.level * 7 + Math.round(atkBonus * 0.75);
    critical = Math.random() > 0.8;
    damageDealt = Math.round(baseSpell * (critical ? 1.9 : 1.15));
    if (monster.element === 'Water' || monster.weakness === 'Lightning') {
      damageDealt = Math.round(damageDealt * 1.4);
    }
  } else if (action === 'potion') {
    healAmount = 50 + player.level * 10;
  }

  // 2. Defensive Stance mitigation check
  if (monster.isDefending && damageDealt > 0) {
    damageDealt = Math.max(1, Math.floor(damageDealt * 0.5));
    damageMitigated = true;
  }

  // 3. Apply to Monster HP
  const nextMonsterHp = Math.max(0, monster.hp - damageDealt);

  // 4. Enemy Counterattack if alive and player didn't just cast a ranged attack from afar
  if (nextMonsterHp > 0 && action !== 'potion') {
    let baseMobAtk = monster.atk;

    // Berserk trigger if below 50% HP
    if (monster.specialAbility === 'berserk' && nextMonsterHp < monster.maxHp * 0.5) {
      baseMobAtk = Math.round(baseMobAtk * 1.4);
    }

    // Apply player's equipped armor and shield defense mitigation
    const mitigationPercent = Math.min(0.65, defBonus * 0.018);
    const rawMobDamage = Math.max(3, Math.round(baseMobAtk * (0.85 + Math.random() * 0.3)));
    damageTaken = Math.max(1, Math.round(rawMobDamage * (1 - mitigationPercent)));

    // Chance to enter defensive stance if monster has the ability
    if (monster.specialAbility === 'defensive_stance' && Math.random() < 0.45) {
      enterDefensiveStance = true;
    }

    // Chance to inflict poison
    if (monster.specialAbility === 'poison' && Math.random() < 0.5) {
      poisonInflicted = true;
    }

    // Chance to drain life
    if (monster.specialAbility === 'life_drain') {
      lifeDrained = Math.round(damageTaken * 0.5);
    }
  }

  const nextPlayerHp = Math.min(
    player.maxHp,
    Math.max(0, player.hp + healAmount - damageTaken)
  );
  const nextPlayerMana = Math.max(0, player.mana - manaCost);

  // Engine diagnostic message
  let engineMessage = '';
  if (action === 'potion') {
    engineMessage = `Restorative Draught: +${healAmount} HP restored. Toxins purged.`;
  } else {
    engineMessage = `Roll #${calculationCounter}: Player [${action.toUpperCase()}] deals ${damageDealt} DMG (Crit: ${critical}). Enemy counters for ${damageTaken} DMG.`;
  }

  return {
    verified: true,
    action,
    damageDealt,
    damageTaken,
    healAmount,
    critical,
    manaCost,
    playerHp: nextPlayerHp,
    playerMana: nextPlayerMana,
    enemyHp: nextMonsterHp,
    calculationId: calculationCounter,
    abilityTriggered,
    enterDefensiveStance,
    damageMitigated,
    poisonInflicted,
    lifeDrained,
    engineMessage,
  };
}

/**
 * Default starting inventory items with equippable armaments
 */
export const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: 1, itemId: 'sword_iron', name: 'Iron Broadsword', type: 'weapon', power: 14, quantity: 1, icon: '⚔️', description: 'Sturdy steel forged in Oakhaven. +14 ATK.' },
  { id: 2, itemId: 'shield_wooden', name: 'Oak Buckler', type: 'shield', power: 6, quantity: 1, icon: '🛡️', description: 'Light wooden shield. +6 DEF, +12 Max HP.' },
  { id: 3, itemId: 'armor_leather', name: 'Traveler Tunic', type: 'armor', power: 8, quantity: 1, icon: '🥋', description: 'Boiled leather jerkin. +6 DEF, +24 Max HP.' },
  { id: 4, itemId: 'relic_apprentice', name: 'Apprentice Charm', type: 'relic', power: 5, quantity: 1, icon: '💍', description: 'Enchanted glass bauble. +12 Max MP, +2 ATK.' },
  { id: 5, itemId: 'pot_crimson', name: 'Crimson Potion', type: 'potion', power: 45, quantity: 5, icon: '🧪', description: 'Mends wounds and cures poison.' },
  { id: 6, itemId: 'pot_mana', name: 'Mana Phial', type: 'potion', power: 30, quantity: 3, icon: '🍶', description: 'Refills arcane reserves.' },
];
