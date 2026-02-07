/**
 * MCP Server Service
 *
 * Renderer-side interface for controlling the MCP server that runs in the
 * Electron main process. Provides start/stop/status and a listener for
 * incoming `log_progress` events from coding agents.
 *
 * On web (non-Electron), the MCP server is unavailable and all methods
 * return graceful fallbacks.
 */

import { isElectron } from '../utils/platform';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface McpServerUrls {
  port: number;
  ip: string;
  httpUrl: string;
  sseUrl: string;
  healthUrl: string;
}

export interface McpStartResult {
  success: boolean;
  error?: string;
  port?: number;
  ip?: string;
  httpUrl?: string;
  sseUrl?: string;
  healthUrl?: string;
}

export interface McpStatus {
  running: boolean;
  port: number | null;
  ip: string | null;
  activeSessions: number;
  totalEvents: number;
}

export interface McpProgressEvent {
  summary: string;
  timestamp: string;
  sessionId: string;
}

// ─── Electron API type (exposed by preload) ──────────────────────────────────

interface ElectronMcpAPI {
  mcpStart: (port?: number) => Promise<McpStartResult>;
  mcpStop: () => Promise<{ success: boolean; error?: string }>;
  mcpStatus: () => Promise<McpStatus>;
  mcpProgressLog: () => Promise<McpProgressEvent[]>;
  mcpLocalIP: () => Promise<string>;
  onMcpProgress: (callback: (event: McpProgressEvent) => void) => void;
  removeMcpProgressListener: () => void;
}

function getElectronAPI(): ElectronMcpAPI | null {
  if (isElectron()) {
    return (window as any).electronAPI as ElectronMcpAPI;
  }
  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check if the MCP server feature is available (only in Electron).
 */
export function isMcpAvailable(): boolean {
  return isElectron();
}

/**
 * Start the MCP server on the given port.
 */
export async function startMcpServer(port: number = 3777): Promise<McpStartResult> {
  const api = getElectronAPI();
  if (!api) {
    return {
      success: false,
      error: 'MCP server is only available in the desktop app (Electron).',
    };
  }
  return api.mcpStart(port);
}

/**
 * Stop the MCP server.
 */
export async function stopMcpServer(): Promise<{ success: boolean; error?: string }> {
  const api = getElectronAPI();
  if (!api) {
    return { success: false, error: 'Not running in Electron.' };
  }
  return api.mcpStop();
}

/**
 * Get the current MCP server status.
 */
export async function getMcpStatus(): Promise<McpStatus> {
  const api = getElectronAPI();
  if (!api) {
    return { running: false, port: null, ip: null, activeSessions: 0, totalEvents: 0 };
  }
  return api.mcpStatus();
}

/**
 * Get the full progress log (all events since server started).
 */
export async function getMcpProgressLog(): Promise<McpProgressEvent[]> {
  const api = getElectronAPI();
  if (!api) return [];
  return api.mcpProgressLog();
}

/**
 * Get the local network IP address.
 */
export async function getLocalIP(): Promise<string> {
  const api = getElectronAPI();
  if (!api) return '127.0.0.1';
  return api.mcpLocalIP();
}

/**
 * Register a listener for incoming log_progress events.
 * Returns an unsubscribe function.
 */
export function onMcpProgress(callback: (event: McpProgressEvent) => void): () => void {
  const api = getElectronAPI();
  if (!api) return () => {};

  api.onMcpProgress(callback);
  return () => api.removeMcpProgressListener();
}
