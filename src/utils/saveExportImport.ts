import { Player, InventoryItem, WorldObject } from '../types/rpg';
import { savePlayerToStorage, saveInventoryToStorage, saveWorldObjectsState } from './storage';
import { recalculatePlayerStats } from './equipment';

export interface ExportedSaveData {
  version: string;
  game: string;
  exportedAt: string;
  timestamp: number;
  player: Player;
  inventory: InventoryItem[];
  worldObjectsState?: Record<string, boolean>;
  pvpStats?: {
    enabled: boolean;
    kills: number;
    deaths: number;
    honor: number;
    rank: string;
  };
}

export function exportSaveData(
  player: Player,
  inventory: InventoryItem[],
  worldObjects: WorldObject[]
): string {
  const objectsStateMap: Record<string, boolean> = {};
  worldObjects.forEach((obj) => {
    if (obj.opened) objectsStateMap[obj.id] = true;
  });

  const exportPayload: ExportedSaveData = {
    version: '3.0.0',
    game: 'Ruins of Valdor - 12 Realms RPG',
    exportedAt: new Date().toISOString(),
    timestamp: Date.now(),
    player,
    inventory,
    worldObjectsState: objectsStateMap,
    pvpStats: {
      enabled: Boolean(player.pvpEnabled),
      kills: player.pvpKills || 0,
      deaths: player.pvpDeaths || 0,
      honor: player.pvpHonor || 0,
      rank: player.pvpRank || 'Recruit',
    },
  };

  return JSON.stringify(exportPayload, null, 2);
}

export function downloadSaveFile(jsonString: string, heroName: string = 'Hero'): void {
  try {
    const cleanName = heroName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `valdor_save_${cleanName}_${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (err) {
    console.error('Failed to download save file:', err);
  }
}

export async function copySaveToClipboard(jsonString: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonString);
      return true;
    }
  } catch {}
  return false;
}

export function validateAndParseSaveData(
  rawInput: string
): { success: boolean; data?: ExportedSaveData; error?: string } {
  try {
    const parsed = JSON.parse(rawInput);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Save data is not a valid JSON object.' };
    }

    if (!parsed.player || typeof parsed.player !== 'object') {
      return { success: false, error: 'Missing character player profile in save data.' };
    }

    if (!parsed.player.name || typeof parsed.player.level !== 'number') {
      return { success: false, error: 'Character data is corrupted or invalid.' };
    }

    if (!Array.isArray(parsed.inventory)) {
      parsed.inventory = [];
    }

    return { success: true, data: parsed as ExportedSaveData };
  } catch (err: any) {
    return { success: false, error: `Invalid JSON syntax: ${err.message}` };
  }
}

export function applyImportedSaveData(
  data: ExportedSaveData,
  currentWorldObjects: WorldObject[]
): {
  player: Player;
  inventory: InventoryItem[];
  worldObjects: WorldObject[];
} {
  const importedPlayer = recalculatePlayerStats({
    ...data.player,
    source: 'Imported Save File',
  });

  const importedInventory = data.inventory || [];

  const objectsState = data.worldObjectsState || {};
  const updatedObjects = currentWorldObjects.map((obj) => ({
    ...obj,
    opened: objectsState[obj.id] ?? obj.opened,
  }));

  // Persist to storage
  savePlayerToStorage(importedPlayer);
  saveInventoryToStorage(importedInventory);
  saveWorldObjectsState(updatedObjects);

  return {
    player: importedPlayer,
    inventory: importedInventory,
    worldObjects: updatedObjects,
  };
}
