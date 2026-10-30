import { Player, EquippedGear, InventoryItem, EquipmentSlot } from '../types/rpg';

/**
 * Calculates attribute bonuses provided by all currently equipped gear.
 */
export function calculateEquipmentStats(equipped?: EquippedGear) {
  let atkBonus = 0;
  let hpBonus = 0;
  let defBonus = 0;
  let manaBonus = 0;

  if (!equipped) {
    return { atkBonus, hpBonus, defBonus, manaBonus };
  }

  // Weapon: primary attack power boost
  if (equipped.weapon) {
    const p = equipped.weapon.power || 0;
    atkBonus += equipped.weapon.atkBonus ?? p;
  }

  // Shield: defense & vitality block
  if (equipped.shield) {
    const p = equipped.shield.power || 0;
    defBonus += equipped.shield.defBonus ?? p;
    hpBonus += equipped.shield.hpBonus ?? Math.round(p * 2);
  }

  // Armor: maximum health boost & physical mitigation
  if (equipped.armor) {
    const p = equipped.armor.power || 0;
    defBonus += equipped.armor.defBonus ?? Math.round(p * 0.7);
    hpBonus += equipped.armor.hpBonus ?? Math.round(p * 3);
  }

  // Relic: arcane mana capacity & spell power
  if (equipped.relic) {
    const p = equipped.relic.power || 0;
    manaBonus += equipped.relic.manaBonus ?? Math.round(p * 2.5);
    atkBonus += equipped.relic.atkBonus ?? Math.round(p * 0.5);
  }

  return { atkBonus, hpBonus, defBonus, manaBonus };
}

/**
 * Determines which equipment slot an inventory item belongs to.
 */
export function getSlotForItem(item: InventoryItem): EquipmentSlot | null {
  if (item.type === 'weapon') return 'weapon';
  if (item.type === 'shield') return 'shield';
  if (item.type === 'armor') return 'armor';
  if (item.type === 'relic') return 'relic';
  return null;
}

/**
 * Recalculates effective player attributes based on base level stats + equipment bonuses.
 */
export function recalculatePlayerStats(player: Player): Player {
  const baseHp = player.baseMaxHp ?? 100 + (player.level - 1) * 25;
  const baseMana = player.baseMaxMana ?? 50 + (player.level - 1) * 15;
  const stats = calculateEquipmentStats(player.equipped);

  const nextMaxHp = baseHp + stats.hpBonus;
  const nextMaxMana = baseMana + stats.manaBonus;

  // Preserve HP percentage or cap at max
  const hpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 1;
  const nextHp = Math.min(nextMaxHp, Math.max(1, Math.round(hpRatio * nextMaxHp)));
  const nextMana = Math.min(nextMaxMana, Math.max(0, player.mana));

  return {
    ...player,
    baseMaxHp: baseHp,
    baseMaxMana: baseMana,
    maxHp: nextMaxHp,
    hp: nextHp,
    maxMana: nextMaxMana,
    mana: nextMana,
  };
}

/**
 * Equips an item into the player's active equipment slot and updates attributes.
 */
export function equipItemToPlayer(
  player: Player,
  item: InventoryItem
): { updatedPlayer: Player; previousEquippedItem: InventoryItem | null } {
  const slot = getSlotForItem(item);
  if (!slot) return { updatedPlayer: player, previousEquippedItem: null };

  const currentEquipped = player.equipped || {};
  const previousEquippedItem = currentEquipped[slot] || null;

  const nextEquipped: EquippedGear = {
    ...currentEquipped,
    [slot]: { ...item, quantity: 1 },
  };

  const updatedPlayer = recalculatePlayerStats({
    ...player,
    equipped: nextEquipped,
  });

  return { updatedPlayer, previousEquippedItem };
}

/**
 * Unequips an item from the player's active equipment slot and updates attributes.
 */
export function unequipItemFromPlayer(
  player: Player,
  slot: EquipmentSlot
): { updatedPlayer: Player; unequippedItem: InventoryItem | null } {
  const currentEquipped = player.equipped || {};
  const unequippedItem = currentEquipped[slot] || null;

  if (!unequippedItem) {
    return { updatedPlayer: player, unequippedItem: null };
  }

  const nextEquipped: EquippedGear = {
    ...currentEquipped,
    [slot]: null,
  };

  const updatedPlayer = recalculatePlayerStats({
    ...player,
    equipped: nextEquipped,
  });

  return { updatedPlayer, unequippedItem };
}
