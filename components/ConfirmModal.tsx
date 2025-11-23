import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Onayla",
  cancelText = "İptal",
  isDanger = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-full flex-shrink-0 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                <AlertTriangle size={24} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                <p className="text-sm text-slate-500 mt-1">{message}</p>
            </div>
        </div>
        
        <div className="flex gap-3 justify-end mt-6">
            <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
                {cancelText}
            </button>
            <button
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
                className={`px-4 py-2 text-white font-bold rounded-xl shadow-md transition-all ${
                    isDanger 
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                    : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'
                }`}
            >
                {confirmText}
            </button>
        </div>
      </div>
    </div>
  );
};