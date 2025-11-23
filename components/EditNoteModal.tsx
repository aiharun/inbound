import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  currentNote: string;
}

export const EditNoteModal: React.FC<EditNoteModalProps> = ({ isOpen, onClose, onSave, currentNote }) => {
  const [note, setNote] = useState(currentNote);

  useEffect(() => {
    setNote(currentNote);
  }, [currentNote, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-orange-600" size={24} />
            Not Düzenle
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Araç Notu</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none h-32 text-slate-700"
                    placeholder="Araç veya operasyon ile ilgili notlar..."
                    autoFocus
                />
            </div>

            <div className="flex gap-3 pt-2">
                <button 
                    onClick={onClose} 
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                    İptal
                </button>
                <button 
                    onClick={() => onSave(note)} 
                    className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Save size={18} />
                    Kaydet
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};