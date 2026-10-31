import React, { useState } from 'react';
import {
  Swords,
  X,
  Shield,
  Award,
  Flame,
  Zap,
  Skull,
  Trophy,
  Check,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Player } from '../types/rpg';
import { getPvPRank, PVP_RANKS } from '../utils/realmsData';
import { sound } from '../utils/audio';

export interface GladiatorChampion {
  id: string;
  name: string;
  title: string;
  sprite: string;
  level: number;
  hp: number;
  atk: number;
  defense: number;
  specialMove: string;
  honorReward: number;
  goldReward: number;
  description: string;
  difficulty: 'Novice' | 'Veteran' | 'Master' | 'Legendary';
  difficultyColor: string;
}

export const ARENA_CHAMPIONS: GladiatorChampion[] = [
  {
    id: 'champ_rogue',
    name: 'Shadowblade Lycus',
    title: 'The Silent Viper',
    sprite: '🥷',
    level: 5,
    hp: 180,
    atk: 18,
    defense: 6,
    specialMove: 'Venomous Ambush',
    honorReward: 40,
    goldReward: 60,
    description: 'A nimble rogue who strikes with dual poison daggers and swift evasion.',
    difficulty: 'Novice',
    difficultyColor: 'text-emerald-400',
  },
  {
    id: 'champ_brutus',
    name: 'Gladiator Brutus',
    title: 'The Iron Bull',
    sprite: '🤺',
    level: 12,
    hp: 420,
    atk: 32,
    defense: 16,
    specialMove: 'Colosseum Whirlwind',
    honorReward: 90,
    goldReward: 150,
    description: 'Former slave turned arena champion, wielding a massive spiky war hammer.',
    difficulty: 'Veteran',
    difficultyColor: 'text-cyan-400',
  },
  {
    id: 'champ_pyro',
    name: 'Pyromancer Vespera',
    title: 'Mistress of the Sunfire',
    sprite: '🧙‍♀️',
    level: 22,
    hp: 850,
    atk: 56,
    defense: 22,
    specialMove: 'Apocalyptic Firestorm',
    honorReward: 200,
    goldReward: 350,
    description: 'Exiled battle-mage channeling scorching fireballs and blinding thunder arcs.',
    difficulty: 'Master',
    difficultyColor: 'text-amber-400',
  },
  {
    id: 'champ_chaos',
    name: 'Chaos Lord Malgok',
    title: 'The Blood Reaver',
    sprite: '👹',
    level: 35,
    hp: 1750,
    atk: 88,
    defense: 36,
    specialMove: 'Abyssal Blood-Leech',
    honorReward: 450,
    goldReward: 800,
    description: 'An unstoppable demonic warlord encased in corrupted obsidian armor.',
    difficulty: 'Legendary',
    difficultyColor: 'text-rose-500',
  },
];

interface PvpArenaModalProps {
  isOpen: boolean;
  player: Player;
  onClose: () => void;
  onTogglePvp: (enabled: boolean) => void;
  onStartDuel: (champion: GladiatorChampion) => void;
}

export const PvpArenaModal: React.FC<PvpArenaModalProps> = ({
  isOpen,
  player,
  onClose,
  onTogglePvp,
  onStartDuel,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'duels' | 'ranks'>('status');

  if (!isOpen) return null;

  const honor = player.pvpHonor || 0;
  const kills = player.pvpKills || 0;
  const deaths = player.pvpDeaths || 0;
  const currentRank = getPvPRank(honor);
  const pvpEnabled = Boolean(player.pvpEnabled);
  const kdRatio = deaths === 0 ? kills : (kills / deaths).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-red-500/50 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-red-500/20 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400">
              <Swords className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wider text-red-400 font-mono">
                  PVP COMBAT & GLADIATOR ARENA
                </h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                    pvpEnabled
                      ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                      : 'bg-slate-800 border border-slate-700 text-slate-400'
                  }`}
                >
                  {pvpEnabled ? '⚔️ WAR FLAGGED' : '🕊️ PEACEFUL'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Engage in real-time LAN player battles or duel legendary Colosseum Champions for honor and glory.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 gap-2 pt-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('status');
            }}
            className={`px-4 py-2 font-mono text-xs font-bold border-b-2 transition ${
              activeTab === 'status'
                ? 'border-red-500 text-red-400 bg-red-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Combat Stance & Stats
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('duels');
            }}
            className={`px-4 py-2 font-mono text-xs font-bold border-b-2 transition ${
              activeTab === 'duels'
                ? 'border-red-500 text-red-400 bg-red-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Gladiator Duels (Solo/Practice)
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('ranks');
            }}
            className={`px-4 py-2 font-mono text-xs font-bold border-b-2 transition ${
              activeTab === 'ranks'
                ? 'border-red-500 text-red-400 bg-red-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Honor Ranks & Perks
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[64vh] space-y-5 custom-scrollbar">
          {activeTab === 'status' && (
            <div className="space-y-5">
              {/* PVP Stance Toggle Card */}
              <div
                className={`p-5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  pvpEnabled
                    ? 'bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900 border-red-500/60 shadow-lg shadow-red-950/40'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300'
                }`}
              >
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{pvpEnabled ? '⚔️' : '🕊️'}</span>
                    <h3 className="font-mono font-bold text-base text-slate-100">
                      PVP Combat Mode:{' '}
                      <span className={pvpEnabled ? 'text-red-400' : 'text-slate-400'}>
                        {pvpEnabled ? 'FLAGGED FOR WAR' : 'DISABLED (SAFE)'}
                      </span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {pvpEnabled
                      ? 'You are flagged for battle! Your abilities and weapon strikes can hit other PVP-flagged LAN players, and you can be attacked. Slaying rivals awards +50 Honor Points.'
                      : 'You are protected in peaceful exploration mode. Attacks will pass harmlessly through other players. Toggle on to duel friends or fight in the arena.'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    onTogglePvp(!pvpEnabled);
                  }}
                  className={`px-6 py-3 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition shrink-0 ${
                    pvpEnabled
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                  }`}
                >
                  {pvpEnabled ? 'Deactivate PVP' : '⚔️ Flag For PVP'}
                </button>
              </div>

              {/* Stats Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 text-center space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-500">PVP Honor Rank</div>
                  <div className={`text-base font-mono font-bold flex items-center justify-center gap-1 ${currentRank.color}`}>
                    <span>{currentRank.badge}</span>
                    <span>{currentRank.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{honor} Honor Points</div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 text-center space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-500">PVP Kills</div>
                  <div className="text-xl font-mono font-bold text-emerald-400">{kills}</div>
                  <div className="text-[10px] text-slate-400">Rivals Vanquished</div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 text-center space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-500">PVP Deaths</div>
                  <div className="text-xl font-mono font-bold text-red-400">{deaths}</div>
                  <div className="text-[10px] text-slate-400">Casualties Taken</div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 text-center space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-500">K/D Ratio</div>
                  <div className="text-xl font-mono font-bold text-amber-400">{kdRatio}</div>
                  <div className="text-[10px] text-slate-400">Combat Efficiency</div>
                </div>
              </div>

              {/* Combat Tips */}
              <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-950/10 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-amber-400 font-mono font-bold">
                  <AlertTriangle className="w-4 h-4" /> Rules of Engagement
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>In LAN co-op, both players must have PVP enabled to strike each other.</li>
                  <li>Targeting enemies or players is automatic within front cone or via [Tab] cycling.</li>
                  <li>Use defensive abilities like <strong className="text-amber-300">Iron Bastion [8]</strong> to cleanse damage over time during duels.</li>
                  <li>When defeated in PVP, you respawn safely at the current town's campfire with full health.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'duels' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mono font-bold text-red-300">
                    COLOSSEUM ROGUE CHAMPIONS
                  </h3>
                  <p className="text-xs text-slate-400">
                    Challenge AI arena gladiators to test your build, earn honor points, and rise in PVP rank.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {ARENA_CHAMPIONS.map((champ) => (
                  <div
                    key={champ.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-red-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-2 rounded-lg bg-slate-900 border border-slate-800">
                            {champ.sprite}
                          </span>
                          <div>
                            <div className="font-mono font-bold text-sm text-slate-100">
                              {champ.name}
                            </div>
                            <div className="text-xs text-slate-400 italic font-serif">
                              "{champ.title}"
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${champ.difficultyColor} border-current/30 bg-current/10 font-bold`}
                        >
                          {champ.difficulty}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-normal">{champ.description}</p>

                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-[11px] font-mono text-center">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Level</span>
                          <span className="text-slate-200 font-bold">{champ.level}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Health</span>
                          <span className="text-red-400 font-bold">{champ.hp} HP</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Attack</span>
                          <span className="text-amber-400 font-bold">{champ.atk} ATK</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Special:</span>
                        <span className="text-red-300 font-bold">{champ.specialMove}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div className="text-[11px] font-mono text-amber-400">
                        +{champ.honorReward} Honor • +{champ.goldReward} Gold
                      </div>
                      <button
                        onClick={() => {
                          sound.playVictory();
                          onStartDuel(champ);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition shadow-lg shadow-red-600/30"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Duel Champion
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ranks' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Accumulate Honor Points through LAN player kills and Colosseum Duels to unlock permanent passive attribute bonuses.
              </div>

              <div className="space-y-2">
                {PVP_RANKS.map((rank, idx) => {
                  const isCurrent = currentRank.title === rank.title;
                  const isUnlocked = honor >= rank.minHonor;

                  return (
                    <div
                      key={rank.title}
                      className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 transition ${
                        isCurrent
                          ? 'bg-red-950/30 border-red-500/70 shadow-md'
                          : isUnlocked
                          ? 'bg-slate-950/60 border-slate-800 text-slate-200'
                          : 'bg-slate-950/30 border-slate-800/40 opacity-50 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{rank.badge}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold text-sm ${rank.color}`}>
                              {rank.title}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-mono font-bold">
                                CURRENT RANK
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            Requires {rank.minHonor} Honor Points
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs">
                        <div className="text-emerald-400">
                          {rank.bonusAtk > 0 ? `+${rank.bonusAtk} Attack Power` : 'Standard Attack'}
                        </div>
                        <div className="text-cyan-400 text-[11px]">
                          {rank.bonusHp > 0 ? `+${rank.bonusHp} Max Health` : 'Standard Health'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
