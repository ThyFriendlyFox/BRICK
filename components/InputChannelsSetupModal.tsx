import React, { useState } from 'react';
import { Copy, Check, Server, GitBranch, Folder, Github } from 'lucide-react';

export type AgentType = 'cursor' | 'claude-code' | 'gemini-cli' | 'google-antigravity';

interface InputChannelsSetupProps {
  onClose: () => void;
  onComplete: () => void;
}

const InputChannelsSetup: React.FC<InputChannelsSetupProps> = ({ 
  onClose, 
  onComplete 
}) => {
  const [mcpServerRunning, setMcpServerRunning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('cursor');
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);
  const [copiedRule, setCopiedRule] = useState<string | null>(null);
  
  const [gitType, setGitType] = useState<'github' | 'local'>('github');
  const [githubConnected, setGithubConnected] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [localRepoPath, setLocalRepoPath] = useState<string | null>(null);
  
  const [watchedFolders, setWatchedFolders] = useState<string[]>([]);

  const handleStartMcpServer = () => {
    setMcpServerRunning(true);
    // TODO: Actually start MCP server
  };

  const handleStopMcpServer = () => {
    setMcpServerRunning(false);
    // TODO: Actually stop MCP server
  };

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

  const handleConnectGitHub = () => {
    // TODO: Implement GitHub OAuth
    setGithubConnected(true);
  };

  const handleSelectLocalRepo = () => {
    // TODO: Open folder picker
    setLocalRepoPath('/path/to/repo');
  };

  const handleSelectFolder = () => {
    // TODO: Open folder picker
    setWatchedFolders([...watchedFolders, '/path/to/folder']);
  };

  const handleRemoveFolder = (index: number) => {
    setWatchedFolders(watchedFolders.filter((_, i) => i !== index));
  };

  const getConnectionConfig = (agent: AgentType): string => {
    const ip = '192.168.1.5'; // TODO: Get actual IP from MCP server
    switch (agent) {
      case 'cursor':
        return `{
  "mcpServers": {
    "brick": {
      "url": "ws://${ip}:3000"
    }
  }
}`;
      case 'claude-code':
        return `claude mcp add --transport http brick http://${ip}:3000/mcp`;
      default:
        return '';
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
        return '';
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

  const hasActiveChannel = 
    mcpServerRunning || 
    (gitType === 'github' && githubConnected && selectedRepo) ||
    (gitType === 'local' && localRepoPath) ||
    watchedFolders.length > 0;

  return (
    <div className="h-screen w-screen bg-df-black font-mono overflow-hidden flex flex-col">
      {/* Header */}
      <div className="pt-8 pb-4 px-4 lg:pt-4 lg:border-b border-b-0 border-df-border shrink-0">
        <h2 className="hidden lg:block text-xs font-bold text-df-white uppercase tracking-widest">
          ESTABLISH INPUT CHANNELS
        </h2>
      </div>

        {/* Three Column Layout - Desktop: columns, Mobile: rows */}
        <div className="flex-grow flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0">
          {/* Column 1: MCP Server */}
          <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-df-border flex flex-col shrink-0 lg:shrink">
            <div className="p-4 border-b border-df-border">
              <div className="flex items-center gap-2 mb-2">
                <Server size={16} className="text-df-orange" />
                <h3 className="text-[10px] font-bold text-df-orange uppercase tracking-widest">
                  MCP SERVER
                </h3>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {/* Start Server Button */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-df-gray">Server Status</span>
                <button
                  onClick={mcpServerRunning ? handleStopMcpServer : handleStartMcpServer}
                  className={`px-4 py-2 text-[10px] font-bold uppercase transition-colors ${
                    mcpServerRunning
                      ? 'bg-red-900 text-red-400 hover:bg-red-800'
                      : 'bg-df-orange text-df-black hover:bg-white'
                  }`}
                >
                  {mcpServerRunning ? 'STOP SERVER' : 'START SERVER'}
                </button>
              </div>

              {mcpServerRunning && (
                <div className="bg-[#111] border border-df-border p-3">
                  <div className="text-[10px] text-green-500 mb-1">RUNNING</div>
                  <code className="text-[9px] text-df-gray">ws://192.168.1.5:3000</code>
                  <div className="text-[9px] text-df-gray mt-1">http://192.168.1.5:3000/mcp</div>
                </div>
              )}

              {/* Agent Selection */}
              <div>
                <label className="text-[10px] text-df-gray uppercase mb-2 block">
                  Select Coding Agent
                </label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value as AgentType)}
                  className="w-full bg-black border border-df-border text-xs text-df-white p-2 outline-none focus:border-df-orange transition-colors"
                >
                  <option value="cursor">Cursor</option>
                  <option value="claude-code">Claude Code</option>
                  <option value="gemini-cli">Gemini CLI</option>
                  <option value="google-antigravity">Google Antigravity</option>
                </select>
              </div>

              {/* Connection Config */}
              {mcpServerRunning && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] text-df-gray uppercase">
                        Connection Config
                      </label>
                      <button
                        onClick={() => handleCopyConfig(getConnectionConfig(selectedAgent))}
                        className="text-[9px] text-df-orange hover:text-df-white uppercase font-bold flex items-center gap-1"
                      >
                        {copiedConfig === selectedAgent ? (
                          <>
                            <Check size={10} /> COPIED
                          </>
                        ) : (
                          <>
                            <Copy size={10} /> COPY
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-black border border-df-border p-3 relative">
                      <pre className="text-[9px] text-df-white font-mono whitespace-pre-wrap overflow-x-auto">
                        {getConnectionConfig(selectedAgent)}
                      </pre>
                    </div>
                    <p className="text-[9px] text-df-gray mt-1">
                      {getConfigInstructions(selectedAgent)}
                    </p>
                  </div>

                  {/* Rule/Instruction */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] text-df-gray uppercase">
                        Rule / Instruction
                      </label>
                      <button
                        onClick={() => handleCopyRule(getRuleInstruction(selectedAgent))}
                        className="text-[9px] text-df-orange hover:text-df-white uppercase font-bold flex items-center gap-1"
                      >
                        {copiedRule === selectedAgent ? (
                          <>
                            <Check size={10} /> COPIED
                          </>
                        ) : (
                          <>
                            <Copy size={10} /> COPY
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-black border border-df-border p-3">
                      <pre className="text-[9px] text-df-white font-mono whitespace-pre-wrap">
                        {getRuleInstruction(selectedAgent)}
                      </pre>
                    </div>
                    <p className="text-[9px] text-df-gray mt-1">
                      {getRuleInstructions(selectedAgent)}
                    </p>
                  </div>

                  <div className="bg-[#111] border border-df-border border-dashed p-3">
                    <p className="text-[9px] text-df-gray">
                      After setup, BRICK will automatically receive updates whenever your agent makes changes.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Column 2: Git Repository */}
          <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-df-border flex flex-col shrink-0 lg:shrink">
            <div className="p-4 border-b border-df-border">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch size={16} className="text-df-orange" />
                <h3 className="text-[10px] font-bold text-df-orange uppercase tracking-widest">
                  GIT REPOSITORY
                </h3>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {/* Git Type Selection */}
              <div>
                <label className="text-[10px] text-df-gray uppercase mb-2 block">
                  Repository Source
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGitType('github')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${
                      gitType === 'github'
                        ? 'bg-df-orange text-df-black'
                        : 'bg-black border border-df-border text-df-gray hover:text-df-white'
                    }`}
                  >
                    <Github size={14} className="inline mr-1" />
                    GitHub
                  </button>
                  <button
                    onClick={() => setGitType('local')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${
                      gitType === 'local'
                        ? 'bg-df-orange text-df-black'
                        : 'bg-black border border-df-border text-df-gray hover:text-df-white'
                    }`}
                  >
                    <Folder size={14} className="inline mr-1" />
                    Local
                  </button>
                </div>
              </div>

              {/* GitHub Flow */}
              {gitType === 'github' && (
                <div className="space-y-4">
                  {!githubConnected ? (
                    <button
                      onClick={handleConnectGitHub}
                      className="w-full py-3 bg-df-white text-df-black font-bold text-xs hover:bg-df-orange transition-colors uppercase"
                    >
                      Connect GitHub
                    </button>
                  ) : (
                    <>
                      <div className="bg-[#111] border border-df-border p-3">
                        <div className="text-[10px] text-green-500 mb-1">CONNECTED</div>
                        <div className="text-[9px] text-df-gray">thyfriendlyfox@gmail.com</div>
                      </div>
                      <div>
                        <label className="text-[10px] text-df-gray uppercase mb-2 block">
                          Select Repository
                        </label>
                        <select
                          value={selectedRepo || ''}
                          onChange={(e) => setSelectedRepo(e.target.value)}
                          className="w-full bg-black border border-df-border text-xs text-df-white p-2 outline-none focus:border-df-orange transition-colors"
                        >
                          <option value="">Choose repository...</option>
                          <option value="repo1">thyfriendlyfox/BRICK</option>
                          <option value="repo2">thyfriendlyfox/other-repo</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Local Folder Flow */}
              {gitType === 'local' && (
                <div className="space-y-4">
                  <button
                    onClick={handleSelectLocalRepo}
                    className="w-full py-3 bg-df-white text-df-black font-bold text-xs hover:bg-df-orange transition-colors uppercase"
                  >
                    Select Git Repository
                  </button>
                  {localRepoPath && (
                    <div className="bg-[#111] border border-df-border p-3">
                      <div className="text-[10px] text-green-500 mb-1">CONNECTED</div>
                      <code className="text-[9px] text-df-gray break-all">{localRepoPath}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Folder Watcher */}
          <div className="w-full lg:w-1/3 flex flex-col shrink-0 lg:shrink">
            <div className="p-4 border-b border-df-border">
              <div className="flex items-center gap-2 mb-2">
                <Folder size={16} className="text-df-orange" />
                <h3 className="text-[10px] font-bold text-df-orange uppercase tracking-widest">
                  FOLDER WATCHER
                </h3>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              <button
                onClick={handleSelectFolder}
                className="w-full py-3 bg-df-white text-df-black font-bold text-xs hover:bg-df-orange transition-colors uppercase"
              >
                Select Folder to Watch
              </button>

              {watchedFolders.length > 0 && (
                <div>
                  <div className="text-[10px] text-df-gray uppercase mb-2">
                    Watched Folders ({watchedFolders.length})
                  </div>
                  <div className="space-y-2">
                    {watchedFolders.map((folder, index) => (
                      <div
                        key={index}
                        className="bg-[#111] border border-df-border p-2 flex items-center justify-between group"
                      >
                        <code className="text-[9px] text-df-white flex-1 truncate">{folder}</code>
                        <button
                          onClick={() => handleRemoveFolder(index)}
                          className="text-[9px] text-df-gray hover:text-df-orange uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSelectFolder}
                    className="mt-2 text-[9px] text-df-orange hover:text-df-white uppercase font-bold"
                  >
                    + Add Another Folder
                  </button>
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
          Done
        </button>
      </div>
    </div>
  );
};

export default InputChannelsSetup;

