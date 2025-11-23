import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Ramp } from '../types';

interface AssignRampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rampId: string) => void;
  ramps: Ramp[];
}

export const AssignRampModal: React.FC<AssignRampModalProps> = ({ isOpen, onClose, onConfirm, ramps }) => {
  const freeRamps = ramps.filter(r => r.status === 'FREE');
  const [selectedRampId, setSelectedRampId] = useState<string>('');

  // Select the first available ramp by default when opening
  useEffect(() => {
    if (isOpen && freeRamps.length > 0) {
        setSelectedRampId(freeRamps[0].id);
    } else {
        setSelectedRampId('');
    }
  }, [isOpen, ramps]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Rampa Atama</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
                    <X size={20} />
                </button>
            </div>

            <div className="mb-6">
                <p className="text-sm text-slate-600 mb-4">
                    Lütfen aracın yanaşacağı boş rampayı seçiniz:
                </p>
                
                {freeRamps.length === 0 ? (
                     <div className="p-4 bg-orange-50 text-orange-700 rounded-xl border border-orange-200 text-sm font-medium text-center">
                        Şu anda müsait rampa bulunmamaktadır.
                     </div>
                ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                         {freeRamps.map(ramp => (
                            <label key={ramp.id} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedRampId === ramp.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input 
                                    type="radio" 
                                    name="ramp" 
                                    value={ramp.id}
                                    checked={selectedRampId === ramp.id}
                                    onChange={(e) => setSelectedRampId(e.target.value)}
                                    className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                                />
                                <span className="ml-3 font-medium text-slate-700">{ramp.name}</span>
                                <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">MÜSAİT</span>
                            </label>
                         ))}
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                 <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                 >
                    İptal
                 </button>
                 <button
                    onClick={() => onConfirm(selectedRampId)}
                    disabled={freeRamps.length === 0 || !selectedRampId}
                    className="flex-1 px-4 py-3 text-white font-bold bg-orange-600 hover:bg-orange-700 rounded-xl shadow-lg shadow-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                 >
                    Rampaya Ata <ArrowRight size={18} />
                 </button>
            </div>
        </div>
    </div>
  );
};