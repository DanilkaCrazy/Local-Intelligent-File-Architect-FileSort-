import React from 'react';
import { FileItem, SystemStats } from '../types';
import { FileText, Image, Archive, FileCode, Presentation, Table, File, CheckCircle2, Clock, ShieldAlert, AlertCircle } from 'lucide-react';
import { formatBytes, formatTime } from '../lib/utils';
import { motion } from 'framer-motion';

interface DashboardProps {
  stats: SystemStats;
  recentFiles: FileItem[];
}

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'document': return <FileText className="w-5 h-5 text-blue-500" />;
    case 'image': return <Image className="w-5 h-5 text-purple-500" />;
    case 'archive': return <Archive className="w-5 h-5 text-amber-500" />;
    case 'script': return <FileCode className="w-5 h-5 text-red-500" />;
    case 'presentation': return <Presentation className="w-5 h-5 text-orange-500" />;
    case 'spreadsheet': return <Table className="w-5 h-5 text-emerald-500" />;
    default: return <File className="w-5 h-5 text-gray-400" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'moved':
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200"><CheckCircle2 className="w-3 h-3" /> Moved</span>;
    case 'waiting_confirmation':
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200"><ShieldAlert className="w-3 h-3" /> Action Required</span>;
    case 'skipped':
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200"><AlertCircle className="w-3 h-3" /> Skipped</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"><Clock className="w-3 h-3 animate-spin" /> Processing</span>;
  }
};

export function Dashboard({ stats, recentFiles }: DashboardProps) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time file processing and security analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Files Processed</div>
          <div className="text-3xl font-light text-gray-900">{stats.filesProcessed}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Successfully Moved</div>
          <div className="text-3xl font-light text-green-600">{stats.filesMoved}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Scripts Blocked</div>
          <div className="text-3xl font-light text-red-600">{stats.scriptsBlocked}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Time Saved (Est.)</div>
          <div className="text-3xl font-light text-blue-600">{stats.timeSavedMinutes}m</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
            {stats.queueLength} in queue
          </span>
        </div>
        
        <div className="bg-white">
          <div className="col-header grid grid-cols-[40px_2fr_1.5fr_1fr_1fr_100px]">
            <div></div>
            <div>File Name</div>
            <div>Category</div>
            <div>Size</div>
            <div>Time</div>
            <div>Status</div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recentFiles.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Waiting for files...</div>
            ) : (
              recentFiles.map((file) => (
                <motion.div 
                  key={file.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="data-row grid grid-cols-[40px_2fr_1.5fr_1fr_1fr_100px]"
                >
                  <div className="flex justify-center">{getCategoryIcon(file.category)}</div>
                  <div className="font-medium text-sm text-gray-900 truncate pr-4" title={file.name}>{file.name}</div>
                  <div className="flex items-center gap-2">
                    {file.category ? (
                      <>
                        <span className="text-sm capitalize text-gray-700">{file.category}</span>
                        {file.confidence && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">
                            {Math.round(file.confidence * 100)}%
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Analyzing...</span>
                    )}
                  </div>
                  <div className="data-value text-gray-500">{formatBytes(file.size)}</div>
                  <div className="data-value text-gray-500">{formatTime(file.timestamp)}</div>
                  <div>{getStatusBadge(file.status)}</div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
