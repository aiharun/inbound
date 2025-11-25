import React, { useState, useEffect } from 'react';
import { X, Truck, FileText, Save, ChevronDown, ListOrdered } from 'lucide-react';
import { Vehicle, VehicleStatus } from '../types';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plate: string, note: string, tripNumber: number) => void;
  availablePlates: string[];
  vehicleNotes?: Record<string, string>;
  vehicles: Vehicle[];
  scheduledTrips: Record<string, number>;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave,
    availablePlates,
    vehicleNotes = {},
    vehicles,
    scheduledTrips
}) => {
  const [plate, setPlate] = useState('');
  const [note, setNote] = useState('');
  const [tripNumber, setTripNumber] = useState<number>(1);
  const [totalTrips, setTotalTrips] = useState<number>(1);

  // Calculate total trips when plate changes
  useEffect(() => {
    if (plate) {
        // 1. Count history (Processed/Active)
        const historyCount = vehicles.filter(v => 
            v.licensePlate === plate && 
            v.status !== VehicleStatus.CANCELED && 
            v.status !== VehicleStatus.INCOMING
        ).length;

        // 2. Count future (Scheduled Remaining)
        // Default to 0 if not explicitly in scheduledTrips, but usually implicit 1 if in availablePlates
        // However, scheduledTrips passed here is 'allRemainingTrips' from App.tsx which handles the implicit 1
        const remainingCount = scheduledTrips[plate] || 0;

        // Note: If history is 0 and remaining is 0 (unlikely if in available list), assume at least 1.
        const total = Math.max(1, historyCount + remainingCount);
        setTotalTrips(total);

        // Reset selected trip to 1 or logic to pick next? Default to 1.
        setTripNumber(1);

        // Try to pre-fill note for Trip 1
        const noteKey = `${plate}-1`;
        if (vehicleNotes[noteKey]) {
            setNote(vehicleNotes[noteKey]);
        } else if (vehicleNotes[plate]) {
            setNote(vehicleNotes[plate]); // Legacy fallback
        } else {
            setNote('');
        }
    }
  }, [plate, vehicles, scheduledTrips, vehicleNotes]);

  // Update note text when trip number changes
  useEffect(() => {
    if (plate && tripNumber) {
        const key = `${plate}-${tripNumber}`;
        if (vehicleNotes[key]) {
            setNote(vehicleNotes[key]);
        } else {
            setNote('');
        }
    }
  }, [tripNumber, plate, vehicleNotes]);

  // Reset when closing
  useEffect(() => {
    if (!isOpen) {
        setPlate('');
        setNote('');
        setTripNumber(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plate && note.trim()) {
      onSave(plate.toUpperCase().trim(), note, tripNumber);
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
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <select
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-mono uppercase transition-all appearance-none cursor-pointer text-slate-700"
                autoFocus
              >
                <option value="" disabled>Plaka Seçiniz</option>
                {availablePlates.map(p => (
                    <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>

          {/* Trip Selection - Only show if total trips > 1 */}
          {plate && totalTrips > 1 && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sefer Seçimi</label>
                <div className="relative">
                  <ListOrdered className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                  <select
                    value={tripNumber}
                    onChange={(e) => setTripNumber(parseInt(e.target.value))}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium transition-all appearance-none cursor-pointer text-slate-700"
                  >
                    {Array.from({ length: totalTrips }).map((_, idx) => (
                        <option key={idx + 1} value={idx + 1}>{idx + 1}. Sefer</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                </div>
                <p className="text-xs text-orange-600 mt-1 ml-1">
                    Bu araç için {totalTrips} adet sefer bulunmaktadır. Notun ekleneceği seferi seçiniz.
                </p>
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Not İçeriği</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Örn: Evrakları eksik, girişte kontrol edilecek."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none h-32"
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
              disabled={!plate || !note.trim()}
              className="flex-1 px-4 py-3 text-white font-bold bg-orange-600 hover:bg-orange-700 rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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