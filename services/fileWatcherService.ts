/**
 * File Watcher Service
 *
 * Renderer-side interface for the file system watcher running in the
 * Electron main process. Opens a native folder picker and watches
 * directories for code file changes.
 *
 * On web (non-Electron), returns graceful fallbacks.
 */

import { isElectron } from '../utils/platform';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WatcherSelectResult {
  success: boolean;
  folderPath?: string;
  error?: string;
}

export interface WatcherStatus {
  watching: boolean;
  folders: string[];
  totalEvents: number;
}

export interface FileChangeEvent {
  type: 'file_change';
  folderPath: string;
  files: {
    path: string;
    type: string;
    sensitive: boolean;
    extension: string;
  }[];
  fileCount: number;
  timestamp: string;
  summary: string;
}

// ─── Electron API type ───────────────────────────────────────────────────────

interface ElectronWatcherAPI {
  watcherSelectFolder: () => Promise<WatcherSelectResult>;
  watcherWatch: (folderPath: string) => Promise<WatcherSelectResult>;
  watcherUnwatch: (folderPath: string) => Promise<{ success: boolean }>;
  watcherFolders: () => Promise<string[]>;
  watcherStatus: () => Promise<WatcherStatus>;
  watcherChangeLog: () => Promise<FileChangeEvent[]>;
  watcherSetIgnorePatterns: (patterns: string[]) => Promise<{ success: boolean }>;
  onWatcherChange: (callback: (event: FileChangeEvent) => void) => void;
  removeWatcherChangeListener: () => void;
}

function getElectronAPI(): ElectronWatcherAPI | null {
  if (isElectron()) {
    return (window as any).electronAPI as ElectronWatcherAPI;
  }
  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check if file watcher is available (Electron only).
 */
export function isWatcherAvailable(): boolean {
  return isElectron();
}

/**
 * Open native folder picker and start watching the selected folder.
 */
export async function selectAndWatchFolder(): Promise<WatcherSelectResult> {
  const api = getElectronAPI();
  if (!api) {
    return { success: false, error: 'File watcher is only available in the desktop app.' };
  }
  return api.watcherSelectFolder();
}

/**
 * Watch a specific folder (without opening the picker).
 */
export async function watchFolder(folderPath: string): Promise<WatcherSelectResult> {
  const api = getElectronAPI();
  if (!api) {
    return { success: false, error: 'Not running in Electron.' };
  }
  return api.watcherWatch(folderPath);
}

/**
 * Stop watching a specific folder.
 */
export async function unwatchFolder(folderPath: string): Promise<{ success: boolean }> {
  const api = getElectronAPI();
  if (!api) return { success: false };
  return api.watcherUnwatch(folderPath);
}

/**
 * Get the list of currently watched folders.
 */
export async function getWatchedFolders(): Promise<string[]> {
  const api = getElectronAPI();
  if (!api) return [];
  return api.watcherFolders();
}

/**
 * Get current watcher status.
 */
export async function getWatcherStatus(): Promise<WatcherStatus> {
  const api = getElectronAPI();
  if (!api) {
    return { watching: false, folders: [], totalEvents: 0 };
  }
  return api.watcherStatus();
}

/**
 * Get the file change event log.
 */
export async function getChangeLog(): Promise<FileChangeEvent[]> {
  const api = getElectronAPI();
  if (!api) return [];
  return api.watcherChangeLog();
}

/**
 * Set custom ignore patterns for privacy.
 */
export async function setIgnorePatterns(patterns: string[]): Promise<{ success: boolean }> {
  const api = getElectronAPI();
  if (!api) return { success: false };
  return api.watcherSetIgnorePatterns(patterns);
}

/**
 * Register a listener for file change events.
 * Returns an unsubscribe function.
 */
export function onFileChange(callback: (event: FileChangeEvent) => void): () => void {
  const api = getElectronAPI();
  if (!api) return () => {};

  api.onWatcherChange(callback);
  return () => api.removeWatcherChangeListener();
}
