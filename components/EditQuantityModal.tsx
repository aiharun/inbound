import React, { useState, useEffect } from 'react';
import { X, Package, Save } from 'lucide-react';

interface EditQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (count: number) => void;
  currentQuantity: number;
}

export const EditQuantityModal: React.FC<EditQuantityModalProps> = ({ isOpen, onClose, onSave, currentQuantity }) => {
  const [count, setCount] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCount(currentQuantity.toString());
    }
  }, [isOpen, currentQuantity]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(count);
    if (!isNaN(val) && val >= 0) {
      onSave(val);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-orange-600" size={24} />
            Yük Adedi Düzenle
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Yeni Adet</label>
                <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-2xl font-mono font-bold text-center text-slate-800"
                    autoFocus
                    min="0"
                />
            </div>

            <div className="flex gap-3 pt-2">
                <button 
                    type="button"
                    onClick={onClose} 
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                    İptal
                </button>
                <button 
                    type="submit"
                    className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Save size={18} />
                    Güncelle
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};