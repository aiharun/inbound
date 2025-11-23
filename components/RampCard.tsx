import React from 'react';
import { Ramp, Vehicle } from '../types';
import { Truck, Package, Clock, Undo2, CheckCircle2 } from 'lucide-react';

interface RampCardProps {
  ramp: Ramp;
  vehicle: Vehicle | undefined;
  onClearRamp: (rampId: string) => void;
  onRevertAssignment?: (rampId: string) => void;
  readOnly?: boolean;
}

export const RampCard: React.FC<RampCardProps> = ({ 
    ramp, 
    vehicle, 
    onClearRamp, 
    onRevertAssignment,
    readOnly = false 
}) => {
  const isOccupied = ramp.status === 'OCCUPIED';

  const calculateDuration = (startTime?: string) => {
    if (!startTime) return '0 dk';
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 60000);
    return `${diff} dk`;
  };

  return (
    <div className={`relative p-4 rounded-xl border-2 transition-all duration-300 h-full flex flex-col justify-between ${
      isOccupied 
        ? 'bg-white border-orange-200 shadow-lg shadow-orange-100' 
        : 'bg-slate-50 border-slate-200 border-dashed'
    }`}>
      <div>
        <div className="flex justify-between items-start mb-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{ramp.name.replace('Ramp', 'Rampa')}</h3>
            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
            isOccupied ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
            {isOccupied ? 'DOLU' : 'MÜSAİT'}
            </span>
        </div>

        {isOccupied && vehicle ? (
            <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Truck className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-800">{vehicle.licensePlate}</p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1 text-slate-600">
                    <Package className="w-3 h-3" />
                    <span>{vehicle.productCount} adet</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-600">
                    <Clock className="w-3 h-3" />
                    <span>{calculateDuration(vehicle.dockingStartTime)}</span>
                </div>
            </div>
            </div>
        ) : (
            <div className="py-6 flex flex-col items-center justify-center text-slate-300">
                <Truck className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-xs">Araç Bekleniyor</span>
            </div>
        )}
      </div>

      {isOccupied && vehicle && !readOnly && (
        <div className="mt-4 space-y-2">
            <button 
                onClick={() => onClearRamp(ramp.id)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors shadow-sm"
            >
                <CheckCircle2 size={14} />
                Tamamla & Boşalt
            </button>
            
            {onRevertAssignment && (
                <button 
                    onClick={() => onRevertAssignment(ramp.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors"
                    title="Yanlışlıkla atandıysa geri al"
                >
                    <Undo2 size={14} />
                    Atamayı Geri Al
                </button>
            )}
        </div>
      )}
    </div>
  );
};