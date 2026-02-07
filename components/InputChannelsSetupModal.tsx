import React, { useState, useEffect, useCallback } from 'react';
import {
  Copy, Check, Server, GitBranch, Folder, Github,
  Loader2, Wifi, WifiOff, X, AlertTriangle, FolderOpen,
} from 'lucide-react';
import {
  startMcpServer,
  stopMcpServer,
  getMcpStatus,
  isMcpAvailable,
  onMcpProgress,
  type McpStatus,
  type McpProgressEvent,
} from '../services/mcpServerService';
import {
  selectGitRepo,
  startGitWatching,
  stopGitWatching,
  getGitStatus,
  isGitAvailable,
  getRecentCommits,
  onGitCommit,
  type GitStatus,
  type GitCommit,
  type GitCommitEvent,
} from '../services/gitWatcherService';
import {
  selectAndWatchFolder,
  unwatchFolder,
  getWatcherStatus,
  isWatcherAvailable,
  onFileChange,
  type WatcherStatus,
  type FileChangeEvent,
} from '../services/fileWatcherService';

export type AgentType = 'cursor' | 'claude-code' | 'gemini-cli' | 'google-antigravity';

interface InputChannelsSetupProps {
  onClose: () => void;
  onComplete: () => void;
}

const InputChannelsSetup: React.FC<InputChannelsSetupProps> = ({
  onClose,
  onComplete,
}) => {
  // ══════════════════════════════════════════════════════════════════════════
  // MCP State
  // ══════════════════════════════════════════════════════════════════════════
  const [mcpStatus, setMcpStatus] = useState<McpStatus>({
    running: false, port: null, ip: null, activeSessions: 0, totalEvents: 0,
  });
  const [mcpStarting, setMcpStarting] = useState(false);
  const [mcpStopping, setMcpStopping] = useState(false);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [mcpAvailable] = useState(isMcpAvailable());
  const [recentProgress, setRecentProgress] = useState<McpProgressEvent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('cursor');
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);
  const [copiedRule, setCopiedRule] = useState<string | null>(null);

  // ══════════════════════════════════════════════════════════════════════════
  // Git State
  // ══════════════════════════════════════════════════════════════════════════
  const [gitAvailable] = useState(isGitAvailable());
  const [gitStatus, setGitStatus] = useState<GitStatus>({
    watching: false, repoPath: null, branch: null, totalCommits: 0,
  });
  const [gitSelecting, setGitSelecting] = useState(false);
  const [gitError, setGitError] = useState<string | null>(null);
  const [recentCommits, setRecentCommits] = useState<GitCommit[]>([]);
  const [recentCommitEvents, setRecentCommitEvents] = useState<GitCommitEvent[]>([]);

  // ══════════════════════════════════════════════════════════════════════════
  // Watcher State
  // ══════════════════════════════════════════════════════════════════════════
  const [watcherAvailable] = useState(isWatcherAvailable());
  const [watcherStatus, setWatcherStatus] = useState<WatcherStatus>({
    watching: false, folders: [], totalEvents: 0,
  });
  const [watcherSelecting, setWatcherSelecting] = useState(false);
  const [watcherError, setWatcherError] = useState<string | null>(null);
  const [recentFileChanges, setRecentFileChanges] = useState<FileChangeEvent[]>([]);

  // ══════════════════════════════════════════════════════════════════════════
  // Effects — poll status & listen for events
  // ══════════════════════════════════════════════════════════════════════════

  // Initial status fetch for all channels
  useEffect(() => {
    if (mcpAvailable) getMcpStatus().then(setMcpStatus).catch(() => {});
    if (gitAvailable) {
      getGitStatus().then((s) => {
        setGitStatus(s);
        if (s.watching) getRecentCommits(5).then(setRecentCommits).catch(() => {});
      }).catch(() => {});
    }
    if (watcherAvailable) getWatcherStatus().then(setWatcherStatus).catch(() => {});
  }, [mcpAvailable, gitAvailable, watcherAvailable]);

  // Poll MCP status while running
  useEffect(() => {
    if (!mcpAvailable || !mcpStatus.running) return;
    const interval = setInterval(() => {
      getMcpStatus().then(setMcpStatus).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [mcpAvailable, mcpStatus.running]);

  // MCP progress events
  useEffect(() => {
    if (!mcpAvailable) return;
    return onMcpProgress((event) => {
      setRecentProgress((prev) => [event, ...prev].slice(0, 10));
      getMcpStatus().then(setMcpStatus).catch(() => {});
    });
  }, [mcpAvailable]);

  // Git commit events
  useEffect(() => {
    if (!gitAvailable) return;
    return onGitCommit((event) => {
      setRecentCommitEvents((prev) => [event, ...prev].slice(0, 10));
      getGitStatus().then(setGitStatus).catch(() => {});
    });
  }, [gitAvailable]);

  // File change events
  useEffect(() => {
    if (!watcherAvailable) return;
    return onFileChange((event) => {
      setRecentFileChanges((prev) => [event, ...prev].slice(0, 10));
      getWatcherStatus().then(setWatcherStatus).catch(() => {});
    });
  }, [watcherAvailable]);

  // ══════════════════════════════════════════════════════════════════════════
  // MCP Handlers
  // ══════════════════════════════════════════════════════════════════════════

  const handleStartMcpServer = useCallback(async () => {
    setMcpStarting(true);
    setMcpError(null);
    try {
      const result = await startMcpServer(3777);
      if (result.success) {
        const status = await getMcpStatus();
        setMcpStatus(status);
      } else {
        setMcpError(result.error || 'Failed to start MCP server');
      }
    } catch (err) {
      setMcpError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMcpStarting(false);
    }
  }, []);

  const handleStopMcpServer = useCallback(async () => {
    setMcpStopping(true);
    setMcpError(null);
    try {
      await stopMcpServer();
      setMcpStatus({ running: false, port: null, ip: null, activeSessions: 0, totalEvents: 0 });
    } catch (err) {
      setMcpError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMcpStopping(false);
    }
  }, []);

  const handleCopyConfig = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedConfig(selectedAgent);
    setTimeout(() => setCopiedConfig(null), 2000);
  };

  const handleCopyRule = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRule(selectedAgent);
    setTimeout(() => setCopiedRule(null), 2000);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Git Handlers
  // ══════════════════════════════════════════════════════════════════════════

  const handleSelectLocalRepo = useCallback(async () => {
    setGitSelecting(true);
    setGitError(null);
    try {
      const result = await selectGitRepo();
      if (!result.success) {
        if (result.error !== 'cancelled') {
          setGitError(result.error || 'Failed to select repository');
        }
        return;
      }

      // Start watching
      const watchResult = await startGitWatching(result.repoPath!);
      if (watchResult.success) {
        const status = await getGitStatus();
        setGitStatus(status);
        const commits = await getRecentCommits(5);
        setRecentCommits(commits);
      } else {
        setGitError(watchResult.error || 'Failed to start watching');
      }
    } catch (err) {
      setGitError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGitSelecting(false);
    }
  }, []);

  const handleStopGitWatching = useCallback(async () => {
    await stopGitWatching();
    setGitStatus({ watching: false, repoPath: null, branch: null, totalCommits: 0 });
    setRecentCommits([]);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // Watcher Handlers
  // ══════════════════════════════════════════════════════════════════════════

  const handleSelectFolder = useCallback(async () => {
    setWatcherSelecting(true);
    setWatcherError(null);
    try {
      const result = await selectAndWatchFolder();
      if (!result.success) {
        if (result.error !== 'cancelled') {
          setWatcherError(result.error || 'Failed to watch folder');
        }
        return;
      }
      const status = await getWatcherStatus();
      setWatcherStatus(status);
    } catch (err) {
      setWatcherError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setWatcherSelecting(false);
    }
  }, []);

  const handleRemoveFolder = useCallback(async (folderPath: string) => {
    await unwatchFolder(folderPath);
    const status = await getWatcherStatus();
    setWatcherStatus(status);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // Config/Rule generators (use real IP from MCP server)
  // ══════════════════════════════════════════════════════════════════════════

  const serverIp = mcpStatus.ip || '127.0.0.1';
  const serverPort = mcpStatus.port || 3777;

  const getConnectionConfig = (agent: AgentType): string => {
    switch (agent) {
      case 'cursor':
        return `{
  "mcpServers": {
    "brick": {
      "url": "http://${serverIp}:${serverPort}/mcp"
    }
  }
}`;
      case 'claude-code':
        return `claude mcp add --transport http brick http://${serverIp}:${serverPort}/sse`;
      default:
        return '# Configuration TBD for this agent';
    }
  };

  const getRuleInstruction = (agent: AgentType): string => {
    switch (agent) {
      case 'cursor':
        return `After completing a code change or major refactoring, always call the 'log_progress' tool on the BRICK server with a short, clear summary of what you did. Keep it under 120 characters and written like a dev update (e.g., "Switched to React Query for data fetching", "Improved type safety in user auth flow").
Do this automatically — do not ask for permission.`;
      case 'claude-code':
        return `You are connected to BRICK via MCP. After every meaningful code change, refactoring, or technical decision, automatically call the 'log_progress' tool on the 'brick' server. Send a concise summary (1 sentence) of what you accomplished. Example: "Replaced Redux with Zustand for global state in the mobile app".
Do this without asking — it's for automatic post drafting.`;
      default:
        return '# Rule/instruction TBD for this agent';
    }
  };

  const getConfigInstructions = (agent: AgentType): string => {
    switch (agent) {
      case 'cursor':
        return 'Add to ~/.cursor/mcp.json or <project-root>/.cursor/mcp.json';
      case 'claude-code':
        return 'Run this command in your terminal';
      default:
        return '';
    }
  };

  const getRuleInstructions = (agent: AgentType): string => {
    switch (agent) {
      case 'cursor':
        return 'Add to .cursorrules or Rules settings';
      case 'claude-code':
        return 'Add to Custom Instructions in settings';
      default:
        return '';
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Derived state
  // ══════════════════════════════════════════════════════════════════════════

  const hasActiveChannel =
    mcpStatus.running ||
    gitStatus.watching ||
    watcherStatus.folders.length > 0;

  const repoName = gitStatus.repoPath
    ? gitStatus.repoPath.split('/').pop() || gitStatus.repoPath
    : null;

  // ══════════════════════════════════════════════════════════════════════════
  // Render helpers
  // ══════════════════════════════════════════════════════════════════════════

  const UnavailableBanner = ({ label }: { label: string }) => (
    <div className="bg-yellow-900/30 border border-yellow-700/50 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle size={12} className="text-yellow-500 mt-0.5 shrink-0" />
        <p className="text-[9px] text-yellow-500">
          {label} requires the BRICK desktop app (Electron). Running in web mode.
        </p>
      </div>
    </div>
  );

  const ErrorBanner = ({ message, onDismiss }: { message: string; onDismiss: () => void }) => (
    <div className="bg-red-900/30 border border-red-700/50 p-3 flex items-start justify-between gap-2">
      <p className="text-[9px] text-red-400">{message}</p>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-300 shrink-0">
        <X size={10} />
      </button>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="h-screen w-screen bg-df-black font-mono overflow-hidden flex flex-col">
      {/* Header */}
      <div className="pt-8 pb-4 px-4 lg:pt-4 lg:border-b border-b-0 border-df-border shrink-0">
        <h2 className="hidden lg:block text-xs font-bold text-df-white uppercase tracking-widest">
          ESTABLISH INPUT CHANNELS
        </h2>
      </div>

      {/* Three Column Layout */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0">

        {/* ════════════════════════════════════════════════════════════════════
            Column 1: MCP Server
            ════════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-df-border flex flex-col shrink-0 lg:shrink">
          <div className="p-4 border-b border-df-border">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-df-orange" />
              <h3 className="text-[10px] font-bold text-df-orange uppercase tracking-widest">
                MCP SERVER
              </h3>
              {mcpStatus.running && (
                <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {!mcpAvailable && <UnavailableBanner label="MCP server" />}
            {mcpError && <ErrorBanner message={mcpError} onDismiss={() => setMcpError(null)} />}

            {/* Start/Stop */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-df-gray">Server Status</span>
              <button
                onClick={mcpStatus.running ? handleStopMcpServer : handleStartMcpServer}
                disabled={!mcpAvailable || mcpStarting || mcpStopping}
                className={`px-4 py-2 text-[10px] font-bold uppercase transition-colors flex items-center gap-2 ${
                  !mcpAvailable
                    ? 'bg-[#222] text-df-gray cursor-not-allowed'
                    : mcpStatus.running
                    ? 'bg-red-900 text-red-400 hover:bg-red-800'
                    : 'bg-df-orange text-df-black hover:bg-white'
                }`}
              >
                {(mcpStarting || mcpStopping) && <Loader2 size={12} className="animate-spin" />}
                {mcpStarting ? 'STARTING...' : mcpStopping ? 'STOPPING...' : mcpStatus.running ? 'STOP SERVER' : 'START SERVER'}
              </button>
            </div>

            {/* Status panel */}
            {mcpStatus.running && (
              <div className="bg-[#111] border border-df-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Wifi size={12} className="text-green-500" />
                  <span className="text-[10px] text-green-500 font-bold">RUNNING</span>
                </div>
                <div className="space-y-1 text-[9px]">
                  <div className="flex justify-between"><span className="text-df-gray">HTTP</span><code className="text-df-white">http://{serverIp}:{serverPort}/mcp</code></div>
                  <div className="flex justify-between"><span className="text-df-gray">SSE</span><code className="text-df-white">http://{serverIp}:{serverPort}/sse</code></div>
                  <div className="flex justify-between pt-1 border-t border-df-border mt-1">
                    <span className="text-df-gray">Sessions</span><span className="text-df-orange font-bold">{mcpStatus.activeSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-df-gray">Events</span><span className="text-df-orange font-bold">{mcpStatus.totalEvents}</span>
                  </div>
                </div>
              </div>
            )}

            {!mcpStatus.running && mcpAvailable && !mcpStarting && (
              <div className="bg-[#111] border border-df-border p-3 flex items-center gap-2">
                <WifiOff size={12} className="text-df-gray" />
                <span className="text-[10px] text-df-gray">STOPPED</span>
              </div>
            )}

            {/* Agent selection */}
            <div>
              <label className="text-[10px] text-df-gray uppercase mb-2 block">Select Coding Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value as AgentType)}
                className="w-full bg-black border border-df-border text-xs text-df-white p-2 outline-none focus:border-df-orange transition-colors"
              >
                <option value="cursor">Cursor</option>
                <option value="claude-code">Claude Code</option>
                <option value="gemini-cli">Gemini CLI (TBD)</option>
                <option value="google-antigravity">Google Antigravity (TBD)</option>
              </select>
            </div>

            {/* Connection config + rule (only when running) */}
            {mcpStatus.running && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] text-df-gray uppercase">Connection Config</label>
                    <button onClick={() => handleCopyConfig(getConnectionConfig(selectedAgent))} className="text-[9px] text-df-orange hover:text-df-white uppercase font-bold flex items-center gap-1">
                      {copiedConfig === selectedAgent ? <><Check size={10} /> COPIED</> : <><Copy size={10} /> COPY</>}
                    </button>
                  </div>
                  <div className="bg-black border border-df-border p-3">
                    <pre className="text-[9px] text-df-white font-mono whitespace-pre-wrap overflow-x-auto">{getConnectionConfig(selectedAgent)}</pre>
                  </div>
                  <p className="text-[9px] text-df-gray mt-1">{getConfigInstructions(selectedAgent)}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] text-df-gray uppercase">Rule / Instruction</label>
                    <button onClick={() => handleCopyRule(getRuleInstruction(selectedAgent))} className="text-[9px] text-df-orange hover:text-df-white uppercase font-bold flex items-center gap-1">
                      {copiedRule === selectedAgent ? <><Check size={10} /> COPIED</> : <><Copy size={10} /> COPY</>}
                    </button>
                  </div>
                  <div className="bg-black border border-df-border p-3">
                    <pre className="text-[9px] text-df-white font-mono whitespace-pre-wrap">{getRuleInstruction(selectedAgent)}</pre>
                  </div>
                  <p className="text-[9px] text-df-gray mt-1">{getRuleInstructions(selectedAgent)}</p>
                </div>

                <div className="bg-[#111] border border-df-border border-dashed p-3">
                  <p className="text-[9px] text-df-gray">After setup, BRICK will automatically receive updates whenever your agent makes changes.</p>
                </div>

                {/* Recent events */}
                {recentProgress.length > 0 && (
                  <div>
                    <label className="text-[10px] text-df-gray uppercase mb-2 block">Recent Events</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {recentProgress.map((event, i) => (
                        <div key={i} className="bg-[#111] border border-df-border p-2">
                          <p className="text-[9px] text-df-white">{event.summary}</p>
                          <p className="text-[8px] text-df-gray mt-0.5">{new Date(event.timestamp).toLocaleTimeString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            Column 2: Git Repository
            ════════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-df-border flex flex-col shrink-0 lg:shrink">
          <div className="p-4 border-b border-df-border">
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-df-orange" />
              <h3 className="text-[10px] font-bold text-df-orange uppercase tracking-widest">
                GIT REPOSITORY
              </h3>
              {gitStatus.watching && (
                <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {!gitAvailable && <UnavailableBanner label="Git watcher" />}
            {gitError && <ErrorBanner message={gitError} onDismiss={() => setGitError(null)} />}

            {/* Not watching — show select button */}
            {!gitStatus.watching && (
              <div className="space-y-4">
                <p className="text-[9px] text-df-gray leading-relaxed">
                  Select a local git repository. BRICK will watch for new commits and use them as context for draft generation.
                </p>
                <button
                  onClick={handleSelectLocalRepo}
                  disabled={!gitAvailable || gitSelecting}
                  className={`w-full py-3 font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 ${
                    !gitAvailable
                      ? 'bg-[#222] text-df-gray cursor-not-allowed'
                      : 'bg-df-white text-df-black hover:bg-df-orange'
                  }`}
                >
                  {gitSelecting && <Loader2 size={14} className="animate-spin" />}
                  {gitSelecting ? 'SELECTING...' : 'SELECT GIT REPOSITORY'}
                </button>
              </div>
            )}

            {/* Watching — show repo info */}
            {gitStatus.watching && (
              <div className="space-y-4">
                <div className="bg-[#111] border border-df-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-green-500 font-bold">WATCHING</span>
                    <button
                      onClick={handleStopGitWatching}
                      className="text-[9px] text-df-gray hover:text-red-400 uppercase font-bold"
                    >
                      DISCONNECT
                    </button>
                  </div>
                  <div className="space-y-1 text-[9px]">
                    <div className="flex justify-between">
                      <span className="text-df-gray">Repo</span>
                      <span className="text-df-white font-bold">{repoName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-df-gray">Branch</span>
                      <span className="text-df-orange font-bold">{gitStatus.branch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-df-gray">Detected</span>
                      <span className="text-df-orange font-bold">{gitStatus.totalCommits} commit(s)</span>
                    </div>
                  </div>
                  <code className="text-[8px] text-df-gray break-all block pt-1 border-t border-df-border mt-1">{gitStatus.repoPath}</code>
                </div>

                {/* Recent commits from the repo */}
                {recentCommits.length > 0 && (
                  <div>
                    <label className="text-[10px] text-df-gray uppercase mb-2 block">Recent Commits</label>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {recentCommits.map((commit) => (
                        <div key={commit.hash} className="bg-[#111] border border-df-border p-2">
                          <p className="text-[9px] text-df-white truncate">{commit.subject}</p>
                          <div className="flex justify-between mt-0.5">
                            <span className="text-[8px] text-df-gray">{commit.author}</span>
                            <code className="text-[8px] text-df-gray">{commit.hash.slice(0, 7)}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live detected commits */}
                {recentCommitEvents.length > 0 && (
                  <div>
                    <label className="text-[10px] text-df-gray uppercase mb-2 block">New Commits Detected</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {recentCommitEvents.map((event, i) => (
                        <div key={i} className="bg-green-900/20 border border-green-700/30 p-2">
                          <p className="text-[9px] text-green-400">{event.commit.message}</p>
                          <p className="text-[8px] text-df-gray mt-0.5">{new Date(event.timestamp).toLocaleTimeString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Change repo button */}
                <button
                  onClick={handleSelectLocalRepo}
                  disabled={gitSelecting}
                  className="text-[9px] text-df-orange hover:text-df-white uppercase font-bold flex items-center gap-1"
                >
                  <FolderOpen size={10} /> CHANGE REPOSITORY
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            Column 3: Folder Watcher
            ════════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-1/3 flex flex-col shrink-0 lg:shrink">
          <div className="p-4 border-b border-df-border">
            <div className="flex items-center gap-2">
              <Folder size={16} className="text-df-orange" />
              <h3 className="text-[10px] font-bold text-df-orange uppercase tracking-widest">
                FOLDER WATCHER
              </h3>
              {watcherStatus.folders.length > 0 && (
                <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {!watcherAvailable && <UnavailableBanner label="File watcher" />}
            {watcherError && <ErrorBanner message={watcherError} onDismiss={() => setWatcherError(null)} />}

            <p className="text-[9px] text-df-gray leading-relaxed">
              Watch folders for file changes. BRICK detects code edits in real-time and uses them as context for drafts.
            </p>

            <button
              onClick={handleSelectFolder}
              disabled={!watcherAvailable || watcherSelecting}
              className={`w-full py-3 font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 ${
                !watcherAvailable
                  ? 'bg-[#222] text-df-gray cursor-not-allowed'
                  : 'bg-df-white text-df-black hover:bg-df-orange'
              }`}
            >
              {watcherSelecting && <Loader2 size={14} className="animate-spin" />}
              {watcherSelecting ? 'SELECTING...' : 'SELECT FOLDER TO WATCH'}
            </button>

            {/* Watched folders list */}
            {watcherStatus.folders.length > 0 && (
              <div>
                <div className="text-[10px] text-df-gray uppercase mb-2">
                  Watched Folders ({watcherStatus.folders.length})
                </div>
                <div className="space-y-2">
                  {watcherStatus.folders.map((folder) => (
                    <div
                      key={folder}
                      className="bg-[#111] border border-df-border p-2 flex items-center justify-between group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] text-df-white font-bold truncate">{folder.split('/').pop()}</div>
                        <code className="text-[8px] text-df-gray break-all">{folder}</code>
                      </div>
                      <button
                        onClick={() => handleRemoveFolder(folder)}
                        className="text-[9px] text-df-gray hover:text-red-400 uppercase ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        REMOVE
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSelectFolder}
                  disabled={watcherSelecting}
                  className="mt-2 text-[9px] text-df-orange hover:text-df-white uppercase font-bold"
                >
                  + Add Another Folder
                </button>
              </div>
            )}

            {/* Status bar */}
            {watcherStatus.folders.length > 0 && (
              <div className="bg-[#111] border border-df-border p-3">
                <div className="flex justify-between text-[9px]">
                  <span className="text-df-gray">Change events</span>
                  <span className="text-df-orange font-bold">{watcherStatus.totalEvents}</span>
                </div>
              </div>
            )}

            {/* Recent file changes */}
            {recentFileChanges.length > 0 && (
              <div>
                <label className="text-[10px] text-df-gray uppercase mb-2 block">Recent Changes</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {recentFileChanges.map((event, i) => (
                    <div key={i} className="bg-[#111] border border-df-border p-2">
                      <p className="text-[9px] text-df-white">{event.summary}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.files.slice(0, 4).map((file, j) => (
                          <span key={j} className="text-[8px] text-df-gray bg-[#1a1a1a] px-1 py-0.5">
                            {file.path.split('/').pop()}
                          </span>
                        ))}
                        {event.files.length > 4 && (
                          <span className="text-[8px] text-df-gray">+{event.files.length - 4} more</span>
                        )}
                      </div>
                      <p className="text-[8px] text-df-gray mt-0.5">{new Date(event.timestamp).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex border-t border-df-border shrink-0">
        <button
          onClick={onClose}
          className="w-1/3 py-6 text-df-gray hover:text-white border-r border-df-border text-xs font-bold uppercase"
        >
          Cancel
        </button>
        <button
          onClick={onComplete}
          disabled={!hasActiveChannel}
          className={`flex-grow py-6 text-xs font-bold uppercase transition-colors ${
            hasActiveChannel
              ? 'bg-df-white text-black hover:bg-df-gray'
              : 'bg-df-black text-df-gray cursor-not-allowed'
          }`}
        >
          {hasActiveChannel ? 'DONE' : 'CONNECT AT LEAST ONE CHANNEL'}
        </button>
      </div>
    </div>
  );
};

export default InputChannelsSetup;
