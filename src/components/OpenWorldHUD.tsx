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
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
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
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isQuestTrackerCollapsed, setIsQuestTrackerCollapsed] = useState(false);
  const [isHeroCollapsed, setIsHeroCollapsed] = useState(false);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);

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

  const latestLog = logs[logs.length - 1];

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2.5 sm:p-3 select-none overflow-hidden font-sans">
      {/* ======================================================== */}
      {/* TOP HEADER ROW                                           */}
      {/* ======================================================== */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {/* Left Column: Hero Vitality & Quest Tracker */}
        <div className="flex flex-col gap-2 max-w-[280px] sm:max-w-[300px]">
          {/* HERO VITALITY FRAME */}
          {!isImmersiveMode && (
            <div className="pointer-events-auto bg-slate-950/65 hover:bg-slate-950/80 backdrop-blur-md border border-slate-700/60 hover:border-slate-600 rounded-xl p-2.5 shadow-xl transition-all duration-200">
              {isHeroCollapsed ? (
                /* Collapsed Minimal Pill */
                <div
                  onClick={() => setIsHeroCollapsed(false)}
                  className="flex items-center justify-between gap-2 cursor-pointer group"
                  title="Expand Hero Profile"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{player.sprite || '🛡️'}</span>
                    <span className="text-xs font-bold text-amber-300">{player.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {player.hp}/{player.maxHp} HP
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition" />
                </div>
              ) : (
                /* Expanded Full Hero Profile */
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 bg-slate-900/90 border border-amber-500/70 rounded-lg flex items-center justify-center text-2xl shadow-inner">
                        {player.sprite || '🛡️'}
                      </div>
                      <div className="absolute -bottom-1.5 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1 py-0.2 rounded shadow">
                        Lv.{player.level}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-amber-300 text-xs truncate max-w-[120px]">
                          {player.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-900/80 text-slate-300 rounded border border-slate-700/70">
                            {player.class}
                          </span>
                          <button
                            onClick={() => setIsHeroCollapsed(true)}
                            className="text-slate-400 hover:text-slate-200 p-0.5"
                            title="Collapse Hero Profile"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* HP Bar */}
                      <div className="mb-1">
                        <div className="flex justify-between text-[10px] font-mono text-emerald-400 leading-tight">
                          <span className="flex items-center gap-0.5">
                            <Heart className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" /> HP
                          </span>
                          <span>
                            {player.hp}/{player.maxHp}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-200"
                            style={{ width: `${hpPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Mana Bar */}
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-cyan-400 leading-tight">
                          <span className="flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 fill-cyan-500 text-cyan-500" /> MP
                          </span>
                          <span>
                            {player.mana}/{player.maxMana}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-200"
                            style={{ width: `${manaPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gold & XP Row */}
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-800/80 text-[10px]">
                    <div className="flex items-center gap-1 text-amber-300 font-bold">
                      <Coins className="w-3 h-3 text-yellow-400" />
                      <span>{player.gold} Gold</span>
                    </div>
                    <div className="flex items-center gap-1 text-sky-300 text-[9px] font-mono">
                      <span>XP:</span>
                      <div className="w-14 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-sky-400 rounded-full" style={{ width: `${xpPercent}%` }} />
                      </div>
                      <span>{xpPercent}%</span>
                    </div>
                  </div>

                  {/* Status Ailments */}
                  {(statusEffects.poisonTurns > 0 || statusEffects.burnTurns > 0) && (
                    <div className="flex gap-1 mt-1.5">
                      {statusEffects.poisonTurns > 0 && (
                        <span className="animate-pulse text-[9px] bg-purple-950/80 text-purple-300 border border-purple-600/70 px-1.5 py-0.5 rounded font-bold">
                          🤢 Poison ({statusEffects.poisonTurns})
                        </span>
                      )}
                      {statusEffects.burnTurns > 0 && (
                        <span className="animate-pulse text-[9px] bg-orange-950/80 text-orange-300 border border-orange-600/70 px-1.5 py-0.5 rounded font-bold">
                          🔥 Burning ({statusEffects.burnTurns})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* QUEST TRACKER WIDGET */}
          {activeQuest && !isImmersiveMode && (
            <div className="pointer-events-auto bg-slate-950/60 hover:bg-slate-950/75 backdrop-blur-md border border-amber-500/30 rounded-xl p-2 shadow-xl transition-all">
              <div className="flex items-center justify-between gap-1.5">
                <div
                  onClick={onOpenQuestLog}
                  className="flex items-center gap-1.5 cursor-pointer hover:text-amber-300 transition truncate"
                  title="Open Quest Log (Q)"
                >
                  <Scroll className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-amber-300 truncate max-w-[170px]">
                    {activeQuest.title}
                  </span>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={onOpenQuestLog}
                    title="Open Quest Journal (Q)"
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/70 font-mono font-bold cursor-pointer"
                  >
                    [Q]
                  </button>
                  <button
                    onClick={() => setIsQuestTrackerCollapsed((prev) => !prev)}
                    className="p-0.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={isQuestTrackerCollapsed ? 'Expand Quest Objectives' : 'Collapse Quest Tracker'}
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
                <div className="mt-1.5 space-y-1.5 border-t border-slate-800/80 pt-1.5">
                  {activeQuest.objectives.map((obj) => (
                    <div key={obj.id} className="text-[10px]">
                      <div className="flex items-center justify-between text-slate-300 mb-0.5">
                        <span className="flex items-center gap-1 truncate max-w-[190px]">
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
                      <div className="w-full bg-slate-900/90 h-1 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${obj.completed ? 'bg-emerald-400' : 'bg-amber-500'}`}
                          style={{
                            width: `${Math.min(100, (obj.currentCount / obj.targetCount) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Claim Button or Reward Preview */}
                  {activeQuest.status === 'completed' ? (
                    <button
                      onClick={() => onClaimQuestReward && onClaimQuestReward(activeQuest.id)}
                      className="w-full mt-1.5 py-1 px-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-[10px] shadow animate-pulse flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Award className="w-3 h-3" /> Claim {activeQuest.reward.uniqueItem.name}!
                    </button>
                  ) : (
                    <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400 border-t border-slate-800/60">
                      <span className="truncate max-w-[180px]">
                        Reward: <span className="text-amber-300 font-bold">{activeQuest.reward.uniqueItem.name}</span>
                      </span>
                      <span className="text-yellow-400 font-bold">+{activeQuest.reward.gold}g</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Sleek Floating Biome & Coordinates Pill */}
        <div className="pointer-events-auto bg-slate-950/50 hover:bg-slate-950/75 backdrop-blur-md border border-slate-800/80 rounded-full px-3 py-1 shadow-lg flex items-center gap-2 transition select-none">
          <span className="text-base">{biomeInfo.icon}</span>
          <div className="flex items-center gap-1.5">
            <span className={`font-bold text-xs ${biomeInfo.color}`}>{biomeInfo.title}</span>
            <span className="text-[10px] font-mono text-slate-400">
              ({Math.round(player.x ?? 18)}, {Math.round(player.y ?? 19)})
            </span>
          </div>
        </div>

        {/* Right Column: Grouped Toolbar & Mini-Map */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          {/* Streamlined Glass Toolbar */}
          <div className="flex items-center gap-1 bg-slate-950/60 backdrop-blur-md border border-slate-800/80 p-1 rounded-xl shadow-lg flex-wrap justify-end">
            {/* Gamepad Connected Badge */}
            {gamepadConnected && (
              <div
                title={gamepadName || 'Xbox / Gamepad Active'}
                className="px-2 py-1 bg-emerald-950/80 border border-emerald-500/70 text-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow"
              >
                <Gamepad2 className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Xbox</span>
              </div>
            )}

            {/* Immersive View Toggle (Clean HUD for maximum world viewing) */}
            <button
              onClick={() => setIsImmersiveMode((prev) => !prev)}
              title={isImmersiveMode ? 'Show Full HUD' : 'Clean Screen Mode (Hides peripheral widgets)'}
              className={`p-1.5 rounded-lg border transition shadow ${
                isImmersiveMode
                  ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/70 text-slate-300'
              }`}
            >
              {isImmersiveMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Touch Controls Toggle & Edit Button */}
            <div className="flex items-center">
              <button
                onClick={onToggleTouchControls}
                title={touchControlsEnabled ? 'Hide Touch Controls' : 'Show Touch Controls'}
                className={`p-1.5 border transition shadow ${
                  touchControlsEnabled
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 rounded-l-lg'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/70 text-slate-400 rounded-lg'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              {touchControlsEnabled && (
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('valdor:open-touch-settings'));
                  }}
                  title="Configure & Move Touch Controls"
                  className="p-1.5 bg-slate-900/90 hover:bg-slate-800 border-y border-r border-amber-500 text-amber-400 rounded-r-lg transition shadow"
                >
                  <Move className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* LAN Multiplayer Button */}
            <button
              onClick={onOpenMultiplayer}
              title="LAN Multiplayer Lobby"
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 shadow transition ${
                peers.length > 0
                  ? 'bg-blue-600/80 hover:bg-blue-500 border-blue-400 text-white'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/70 text-slate-200'
              }`}
            >
              <Users className="w-3 h-3 text-cyan-300" />
              <span className="hidden md:inline">LAN:</span>
              <span>{peers.length > 0 ? `${peers.length}P` : roomCode}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Quest Log Button */}
            <button
              onClick={onOpenQuestLog}
              title="Quest Journal (Q)"
              className={`p-1.5 rounded-lg border transition shadow relative cursor-pointer ${
                hasClaimableQuest
                  ? 'bg-amber-600/90 border-amber-400 text-white animate-pulse'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/70 text-slate-300'
              }`}
            >
              <Scroll className="w-3.5 h-3.5 text-amber-400" />
              {hasClaimableQuest && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-slate-900 animate-ping" />
              )}
            </button>

            {/* Inventory Button */}
            <button
              onClick={onOpenInventory}
              title="Inventory (B / Xbox Start)"
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 rounded-lg text-slate-300 hover:text-white transition shadow cursor-pointer"
            >
              <Backpack className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {/* Character Customization */}
            <button
              onClick={onOpenCharacterCreation}
              title="Customize Hero (C)"
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 rounded-lg text-slate-300 hover:text-white transition shadow"
            >
              <User className="w-3.5 h-3.5 text-purple-400" />
            </button>

            {/* Tech Inspector / XML Bestiary */}
            <button
              onClick={onOpenTechModal}
              title="Tech Inspector / XML Bestiary / DB (T)"
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 rounded-lg text-slate-300 hover:text-white transition shadow"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            {/* CRT Shader Toggle */}
            <button
              onClick={onToggleCrt}
              title="CRT Retro Shader"
              className={`p-1.5 border rounded-lg transition shadow ${
                crtEnabled
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/70 text-slate-400'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
            </button>

            {/* Audio Mute Toggle */}
            <button
              onClick={onToggleMute}
              title="Toggle Audio Mute"
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 rounded-lg text-slate-300 hover:text-white transition shadow"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>

          {/* Mini-Map Component (Collapsible) */}
          {!isImmersiveMode && (
            <MiniMap
              player={player}
              mobs={mobs}
              objects={objects}
              peers={peers}
              targetEnemy={targetEnemy}
              onSelectMonster={onSelectMonster}
            />
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TARGET ENEMY FRAME (Frosted Translucent Overlay)         */}
      {/* ======================================================== */}
      {targetEnemy && targetEnemy.hp > 0 && (
        <div className="pointer-events-auto self-center bg-slate-950/70 backdrop-blur-md border border-red-500/60 rounded-xl px-3 py-1.5 shadow-2xl flex items-center gap-2.5 -mt-4 animate-fade-in">
          <div className="text-2xl">{targetEnemy.sprite}</div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-red-300 text-xs">{targetEnemy.name}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-red-950/80 text-red-300 border border-red-800/80 rounded font-mono">
                Lv.{targetEnemy.level} {targetEnemy.element}
              </span>
              {targetEnemy.isDefending && (
                <span className="text-[9px] px-1.5 py-0.2 bg-sky-950/80 text-sky-400 border border-sky-700/80 rounded flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5" /> Block 50%
                </span>
              )}
            </div>
            <div className="w-36 sm:w-44 h-2 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 mt-1">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all"
                style={{ width: `${Math.round((targetEnemy.hp / targetEnemy.maxHp) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
              <span>Weak: {targetEnemy.weakness}</span>
              <span>
                {targetEnemy.hp}/{targetEnemy.maxHp} HP
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* REWARD / LEVEL UP NOTIFICATION POPUP                     */}
      {/* ======================================================== */}
      {rewardPreview && (
        <div className="pointer-events-none self-center bg-amber-950/90 backdrop-blur-md border-2 border-amber-400/90 rounded-2xl p-3 shadow-2xl text-center animate-bounce z-50 max-w-xs">
          <div className="text-xl mb-0.5">🎉 VICTORY!</div>
          <div className="text-xs font-bold text-amber-200 mb-1">Defeated {rewardPreview.monsterName}</div>
          <div className="flex items-center justify-center gap-3 text-xs font-mono font-bold">
            <span className="text-yellow-400">+{rewardPreview.gold} Gold</span>
            <span className="text-sky-400">+{rewardPreview.xp} XP</span>
          </div>
          {rewardPreview.isLevelUp && (
            <div className="mt-1.5 text-[11px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/80 rounded-lg py-0.5 px-2">
              ⭐ LEVEL UP! Advanced to Level {rewardPreview.newLevel}!
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTEXTUAL OBJECT INTERACT PROMPT                        */}
      {/* ======================================================== */}
      {nearbyObject && (
        <div
          className="pointer-events-auto self-center bg-slate-900/90 backdrop-blur-md border border-yellow-400/80 text-yellow-300 px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-pulse cursor-pointer hover:bg-slate-800 transition"
          onClick={onInteract}
        >
          <span className="text-lg">{nearbyObject.icon}</span>
          <span>{nearbyObject.interactionPrompt}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* BOTTOM SECTION: Combat Log / Chat & Action Hotbar        */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-2.5 mt-auto">
        {/* Streamlined Chat / Combat Log */}
        {!isImmersiveMode && (
          <div className="pointer-events-auto w-full sm:w-80 md:w-88 transition-all duration-300">
            {isChatExpanded ? (
              /* Expanded Log Window */
              <div className="bg-slate-950/65 hover:bg-slate-950/80 backdrop-blur-md border border-slate-700/70 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                {/* Header tabs */}
                <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1 border-b border-slate-800/80 text-[10px] font-bold text-slate-300">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setActiveLogTab('all')}
                      className={`px-2 py-0.5 rounded transition ${
                        activeLogTab === 'all' ? 'bg-amber-600 text-white' : 'hover:text-white'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveLogTab('chat')}
                      className={`px-2 py-0.5 rounded transition ${
                        activeLogTab === 'chat' ? 'bg-amber-600 text-white' : 'hover:text-white'
                      }`}
                    >
                      Party
                    </button>
                    <button
                      onClick={() => setActiveLogTab('combat')}
                      className={`px-2 py-0.5 rounded transition ${
                        activeLogTab === 'combat' ? 'bg-amber-600 text-white' : 'hover:text-white'
                      }`}
                    >
                      Combat
                    </button>
                  </div>
                  <button
                    onClick={() => setIsChatExpanded(false)}
                    className="text-slate-400 hover:text-white p-1 text-[11px]"
                    title="Minimize Log"
                  >
                    ▼
                  </button>
                </div>

                {/* Log messages scroll */}
                <div className="h-24 sm:h-28 overflow-y-auto p-2 text-[10px] sm:text-[11px] font-mono space-y-1 flex flex-col-reverse bg-slate-950/50">
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
                        <span className="text-slate-500 mr-1">[{entry.timestamp}]</span>
                        {entry.sender && <span className="text-cyan-400 font-bold mr-1">{entry.sender}:</span>}
                        <span className={colorClass}>{entry.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="flex border-t border-slate-800/80 bg-slate-900/70">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="LAN party message..."
                    className="flex-1 bg-transparent px-2 py-1 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                  <button
                    type="submit"
                    className="px-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition"
                  >
                    Send
                  </button>
                </form>
              </div>
            ) : (
              /* Minimized Live Ticker (Leaves the world unobstructed!) */
              <div
                onClick={() => setIsChatExpanded(true)}
                className="bg-slate-950/60 hover:bg-slate-950/80 backdrop-blur-md border border-slate-700/70 rounded-xl px-2.5 py-1.5 shadow-lg flex items-center justify-between gap-2 cursor-pointer transition select-none group"
                title="Click to expand full chat & combat log"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-[10px] font-mono text-slate-300 truncate">
                    {latestLog ? (
                      <>
                        <span className="text-slate-500">[{latestLog.timestamp}]</span>{' '}
                        {latestLog.sender && <span className="text-cyan-300 font-bold">{latestLog.sender}: </span>}
                        <span>{latestLog.text}</span>
                      </>
                    ) : (
                      'Chat & Combat Logs (Click to open)'
                    )}
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 group-hover:-translate-y-0.5 transition flex-shrink-0">
                  ▲
                </span>
              </div>
            )}
          </div>
        )}

        {/* REFINED COMBAT ACTION HOTBAR (Docked Center-Bottom) */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-slate-950/65 backdrop-blur-md border border-amber-500/40 p-1.5 rounded-2xl shadow-2xl mx-auto sm:mx-0">
          {/* [1] Attack */}
          <button
            onClick={() => onAction('attack')}
            className="group relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-slate-900/90 hover:bg-amber-950/80 border border-slate-700/80 hover:border-amber-500/80 rounded-xl text-slate-200 transition active:scale-95 shadow"
            title="Melee Strike (Key 1 / Gamepad A)"
          >
            <span className="text-xl sm:text-2xl group-hover:scale-110 transition">🗡️</span>
            <span className="text-[9px] font-bold mt-0.5 leading-none">Strike</span>
            <div className="absolute top-1 left-1.5 flex items-center gap-0.5">
              <span className="text-[8px] font-mono text-amber-400 font-black">[1]</span>
              {gamepadConnected && (
                <span className="px-0.5 bg-green-600 text-white rounded font-sans text-[7px] font-black">A</span>
              )}
            </div>
          </button>

          {/* [2] Fireball */}
          <button
            onClick={() => onAction('fireball')}
            disabled={player.mana < 15}
            className={`group relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-slate-900/90 border rounded-xl text-slate-200 transition active:scale-95 shadow ${
              player.mana >= 15
                ? 'hover:bg-red-950/80 border-slate-700/80 hover:border-red-500/80'
                : 'opacity-40 border-slate-800 cursor-not-allowed'
            }`}
            title="Fireball spell: 15 MP (Key 2 / Gamepad X)"
          >
            <span className="text-xl sm:text-2xl group-hover:scale-110 transition">🔥</span>
            <span className="text-[9px] font-bold mt-0.5 leading-none">Fireball</span>
            <div className="absolute top-1 left-1.5 flex items-center gap-0.5">
              <span className="text-[8px] font-mono text-red-400 font-black">[2]</span>
              {gamepadConnected && (
                <span className="px-0.5 bg-blue-600 text-white rounded font-sans text-[7px] font-black">X</span>
              )}
            </div>
            <span className="absolute bottom-0.5 text-[8px] text-cyan-400 font-mono">15m</span>
          </button>

          {/* [3] Thunder */}
          <button
            onClick={() => onAction('thunder')}
            disabled={player.mana < 20}
            className={`group relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-slate-900/90 border rounded-xl text-slate-200 transition active:scale-95 shadow ${
              player.mana >= 20
                ? 'hover:bg-cyan-950/80 border-slate-700/80 hover:border-cyan-500/80'
                : 'opacity-40 border-slate-800 cursor-not-allowed'
            }`}
            title="Thunder spell: 20 MP (Key 3 / Gamepad Y)"
          >
            <span className="text-xl sm:text-2xl group-hover:scale-110 transition">⚡</span>
            <span className="text-[9px] font-bold mt-0.5 leading-none">Thunder</span>
            <div className="absolute top-1 left-1.5 flex items-center gap-0.5">
              <span className="text-[8px] font-mono text-cyan-400 font-black">[3]</span>
              {gamepadConnected && (
                <span className="px-0.5 bg-yellow-500 text-slate-950 rounded font-sans text-[7px] font-black">Y</span>
              )}
            </div>
            <span className="absolute bottom-0.5 text-[8px] text-cyan-400 font-mono">20m</span>
          </button>

          {/* [4] Potion */}
          <button
            onClick={() => onAction('potion')}
            className="group relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-slate-900/90 hover:bg-emerald-950/80 border border-slate-700/80 hover:border-emerald-500/80 rounded-xl text-slate-200 transition active:scale-95 shadow"
            title="Health Potion: +50 HP (Key 4 / Gamepad B)"
          >
            <span className="text-xl sm:text-2xl group-hover:scale-110 transition">🧪</span>
            <span className="text-[9px] font-bold mt-0.5 leading-none">Potion</span>
            <div className="absolute top-1 left-1.5 flex items-center gap-0.5">
              <span className="text-[8px] font-mono text-emerald-400 font-black">[4]</span>
              {gamepadConnected && (
                <span className="px-0.5 bg-red-600 text-white rounded font-sans text-[7px] font-black">B</span>
              )}
            </div>
            <span className="absolute bottom-0.5 text-[8px] text-emerald-400 font-mono">+50h</span>
          </button>

          {/* Contextual Interact [E] button */}
          {nearbyObject && (
            <button
              onClick={onInteract}
              className="relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 border border-yellow-300 rounded-xl font-black transition active:scale-95 shadow-lg animate-pulse"
              title="Interact (E / Gamepad RB)"
            >
              <span className="text-xl">{nearbyObject.icon}</span>
              <span className="text-[9px] uppercase font-bold mt-0.5 leading-none">[E] USE</span>
              {gamepadConnected && (
                <span className="absolute top-1 right-1 px-1 bg-slate-900 text-yellow-300 border border-yellow-400 rounded font-sans text-[7px] font-black">
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
