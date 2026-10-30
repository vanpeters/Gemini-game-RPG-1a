import React, { useState, useEffect } from 'react';
import { X, Package, Shield, Sparkles, Heart } from 'lucide-react';
import { InventoryItem } from '../types/rpg';
import { sound } from '../utils/audio';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchInventory();
  }, [isOpen]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-300">SQLite Inventory</h3>
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

        <div className="p-4 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-lg">
                  {item.type === 'weapon' && '⚔️'}
                  {item.type === 'armor' && '🛡️'}
                  {item.type === 'potion' && '🧪'}
                  {item.type === 'relic' && '💎'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{item.name}</h4>
                  <span className="text-[10px] text-slate-400 uppercase">
                    {item.type} · Power: +{item.power}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-amber-400 font-bold tabular-nums">
                  x{item.quantity}
                </span>
                {item.type === 'potion' && (
                  <button
                    onClick={() => {
                      sound.playPotion();
                      onUseItem(item);
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-700 hover:bg-emerald-900 text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Drink
                  </button>
                )}
              </div>
            </div>
          ))}

          {items.length === 0 && !loading && (
            <div className="text-center py-6 text-slate-500 text-xs">
              Your bag is currently empty.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
