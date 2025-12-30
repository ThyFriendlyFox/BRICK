export enum Platform {
  X = 'X',
  REDDIT = 'REDDIT'
}

export type TriggerSource = 'COMMIT' | 'AGENT_LOG' | 'FILE_PULSE';

export interface Draft {
  id: string;
  timestamp: number;
  platform: Platform;
  content: string;
  source: TriggerSource;
  title?: string;
  mediaUrl?: string;
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
  mcpEnabled: boolean;
  fileWatcherEnabled: boolean;
  setupComplete: boolean;
}

export interface AgentLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'thought' | 'action' | 'error';
}