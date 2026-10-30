import React, { useState } from 'react';
import { Shield, Sparkles, Wand2, Dices, ArrowRight, X, Heart, Zap, Swords, Check } from 'lucide-react';
import { HeroVisualArchetype, Player } from '../types/rpg';
import { sound } from '../utils/audio';

interface CharacterCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: (newPlayer: Player) => void;
  currentPlayer: Player | null;
}

const HERO_ARCHETYPES: HeroVisualArchetype[] = [
  {
    id: 'knight',
    name: 'Rune Knight',
    className: 'Rune Knight',
    sprite: '🛡️',
    badge: 'Warrior / Vanguard',
    hp: 115,
    mana: 45,
    description: 'A heavily armored champion engraved with ancient protective wards. Superior durability and stalwart defense against physical onslaughts.',
    perk: 'Stalwart Vitality (+15 Max HP & 10% Damage Resistance)',
    accentColor: '#f59e0b',
    borderClass: 'border-amber-500/60 text-amber-300',
    bgGradient: 'from-amber-950/60 to-slate-900',
  },
  {
    id: 'mage',
    name: 'Pyromancer',
    className: 'Pyromancer',
    sprite: '🧙‍♂️',
    badge: 'Spellcaster / Elementalist',
    hp: 85,
    mana: 80,
    description: 'A student of forbidden fiery runes who commands devastating pyromantic flame. Channels superior mana capacity for repeated spellcraft.',
    perk: 'Aether Mastery (+35 Max Mana & +25% Fireball DMG)',
    accentColor: '#ef4444',
    borderClass: 'border-rose-500/60 text-rose-300',
    bgGradient: 'from-rose-950/60 to-slate-900',
  },
  {
    id: 'rogue',
    name: 'Shadow Rogue',
    className: 'Shadow Rogue',
    sprite: '🥷',
    badge: 'Assassin / Infiltrator',
    hp: 92,
    mana: 50,
    description: 'A lethal scout from the submerged undercity. Dances between shadows, identifying vulnerable weak points for devastating critical strikes.',
    perk: 'Lethal Precision (+14% Base Critical Hit Chance)',
    accentColor: '#a855f7',
    borderClass: 'border-purple-500/60 text-purple-300',
    bgGradient: 'from-purple-950/60 to-slate-900',
  },
  {
    id: 'paladin',
    name: 'Sun Templar',
    className: 'Sun Templar',
    sprite: '⚜️',
    badge: 'Holy Crusader / Healer',
    hp: 105,
    mana: 60,
    description: 'Anointed warrior of the solar dawn. Wields holy radiance to restore life force and smite undead horrors that stalk the catacombs.',
    perk: 'Solar Blessing (+15 HP Potion Efficacy & Holy Ward)',
    accentColor: '#eab308',
    borderClass: 'border-yellow-500/60 text-yellow-300',
    bgGradient: 'from-yellow-950/60 to-slate-900',
  },
  {
    id: 'ranger',
    name: 'Storm Ranger',
    className: 'Storm Ranger',
    sprite: '🏹',
    badge: 'Tracker / Marksman',
    hp: 98,
    mana: 55,
    description: 'A wilderness tracker wielding a storm-infused composite bow. Combines steady aim with thunderous arcane shots.',
    perk: 'Tempest Infusion (+20% Lightning Spell Damage)',
    accentColor: '#10b981',
    borderClass: 'border-emerald-500/60 text-emerald-300',
    bgGradient: 'from-emerald-950/60 to-slate-900',
  },
];

const SUGGESTED_NAMES = [
  'Valen the Brave',
  'Aurelia Sunfire',
  'Kaelen Shadowveil',
  'Lyra Frostwhisper',
  'Darius Ironclad',
  'Morrigan Voidseeker',
  'Thorne Oakenshield',
  'Seraphina Dawn',
  'Ragnar Bloodaxe',
  'Elowen Starfall',
];

export const CharacterCreationModal: React.FC<CharacterCreationProps> = ({
  isOpen,
  onClose,
  onCharacterCreated,
  currentPlayer,
}) => {
  const [heroName, setHeroName] = useState<string>(currentPlayer?.name || 'Valen the Brave');
  const [selectedStyleId, setSelectedStyleId] = useState<string>(currentPlayer?.styleId || 'knight');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentArchetype = HERO_ARCHETYPES.find((a) => a.id === selectedStyleId) || HERO_ARCHETYPES[0];

  const rollRandomName = () => {
    sound.playClick();
    const available = SUGGESTED_NAMES.filter((n) => n !== heroName);
    const chosen = available[Math.floor(Math.random() * available.length)];
    setHeroName(chosen);
  };

  const handleCreateHero = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = heroName.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a name for your hero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      const payload = `name=${encodeURIComponent(trimmed)}&class=${encodeURIComponent(
        currentArchetype.className
      )}&styleId=${encodeURIComponent(currentArchetype.id)}&sprite=${encodeURIComponent(
        currentArchetype.sprite
      )}&hp=${currentArchetype.hp}&maxHp=${currentArchetype.hp}&mana=${currentArchetype.mana}&maxMana=${
        currentArchetype.mana
      }`;

      const createdPlayer: Player = {
        id: 1,
        name: heroName.trim(),
        class: currentArchetype.className,
        styleId: currentArchetype.id,
        sprite: currentArchetype.sprite,
        level: 1,
        hp: currentArchetype.hp,
        maxHp: currentArchetype.hp,
        mana: currentArchetype.mana,
        maxMana: currentArchetype.mana,
        gold: 30,
        xp: 0,
        wins: 0,
        deaths: 0,
        source: 'Client-Side Database',
        x: 18,
        y: 19,
        direction: 'down',
        isMoving: false,
      };

      sound.playVictory();
      onCharacterCreated(createdPlayer);
    } catch (err: any) {
      setErrorMessage('Error creating character: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-amber-500/40 bg-amber-950/50 flex items-center justify-center text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-wide">
                Forge Your Hero · Character Creation
              </h2>
              <span className="text-[11px] text-slate-400">
                Choose name, appearance, and starting archetype to persist in SQLite
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close Character Creation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Name Input Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Hero Name
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={heroName}
                maxLength={32}
                onChange={(e) => setHeroName(e.target.value)}
                placeholder="Enter character name..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-amber-500 text-sm text-amber-200 font-mono focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={rollRandomName}
                className="px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                title="Generate Random Hero Name"
              >
                <Dices className="w-4 h-4 text-amber-400" />
                <span>Randomize</span>
              </button>
            </div>
          </div>

          {/* Archetype / Visual Style Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              2. Choose Hero Archetype & Visual Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {HERO_ARCHETYPES.map((archetype) => {
                const isSelected = selectedStyleId === archetype.id;
                return (
                  <button
                    key={archetype.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedStyleId(archetype.id);
                    }}
                    className={`relative p-3.5 rounded-lg border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? `${archetype.borderClass} bg-gradient-to-b ${archetype.bgGradient} ring-2 ring-amber-500/40 shadow-lg scale-102`
                        : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-900 text-slate-400'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <div className="text-3xl mb-2 flex items-center justify-center h-12 bg-slate-900/60 rounded border border-slate-800/80">
                      {archetype.sprite}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{archetype.name}</h4>
                      <span className="text-[10px] text-slate-400 block line-clamp-1">{archetype.badge}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Archetype Live Card Preview */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-5 flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-xl border border-slate-700 bg-slate-900 flex flex-col items-center justify-center text-5xl shadow-inner relative">
              <span>{currentArchetype.sprite}</span>
              <span className="absolute -bottom-2 text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold uppercase">
                {currentArchetype.id}
              </span>
            </div>

            <div className="flex-1 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-amber-300">{heroName || 'Valen'}</h3>
                  <span className="text-[11px] text-slate-400">{currentArchetype.className} · Level 1 Pioneer</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-rose-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-rose-500/20" /> {currentArchetype.hp} Max HP
                  </span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-cyan-500/20" /> {currentArchetype.mana} Max Mana
                  </span>
                </div>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed italic">
                "{currentArchetype.description}"
              </p>

              <div className="pt-1 flex items-center gap-2 text-[11px] text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Trait: <b>{currentArchetype.perk}</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreateHero}
            disabled={isSubmitting || !heroName.trim()}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
          >
            <span>{isSubmitting ? 'Saving to SQLite...' : 'Forge Hero & Enter Ruins'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
