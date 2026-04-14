import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Check, X, FileCode } from 'lucide-react';
import { FileItem } from '../types';

interface SecurityModalProps {
  file: FileItem | null;
  onConfirm: (fileId: string, allow: boolean) => void;
}

export function SecurityModal({ file, onConfirm }: SecurityModalProps) {
  if (!file) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-red-100"
        >
          <div className="bg-red-50 p-6 flex items-start gap-4 border-b border-red-100">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900">Security Risk Detected</h2>
              <p className="text-sm text-red-700 mt-1">
                Static analysis found potentially dangerous patterns in this script.
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <FileCode className="w-5 h-5 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500 font-mono">{file.originalPath}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Detected Risks</h3>
              <ul className="space-y-2">
                {file.riskDetails?.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-800">
                <strong>Recommendation:</strong> Do not allow this file to be moved to your organized folders unless you explicitly trust the source.
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => onConfirm(file.id, false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Block & Skip
            </button>
            <button
              onClick={() => onConfirm(file.id, true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Allow Move
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
