import React, { useState } from 'react';
import {
  Globe,
  X,
  Compass,
  MapPin,
  Sparkles,
  Shield,
  Skull,
  Lock,
  CheckCircle,
  ArrowRight,
  Flame,
  Award,
  Zap,
} from 'lucide-react';
import { Player } from '../types/rpg';
import { REALMS, RealmDefinition, isRealmUnlocked } from '../utils/realmsData';
import { sound } from '../utils/audio';

interface RealmTravelModalProps {
  isOpen: boolean;
  currentRealmId: number;
  player: Player;
  onClose: () => void;
  onTravelToRealm: (realmId: number) => void;
}

export const RealmTravelModal: React.FC<RealmTravelModalProps> = ({
  isOpen,
  currentRealmId,
  player,
  onClose,
  onTravelToRealm,
}) => {
  const [selectedRealmId, setSelectedRealmId] = useState<number>(currentRealmId);

  if (!isOpen) return null;

  const selectedRealm = REALMS.find((r) => r.id === selectedRealmId) || REALMS[0];
  const isSelectedUnlocked = isRealmUnlocked(player, selectedRealmId);
  const isCurrent = selectedRealmId === currentRealmId;

  const handleSelect = (rId: number) => {
    sound.playClick();
    setSelectedRealmId(rId);
  };

  const handleTeleport = () => {
    if (!isSelectedUnlocked || isCurrent) return;
    sound.playVictory();
    onTravelToRealm(selectedRealmId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900/95 border border-amber-500/40 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wider text-amber-300 font-mono">
                  MULTIVERSE REALM GATEWAY
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
                  12 WORLDS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Explore 12 distinct worlds, each featuring its own fortified town, unique NPCs, and perilous dungeons.
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

        {/* Content: 12 Realms List & Details Pane */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
          {/* Left: 12 Realms Grid */}
          <div className="md:col-span-5 border-r border-slate-800 overflow-y-auto p-3 space-y-2 max-h-[58vh] md:max-h-[72vh] custom-scrollbar">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-widest px-2 py-1 flex items-center justify-between">
              <span>Known Dimensions</span>
              <span className="text-amber-400">Level {player.level} Hero</span>
            </div>

            {REALMS.map((realm) => {
              const unlocked = isRealmUnlocked(player, realm.id);
              const isHere = realm.id === currentRealmId;
              const isSelected = realm.id === selectedRealmId;

              return (
                <button
                  key={realm.id}
                  onClick={() => handleSelect(realm.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg'
                      : isHere
                      ? 'bg-slate-800/80 border-emerald-500/60 text-slate-200'
                      : unlocked
                      ? 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-800/60 text-slate-300'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-60 text-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-lg mt-0.5">{realm.badge.split(' ')[0]}</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate font-mono">{realm.name}</span>
                        {isHere && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{realm.town.name}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 text-right">
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        unlocked ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      {realm.levelBracket}
                    </span>
                    {!unlocked ? (
                      <span className="flex items-center gap-1 text-[10px] text-red-400 mt-0.5">
                        <Lock className="w-3 h-3" /> Req Lv.{realm.recommendedLevel}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
                        <CheckCircle className="w-3 h-3" /> Unlocked
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Selected Realm Showcase Pane */}
          <div className="md:col-span-7 p-5 overflow-y-auto max-h-[58vh] md:max-h-[72vh] flex flex-col justify-between space-y-4 bg-slate-950/50">
            <div className="space-y-4">
              {/* Realm Header */}
              <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-slate-900 to-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {selectedRealm.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Recommended: <strong className="text-amber-400">{selectedRealm.levelBracket}</strong>
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-amber-300 font-mono tracking-wide">
                  {selectedRealm.name}
                </h3>
                <div className="text-xs text-amber-200/70 italic font-serif">
                  "{selectedRealm.subtitle}"
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">{selectedRealm.lore}</p>
              </div>

              {/* Two Column Town & Dungeon Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Town Card */}
                <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase">
                    <MapPin className="w-4 h-4" /> Town Haven
                  </div>
                  <div className="text-sm font-bold text-slate-100 font-mono">
                    {selectedRealm.town.name}
                  </div>
                  <div className="text-xs text-slate-400 leading-normal">
                    {selectedRealm.town.description}
                  </div>
                  <div className="pt-2 border-t border-emerald-500/20 text-[11px] space-y-1 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span>{selectedRealm.town.elderIcon}</span>
                      <strong className="text-emerald-300">{selectedRealm.town.elderName}</strong>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Smith: {selectedRealm.town.smithName} • Alchemy: {selectedRealm.town.alchemistName}
                    </div>
                  </div>
                </div>

                {/* Dungeon Card */}
                <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-mono font-bold uppercase">
                    <Skull className="w-4 h-4" /> Dungeon Sector
                  </div>
                  <div className="text-sm font-bold text-slate-100 font-mono">
                    {selectedRealm.dungeon.name}
                  </div>
                  <div className="text-xs text-slate-400 leading-normal">
                    {selectedRealm.dungeon.description}
                  </div>
                  <div className="pt-2 border-t border-red-500/20 text-[11px] space-y-1 text-slate-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span>{selectedRealm.dungeon.bossIcon}</span>
                        <strong className="text-red-300">{selectedRealm.dungeon.bossName}</strong>
                      </div>
                      <span className="text-[10px] text-red-400 font-mono">
                        Lv.{selectedRealm.dungeon.bossLevel}
                      </span>
                    </div>
                    <div className="text-amber-300 text-[10px] flex items-center gap-1">
                      <span>{selectedRealm.dungeon.uniqueLootIcon}</span>
                      <span>Vault: {selectedRealm.dungeon.uniqueLootName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Action Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-400 font-mono">
                {isCurrent ? (
                  <span className="text-emerald-400">You are currently located in this realm.</span>
                ) : isSelectedUnlocked ? (
                  <span className="text-slate-300">Gateway aligned and ready for trans-dimensional teleport.</span>
                ) : (
                  <span className="text-red-400">
                    Realm sealed. Reach Level {selectedRealm.recommendedLevel} to unlock.
                  </span>
                )}
              </div>

              <button
                onClick={handleTeleport}
                disabled={!isSelectedUnlocked || isCurrent}
                className={`px-5 py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition ${
                  isCurrent
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : isSelectedUnlocked
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <span>{isCurrent ? 'Current World' : 'Teleport to Realm'}</span>
                {!isCurrent && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
