import React, { useState, useEffect } from 'react';
import { X, Package, Shield, Sparkles, Heart, Zap, Sword, Shirt, Gem, CheckCircle2 } from 'lucide-react';
import { InventoryItem, Player, EquipmentSlot } from '../types/rpg';
import { sound } from '../utils/audio';
import { loadSavedInventory, saveInventoryToStorage } from '../utils/storage';
import { calculateEquipmentStats, getSlotForItem } from '../utils/equipment';

interface InventoryModalProps {
  isOpen: boolean;
  player: Player;
  onClose: () => void;
  onUseItem: (item: InventoryItem) => void;
  onEquipItem: (item: InventoryItem) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  player,
  onClose,
  onUseItem,
  onEquipItem,
  onUnequipItem,
}) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'weapon' | 'armor' | 'shield' | 'relic' | 'potion'>('all');

  useEffect(() => {
    if (!isOpen) return;
    const inv = loadSavedInventory();
    setItems(inv);
  }, [isOpen]);

  const handleUse = (item: InventoryItem) => {
    if (item.type === 'potion') {
      sound.playPotion();
      onUseItem(item);
      const updated = items
        .map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0);
      setItems(updated);
      saveInventoryToStorage(updated);
    }
  };

  if (!isOpen) return null;

  const equipped = player.equipped || {};
  const stats = calculateEquipmentStats(equipped);
  const baseHp = player.baseMaxHp ?? 100 + (player.level - 1) * 25;
  const baseMana = player.baseMaxMana ?? 50 + (player.level - 1) * 15;
  const baseAtk = 12 + player.level * 4;

  const filteredItems = items.filter((item) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'armor') return item.type === 'armor';
    if (selectedFilter === 'shield') return item.type === 'shield';
    if (selectedFilter === 'weapon') return item.type === 'weapon';
    if (selectedFilter === 'relic') return item.type === 'relic';
    if (selectedFilter === 'potion') return item.type === 'potion';
    return true;
  });

  const slotsConfig: {
    slot: EquipmentSlot;
    label: string;
    icon: React.ReactNode;
    defaultIcon: string;
    item: InventoryItem | null | undefined;
    desc: string;
  }[] = [
    {
      slot: 'weapon',
      label: 'Main-Hand Weapon',
      icon: <Sword className="w-3.5 h-3.5 text-amber-400" />,
      defaultIcon: '⚔️',
      item: equipped.weapon,
      desc: '+Attack Power damage scaling',
    },
    {
      slot: 'shield',
      label: 'Off-Hand Shield',
      icon: <Shield className="w-3.5 h-3.5 text-sky-400" />,
      defaultIcon: '🛡️',
      item: equipped.shield,
      desc: '+Defense & bonus Max HP vitality',
    },
    {
      slot: 'armor',
      label: 'Chest Armor',
      icon: <Shirt className="w-3.5 h-3.5 text-emerald-400" />,
      defaultIcon: '🥋',
      item: equipped.armor,
      desc: '+Max HP survivability & mitigation',
    },
    {
      slot: 'relic',
      label: 'Relic / Amulet',
      icon: <Gem className="w-3.5 h-3.5 text-purple-400" />,
      defaultIcon: '💍',
      item: equipped.relic,
      desc: '+Max Mana capacity & spell burst',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md font-mono select-none animate-in fade-in zoom-in-95">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-amber-500/80 bg-slate-900 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-500/40 bg-slate-950/90">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-amber-300">Hero Equipment & Knapsack</h3>
              <p className="text-[10px] text-slate-400">
                Equip weapons, shields, and armor to amplify damage and survivability
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Close [ESC]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* ======================================================== */}
          {/* SECTION 1: EQUIPMENT SLOTS (PAPERDOLL)                   */}
          {/* ======================================================== */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 shadow-inner">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Active Equipment Slots
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Click equipped item to unequip
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {slotsConfig.map(({ slot, label, icon, defaultIcon, item }) => (
                <div
                  key={slot}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                    item
                      ? 'border-amber-500/60 bg-gradient-to-r from-slate-900 to-slate-950/90 shadow-md ring-1 ring-amber-500/20'
                      : 'border-dashed border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-lg border flex items-center justify-center text-2xl flex-shrink-0 shadow-inner ${
                        item
                          ? 'border-amber-400/80 bg-amber-950/50 shadow-amber-500/20'
                          : 'border-slate-800 bg-slate-900/60 text-slate-600'
                      }`}
                    >
                      {item ? item.icon || defaultIcon : defaultIcon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-bold">
                        {icon}
                        <span>{label}</span>
                      </div>
                      {item ? (
                        <>
                          <div className="font-bold text-xs text-amber-200 truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono font-bold">
                            {slot === 'weapon' && `+${item.power || item.atkBonus} ATK`}
                            {slot === 'shield' && `+${item.power} DEF • +${Math.round(item.power * 2)} Max HP`}
                            {slot === 'armor' && `+${item.power} DEF • +${Math.round(item.power * 3)} Max HP`}
                            {slot === 'relic' && `+${Math.round(item.power * 2.5)} Max MP • +${Math.round(item.power * 0.5)} ATK`}
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic">Empty Slot</div>
                      )}
                    </div>
                  </div>

                  {item && (
                    <button
                      onClick={() => onUnequipItem(slot)}
                      className="px-2 py-1 text-[10px] rounded bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold transition flex-shrink-0 cursor-pointer"
                      title="Unequip to Knapsack"
                    >
                      Unequip
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: ATTRIBUTE ATTRIBUTES BREAKDOWN CARD           */}
          {/* ======================================================== */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-3 shadow-md">
            <div className="text-[11px] font-bold uppercase text-amber-300 mb-2 flex items-center justify-between">
              <span>Modified Player Attributes</span>
              <span className="text-[10px] text-slate-400 font-normal">Level {player.level} {player.class}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* Attack */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-amber-400/90 font-bold flex items-center gap-1">
                  <Sword className="w-3 h-3 text-amber-400" /> ATK Power
                </div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {baseAtk + stats.atkBonus}
                  {stats.atkBonus > 0 && (
                    <span className="text-[10px] text-emerald-400 ml-1 font-normal font-mono">
                      (+{stats.atkBonus})
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">Base: {baseAtk}</div>
              </div>

              {/* Defense */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-sky-400/90 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-sky-400" /> Defense Rating
                </div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  +{stats.defBonus} DEF
                </div>
                <div className="text-[9px] text-emerald-400 font-mono">
                  {Math.min(65, Math.round(stats.defBonus * 1.8))}% Mitigated
                </div>
              </div>

              {/* Max HP */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-red-400/90 font-bold flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400" /> Max Vitality
                </div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {player.maxHp} HP
                  {stats.hpBonus > 0 && (
                    <span className="text-[10px] text-emerald-400 ml-1 font-normal font-mono">
                      (+{stats.hpBonus})
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">Base: {baseHp} HP</div>
              </div>

              {/* Max Mana */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-cyan-400/90 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" /> Arcane Mana
                </div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {player.maxMana} MP
                  {stats.manaBonus > 0 && (
                    <span className="text-[10px] text-cyan-300 ml-1 font-normal font-mono">
                      (+{stats.manaBonus})
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">Base: {baseMana} MP</div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: KNAPSACK ITEMS LIST                           */}
          {/* ======================================================== */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                Knapsack Inventory ({items.length} items)
              </span>

              {/* Filters */}
              <div className="flex items-center gap-1 text-[10px]">
                {(['all', 'weapon', 'shield', 'armor', 'relic', 'potion'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedFilter(tab)}
                    className={`px-2 py-0.5 rounded capitalize transition font-bold ${
                      selectedFilter === tab
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs italic">
                No items in this category.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const isUnique =
                    item.isUniqueQuestReward ||
                    item.rarity === 'legendary' ||
                    item.rarity === 'mythic';
                  const slot = getSlotForItem(item);
                  const isEquippedInSlot =
                    slot && equipped[slot]?.itemId === item.itemId;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isEquippedInSlot
                          ? 'border-emerald-500/80 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/30'
                          : isUnique
                          ? 'border-amber-500/80 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-950/80 shadow-md ring-1 ring-amber-500/30'
                          : 'border-slate-800 bg-slate-950/50 hover:bg-slate-950/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-lg border flex items-center justify-center text-2xl flex-shrink-0 shadow-inner ${
                              isEquippedInSlot
                                ? 'border-emerald-400 bg-emerald-950/60'
                                : isUnique
                                ? 'border-amber-400 bg-amber-950/60 shadow-amber-500/20'
                                : 'border-slate-700 bg-slate-900'
                            }`}
                          >
                            {item.icon ||
                              (item.type === 'weapon'
                                ? '⚔️'
                                : item.type === 'shield'
                                ? '🛡️'
                                : item.type === 'armor'
                                ? '🥋'
                                : item.type === 'relic'
                                ? '💍'
                                : '🧪')}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-amber-200">
                                {item.name}
                              </span>

                              {isEquippedInSlot && (
                                <span className="text-[9px] bg-emerald-950 border border-emerald-500 text-emerald-300 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> EQUIPPED
                                </span>
                              )}

                              {item.rarity && (
                                <span
                                  className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                                    item.rarity === 'mythic'
                                      ? 'bg-red-950 border-red-500 text-red-300'
                                      : item.rarity === 'legendary'
                                      ? 'bg-amber-950 border-amber-500 text-amber-300'
                                      : item.rarity === 'epic'
                                      ? 'bg-purple-950 border-purple-500 text-purple-300'
                                      : 'bg-slate-800 border-slate-700 text-slate-300'
                                  }`}
                                >
                                  {item.rarity}
                                </span>
                              )}

                              {item.isUniqueQuestReward && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded font-bold">
                                  Unique Quest Relic
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {item.description || (
                                <>
                                  {item.type === 'weapon' && `+${item.power} Attack Power`}
                                  {item.type === 'shield' && `+${item.power} Defense Mitigation`}
                                  {item.type === 'armor' && `+${item.power} Defense & Health`}
                                  {item.type === 'relic' && `+${item.power} Mana & Power`}
                                  {item.type === 'potion' && `Restores ${item.power} HP & cures poison`}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className="text-xs text-slate-400 font-mono">
                            x{item.quantity}
                          </span>

                          {slot && !isEquippedInSlot && (
                            <button
                              onClick={() => {
                                sound.playVictory();
                                onEquipItem(item);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow cursor-pointer active:scale-95"
                            >
                              Equip
                            </button>
                          )}

                          {slot && isEquippedInSlot && (
                            <button
                              onClick={() => {
                                sound.playClick();
                                onUnequipItem(slot);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-bold transition cursor-pointer"
                            >
                              Unequip
                            </button>
                          )}

                          {item.type === 'potion' && (
                            <button
                              onClick={() => handleUse(item)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow cursor-pointer active:scale-95"
                            >
                              Quaff
                            </button>
                          )}
                        </div>
                      </div>

                      {item.lore && (
                        <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-amber-400/90 italic font-serif">
                          "{item.lore}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
