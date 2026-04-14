/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SecurityModal } from './components/SecurityModal';
import { FileItem, SystemStats, LogEntry } from './types';

interface FileInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    filesProcessed: 0,
    filesMoved: 0,
    scriptsBlocked: 0,
    timeSavedMinutes: 0,
    queueLength: 0,
    llmStatus: 'idle'
  });
  
  const [confirmFileId, setConfirmFileId] = useState<string | null>(null);
  const [sourceDir, setSourceDir] = useState<string>('');
  const [targetDir, setTargetDir] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  const handleSelectSource = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        setSourceDir(selected);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTarget = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        setTargetDir(selected);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const processFile = async (fileInfo: FileInfo) => {
    const newFile: FileItem = {
      id: Math.random().toString(36).substring(7),
      name: fileInfo.name,
      originalPath: fileInfo.path,
      size: fileInfo.size,
      type: fileInfo.extension || 'unknown',
      timestamp: Date.now(),
      status: 'analyzing'
    };

    setFiles(prev => [newFile, ...prev].slice(0, 100));
    setStats(prev => ({ ...prev, llmStatus: 'processing' }));

    try {
      const result: any = await invoke('analyze_and_move_file', {
        filePath: fileInfo.path,
        targetDir: targetDir
      });

      if (result.is_script && !result.success) {
        setFiles(prev => prev.map(f => f.id === newFile.id ? { 
          ...f, 
          status: 'waiting_confirmation',
          category: 'script',
          securityRisk: true,
          riskDetails: ['Detected script extension', 'Awaiting manual review']
        } : f));
        setConfirmFileId(newFile.id);
        // Wait for confirmation before continuing
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            setConfirmFileId((currentConfirmId) => {
              if (currentConfirmId !== newFile.id) {
                clearInterval(checkInterval);
                resolve(true);
              }
              return currentConfirmId;
            });
          }, 500);
        });
      } else {
        setFiles(prev => prev.map(f => f.id === newFile.id ? { 
          ...f, 
          status: 'moved',
          category: result.category as any,
          targetFolder: result.new_path
        } : f));
        setStats(prev => ({ 
          ...prev, 
          queueLength: Math.max(0, prev.queueLength - 1),
          filesProcessed: prev.filesProcessed + 1,
          filesMoved: prev.filesMoved + 1,
          timeSavedMinutes: prev.timeSavedMinutes + 0.5,
          llmStatus: 'idle'
        }));
      }
    } catch (error) {
      console.error(error);
      setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: 'error', error: String(error) } : f));
      setStats(prev => ({ ...prev, queueLength: Math.max(0, prev.queueLength - 1), llmStatus: 'idle' }));
    }
  };

  const startScanning = async () => {
    if (!sourceDir || !targetDir) {
      alert("Please select both source and target directories.");
      return;
    }

    setIsScanning(true);
    try {
      const scannedFiles: FileInfo[] = await invoke('scan_directory', { dirPath: sourceDir });
      setStats(prev => ({ ...prev, queueLength: scannedFiles.length }));
      
      for (const file of scannedFiles) {
        await processFile(file);
      }
    } catch (error) {
      console.error("Failed to scan directory:", error);
      alert("Error scanning directory: " + error);
    } finally {
      setIsScanning(false);
      setStats(prev => ({ ...prev, llmStatus: 'idle', queueLength: 0 }));
    }
  };

  const handleConfirm = useCallback(async (fileId: string, allow: boolean) => {
    const file = files.find(f => f.id === fileId);
    
    if (allow && file && targetDir) {
       try {
         await invoke('force_move_script', { filePath: file.originalPath, targetDir });
       } catch (e) {
         console.error(e);
       }
    }

    setFiles(prev => prev.map(f => f.id === fileId ? { 
      ...f, 
      status: allow ? 'moved' : 'skipped',
      targetFolder: allow ? `Organized\\Scripts` : undefined
    } : f));
    
    setStats(prev => ({ 
      ...prev, 
      queueLength: Math.max(0, prev.queueLength - 1),
      filesProcessed: prev.filesProcessed + 1,
      filesMoved: allow ? prev.filesMoved + 1 : prev.filesMoved,
      scriptsBlocked: !allow ? prev.scriptsBlocked + 1 : prev.scriptsBlocked,
      llmStatus: 'idle'
    }));
    
    setConfirmFileId(null);
  }, [files, targetDir]);

  const fileToConfirm = confirmFileId ? files.find(f => f.id === confirmFileId) || null : null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f5]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-6 right-8 z-10 flex gap-3 items-center">
          <div className="flex flex-col gap-1">
            <button 
              onClick={handleSelectSource}
              className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              {sourceDir ? `Source: ...${sourceDir.slice(-15)}` : 'Select Source Folder'}
            </button>
            <button 
              onClick={handleSelectTarget}
              className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              {targetDir ? `Target: ...${targetDir.slice(-15)}` : 'Select Target Folder'}
            </button>
          </div>
          <button 
            onClick={startScanning}
            className={`px-6 py-3 rounded-lg text-sm font-medium shadow-sm transition-colors ${
              !sourceDir || !targetDir || isScanning 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={!sourceDir || !targetDir || isScanning}
          >
            {isScanning ? 'Processing...' : 'Scan & Organize'}
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <Dashboard stats={stats} recentFiles={files} />
        )}
        {activeTab !== 'dashboard' && (
          <div className="p-8 flex items-center justify-center h-full text-gray-400">
            <p>This section is under construction.</p>
          </div>
        )}
      </main>

      <SecurityModal 
        file={fileToConfirm} 
        onConfirm={handleConfirm} 
      />
    </div>
  );
}