
export enum Platform {
  ALL = 'ALL',
  X = 'X',
  REDDIT = 'REDDIT',
  EMAIL = 'EMAIL',
  DISCORD = 'DISCORD'
}

export interface Draft {
  id: string;
  timestamp: number;
  platform: Platform;
  content: string;
  title?: string; // For Reddit
  mediaUrl?: string; // Placeholder for screenshots
  posted: boolean;
}

export interface FeedbackItem {
  id: string;
  platform: Platform;
  username: string;
  content: string;
  timestamp: number;
  type: 'question' | 'bug' | 'request' | 'positive' | 'general';
  threadId: string;
  threadTitle: string;
}

export interface UserConfig {
  xConnected: boolean;
  redditConnected: boolean;
  emailConnected: boolean;
  discordConnected: boolean;
  setupComplete: boolean;
}

/**
 * An event from an input channel that triggers draft generation.
 */
export interface InputEvent {
  source: 'mcp' | 'git' | 'watcher';
  /** Human-readable summary of the coding activity */
  context: string;
  /** Optional code context (git diff, file list, etc.) */
  codeSnippet?: string;
  timestamp: number;
}
