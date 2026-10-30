import React, { useState, useEffect } from 'react';
import { X, Package, Shield, Sparkles, Heart } from 'lucide-react';
import { InventoryItem } from '../types/rpg';
import { sound } from '../utils/audio';
import { loadSavedInventory, saveInventoryToStorage } from '../utils/storage';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseItem: (item: InventoryItem) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  onUseItem,
}) => {
  const [items, setItems] = useState<InventoryItem[]>([]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-300">Adventurer Knapsack & Gear</h3>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {items.map((item) => {
            const isUnique = item.isUniqueQuestReward || item.rarity === 'legendary' || item.rarity === 'mythic';

            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-all ${
                  isUnique
                    ? 'border-amber-500/80 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-950/80 shadow-md ring-1 ring-amber-500/30'
                    : 'border-slate-800 bg-slate-950/50 hover:bg-slate-950/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded border flex items-center justify-center text-2xl shadow-inner ${
                        isUnique
                          ? 'border-amber-400 bg-amber-950/60 shadow-amber-500/20'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {item.icon || (item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : item.type === 'relic' ? '👑' : '🧪')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-amber-200">{item.name}</span>
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
                            {item.type === 'armor' && `+${item.power} Defense Mitigation`}
                            {item.type === 'relic' && `+${item.power} Power Enhancement`}
                            {item.type === 'potion' && `Restores ${item.power} HP & cures poison`}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono">x{item.quantity}</span>
                    {item.type === 'potion' && (
                      <button
                        onClick={() => handleUse(item)}
                        className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition cursor-pointer"
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

          {items.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500">Your knapsack is empty. Complete quests to earn unique gear!</div>
          )}
        </div>

        <div className="flex justify-between items-center px-5 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <span>Persisted in Local Database</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
