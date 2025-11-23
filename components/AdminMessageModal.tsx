import React from 'react';
import { X, MessageSquare, Clock } from 'lucide-react';
import { AdminMessage } from '../types';

interface AdminMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: AdminMessage;
}

export const AdminMessageModal: React.FC<AdminMessageModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4 animate-in fade-in zoom-in duration-300 border-l-8 border-blue-600">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
              <MessageSquare size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Yönetici Mesajı</h2>
              <p className="text-xs text-slate-500 font-medium">Sistem Yöneticisinden</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mb-6">
           <span className="font-bold text-blue-600">{message.sentBy}</span>
           <div className="flex items-center gap-1">
             <Clock size={12} />
             {new Date(message.sentAt).toLocaleTimeString('tr-TR')}
           </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          Okudum, Kapat
        </button>
      </div>
    </div>
  );
};