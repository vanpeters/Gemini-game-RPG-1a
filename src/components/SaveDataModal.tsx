import React, { useState } from 'react';
import {
  Download,
  Upload,
  Copy,
  Check,
  FileJson,
  X,
  AlertCircle,
  Database,
  CheckCircle,
  Sparkles,
  Shield,
  FileText,
} from 'lucide-react';
import { Player, InventoryItem, WorldObject } from '../types/rpg';
import {
  exportSaveData,
  downloadSaveFile,
  copySaveToClipboard,
  validateAndParseSaveData,
  applyImportedSaveData,
} from '../utils/saveExportImport';
import { sound } from '../utils/audio';

interface SaveDataModalProps {
  isOpen: boolean;
  player: Player;
  inventory: InventoryItem[];
  worldObjects: WorldObject[];
  onClose: () => void;
  onImportSave: (
    importedPlayer: Player,
    importedInventory: InventoryItem[],
    importedObjects: WorldObject[]
  ) => void;
}

export const SaveDataModal: React.FC<SaveDataModalProps> = ({
  isOpen,
  player,
  inventory,
  worldObjects,
  onClose,
  onImportSave,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  if (!isOpen) return null;

  const saveJson = exportSaveData(player, inventory, worldObjects);

  const handleDownload = () => {
    sound.playVictory();
    downloadSaveFile(saveJson, player.name);
  };

  const handleCopy = async () => {
    sound.playClick();
    const ok = await copySaveToClipboard(saveJson);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        processImport(content);
      }
    };
    reader.readAsText(file);
  };

  const processImport = (text: string) => {
    const validation = validateAndParseSaveData(text);
    if (!validation.success || !validation.data) {
      sound.playEnemyHit();
      setImportStatus({
        type: 'error',
        message: validation.error || 'Failed to parse save file.',
      });
      return;
    }

    try {
      const result = applyImportedSaveData(validation.data, worldObjects);
      sound.playVictory();
      setImportStatus({
        type: 'success',
        message: `Successfully restored ${result.player.name} (Lv.${result.player.level} ${result.player.class})!`,
      });
      onImportSave(result.player, result.inventory, result.worldObjects);
    } catch (err: any) {
      sound.playEnemyHit();
      setImportStatus({
        type: 'error',
        message: `Import failed: ${err.message}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-amber-500/40 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wider text-amber-300 font-mono">
                SAVE DATA VAULT & EXPORTER
              </h2>
              <p className="text-xs text-slate-400">
                Export and import complete character progress, gear, and realm exploration data as JSON.
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 gap-2 pt-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('export');
            }}
            className={`px-4 py-2 font-mono text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'export'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" /> Export Save Data
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('import');
            }}
            className={`px-4 py-2 font-mono text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'import'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" /> Import Save Data
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto max-h-[66vh] space-y-4">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-mono font-bold text-sm text-amber-300">
                    Character: {player.name} (Lv.{player.level} {player.class})
                  </div>
                  <div className="text-xs text-slate-400">
                    Includes {inventory.length} inventory items, quests, abilities, and explored world fog.
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy JSON
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
                  >
                    <Download className="w-4 h-4" /> Download .json
                  </button>
                </div>
              </div>

              {/* JSON Live Viewer */}
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Formatted Save Payload</span>
                  <span className="text-[10px] text-slate-500">{(saveJson.length / 1024).toFixed(1)} KB</span>
                </div>
                <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400/90 max-h-72 overflow-y-auto custom-scrollbar select-all">
                  {saveJson}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Drop/Selector */}
              <div className="p-5 rounded-lg border-2 border-dashed border-slate-700 hover:border-amber-500/50 bg-slate-950/40 text-center space-y-2 transition">
                <Upload className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="text-sm font-bold text-slate-200">
                  Upload Save File (.json)
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a valid Ruins of Valdor save file to restore your character and realms.
                </p>
                <label className="inline-block px-4 py-2 mt-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold cursor-pointer transition">
                  Browse File
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or Paste Raw JSON */}
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Or Paste Save JSON Directly
                </div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste exported save JSON here..."
                  rows={6}
                  className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Status Banner */}
              {importStatus.type !== 'idle' && (
                <div
                  className={`p-3 rounded-lg border flex items-center gap-2.5 text-xs font-mono ${
                    importStatus.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-red-950/40 border-red-500/50 text-red-300'
                  }`}
                >
                  {importStatus.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}

              {/* Restore Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => processImport(importText)}
                  disabled={!importText.trim()}
                  className={`px-5 py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition ${
                    importText.trim()
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Upload className="w-4 h-4" /> Restore Save State
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
