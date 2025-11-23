import React, { useState } from 'react';
import { X, Truck, Package, CalendarClock, Plus } from 'lucide-react';

interface AddIncomingVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { licensePlate: string; productCount: number; estimatedArrivalTime: string }) => void;
  availablePlates: string[];
}

export const AddIncomingVehicleModal: React.FC<AddIncomingVehicleModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit,
    availablePlates
}) => {
  const [licensePlate, setLicensePlate] = useState('');
  const [productCount, setProductCount] = useState<string>('');
  // Default to 1 hour from now
  const getDefaultTime = () => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };
  const [eta, setEta] = useState(getDefaultTime());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate || !productCount || !eta) return;

    onSubmit({
      licensePlate: licensePlate.toUpperCase().trim(),
      productCount: parseInt(productCount),
      estimatedArrivalTime: new Date(eta).toISOString()
    });
    
    setLicensePlate('');
    setProductCount('');
    setEta(getDefaultTime());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Gelecek Araç Bildir</h2>
            <p className="text-xs text-slate-500">Yolda olan veya haber verilen araç kaydı</p>
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
                list="incoming-plate-suggestions"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="34 ABC 123"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono uppercase transition-all"
                autoFocus
              />
              <datalist id="incoming-plate-suggestions">
                {availablePlates.map(p => (
                    <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Beklenen Yük (Adet)</label>
              <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                  type="number"
                  value={productCount}
                  onChange={(e) => setProductCount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tahmini Varış Zamanı</label>
            <div className="relative">
              <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="datetime-local"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-700"
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
              className="flex-1 px-4 py-3 text-white font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              <CalendarClock size={18} />
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};