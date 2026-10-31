import React, { useState, useEffect } from 'react';
import {
  X,
  Terminal,
  Database,
  Code,
  RotateCw,
  Play,
  CheckCircle,
  Copy,
  Users,
  Layers,
  Sparkles,
  Wifi,
  Zap,
  Star,
  Shield,
  RotateCcw,
  Flame,
  Snowflake,
  Info,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { parseBestiaryXML } from '../utils/xmlParser';
import { loadSavedPlayer, loadSavedInventory } from '../utils/storage';
import { Player } from '../types/rpg';
import { COMBAT_SKILLS, getSkillRankInfo, canUnlockOrUpgradeSkill } from '../utils/skillData';

interface TechInspectorModalProps {
  isOpen: boolean;
  player: Player;
  onClose: () => void;
  onReloadXml: () => void;
  onUnlockOrUpgradeSkill: (skillId: string) => void;
  onRespecSkills?: () => void;
}

type TabType = 'skills' | 'overview' | 'xml' | 'sql' | 'lan';

export const TechInspectorModal: React.FC<TechInspectorModalProps> = ({
  isOpen,
  player,
  onClose,
  onReloadXml,
  onUnlockOrUpgradeSkill,
  onRespecSkills,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('skills');
  const [copied, setCopied] = useState<string | null>(null);

  // XML Editor state
  const [xmlContent, setXmlContent] = useState<string>('');
  const [xmlStatus, setXmlStatus] = useState<string>('');
  const [xmlLoading, setXmlLoading] = useState(false);

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM characters;');
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchXml();
    runSql('SELECT * FROM characters;');
  }, [isOpen]);

  const fetchXml = async () => {
    setXmlLoading(true);
    try {
      const res = await fetch('/enemies.xml');
      if (res.ok) {
        const text = await res.text();
        setXmlContent(text);
        const parsed = parseBestiaryXML(text);
        setXmlStatus(`Loaded ${parsed.length} monster definitions from enemies.xml`);
      }
    } catch (e: any) {
      setXmlStatus('Failed to load enemies.xml: ' + e.message);
    } finally {
      setXmlLoading(false);
    }
  };

  const handleApplyXml = () => {
    try {
      const parsed = parseBestiaryXML(xmlContent);
      onReloadXml();
      sound.playPotion();
      setXmlStatus(`Successfully parsed ${parsed.length} monster archetypes via DOMParser!`);
    } catch (e: any) {
      setXmlStatus('Parse Error: ' + e.message);
    }
  };

  const runSql = (query: string) => {
    setSqlError(null);
    const savedPlayer = loadSavedPlayer();
    const inventory = loadSavedInventory();

    const normalized = query.trim().toLowerCase();

    if (normalized.includes('characters')) {
      setSqlResult({
        columns: ['id', 'name', 'class', 'level', 'skill_points', 'hp', 'max_hp', 'mana', 'gold', 'xp'],
        rows: [
          [
            savedPlayer.id,
            savedPlayer.name,
            savedPlayer.class,
            savedPlayer.level,
            savedPlayer.skillPoints ?? 0,
            savedPlayer.hp,
            savedPlayer.maxHp,
            savedPlayer.mana,
            savedPlayer.gold,
            savedPlayer.xp,
          ],
        ],
      });
    } else if (normalized.includes('inventory')) {
      setSqlResult({
        columns: ['id', 'item_id', 'name', 'type', 'power', 'quantity'],
        rows: inventory.map((i) => [i.id, i.itemId, i.name, i.type, i.power, i.quantity]),
      });
    } else {
      setSqlError('Table not recognized. Try querying "characters" or "inventory".');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isOpen) return null;

  const skillPoints = player.skillPoints ?? 0;
  const unlockedSkills = player.unlockedSkills ?? {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md font-mono select-none animate-in fade-in zoom-in-95">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-950 px-5 py-3 border-b border-amber-500/40">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-amber-300 uppercase tracking-wide">
                Tech Inspector & Combat Skill Tree
              </h2>
              <p className="text-[10px] text-slate-400">
                Level-up progression, DOMParser XML bestiary, client-side SQL, and WebRTC architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Close [ESC]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-950/70 border-b border-slate-800 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'skills'
                ? 'bg-amber-600 text-white shadow-inner'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>Combat Abilities & Skill Points ({skillPoints})</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-600 text-white shadow-inner'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('xml')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'xml'
                ? 'bg-amber-600 text-white shadow-inner'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>XML Bestiary (DOMParser)</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-amber-600 text-white shadow-inner'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Relational SQL & Storage</span>
          </button>

          <button
            onClick={() => setActiveTab('lan')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'lan'
                ? 'bg-amber-600 text-white shadow-inner'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>LAN Multiplayer</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* ======================================================== */}
          {/* TAB 1: COMBAT ABILITIES & SKILL POINT SYSTEM             */}
          {/* ======================================================== */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              {/* Skill Point Balance Banner */}
              <div className="bg-gradient-to-r from-amber-950/70 via-slate-950 to-slate-900 border border-amber-500/50 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow-inner">
                    ⚡
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-amber-200">
                        Available Skill Points:
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-bold font-mono animate-bounce">
                        {skillPoints} Available
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Earn <span className="text-amber-300 font-bold">+1 Skill Point</span> every time your hero levels up!
                      Current Level: <span className="text-emerald-400 font-bold">Lv.{player.level}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onRespecSkills && (
                    <button
                      onClick={() => {
                        sound.playPotion();
                        onRespecSkills();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="Reset all abilities and refund skill points"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Re-spec Points</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Skills Tree Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {COMBAT_SKILLS.map((skill) => {
                  const currentRank = unlockedSkills[skill.id] || 0;
                  const isUnlocked = currentRank > 0;
                  const isMax = currentRank >= skill.maxRank;
                  const canUpgrade = canUnlockOrUpgradeSkill(player, skill.id);
                  const activeRankInfo = getSkillRankInfo(skill.id, currentRank);
                  const nextRankInfo = getSkillRankInfo(skill.id, currentRank + 1);

                  return (
                    <div
                      key={skill.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isUnlocked
                          ? `${skill.borderClass} bg-gradient-to-b from-slate-900 to-slate-950/90 shadow-lg ring-1 ring-amber-500/20`
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Top info */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-11 h-11 rounded-lg border border-slate-700 bg-slate-900/90 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                              {skill.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold text-sm ${skill.accentColor}`}>
                                  {skill.name}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                                  {skill.keybind}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans">
                                {skill.tagline}
                              </div>
                            </div>
                          </div>

                          {/* Rank Stars */}
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-0.5 text-xs">
                              {[1, 2, 3].map((starIdx) => (
                                <span
                                  key={starIdx}
                                  className={
                                    starIdx <= currentRank ? 'text-amber-400' : 'text-slate-700'
                                  }
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">
                              {isUnlocked ? `Rank ${currentRank}/${skill.maxRank}` : 'Locked'}
                            </span>
                          </div>
                        </div>

                        {/* Description / Rank effect */}
                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 mb-2.5 text-xs text-slate-300 min-h-[64px] flex flex-col justify-center">
                          {isUnlocked && activeRankInfo ? (
                            <div>
                              <div className="text-[11px] leading-relaxed">
                                {activeRankInfo.description}
                              </div>
                              <div className="text-[10px] font-mono text-emerald-400 font-bold mt-1">
                                {activeRankInfo.effectSummary}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">
                              {skill.ranks[0].description}
                            </div>
                          )}
                        </div>

                        {/* Next Rank Preview if not max */}
                        {!isMax && (
                          <div className="text-[10px] text-slate-400 mb-3 px-1">
                            <span className="text-amber-300 font-bold">Next Rank preview: </span>
                            <span>{nextRankInfo?.effectSummary}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div>
                        {isMax ? (
                          <div className="w-full py-2 rounded-lg bg-amber-950/40 border border-amber-600/50 text-amber-300 text-center text-xs font-bold">
                            👑 Mastered (Max Rank 3)
                          </div>
                        ) : (
                          <button
                            disabled={!canUpgrade}
                            onClick={() => {
                              sound.playVictory();
                              onUnlockOrUpgradeSkill(skill.id);
                            }}
                            className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95 ${
                              canUpgrade
                                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-500/20'
                                : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>
                              {currentRank === 0
                                ? 'Unlock Ability (1 Point)'
                                : `Upgrade to Rank ${currentRank + 1} (1 Point)`}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Combat hotbar guide banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 flex items-center gap-2.5">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  Unlocked combat abilities appear directly on your HUD Action Hotbar and can be triggered in battle using keys <span className="text-amber-300 font-bold">[5]</span> for Whirlwind, <span className="text-cyan-300 font-bold">[6]</span> for Frost Nova, <span className="text-yellow-300 font-bold">[7]</span> for Thunder Smite, and <span className="text-emerald-300 font-bold">[8]</span> for Iron Bastion!
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ARCHITECTURE OVERVIEW                             */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h3 className="font-bold text-amber-300 text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Client-Side Open World RPG Architecture
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Ruins of Valdor is designed as a server-less, pure client-side Open World RPG. It eliminates server-side process crashes and external binary dependencies while offering peer-to-peer LAN co-op multiplayer.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
                  <div className="font-bold text-slate-200 flex items-center gap-2 mb-1.5">
                    <span className="text-lg">🗺️</span>
                    <span>2D Open World Tile Engine</span>
                  </div>
                  <p className="text-slate-400 leading-normal">
                    Continuous 80x80 tile world spanning 5 distinct biomes (Oakhaven Hamlet, Whispering Wildwood, Ruins of Valdor, Gloom Mire, Molten Caldera) rendered at 60 FPS via Canvas 2D with smooth camera tracking.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
                  <div className="font-bold text-slate-200 flex items-center gap-2 mb-1.5">
                    <span className="text-lg">👥</span>
                    <span>LAN Co-Op Multiplayer</span>
                  </div>
                  <p className="text-slate-400 leading-normal">
                    Real-time peer-to-peer synchronization utilizing browser-native BroadcastChannel (local tabs/windows) and WebRTC DataChannels (cross-device on local Wi-Fi) without relay server overhead.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
                  <div className="font-bold text-slate-200 flex items-center gap-2 mb-1.5">
                    <span className="text-lg">📜</span>
                    <span>XML Data Parsing (DOMParser)</span>
                  </div>
                  <p className="text-slate-400 leading-normal">
                    All 38 monster definitions, boss behaviors, element alignments, and stat curves are loaded directly from <code className="text-amber-300">/enemies.xml</code> using the browser's native DOMParser API.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
                  <div className="font-bold text-slate-200 flex items-center gap-2 mb-1.5">
                    <span className="text-lg">💾</span>
                    <span>Relational SQL Client Storage</span>
                  </div>
                  <p className="text-slate-400 leading-normal">
                    Player progress, opened world chests, quest objectives, and equipment are backed by a structured relational table schema and persisted to localStorage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: XML BESTIARY EDITOR                               */}
          {/* ======================================================== */}
          {activeTab === 'xml' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-bold">
                  Editing: /enemies.xml (Native Browser DOMParser)
                </span>
                <button
                  onClick={handleApplyXml}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Parse & Apply Changes</span>
                </button>
              </div>

              {xmlStatus && (
                <div className="text-xs text-amber-300 bg-slate-950 p-2 rounded border border-amber-600/40">
                  {xmlStatus}
                </div>
              )}

              <textarea
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
                rows={16}
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500 leading-relaxed resize-y"
              />
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: SQL CONSOLE                                       */}
          {/* ======================================================== */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSql(sqlQuery)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-amber-200 focus:outline-none focus:border-amber-500 font-mono"
                  placeholder="e.g. SELECT * FROM characters;"
                />
                <button
                  onClick={() => runSql(sqlQuery)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition cursor-pointer"
                >
                  Execute SQL
                </button>
              </div>

              {sqlError && (
                <div className="text-xs text-red-400 bg-red-950/50 p-2 rounded border border-red-800">
                  {sqlError}
                </div>
              )}

              {sqlResult && (
                <div className="overflow-x-auto border border-slate-800 rounded bg-slate-950">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 border-b border-slate-800 text-amber-300">
                      <tr>
                        {sqlResult.columns.map((col) => (
                          <th key={col} className="px-3 py-2 font-bold uppercase tracking-wider">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {sqlResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/40">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 text-slate-300 whitespace-nowrap">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: LAN ARCHITECTURE                                  */}
          {/* ======================================================== */}
          {activeTab === 'lan' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h4 className="font-bold text-amber-300 text-sm mb-2 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  Dual-Transport LAN Mesh
                </h4>
                <p>
                  Ruins of Valdor utilizes a dual-transport network strategy:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                  <li>
                    <strong className="text-slate-200">BroadcastChannel API:</strong> Instant zero-overhead IPC synchronization between multiple tabs or windows running on the same computer or local network testing environment.
                  </li>
                  <li>
                    <strong className="text-slate-200">WebRTC DataChannels:</strong> Low-latency UDP-like P2P communication between multiple distinct laptops, desktops, or Android phones connected to the same local Wi-Fi or LAN router.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
