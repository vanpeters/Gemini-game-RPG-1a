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

        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded border border-slate-700 bg-slate-900 flex items-center justify-center text-xl">
                  {item.icon || (item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '🧪')}
                </div>
                <div>
                  <div className="font-bold text-xs text-amber-200">{item.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {item.type === 'weapon' && `+${item.power} Attack Power`}
                    {item.type === 'armor' && `+${item.power} Defense Mitigation`}
                    {item.type === 'potion' && `Restores ${item.power} HP & cures poison`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">x{item.quantity}</span>
                {item.type === 'potion' && (
                  <button
                    onClick={() => handleUse(item)}
                    className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition"
                  >
                    Quaff
                  </button>
                )}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500">Your knapsack is empty.</div>
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
