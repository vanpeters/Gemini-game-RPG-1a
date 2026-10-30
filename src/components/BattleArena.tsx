import React, { useRef, useEffect } from 'react';
import {
  Shield,
  Zap,
  Flame,
  Sparkles,
  Heart,
  Save,
  Terminal,
  Volume2,
  VolumeX,
  Swords,
  Coins,
  Skull,
  Trophy,
  Package,
  Layers,
  ChevronRight,
  User,
} from 'lucide-react';
import { Player, Monster, CombatLogEntry, FloatingText, CppTelemetry, StatusEffects } from '../types/rpg';
import { sound } from '../utils/audio';

interface BattleArenaProps {
  player: Player;
  enemy: Monster | null;
  logs: CombatLogEntry[];
  floatingTexts: FloatingText[];
  statusEffects: StatusEffects;
  isActing: boolean;
  cppStats: CppTelemetry | null;
  onAction: (action: 'attack' | 'fireball' | 'thunder' | 'potion') => void;
  onSave: () => void;
  onFlee: () => void;
  onOpenInventory: () => void;
  onOpenCharacterCreation: () => void;
  onOpenTechModal: () => void;
  onReturnTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  crtEnabled: boolean;
  onToggleCrt: () => void;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  player,
  enemy,
  logs,
  floatingTexts,
  statusEffects,
  isActing,
  cppStats,
  onAction,
  onSave,
  onFlee,
  onOpenInventory,
  onOpenCharacterCreation,
  onOpenTechModal,
  onReturnTitle,
  isMuted,
  onToggleMute,
  crtEnabled,
  onToggleCrt,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll combat log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Compute percentages safely
  const playerHpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const playerManaPercent = Math.max(0, Math.min(100, (player.mana / player.maxMana) * 100));
  const enemyHpPercent = enemy ? Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100)) : 0;
  const xpNeeded = player.level * 100;
  const xpPercent = Math.min(100, (player.xp / xpNeeded) * 100);

  return (
    <div className={`relative w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-mono select-none ${crtEnabled ? 'crt-scanlines' : ''}`}>
      {/* Background Graphic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="/src/assets/images/valdor_dungeon_backdrop_1793333626022.jpg"
          alt=""
          className="w-full h-full object-cover object-center filter brightness-[0.25] contrast-125"
        />
        <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_10%,_#020617_90%]" />
      </div>

      {/* Top Header / HUD Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 py-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onReturnTitle();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4 text-amber-500" />
            <span className="font-bold tracking-wider uppercase text-amber-200">Ruins of Valdor</span>
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-slate-400">Chamber of Shadows</span>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onOpenCharacterCreation();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-600/40 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-xs transition-colors cursor-pointer"
            title="Customize Hero Name & Archetype"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Hero</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenInventory();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
            title="Open SQLite Inventory"
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>Bag</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenTechModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-purple-500/40 bg-purple-950/50 hover:bg-purple-900/70 text-purple-300 text-xs transition-colors cursor-pointer"
            title="Open 6-Tech Architecture Inspector"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Tech Inspector</span>
            <span className="sm:hidden">Tech</span>
          </button>

          <button
            onClick={onToggleCrt}
            className={`px-2.5 py-1.5 rounded border text-xs transition-colors cursor-pointer ${
              crtEnabled
                ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300'
                : 'border-slate-800 bg-slate-900 text-slate-500'
            }`}
            title="Toggle CRT scanline filter"
          >
            CRT
          </button>

          <button
            onClick={() => {
              onToggleMute();
              sound.playClick();
            }}
            className="p-1.5 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Arena Area */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 py-4 flex-1 flex flex-col justify-center">
        {/* Battle Arena Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-4">
          {/* HERO CARD */}
          <div className={`relative rounded-lg border bg-slate-900/85 backdrop-blur-md p-4 flex flex-col justify-between shadow-lg transition-colors ${
            statusEffects.poisonTurns > 0
              ? 'border-emerald-500/80 ring-1 ring-emerald-500/50'
              : statusEffects.burnTurns > 0
              ? 'border-rose-500/80 ring-1 ring-rose-500/50'
              : 'border-slate-800'
          }`}>
            {/* Hero Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-amber-300">{player.name}</h2>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold">
                    {player.class}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Level {player.level} <span className="text-slate-600">·</span> XP {player.xp}/{xpNeeded}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-yellow-400 font-bold tabular-nums">
                  <Coins className="w-3.5 h-3.5" /> {player.gold}
                </span>
                <span className="flex items-center gap-1 text-slate-400 text-[11px] tabular-nums" title="Wins / Deaths">
                  <Trophy className="w-3 h-3 text-emerald-400" /> {player.wins}
                  <Skull className="w-3 h-3 text-rose-400 ml-1" /> {player.deaths}
                </span>
              </div>
            </div>

            {/* Active Status Effects on Hero */}
            {(statusEffects.poisonTurns > 0 || statusEffects.burnTurns > 0) && (
              <div className="mb-2 flex items-center gap-2 flex-wrap text-xs">
                {statusEffects.poisonTurns > 0 && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/70 text-emerald-300 text-[11px] font-bold flex items-center gap-1 animate-pulse">
                    🤢 Poisoned ({statusEffects.poisonTurns} turns)
                  </span>
                )}
                {statusEffects.burnTurns > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/70 text-rose-300 text-[11px] font-bold flex items-center gap-1 animate-pulse">
                    🔥 Burning ({statusEffects.burnTurns} turns)
                  </span>
                )}
              </div>
            )}

            {/* Hero Character Visual Preview */}
            <div className="flex items-center gap-4 py-2">
              <div className="relative w-16 h-16 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl shadow-inner">
                <span>{player.sprite || '🛡️'}</span>
                {/* Floating Damage Text on Hero */}
                {floatingTexts
                  .filter((f) => f.target === 'player')
                  .map((f) => (
                    <span
                      key={f.id}
                      className={`absolute -top-4 left-1/2 -translate-x-1/2 font-bold text-xs animate-bounce pointer-events-none ${
                        f.type === 'poison'
                          ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                          : f.type === 'heal'
                          ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                          : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      }`}
                    >
                      {f.text}
                    </span>
                  ))}
              </div>

              <div className="flex-1 space-y-2">
                {/* HP Bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-500/20" /> HP
                    </span>
                    <span className="text-slate-300 tabular-nums">
                      {player.hp} / {player.maxHp}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 transition-all duration-300"
                      style={{ width: `${playerHpPercent}%` }}
                    />
                  </div>
                </div>

                {/* Mana Bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-cyan-500/20" /> MANA
                    </span>
                    <span className="text-slate-300 tabular-nums">
                      {player.mana} / {player.maxMana}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 transition-all duration-300"
                      style={{ width: `${playerManaPercent}%` }}
                    />
                  </div>
                </div>

                {/* XP Bar */}
                <div className="pt-0.5">
                  <div className="w-full h-1 rounded bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Hero Subtext */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>DB State: <b className="text-emerald-400 font-normal">SQLite Verified</b></span>
              <span>Hero Style: <b className="text-amber-300 font-normal capitalize">{player.styleId || 'knight'}</b></span>
            </div>
          </div>

          {/* MONSTER CARD */}
          <div className="relative rounded-lg border border-slate-800 bg-slate-900/85 backdrop-blur-md p-4 flex flex-col justify-between shadow-lg">
            {enemy ? (
              <>
                {/* Monster Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                      {enemy.name}
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      XML ID: <span className="font-mono text-cyan-300">"{enemy.id}"</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300">
                      Elem: {enemy.element}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-950/70 border border-rose-800/60 text-rose-300">
                      Weak: {enemy.weakness}
                    </span>
                  </div>
                </div>

                {/* Monster Defensive Stance Active Banner */}
                {enemy.isDefending && (
                  <div className="mb-2 p-1.5 rounded bg-amber-950/80 border border-amber-500/80 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>DEFENSIVE STANCE ACTIVE (-50% DMG Taken)</span>
                  </div>
                )}

                {/* Monster Visual Centerpiece */}
                <div className="flex items-center gap-4 py-2">
                  <div className={`relative w-16 h-16 rounded-lg bg-slate-950 border flex items-center justify-center text-4xl shadow-inner transition-colors ${
                    enemy.isDefending ? 'border-amber-400 ring-2 ring-amber-500/40' : 'border-slate-800'
                  }`}>
                    <span className="transition-transform duration-150 transform hover:scale-110">
                      {enemy.sprite}
                    </span>

                    {/* Floating Damage Text on Monster */}
                    {floatingTexts
                      .filter((f) => f.target === 'enemy')
                      .map((f) => (
                        <span
                          key={f.id}
                          className={`absolute -top-4 left-1/2 -translate-x-1/2 font-bold text-xs pointer-events-none ${
                            f.type === 'crit'
                              ? 'text-yellow-300 text-sm animate-bounce drop-shadow-[0_0_10px_rgba(253,224,71,0.9)]'
                              : f.type === 'defense'
                              ? 'text-cyan-300 text-xs animate-bounce drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                              : 'text-amber-400 animate-bounce drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                          }`}
                        >
                          {f.text}
                        </span>
                      ))}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Monster HP */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-400 font-bold">MONSTER HP</span>
                        <span className="text-slate-300 tabular-nums">
                          {enemy.hp} / {enemy.maxHp}
                        </span>
                      </div>
                      <div className="w-full h-3 rounded bg-slate-950 border border-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 transition-all duration-300"
                          style={{ width: `${enemyHpPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Atk: <b className="text-slate-200">{enemy.atk}</b></span>
                      <span>Ability: <b className="text-amber-300 uppercase font-semibold">{enemy.specialAbility}</b></span>
                      <span>Bounty: <b className="text-yellow-400">+{enemy.gold}g</b></span>
                    </div>

                    <p className="text-[11px] text-slate-400 italic line-clamp-2">
                      "{enemy.lore}"
                    </p>
                  </div>
                </div>

                {/* Monster Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Special Move: <b className="text-rose-300 font-normal">{enemy.specialMove}</b></span>
                  <span>Origin: <b className="text-cyan-300 font-normal">enemies.xml</b></span>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-8 text-slate-500">
                <span>Searching dark chamber...</span>
              </div>
            )}
          </div>
        </div>

        {/* COMBAT LOG */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/90 backdrop-blur-md p-3 mb-4 shadow-inner">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1.5 mb-2">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              Combat Transcript & Backend Event Stream
            </span>
            <span className="text-[10px] text-slate-400">
              Logged events: {logs.length}
            </span>
          </div>

          <div
            ref={logContainerRef}
            className="h-28 overflow-y-auto space-y-1 text-xs pr-1 font-mono leading-relaxed"
          >
            {logs.map((log) => {
              let colorClass = 'text-slate-300';
              if (log.type === 'player_atk') colorClass = 'text-amber-200';
              else if (log.type === 'crit') colorClass = 'text-yellow-300 font-bold';
              else if (log.type === 'spell') colorClass = 'text-cyan-300';
              else if (log.type === 'enemy_atk') colorClass = 'text-rose-400';
              else if (log.type === 'heal') colorClass = 'text-emerald-300';
              else if (log.type === 'victory') colorClass = 'text-yellow-400 font-bold';
              else if (log.type === 'defeat') colorClass = 'text-red-500 font-bold';
              else if (log.type === 'cpp_engine') colorClass = 'text-purple-300 text-[11px]';
              else if (log.type === 'db_save') colorClass = 'text-emerald-400 text-[11px]';
              else if (log.type === 'poison') colorClass = 'text-emerald-400 font-bold';
              else if (log.type === 'defensive_stance') colorClass = 'text-amber-300 font-bold';
              else if (log.type === 'burn') colorClass = 'text-rose-400 font-bold';

              return (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-slate-400 text-[10px] select-none shrink-0 font-mono">
                    [{log.timestamp}]
                  </span>
                  <span className={colorClass}>{log.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTION CONTROLS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Action 1: Attack */}
          <button
            onClick={() => onAction('attack')}
            disabled={isActing || Boolean(enemy && enemy.hp <= 0)}
            className="flex flex-col items-center justify-center p-2.5 rounded border border-amber-600/50 bg-gradient-to-b from-amber-950/60 to-slate-900 hover:from-amber-900/80 hover:to-slate-800 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
              <Swords className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Strike [1]</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">12-20 DMG · 18% Crit</span>
          </button>

          {/* Action 2: Fireball */}
          <button
            onClick={() => onAction('fireball')}
            disabled={isActing || player.mana < 15 || Boolean(enemy && enemy.hp <= 0)}
            className="flex flex-col items-center justify-center p-2.5 rounded border border-rose-600/50 bg-gradient-to-b from-rose-950/60 to-slate-900 hover:from-rose-900/80 hover:to-slate-800 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-1.5 text-rose-300 text-xs font-bold">
              <Flame className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              <span>Fireball [2]</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">25-39 DMG · 15 MP</span>
          </button>

          {/* Action 3: Lightning */}
          <button
            onClick={() => onAction('thunder')}
            disabled={isActing || player.mana < 25 || Boolean(enemy && enemy.hp <= 0)}
            className="flex flex-col items-center justify-center p-2.5 rounded border border-purple-600/50 bg-gradient-to-b from-purple-950/60 to-slate-900 hover:from-purple-900/80 hover:to-slate-800 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold">
              <Zap className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Lightning [3]</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">38-57 DMG · 25 MP</span>
          </button>

          {/* Action 4: Potion */}
          <button
            onClick={() => onAction('potion')}
            disabled={isActing || (player.hp >= player.maxHp && statusEffects.poisonTurns === 0 && statusEffects.burnTurns === 0)}
            className="flex flex-col items-center justify-center p-2.5 rounded border border-emerald-600/50 bg-gradient-to-b from-emerald-950/60 to-slate-900 hover:from-emerald-900/80 hover:to-slate-800 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
              <Heart className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Potion [4]</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">+35 HP · Cures Ailments</span>
          </button>

          {/* Action 5: Save DB */}
          <button
            onClick={onSave}
            disabled={isActing}
            className="flex flex-col items-center justify-center p-2.5 rounded border border-cyan-600/50 bg-gradient-to-b from-cyan-950/60 to-slate-900 hover:from-cyan-900/80 hover:to-slate-800 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 cursor-pointer shadow-sm group"
            title="Persist hero state to SQLite via C++ POST /api/save"
          >
            <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
              <Save className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Save DB [S]</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">SQLite via C++</span>
          </button>

          {/* Action 6: Campfire / Rest */}
          <button
            onClick={onFlee}
            disabled={isActing}
            className="flex flex-col items-center justify-center p-2.5 rounded border border-slate-700 bg-slate-900/90 hover:bg-slate-800 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 cursor-pointer shadow-sm text-slate-400 hover:text-slate-200"
            title="Rest at campfire and restore HP/Mana"
          >
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Rest [F]</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">Campfire Recovery</span>
          </button>
        </div>
      </main>

      {/* Bottom Live Tech Strip */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <span className="flex items-center gap-1.5 text-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            C++ Engine: {cppStats?.engine || 'gcc 12.3 (C++17)'}
          </span>
          <span className="text-slate-600">·</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            SQLite: {cppStats?.sqliteVersion || 'v3.40.1'} (rpg.db)
          </span>
          <span className="text-slate-600">·</span>
          <span className="flex items-center gap-1.5 text-cyan-300">
            XML: 38 Monsters (DOMParser)
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">
            C++ Combat Roll #{cppStats?.combatCalculations || 0}
          </span>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onOpenTechModal();
          }}
          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:underline transition-colors cursor-pointer text-xs"
        >
          <span>Architecture Console</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
};
