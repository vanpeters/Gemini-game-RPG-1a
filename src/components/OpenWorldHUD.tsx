import React, { useState } from 'react';
import {
  Player,
  WorldMonster,
  WorldObject,
  NetworkPeer,
  CombatLogEntry,
  StatusEffects,
  RewardPreview,
  BiomeType,
} from '../types/rpg';
import {
  Shield,
  Zap,
  Coins,
  Sparkles,
  Users,
  Backpack,
  Terminal,
  User,
  Volume2,
  VolumeX,
  Tv,
  MessageSquare,
  Crosshair,
  Flame,
  Heart,
  Compass,
  Gamepad2,
  Smartphone,
  Move,
  Scroll,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { getBiomeAt } from '../utils/worldGenerator';
import { MiniMap } from './MiniMap';

interface OpenWorldHUDProps {
  player: Player;
  targetEnemy: WorldMonster | null;
  mobs: WorldMonster[];
  objects: WorldObject[];
  logs: CombatLogEntry[];
  statusEffects: StatusEffects;
  rewardPreview: RewardPreview | null;
  peers: NetworkPeer[];
  isHost: boolean;
  roomCode: string;
  ping: number;
  onAction: (action: 'attack' | 'fireball' | 'thunder' | 'potion') => void;
  onOpenMultiplayer: () => void;
  onOpenInventory: () => void;
  onOpenCharacterCreation: () => void;
  onOpenTechModal: () => void;
  onOpenQuestLog: () => void;
  onClaimQuestReward?: (questId: string) => void;
  onToggleMute: () => void;
  isMuted: boolean;
  crtEnabled: boolean;
  onToggleCrt: () => void;
  onSendChat: (text: string) => void;
  nearbyObject: WorldObject | null;
  onInteract: () => void;
  onSelectMonster?: (mob: WorldMonster) => void;
  gamepadConnected?: boolean;
  gamepadName?: string;
  touchControlsEnabled?: boolean;
  onToggleTouchControls?: () => void;
}

const BIOME_NAMES: Record<BiomeType, { title: string; icon: string; desc: string; color: string }> = {
  oakhaven: { title: 'Oakhaven Hamlet', icon: '🏡', desc: 'Peaceful settlement of artisans and elders.', color: 'text-emerald-400' },
  wildwood: { title: 'Whispering Wildwood', icon: '🌲', desc: 'Overgrown woodland teeming with goblins & dire wolves.', color: 'text-green-400' },
  ruins: { title: 'Ancient Ruins of Valdor', icon: '🏛️', desc: 'Crumbling citadel haunted by skeleton knights & liches.', color: 'text-indigo-400' },
  mire: { title: 'Gloom Mire', icon: '🐊', desc: 'Venomous swampland; watch out for poison hydras.', color: 'text-lime-400' },
  caldera: { title: 'Molten Caldera', icon: '🌋', desc: 'Scorched volcanic lair of the Nether Dragon.', color: 'text-red-400' },
};

export const OpenWorldHUD: React.FC<OpenWorldHUDProps> = ({
  player,
  targetEnemy,
  mobs,
  objects,
  logs,
  statusEffects,
  rewardPreview,
  peers,
  isHost,
  roomCode,
  ping,
  onAction,
  onOpenMultiplayer,
  onOpenInventory,
  onOpenCharacterCreation,
  onOpenTechModal,
  onOpenQuestLog,
  onClaimQuestReward,
  onToggleMute,
  isMuted,
  crtEnabled,
  onToggleCrt,
  onSendChat,
  nearbyObject,
  onInteract,
  onSelectMonster,
  gamepadConnected,
  gamepadName,
  touchControlsEnabled,
  onToggleTouchControls,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [activeLogTab, setActiveLogTab] = useState<'all' | 'chat' | 'combat'>('all');
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isQuestTrackerCollapsed, setIsQuestTrackerCollapsed] = useState(false);

  const biomeKey = getBiomeAt(player.x ?? 18, player.y ?? 19);
  const biomeInfo = BIOME_NAMES[biomeKey];

  const quests = player.quests || [];
  const activeQuest = quests.find((q) => q.id === player.activeQuestId) || quests[0];
  const hasClaimableQuest = quests.some((q) => q.status === 'completed');

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  const hpPercent = Math.max(0, Math.min(100, Math.round((player.hp / player.maxHp) * 100)));
  const manaPercent = Math.max(0, Math.min(100, Math.round((player.mana / player.maxMana) * 100)));
  const xpNeeded = player.level * 100;
  const xpPercent = Math.max(0, Math.min(100, Math.round((player.xp / xpNeeded) * 100)));

  const filteredLogs = logs.filter((l) => {
    if (activeLogTab === 'chat') return l.type === 'chat' || l.type === 'multiplayer';
    if (activeLogTab === 'combat') return l.type !== 'chat';
    return true;
  });

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 select-none">
      {/* TOP BAR */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Hero Section & Quest Tracker */}
        <div className="flex flex-col gap-2 max-w-[320px]">
          {/* Hero Vitality Box */}
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border-2 border-amber-600/60 rounded-lg p-3 shadow-2xl flex items-center gap-3 min-w-[280px]">
            <div className="relative">
              <div className="w-14 h-14 bg-slate-950 border-2 border-amber-500 rounded-md flex items-center justify-center text-3xl shadow-inner">
                {player.sprite || '🛡️'}
              </div>
              <div className="absolute -bottom-2 -right-1 bg-amber-500 text-slate-950 font-black text-[11px] px-1.5 py-0.5 rounded shadow">
                Lv.{player.level}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-300 text-sm">{player.name}</span>
                <span className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                  {player.class}
                </span>
              </div>

              {/* Health Bar */}
              <div className="mb-1.5">
                <div className="flex justify-between text-[11px] font-mono text-emerald-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-emerald-500 text-emerald-500" /> HP
                  </span>
                  <span>
                    {player.hp} / {player.maxHp}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-200"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>

              {/* Mana Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-cyan-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-cyan-500 text-cyan-500" /> MP
                  </span>
                  <span>
                    {player.mana} / {player.maxMana}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-200"
                    style={{ width: `${manaPercent}%` }}
                  />
                </div>
              </div>

              {/* XP & Gold row */}
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800 text-[11px]">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{player.gold} Gold</span>
                </div>
                <div className="flex items-center gap-1 text-sky-300 text-[10px]">
                  <span>XP:</span>
                  <div className="w-16 h-1.5 bg-slate-950 rounded overflow-hidden border border-slate-800">
                    <div className="h-full bg-sky-400" style={{ width: `${xpPercent}%` }} />
                  </div>
                  <span>{xpPercent}%</span>
                </div>
              </div>

              {/* Status Ailments Badges */}
              {(statusEffects.poisonTurns > 0 || statusEffects.burnTurns > 0) && (
                <div className="flex gap-1.5 mt-2">
                  {statusEffects.poisonTurns > 0 && (
                    <span className="animate-pulse text-[10px] bg-purple-950 text-purple-300 border border-purple-600 px-1.5 py-0.5 rounded font-bold">
                      🤢 Poisoned ({statusEffects.poisonTurns})
                    </span>
                  )}
                  {statusEffects.burnTurns > 0 && (
                    <span className="animate-pulse text-[10px] bg-orange-950 text-orange-300 border border-orange-600 px-1.5 py-0.5 rounded font-bold">
                      🔥 Burning ({statusEffects.burnTurns})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quest Tracker Widget */}
          {activeQuest && (
            <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-amber-600/50 rounded-lg p-2.5 shadow-xl transition-all">
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
                <div
                  onClick={onOpenQuestLog}
                  className="flex items-center gap-1.5 cursor-pointer hover:text-amber-300 transition"
                >
                  <Scroll className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-amber-300 truncate max-w-[200px]">
                    {activeQuest.title}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={onOpenQuestLog}
                    title="Open Full Quest Journal (Q)"
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold cursor-pointer"
                  >
                    [Q]
                  </button>
                  <button
                    onClick={() => setIsQuestTrackerCollapsed((prev) => !prev)}
                    className="p-0.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {isQuestTrackerCollapsed ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {!isQuestTrackerCollapsed && (
                <div className="mt-2 space-y-1.5">
                  {activeQuest.objectives.map((obj) => (
                    <div key={obj.id} className="text-[10px]">
                      <div className="flex items-center justify-between text-slate-300 mb-0.5">
                        <span className="flex items-center gap-1 truncate max-w-[210px]">
                          {obj.completed ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Circle className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          )}
                          <span className={obj.completed ? 'line-through text-slate-500' : ''}>
                            {obj.description}
                          </span>
                        </span>
                        <span className="font-mono text-slate-400 ml-1 font-bold">
                          {obj.currentCount}/{obj.targetCount}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${obj.completed ? 'bg-emerald-400' : 'bg-amber-500'}`}
                          style={{
                            width: `${Math.min(100, (obj.currentCount / obj.targetCount) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Claim or Reward Preview */}
                  {activeQuest.status === 'completed' ? (
                    <button
                      onClick={() => onClaimQuestReward && onClaimQuestReward(activeQuest.id)}
                      className="w-full mt-2 py-1 px-2 rounded bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-[11px] shadow animate-pulse flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" /> Claim {activeQuest.reward.uniqueItem.name}!
                    </button>
                  ) : (
                    <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400 border-t border-slate-800/80 mt-1">
                      <span className="flex items-center gap-1">
                        <span>Reward:</span>
                        <span className="text-amber-300 font-bold">
                          {activeQuest.reward.uniqueItem.icon} {activeQuest.reward.uniqueItem.name}
                        </span>
                      </span>
                      <span className="text-yellow-400 font-bold">+{activeQuest.reward.gold}g</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Biome & Coordinates Banner */}
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700 rounded-lg px-3 py-1.5 shadow-lg flex items-center gap-2.5">
          <span className="text-xl">{biomeInfo.icon}</span>
          <div>
            <div className={`font-bold text-xs ${biomeInfo.color} flex items-center gap-1.5`}>
              <span>{biomeInfo.title}</span>
              <span className="text-[10px] font-mono text-slate-400">
                ({Math.round(player.x ?? 18)}, {Math.round(player.y ?? 19)})
              </span>
            </div>
            <div className="text-[10px] text-slate-400">{biomeInfo.desc}</div>
          </div>
        </div>

        {/* Top-Right Container: Control Buttons & Mini-Map */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {/* Top Control Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Gamepad Connection Badge */}
            {gamepadConnected && (
              <div
                title={gamepadName || 'Xbox / Standard Controller Active'}
                className="px-2.5 py-1 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Xbox Connected</span>
              </div>
            )}

            {/* Touch Controls Toggle & Customize Buttons */}
            <div className="flex items-center">
              <button
                onClick={onToggleTouchControls}
                title={touchControlsEnabled ? 'Hide Touch Controls' : 'Show Touch Controls (Android / Mobile)'}
                className={`p-2 border transition shadow ${
                  touchControlsEnabled
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 rounded-l-lg'
                    : 'bg-slate-900/90 border-slate-700 text-slate-400 rounded-lg'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              {touchControlsEnabled && (
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('valdor:open-touch-settings'));
                  }}
                  title="Configure Touch Controls (Resize, Move, Opacity)"
                  className="p-2 bg-slate-900 hover:bg-slate-800 border-y border-r border-amber-500 text-amber-400 rounded-r-lg transition shadow"
                >
                  <Move className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* LAN Multiplayer Button */}
            <button
              onClick={onOpenMultiplayer}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
                peers.length > 0
                  ? 'bg-blue-600/90 hover:bg-blue-500 border-blue-400 text-white'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-300" />
              <span>LAN: {peers.length > 0 ? `${peers.length} Peers` : roomCode}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>

            {/* Quest Log Button */}
            <button
              onClick={onOpenQuestLog}
              title="Quest Chronicles & Missions (Q)"
              className={`p-2 rounded-lg border transition shadow relative cursor-pointer ${
                hasClaimableQuest
                  ? 'bg-amber-600/90 border-amber-400 text-white animate-pulse'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Scroll className="w-4 h-4 text-amber-400" />
              {hasClaimableQuest && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900 animate-ping" />
              )}
            </button>

            {/* Inventory Button */}
            <button
              onClick={onOpenInventory}
              title="Inventory (B / Xbox Start)"
              className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition shadow cursor-pointer"
            >
              <Backpack className="w-4 h-4 text-amber-400" />
            </button>

            {/* Character Customization */}
            <button
              onClick={onOpenCharacterCreation}
              title="Customize Character (C)"
              className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition shadow"
            >
              <User className="w-4 h-4 text-purple-400" />
            </button>

            {/* Tech Inspector */}
            <button
              onClick={onOpenTechModal}
              title="Tech Inspector / XML Bestiary / DB (T / Xbox Back)"
              className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition shadow"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
            </button>

            {/* CRT Scanline Toggle */}
            <button
              onClick={onToggleCrt}
              title="Toggle CRT Shader"
              className={`p-2 border rounded-lg transition shadow ${
                crtEnabled ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'bg-slate-900/90 border-slate-700 text-slate-400'
              }`}
            >
              <Tv className="w-4 h-4" />
            </button>

            {/* Audio Mute */}
            <button
              onClick={onToggleMute}
              title="Toggle Audio"
              className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition shadow"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          {/* Mini-Map Component in Top-Right Corner */}
          <MiniMap
            player={player}
            mobs={mobs}
            objects={objects}
            peers={peers}
            targetEnemy={targetEnemy}
            onSelectMonster={onSelectMonster}
          />
        </div>
      </div>

      {/* TARGET ENEMY CARD (if enemy nearby or engaged) */}
      {targetEnemy && targetEnemy.hp > 0 && (
        <div className="pointer-events-auto self-center bg-slate-950/90 backdrop-blur-md border-2 border-red-500/80 rounded-lg px-4 py-2.5 shadow-2xl flex items-center gap-3 -mt-6">
          <div className="text-3xl">{targetEnemy.sprite}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-300 text-sm">{targetEnemy.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded">
                Lv.{targetEnemy.level} {targetEnemy.element}
              </span>
              {targetEnemy.isDefending && (
                <span className="text-[10px] px-1.5 py-0.5 bg-sky-950 text-sky-400 border border-sky-700 rounded flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Block 50%
                </span>
              )}
            </div>
            <div className="w-44 h-2.5 bg-slate-900 rounded overflow-hidden border border-slate-800 mt-1">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all"
                style={{ width: `${Math.round((targetEnemy.hp / targetEnemy.maxHp) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-0.5">
              <span>Weakness: {targetEnemy.weakness}</span>
              <span>
                {targetEnemy.hp} / {targetEnemy.maxHp} HP
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING LEVEL UP / REWARD PREVIEW POPUP */}
      {rewardPreview && (
        <div className="pointer-events-none self-center bg-amber-950/95 border-2 border-amber-400 rounded-xl p-4 shadow-2xl text-center animate-bounce z-50">
          <div className="text-2xl mb-1">🎉 VICTORY!</div>
          <div className="text-xs font-bold text-amber-200 mb-2">Felled {rewardPreview.monsterName}</div>
          <div className="flex items-center justify-center gap-4 text-sm font-mono font-bold">
            <span className="text-yellow-400">+{rewardPreview.gold} Gold</span>
            <span className="text-sky-400">+{rewardPreview.xp} XP</span>
          </div>
          {rewardPreview.isLevelUp && (
            <div className="mt-2 text-xs font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500 rounded py-1 px-2">
              ⭐ LEVEL UP! Advanced to Level {rewardPreview.newLevel}!
            </div>
          )}
        </div>
      )}

      {/* NEARBY INTERACTION PROMPT */}
      {nearbyObject && (
        <div className="pointer-events-auto self-center bg-slate-900/95 border-2 border-yellow-500 text-yellow-300 px-4 py-2 rounded-lg font-bold text-xs shadow-2xl flex items-center gap-2 animate-pulse cursor-pointer"
             onClick={onInteract}>
          <span className="text-xl">{nearbyObject.icon}</span>
          <span>{nearbyObject.interactionPrompt}</span>
        </div>
      )}

      {/* BOTTOM SECTION: Combat Log & Chat + Action Hotbar */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-3 mt-auto">
        {/* Real-Time Party Chat & Combat Log */}
        <div className="pointer-events-auto w-full md:w-96 bg-slate-950/90 backdrop-blur-md border border-slate-700 rounded-lg overflow-hidden shadow-2xl flex flex-col">
          {/* Header tabs */}
          <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 border-b border-slate-800 text-xs font-bold text-slate-300">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveLogTab('all')}
                className={`px-2 py-0.5 rounded transition ${activeLogTab === 'all' ? 'bg-amber-600 text-white' : 'hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveLogTab('chat')}
                className={`px-2 py-0.5 rounded transition ${activeLogTab === 'chat' ? 'bg-amber-600 text-white' : 'hover:text-white'}`}
              >
                Party Chat
              </button>
              <button
                onClick={() => setActiveLogTab('combat')}
                className={`px-2 py-0.5 rounded transition ${activeLogTab === 'combat' ? 'bg-amber-600 text-white' : 'hover:text-white'}`}
              >
                Combat
              </button>
            </div>
            <button
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              className="text-slate-400 hover:text-white text-[11px]"
            >
              {isChatExpanded ? '▼' : '▲'}
            </button>
          </div>

          {/* Log Messages */}
          {isChatExpanded && (
            <div className="h-28 overflow-y-auto p-2 text-[11px] font-mono space-y-1 flex flex-col-reverse bg-slate-950/70">
              {filteredLogs.slice(-25).reverse().map((entry) => {
                let colorClass = 'text-slate-300';
                if (entry.type === 'player_atk') colorClass = 'text-green-400';
                else if (entry.type === 'enemy_atk') colorClass = 'text-red-400';
                else if (entry.type === 'spell') colorClass = 'text-cyan-400';
                else if (entry.type === 'heal') colorClass = 'text-emerald-400';
                else if (entry.type === 'crit') colorClass = 'text-yellow-400 font-bold';
                else if (entry.type === 'victory') colorClass = 'text-amber-300 font-bold';
                else if (entry.type === 'poison') colorClass = 'text-purple-400';
                else if (entry.type === 'defensive_stance') colorClass = 'text-sky-300';
                else if (entry.type === 'chat') colorClass = 'text-blue-300 font-medium';
                else if (entry.type === 'multiplayer') colorClass = 'text-indigo-300';

                return (
                  <div key={entry.id} className="leading-tight">
                    <span className="text-slate-500 mr-1.5">[{entry.timestamp}]</span>
                    {entry.sender && <span className="text-cyan-400 font-bold mr-1">{entry.sender}:</span>}
                    <span className={colorClass}>{entry.text}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chat Input Bar */}
          <form onSubmit={handleChatSubmit} className="flex border-t border-slate-800 bg-slate-900/90">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Press Enter to send LAN party chat..."
              className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none font-mono"
            />
            <button
              type="submit"
              className="px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition"
            >
              Send
            </button>
          </form>
        </div>

        {/* COMBAT ACTION HOTBAR */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/90 backdrop-blur-md border-2 border-amber-600/60 p-2 rounded-xl shadow-2xl">
          {/* [1] Attack */}
          <button
            onClick={() => onAction('attack')}
            className="group relative flex flex-col items-center justify-center w-16 h-16 bg-slate-900 hover:bg-amber-950 border-2 border-slate-700 hover:border-amber-500 rounded-lg text-slate-200 transition active:scale-95 shadow"
          >
            <span className="text-2xl group-hover:scale-110 transition">🗡️</span>
            <span className="text-[10px] font-bold mt-0.5">Strike</span>
            <div className="absolute top-1 left-1.5 flex items-center gap-0.5">
              <span className="text-[9px] font-mono text-amber-400 font-black">[1]</span>
              {gamepadConnected && (
                <span className="px-1 bg-green-600 text-white rounded font-sans text-[8px] font-black">A</span>
              )}
            </div>
          </button>

          {/* [2] Fireball */}
          <button
            onClick={() => onAction('fireball')}
            disabled={player.mana < 15}
            className={`group relative flex flex-col items-center justify-center w-16 h-16 bg-slate-900 border-2 rounded-lg text-slate-200 transition active:scale-95 shadow ${
              player.mana >= 15
                ? 'hover:bg-red-950 border-slate-700 hover:border-red-500'
                : 'opacity-50 border-slate-800 cursor-not-allowed'
            }`}
          >
            <span className="text-2xl group-hover:scale-110 transition">🔥</span>
            <span className="text-[10px] font-bold mt-0.5">Fireball</span>
            <div className="absolute top-1 left-1.5 flex items-center gap-0.5">
              <span className="text-[9px] font-mono text-red-400 font-black">[2]</span>
              {gamepadConnected && (
                <span className="px-1 bg-blue-600 text-white rounded font-sans text-[8px] font-black">X</span>
              )}
            </div>
            <span className="absolute bottom-1 text-[9px] text-cyan-400 font-mono">15 MP</span>
          </button>

          {/* [3] Thunder */}
          <button
            onClick={() => onAction('thunder')}
            disabled={player.mana < 20}
            className={`group relative flex flex-col items-center justify-center w-16 h-16 bg-slate-900 border-2 rounded-lg text-slate-200 transition active:scale-95 shadow ${
              player.mana >= 20
                ? 'hover:bg-cyan-950 border-slate-700 hover:border-cyan-500'
                : 'opacity-50 border-slate-800 cursor-not-allowed'
            }`}
          >
            <span className="text-2xl group-hover:scale-110 transition">⚡</span>
            <span className="text-[10px] font-bold mt-0.5">Thunder</span>
            <div className="absolute top-1 left-1.5 flex items-center gap-0.5">
              <span className="text-[9px] font-mono text-cyan-400 font-black">[3]</span>
              {gamepadConnected && (
                <span className="px-1 bg-yellow-500 text-slate-950 rounded font-sans text-[8px] font-black">Y</span>
              )}
            </div>
            <span className="absolute bottom-1 text-[9px] text-cyan-400 font-mono">20 MP</span>
          </button>

          {/* [4] Potion */}
          <button
            onClick={() => onAction('potion')}
            className="group relative flex flex-col items-center justify-center w-16 h-16 bg-slate-900 hover:bg-emerald-950 border-2 border-slate-700 hover:border-emerald-500 rounded-lg text-slate-200 transition active:scale-95 shadow"
          >
            <span className="text-2xl group-hover:scale-110 transition">🧪</span>
            <span className="text-[10px] font-bold mt-0.5">Potion</span>
            <div className="absolute top-1 left-1.5 flex items-center gap-0.5">
              <span className="text-[9px] font-mono text-emerald-400 font-black">[4]</span>
              {gamepadConnected && (
                <span className="px-1 bg-red-600 text-white rounded font-sans text-[8px] font-black">B</span>
              )}
            </div>
            <span className="absolute bottom-1 text-[9px] text-emerald-400 font-mono">+50 HP</span>
          </button>

          {/* Contextual Interact [E] */}
          {nearbyObject && (
            <button
              onClick={onInteract}
              className="relative flex flex-col items-center justify-center w-16 h-16 bg-yellow-500 hover:bg-yellow-400 text-slate-950 border-2 border-yellow-300 rounded-lg font-black transition active:scale-95 shadow-lg animate-pulse"
            >
              <span className="text-2xl">{nearbyObject.icon}</span>
              <span className="text-[10px] uppercase font-bold mt-0.5">[E] USE</span>
              {gamepadConnected && (
                <span className="absolute top-1 right-1 px-1 bg-slate-900 text-yellow-300 border border-yellow-400 rounded font-sans text-[8px] font-black">
                  RB
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
