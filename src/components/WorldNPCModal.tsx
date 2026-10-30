import React, { useState } from 'react';
import { WorldObject, Player, InventoryItem } from '../types/rpg';
import { MessageSquare, Heart, Shield, Sparkles, Coins, ShoppingBag } from 'lucide-react';
import { sound } from '../utils/audio';

interface WorldNPCModalProps {
  object: WorldObject | null;
  player: Player;
  onClose: () => void;
  onRest: () => void;
  onDrinkFountain: () => void;
  onBuyItem: (item: InventoryItem, cost: number) => void;
}

export const WorldNPCModal: React.FC<WorldNPCModalProps> = ({
  object,
  player,
  onClose,
  onRest,
  onDrinkFountain,
  onBuyItem,
}) => {
  const [dialogueIndex, setDialogueIndex] = useState(0);

  if (!object) return null;

  const dialogues = object.dialogue || [object.description];
  const isCampfire = object.type === 'campfire';
  const isFountain = object.type === 'fountain';
  const isShrine = object.type === 'shrine';
  const isBlacksmith = object.id === 'obj_blacksmith';
  const isAlchemist = object.id === 'obj_alchemist';

  const handleNextDialogue = () => {
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex(dialogueIndex + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-950 px-5 py-3 border-b border-amber-600/50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{object.icon}</span>
            <div>
              <h2 className="text-base font-bold text-amber-300">{object.name}</h2>
              <p className="text-[11px] text-slate-400 capitalize">{object.type} Encounter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-0.5 rounded hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Dialogue box */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 leading-relaxed min-h-[90px] flex items-center">
            {dialogues[dialogueIndex]}
          </div>

          {/* Contextual Action Buttons */}
          {isCampfire && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  onRest();
                  onClose();
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow"
              >
                <span>🔥 Rest by Hearth & Save Progress (Full HP/MP)</span>
              </button>
            </div>
          )}

          {isFountain && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  onDrinkFountain();
                  onClose();
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow"
              >
                <span>⛲ Drink Enchanted Waters (Purify Status & Restore HP)</span>
              </button>
            </div>
          )}

          {isShrine && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  onDrinkFountain();
                  onClose();
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow"
              >
                <Sparkles className="w-4 h-4" />
                <span>Meditate & Absorb Ancient Leyline Resonance</span>
              </button>
            </div>
          )}

          {/* Merchant Shop if Alchemist */}
          {isAlchemist && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center justify-between">
                <span>Alchemical Wares</span>
                <span className="text-yellow-400 font-normal">Your Gold: {player.gold}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={player.gold < 20}
                  onClick={() => {
                    onBuyItem(
                      {
                        id: Date.now(),
                        itemId: 'pot_crimson',
                        name: 'Crimson Potion',
                        type: 'potion',
                        power: 50,
                        quantity: 1,
                        icon: '🧪',
                        description: 'Restores 50 HP and clears poison.',
                      },
                      20
                    );
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 rounded flex items-center justify-between text-xs transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧪</span>
                    <div className="text-left">
                      <div className="font-bold text-slate-200">Crimson Potion</div>
                      <div className="text-[10px] text-emerald-400">+50 HP</div>
                    </div>
                  </div>
                  <span className="text-yellow-400 font-bold">20g</span>
                </button>

                <button
                  disabled={player.gold < 15}
                  onClick={() => {
                    onBuyItem(
                      {
                        id: Date.now(),
                        itemId: 'pot_mana',
                        name: 'Mana Phial',
                        type: 'potion',
                        power: 35,
                        quantity: 1,
                        icon: '🍶',
                        description: 'Restores 35 MP.',
                      },
                      15
                    );
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 rounded flex items-center justify-between text-xs transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍶</span>
                    <div className="text-left">
                      <div className="font-bold text-slate-200">Mana Phial</div>
                      <div className="text-[10px] text-cyan-400">+35 MP</div>
                    </div>
                  </div>
                  <span className="text-yellow-400 font-bold">15g</span>
                </button>
              </div>
            </div>
          )}

          {/* Blacksmith Gear Shop */}
          {isBlacksmith && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center justify-between">
                <span>Forged Armaments</span>
                <span className="text-yellow-400 font-normal">Your Gold: {player.gold}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={player.gold < 80}
                  onClick={() => {
                    onBuyItem(
                      {
                        id: Date.now(),
                        itemId: 'weapon_runeblade',
                        name: 'Rune Blade of Valdor',
                        type: 'weapon',
                        power: 28,
                        quantity: 1,
                        icon: '🗡️',
                        description: 'Sharp steel imbued with ancestral runes.',
                      },
                      80
                    );
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 rounded flex items-center justify-between text-xs transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🗡️</span>
                    <div className="text-left">
                      <div className="font-bold text-slate-200">Rune Blade</div>
                      <div className="text-[10px] text-amber-400">+28 ATK</div>
                    </div>
                  </div>
                  <span className="text-yellow-400 font-bold">80g</span>
                </button>

                <button
                  disabled={player.gold < 100}
                  onClick={() => {
                    onBuyItem(
                      {
                        id: Date.now(),
                        itemId: 'armor_paladin',
                        name: 'Aegis Plate',
                        type: 'armor',
                        power: 20,
                        quantity: 1,
                        icon: '🛡️',
                        description: 'Heavy plate armor granting increased survivability.',
                      },
                      100
                    );
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 rounded flex items-center justify-between text-xs transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛡️</span>
                    <div className="text-left">
                      <div className="font-bold text-slate-200">Aegis Plate</div>
                      <div className="text-[10px] text-sky-400">+20 DEF</div>
                    </div>
                  </div>
                  <span className="text-yellow-400 font-bold">100g</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between bg-slate-950 px-5 py-3 border-t border-slate-800 text-xs">
          <span className="text-slate-500">
            {dialogueIndex + 1} of {dialogues.length}
          </span>
          <button
            onClick={handleNextDialogue}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition"
          >
            {dialogueIndex < dialogues.length - 1 ? 'Next →' : 'Farewell'}
          </button>
        </div>
      </div>
    </div>
  );
};
