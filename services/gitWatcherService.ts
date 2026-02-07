/**
 * Git Watcher Service
 *
 * Renderer-side interface for the git commit watcher running in the
 * Electron main process. Opens a native folder picker, validates that
 * the folder is a git repo, and polls for new commits.
 *
 * On web (non-Electron), returns graceful fallbacks.
 */

import { isElectron } from '../utils/platform';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GitSelectResult {
  success: boolean;
  repoPath?: string;
  branch?: string;
  error?: string;
}

export interface GitWatchResult {
  success: boolean;
  repoPath?: string;
  branch?: string;
  error?: string;
}

export interface GitStatus {
  watching: boolean;
  repoPath: string | null;
  branch: string | null;
  totalCommits: number;
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  subject: string;
}

export interface GitCommitEvent {
  type: 'git_commit';
  repoPath: string;
  branch: string;
  commit: {
    hash: string;
    author: string;
    date: string;
    message: string;
  };
  diff: string;
  timestamp: string;
}

// ─── Electron API type ───────────────────────────────────────────────────────

interface ElectronGitAPI {
  gitSelectRepo: () => Promise<GitSelectResult>;
  gitStartWatching: (repoPath: string) => Promise<GitWatchResult>;
  gitStopWatching: () => Promise<{ success: boolean }>;
  gitStatus: () => Promise<GitStatus>;
  gitRecentCommits: (limit?: number) => Promise<GitCommit[]>;
  gitCommitLog: () => Promise<GitCommitEvent[]>;
  onGitCommit: (callback: (event: GitCommitEvent) => void) => void;
  removeGitCommitListener: () => void;
}

function getElectronAPI(): ElectronGitAPI | null {
  if (isElectron()) {
    return (window as any).electronAPI as ElectronGitAPI;
  }
  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check if git watcher is available (Electron only).
 */
export function isGitAvailable(): boolean {
  return isElectron();
}

/**
 * Open native folder picker and validate the selected folder as a git repo.
 * Returns the repo root path and current branch if valid.
 */
export async function selectGitRepo(): Promise<GitSelectResult> {
  const api = getElectronAPI();
  if (!api) {
    return { success: false, error: 'Git watcher is only available in the desktop app.' };
  }
  return api.gitSelectRepo();
}

/**
 * Start watching a git repo for new commits.
 */
export async function startGitWatching(repoPath: string): Promise<GitWatchResult> {
  const api = getElectronAPI();
  if (!api) {
    return { success: false, error: 'Not running in Electron.' };
  }
  return api.gitStartWatching(repoPath);
}

/**
 * Stop watching the current repo.
 */
export async function stopGitWatching(): Promise<{ success: boolean }> {
  const api = getElectronAPI();
  if (!api) return { success: false };
  return api.gitStopWatching();
}

/**
 * Get the current git watcher status.
 */
export async function getGitStatus(): Promise<GitStatus> {
  const api = getElectronAPI();
  if (!api) {
    return { watching: false, repoPath: null, branch: null, totalCommits: 0 };
  }
  return api.gitStatus();
}

/**
 * Get recent commits from the watched repo.
 */
export async function getRecentCommits(limit: number = 10): Promise<GitCommit[]> {
  const api = getElectronAPI();
  if (!api) return [];
  return api.gitRecentCommits(limit);
}

/**
 * Get the commit event log (commits detected since watching started).
 */
export async function getGitCommitLog(): Promise<GitCommitEvent[]> {
  const api = getElectronAPI();
  if (!api) return [];
  return api.gitCommitLog();
}

/**
 * Register a listener for new commit events.
 * Returns an unsubscribe function.
 */
export function onGitCommit(callback: (event: GitCommitEvent) => void): () => void {
  const api = getElectronAPI();
  if (!api) return () => {};

  api.onGitCommit(callback);
  return () => api.removeGitCommitListener();
}
