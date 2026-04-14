export type FileCategory = 'document' | 'image' | 'archive' | 'script' | 'presentation' | 'spreadsheet' | 'other';

export type FileStatus = 'pending' | 'extracting' | 'analyzing' | 'waiting_confirmation' | 'moved' | 'skipped' | 'error';

export interface FileItem {
  id: string;
  name: string;
  originalPath: string;
  size: number;
  type: string;
  timestamp: number;
  status: FileStatus;
  category?: FileCategory;
  confidence?: number;
  targetFolder?: string;
  securityRisk?: boolean;
  riskDetails?: string[];
  error?: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'success';
  module: 'watcher' | 'extractor' | 'llm' | 'decision' | 'fs' | 'security';
  message: string;
  details?: any;
}

export interface SystemStats {
  filesProcessed: number;
  filesMoved: number;
  scriptsBlocked: number;
  timeSavedMinutes: number;
  queueLength: number;
  llmStatus: 'idle' | 'processing' | 'offline';
}
