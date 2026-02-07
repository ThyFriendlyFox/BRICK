const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // ── Shell ──
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // ── OAuth ──
  onOAuthCallback: (callback) => {
    ipcRenderer.on('oauth-callback', (_event, url) => {
      callback(url);
    });
  },
  removeOAuthCallback: () => {
    ipcRenderer.removeAllListeners('oauth-callback');
  },

  // ── MCP Server ──
  mcpStart: (port) => ipcRenderer.invoke('mcp:start', port),
  mcpStop: () => ipcRenderer.invoke('mcp:stop'),
  mcpStatus: () => ipcRenderer.invoke('mcp:status'),
  mcpProgressLog: () => ipcRenderer.invoke('mcp:progressLog'),
  mcpLocalIP: () => ipcRenderer.invoke('mcp:localIP'),
  onMcpProgress: (callback) => {
    ipcRenderer.on('mcp:progress', (_event, data) => callback(data));
  },
  removeMcpProgressListener: () => {
    ipcRenderer.removeAllListeners('mcp:progress');
  },

  // ── Git Watcher ──
  gitSelectRepo: () => ipcRenderer.invoke('git:selectRepo'),
  gitStartWatching: (repoPath) => ipcRenderer.invoke('git:startWatching', repoPath),
  gitStopWatching: () => ipcRenderer.invoke('git:stopWatching'),
  gitStatus: () => ipcRenderer.invoke('git:status'),
  gitRecentCommits: (limit) => ipcRenderer.invoke('git:recentCommits', limit),
  gitCommitLog: () => ipcRenderer.invoke('git:commitLog'),
  onGitCommit: (callback) => {
    ipcRenderer.on('git:commit', (_event, data) => callback(data));
  },
  removeGitCommitListener: () => {
    ipcRenderer.removeAllListeners('git:commit');
  },

  // ── File Watcher ──
  watcherSelectFolder: () => ipcRenderer.invoke('watcher:selectFolder'),
  watcherWatch: (folderPath) => ipcRenderer.invoke('watcher:watch', folderPath),
  watcherUnwatch: (folderPath) => ipcRenderer.invoke('watcher:unwatch', folderPath),
  watcherFolders: () => ipcRenderer.invoke('watcher:folders'),
  watcherStatus: () => ipcRenderer.invoke('watcher:status'),
  watcherChangeLog: () => ipcRenderer.invoke('watcher:changeLog'),
  watcherSetIgnorePatterns: (patterns) => ipcRenderer.invoke('watcher:setIgnorePatterns', patterns),
  onWatcherChange: (callback) => {
    ipcRenderer.on('watcher:change', (_event, data) => callback(data));
  },
  removeWatcherChangeListener: () => {
    ipcRenderer.removeAllListeners('watcher:change');
  },
});
