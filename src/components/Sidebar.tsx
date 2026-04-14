import React from 'react';
import { FolderTree, Settings, ShieldAlert, Activity, HardDrive } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'rules', label: 'Rules & Folders', icon: FolderTree },
    { id: 'logs', label: 'System Logs', icon: HardDrive },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-[#e5e5e5] h-screen flex flex-col shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-sm tracking-tight">FileSort</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Organizer LIFA</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === item.id 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#e5e5e5]">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Local LLM</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono">llama3.2:3b (Active)</p>
        </div>
      </div>
    </div>
  );
}
