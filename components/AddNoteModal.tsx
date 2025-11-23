import React, { useState } from 'react';
import { X, Truck, FileText, Save } from 'lucide-react';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plate: string, note: string) => void;
  availablePlates: string[];
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave,
    availablePlates
}) => {
  const [plate, setPlate] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plate && note) {
      onSave(plate.toUpperCase().trim(), note);
      setPlate('');
      setNote('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Not Ekle</h2>
            <p className="text-xs text-slate-500">Araç veya operasyon için bilgi notu</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Araç Plakası</label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                list="note-plate-suggestions"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="34 ABC 123"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono uppercase transition-all"
                autoFocus
              />
              <datalist id="note-plate-suggestions">
                {availablePlates.map(p => (
                    <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Not İçeriği</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Örn: Evrakları eksik, girişte kontrol edilecek."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none h-32"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!plate || !note}
              className="flex-1 px-4 py-3 text-white font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              Notu Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};