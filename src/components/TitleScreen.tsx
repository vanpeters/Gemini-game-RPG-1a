import React, { useEffect } from 'react';
import { Shield, Sparkles, Volume2, VolumeX, Terminal, Database, Code, FileCode, Users, Wifi } from 'lucide-react';
import { Player } from '../types/rpg';
import { sound } from '../utils/audio';

interface TitleScreenProps {
  onStart: () => void;
  player: Player | null;
  onOpenCharacterCreation: () => void;
  onOpenTechModal: () => void;
  onOpenMultiplayer: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  player,
  onOpenCharacterCreation,
  onOpenTechModal,
  onOpenMultiplayer,
  isMuted,
  onToggleMute,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        sound.playClick();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col justify-between items-center text-slate-100 select-none bg-slate-950 font-sans">
      {/* Background Graphic / Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
      <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_20%,_rgba(5,7,12,0.85)_80%] pointer-events-none" />

      {/* Atmospheric Star / Dust Field */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-15" />

      {/* Top Bar Navigation */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-amber-500/40 bg-amber-950/40 flex items-center justify-center text-amber-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-wider text-amber-200 uppercase font-mono">
              Ruins of Valdor
            </span>
            <span className="text-xs text-slate-400 block font-mono">Open World • LAN Co-Op RPG</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onOpenMultiplayer();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded border border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 text-xs font-mono transition-all cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>LAN Co-Op Lobby</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenTechModal();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 text-xs font-mono transition-all cursor-pointer"
            title="Inspect client-side architecture & XML bestiary"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Tech Inspector</span>
          </button>

          <button
            onClick={() => {
              onToggleMute();
              sound.playClick();
            }}
            className="p-2 rounded border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Center Hero Title Lockup */}
      <main className="relative z-10 max-w-3xl text-center px-4 flex flex-col items-center">
        {/* Thematic Bespoke SVG Title */}
        <div className="mb-4">
          <svg className="w-72 h-16 sm:w-96 sm:h-20 drop-shadow-[0_0_15px_rgba(217,119,6,0.5)]" viewBox="0 0 400 80">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="45%" stopColor="#eab308" />
                <stop offset="70%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
            </defs>
            <text
              x="50%"
              y="55"
              textAnchor="middle"
              fill="url(#goldGrad)"
              className="font-serif font-extrabold tracking-[0.25em]"
              style={{ fontSize: '38px', letterSpacing: '0.22em' }}
            >
              VALDOR
            </text>
            <text
              x="50%"
              y="18"
              textAnchor="middle"
              fill="#94a3b8"
              className="font-mono tracking-[0.35em] text-xs uppercase"
              style={{ fontSize: '11px', letterSpacing: '0.35em' }}
            >
              RUINS OF
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-sm sm:text-base max-w-xl font-serif italic mb-6 leading-relaxed">
          Embark on an open-world fantasy adventure across 5 biomes. Face XML bestiary monsters in real time,
          uncover ancient relics, and explore together with friends over LAN multiplayer.
        </p>

        {/* Hero Character Card Pill */}
        {player && (
          <div className="mb-8 px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900/80 backdrop-blur-sm flex items-center gap-4 text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="text-lg">{player.sprite || '🛡️'}</span>
              Hero: {player.name}
            </span>
            <span>·</span>
            <span className="text-emerald-400">Level {player.level} {player.class}</span>
            <span>·</span>
            <span className="text-yellow-400">💰 {player.gold} Gold</span>
            <span>·</span>
            <span className="text-cyan-400">📍 Oakhaven Hamlet</span>
          </div>
        )}

        {/* Start Quest & Character Creation CTA Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onStart();
            }}
            className="group relative px-8 py-3.5 rounded-md font-mono text-sm uppercase tracking-wider font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-[0_0_25px_rgba(234,179,8,0.45)] hover:shadow-[0_0_35px_rgba(234,179,8,0.65)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-900" />
              Explore Open World (Start)
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenMultiplayer();
            }}
            className="px-6 py-3.5 rounded-md font-mono text-sm uppercase tracking-wider font-bold text-cyan-300 border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/60 hover:text-cyan-200 transition-all cursor-pointer flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>LAN Co-Op Room</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenCharacterCreation();
            }}
            className="px-6 py-3.5 rounded-md font-mono text-sm uppercase tracking-wider font-bold text-amber-300 border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60 hover:text-amber-200 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Forge New Hero</span>
          </button>
        </div>

        {/* Control Hints */}
        <div className="mt-4 text-slate-400 text-xs font-mono tracking-wider">
          Move with <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300">W A S D</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300">Arrows</kbd> · Attack <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300">1 2 3</kbd> · Interact <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300">E</kbd>
        </div>
      </main>

      {/* Bottom 6-Tech Architecture Strip */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-orange-400">
              <Code className="w-3.5 h-3.5" /> HTML/CSS Pixel UI
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5 text-yellow-400">
              <FileCode className="w-3.5 h-3.5" /> JS/TS Open-World Engine
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <FileCode className="w-3.5 h-3.5" /> XML Bestiary (DOMParser)
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Database className="w-3.5 h-3.5" /> Client SQL Persistence
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <Wifi className="w-3.5 h-3.5" /> LAN P2P Multiplayer (WebRTC)
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onOpenTechModal();
            }}
            className="text-amber-400 hover:text-amber-300 hover:underline transition-colors cursor-pointer"
          >
            Architecture Diagnostics →
          </button>
        </div>
      </footer>
    </div>
  );
};
