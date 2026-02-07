/**
 * BRICK File Watcher
 *
 * Watches directories for file changes using Node.js fs.watch (recursive).
 * Debounces rapid changes and filters out irrelevant files.
 * Emits events that BRICK can use as context for draft generation.
 *
 * Runs in the Electron main process.
 */

const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

/** Directories and files to always ignore */
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'out',
  '.cache',
  '.turbo',
  '__pycache__',
  '.pytest_cache',
  'target',        // Rust
  'vendor',        // Go/PHP
  '.idea',
  '.vscode',
  '.DS_Store',
  'Thumbs.db',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'Cargo.lock',
  'Gemfile.lock',
  'poetry.lock',
];

/** File extensions we care about */
const WATCHED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.kt', '.scala',
  '.c', '.cpp', '.h', '.hpp', '.cs',
  '.swift', '.m', '.mm',
  '.vue', '.svelte', '.astro',
  '.html', '.css', '.scss', '.less',
  '.json', '.yaml', '.yml', '.toml',
  '.md', '.mdx', '.txt',
  '.sql', '.graphql', '.gql',
  '.sh', '.bash', '.zsh',
  '.dockerfile', '.tf', '.hcl',
  '.env.example', '.gitignore',
]);

/** Privacy-sensitive patterns to never report content from */
const PRIVACY_PATTERNS = [
  '.env',
  '.env.local',
  '.env.production',
  'secrets',
  'credentials',
  'private',
  '.pem',
  '.key',
  '.cert',
  '.p12',
];

const DEBOUNCE_MS = 1000; // Debounce file change events

// ─── State ───────────────────────────────────────────────────────────────────

/**
 * @typedef {{ watcher: fs.FSWatcher, debounceTimer: ReturnType<typeof setTimeout> | null, pendingChanges: Map<string, string> }} WatcherEntry
 */

/** @type {Map<string, WatcherEntry>} */
const watchers = new Map();

/** @type {Set<(event: object) => void>} */
const changeListeners = new Set();

/** @type {object[]} */
const changeLog = [];

/** @type {string[]} */
let customIgnorePatterns = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check if a file path should be ignored.
 * @param {string} filePath
 * @returns {boolean}
 */
function shouldIgnore(filePath) {
  const parts = filePath.split(path.sep);
  const allPatterns = [...DEFAULT_IGNORE_PATTERNS, ...customIgnorePatterns];

  for (const part of parts) {
    for (const pattern of allPatterns) {
      if (part === pattern || part.startsWith(pattern)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a file has a watched extension.
 * @param {string} filePath
 * @returns {boolean}
 */
function hasWatchedExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) {
    // Check for extensionless files we care about (Dockerfile, Makefile, etc.)
    const basename = path.basename(filePath);
    return ['Dockerfile', 'Makefile', 'Procfile', 'Rakefile', 'Gemfile'].includes(basename);
  }
  return WATCHED_EXTENSIONS.has(ext);
}

/**
 * Check if a file matches privacy-sensitive patterns.
 * @param {string} filePath
 * @returns {boolean}
 */
function isPrivacySensitive(filePath) {
  const basename = path.basename(filePath);
  const fullPath = filePath.toLowerCase();

  for (const pattern of PRIVACY_PATTERNS) {
    if (basename === pattern || basename.startsWith(pattern) || fullPath.includes(pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Emit a batch of file change events.
 * @param {string} folderPath
 * @param {Map<string, string>} changes - Map of relative path → change type
 */
function emitChanges(folderPath, changes) {
  if (changes.size === 0) return;

  const files = [];
  for (const [relativePath, changeType] of changes) {
    files.push({
      path: relativePath,
      type: changeType,
      sensitive: isPrivacySensitive(relativePath),
      extension: path.extname(relativePath),
    });
  }

  const event = {
    type: 'file_change',
    folderPath,
    files,
    fileCount: files.length,
    timestamp: new Date().toISOString(),
    summary: buildChangeSummary(files),
  };

  changeLog.push(event);

  // Notify listeners
  for (const listener of changeListeners) {
    try {
      listener(event);
    } catch (err) {
      console.error('[Watcher] Error in change listener:', err);
    }
  }
}

/**
 * Build a human-readable summary of file changes.
 * @param {{ path: string, type: string, extension: string }[]} files
 * @returns {string}
 */
function buildChangeSummary(files) {
  const byExtension = {};
  for (const file of files) {
    const ext = file.extension || 'other';
    byExtension[ext] = (byExtension[ext] || 0) + 1;
  }

  const parts = Object.entries(byExtension)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([ext, count]) => `${count} ${ext}`);

  return `${files.length} file(s) changed: ${parts.join(', ')}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Start watching a folder for file changes.
 * @param {string} folderPath - Absolute path to watch
 * @returns {{ success: boolean, folderPath?: string, error?: string }}
 */
function watchFolder(folderPath) {
  try {
    // Validate the folder exists
    if (!fs.existsSync(folderPath)) {
      return { success: false, error: 'Folder does not exist' };
    }

    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      return { success: false, error: 'Path is not a directory' };
    }

    // Don't double-watch
    if (watchers.has(folderPath)) {
      return { success: true, folderPath, error: 'Already watching this folder' };
    }

    // Start watching
    const watcher = fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      // Filter
      if (shouldIgnore(filename)) return;
      if (!hasWatchedExtension(filename)) return;

      // Accumulate changes with debouncing
      const entry = watchers.get(folderPath);
      if (!entry) return;

      entry.pendingChanges.set(filename, eventType);

      // Debounce: emit after DEBOUNCE_MS of quiet
      if (entry.debounceTimer) {
        clearTimeout(entry.debounceTimer);
      }
      entry.debounceTimer = setTimeout(() => {
        const changes = new Map(entry.pendingChanges);
        entry.pendingChanges.clear();
        emitChanges(folderPath, changes);
      }, DEBOUNCE_MS);
    });

    watcher.on('error', (err) => {
      console.error(`[Watcher] Error watching ${folderPath}:`, err.message);
    });

    watchers.set(folderPath, {
      watcher,
      debounceTimer: null,
      pendingChanges: new Map(),
    });

    console.log(`[Watcher] Watching: ${folderPath}`);
    return { success: true, folderPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Stop watching a specific folder.
 * @param {string} folderPath
 * @returns {{ success: boolean }}
 */
function unwatchFolder(folderPath) {
  const entry = watchers.get(folderPath);
  if (entry) {
    entry.watcher.close();
    if (entry.debounceTimer) clearTimeout(entry.debounceTimer);
    watchers.delete(folderPath);
    console.log(`[Watcher] Stopped watching: ${folderPath}`);
    return { success: true };
  }
  return { success: false };
}

/**
 * Stop watching all folders.
 */
function unwatchAll() {
  for (const [folderPath, entry] of watchers) {
    entry.watcher.close();
    if (entry.debounceTimer) clearTimeout(entry.debounceTimer);
    console.log(`[Watcher] Stopped watching: ${folderPath}`);
  }
  watchers.clear();
}

/**
 * Get list of currently watched folders.
 * @returns {string[]}
 */
function getWatchedFolders() {
  return [...watchers.keys()];
}

/**
 * Get current watcher status.
 * @returns {{ watching: boolean, folders: string[], totalEvents: number }}
 */
function getStatus() {
  return {
    watching: watchers.size > 0,
    folders: [...watchers.keys()],
    totalEvents: changeLog.length,
  };
}

/**
 * Get the change event log.
 * @returns {object[]}
 */
function getChangeLog() {
  return [...changeLog];
}

/**
 * Set custom ignore patterns (from user privacy settings).
 * @param {string[]} patterns
 */
function setIgnorePatterns(patterns) {
  customIgnorePatterns = patterns;
}

/**
 * Register a listener for file change events.
 * @param {(event: object) => void} callback
 * @returns {() => void} Unsubscribe function
 */
function onChange(callback) {
  changeListeners.add(callback);
  return () => changeListeners.delete(callback);
}

module.exports = {
  watchFolder,
  unwatchFolder,
  unwatchAll,
  getWatchedFolders,
  getStatus,
  getChangeLog,
  setIgnorePatterns,
  onChange,
};
