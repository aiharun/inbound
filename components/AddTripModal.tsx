import React, { useState } from 'react';
import { X, Truck, Repeat, Save, ChevronDown } from 'lucide-react';

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plate: string, count: number) => void;
  availablePlates: string[];
}

export const AddTripModal: React.FC<AddTripModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit,
    availablePlates
}) => {
  const [plate, setPlate] = useState('');
  const [count, setCount] = useState<string>(''); // Changed to string to support empty state

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCount = parseInt(count);
    if (plate && !isNaN(parsedCount) && parsedCount > 0) {
      onSubmit(plate.toUpperCase(), parsedCount);
      setPlate('');
      setCount('');
      onClose();
    }
  };

  const isFormValid = plate && count && parseInt(count) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Sefer Planla</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Araç Plakası</label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <select
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-mono uppercase transition-all appearance-none cursor-pointer ${!plate ? 'text-slate-400' : 'text-slate-700'}`}
                autoFocus
              >
                <option value="" disabled>Plaka Seçiniz</option>
                {availablePlates.map(p => (
                    <option key={p} value={p} className="text-slate-700">{p}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Planlanan Sefer Sayısı</label>
            <div className="relative">
              <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="1"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-1">Bu plaka için toplam kaç giriş bekleniyor?</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="flex-1 px-4 py-3 text-white font-bold bg-orange-600 hover:bg-orange-700 rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};