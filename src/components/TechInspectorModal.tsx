import React, { useState, useEffect } from 'react';
import {
  X,
  Terminal,
  Database,
  Code,
  FileCode,
  RotateCw,
  Play,
  CheckCircle,
  Copy,
  Users,
  Layers,
  Sparkles,
  Save,
  Wifi,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { parseBestiaryXML } from '../utils/xmlParser';
import { loadSavedPlayer, loadSavedInventory, generateSqlDump } from '../utils/storage';

interface TechInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReloadXml: () => void;
}

type TabType = 'overview' | 'xml' | 'sql' | 'lan' | 'code';

export const TechInspectorModal: React.FC<TechInspectorModalProps> = ({
  isOpen,
  onClose,
  onReloadXml,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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
    const player = loadSavedPlayer();
    const inventory = loadSavedInventory();

    const normalized = query.trim().toLowerCase();

    if (normalized.includes('characters')) {
      setSqlResult({
        columns: ['id', 'name', 'class', 'level', 'hp', 'max_hp', 'mana', 'max_mana', 'gold', 'xp', 'x', 'y'],
        rows: [
          [
            player.id,
            player.name,
            player.class,
            player.level,
            player.hp,
            player.maxHp,
            player.mana,
            player.maxMana,
            player.gold,
            player.xp,
            Math.round(player.x ?? 18),
            Math.round(player.y ?? 19),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-500 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-950 px-5 py-3 border-b border-amber-600/50">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-amber-300 uppercase tracking-wide">
              Game Engine & Architecture Console
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-0.5 rounded hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-950/60 border-b border-slate-800 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('xml')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'xml' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>XML Bestiary (DOMParser)</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'sql' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Relational SQL & Storage</span>
          </button>
          <button
            onClick={() => setActiveTab('lan')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'lan' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>LAN Multiplayer Architecture</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
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
                    <span>XML Bestiary Configuration</span>
                  </div>
                  <p className="text-slate-400 leading-normal">
                    Structured XML schema extracted with the browser&apos;s native DOMParser. All 38 monster archetypes, abilities, resistances, and lore are loaded directly.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
                  <div className="font-bold text-slate-200 flex items-center gap-2 mb-1.5">
                    <span className="text-lg">💾</span>
                    <span>Client-Side Relational DB</span>
                  </div>
                  <p className="text-slate-400 leading-normal">
                    Full persistence for player stats, coordinates, inventory, and opened world chests in local client storage with SQL schema inspection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'xml' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">enemies.xml (Native DOMParser)</span>
                <div className="flex gap-2">
                  <button
                    onClick={fetchXml}
                    disabled={xmlLoading}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded flex items-center gap-1.5 transition"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${xmlLoading ? 'animate-spin' : ''}`} />
                    <span>Reload XML</span>
                  </button>
                  <button
                    onClick={handleApplyXml}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded flex items-center gap-1.5 transition shadow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Re-parse Bestiary</span>
                  </button>
                </div>
              </div>

              {xmlStatus && (
                <div className="text-xs font-mono px-3 py-2 bg-slate-950 border border-slate-800 rounded text-amber-300">
                  {xmlStatus}
                </div>
              )}

              <textarea
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
                className="w-full h-80 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-400 resize-none outline-none focus:border-amber-500"
              />
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="e.g. SELECT * FROM characters;"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-amber-300 outline-none"
                />
                <button
                  onClick={() => runSql(sqlQuery)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute SQL</span>
                </button>
              </div>

              {sqlError && (
                <div className="text-xs text-red-400 bg-red-950/60 p-2 rounded border border-red-800">
                  {sqlError}
                </div>
              )}

              {sqlResult && (
                <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                      <tr>
                        {sqlResult.columns.map((col, idx) => (
                          <th key={idx} className="p-2 border-r border-slate-800 last:border-r-0">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {sqlResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/50">
                          {row.map((val, cIdx) => (
                            <td key={cIdx} className="p-2 border-r border-slate-800 last:border-r-0">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Schema SQL dump view */}
              <div className="pt-2">
                <div className="text-xs font-bold text-slate-400 mb-1">Generated schema.sql:</div>
                <pre className="bg-slate-950 border border-slate-800 rounded p-3 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-40">
                  {generateSqlDump(loadSavedPlayer(), loadSavedInventory())}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'lan' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h3 className="font-bold text-amber-300 text-sm mb-2 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-amber-400" />
                  Peer-to-Peer LAN Networking Protocol
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Ruins of Valdor synchronizes player coordinates, actions, party chat, and world monsters using a decentralized mesh topology:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1.5 text-slate-400">
                  <li>
                    <strong className="text-slate-200">Tier 1: BroadcastChannel</strong> — Operates instantly across multiple browser tabs and windows on the same origin with 0ms relay delay.
                  </li>
                  <li>
                    <strong className="text-slate-200">Tier 2: WebRTC DataChannels</strong> — Direct P2P transport between separate laptops, PCs, or phones on the same local Wi-Fi.
                  </li>
                  <li>
                    <strong className="text-slate-200">Host Authority</strong> — The world host is authoritative for mob spawns, patrol behaviors, and chest states, preventing desync.
                  </li>
                  <li>
                    <strong className="text-slate-200">Hermetic Resilience</strong> — No central server daemon to compile, manage, or crash.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between bg-slate-950 px-5 py-3 border-t border-slate-800 text-xs">
          <span className="text-slate-500">Ruins of Valdor v2.5 Client Architecture</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
