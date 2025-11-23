import React from 'react';
import { CalendarClock, ListTodo, CheckCircle2, ArrowRight, User, Phone, Truck, History, XCircle, RotateCcw, Minus, StickyNote, Clock, Pencil, Edit } from 'lucide-react';
import { DriverInfo } from '../data/drivers';
import { Vehicle, VehicleStatus } from '../types';

interface PlannedTripsListProps {
  scheduledTrips: Record<string, number>;
  canceledTrips: Record<string, number>;
  onAssign: (plate: string) => void;
  onCancel: (plate: string) => void;
  onRestore: (plate: string) => void;
  onRemoveOneTrip?: (plate: string) => void;
  drivers: Record<string, DriverInfo>;
  vehicleNotes?: Record<string, string>;
  readOnly?: boolean;
  vehicles: Vehicle[];
  onOpenEditor?: () => void;
}

export const PlannedTripsList: React.FC<PlannedTripsListProps> = ({ 
  scheduledTrips, 
  canceledTrips,
  onAssign, 
  onCancel,
  onRestore,
  onRemoveOneTrip,
  drivers, 
  vehicleNotes = {},
  readOnly = false, 
  vehicles,
  onOpenEditor
}) => {
  const trips = (Object.entries(scheduledTrips) as [string, number][])
    .sort((a, b) => b[1] - a[1]);

  const canceledList = (Object.entries(canceledTrips) as [string, number][]);
  const canceledPlates = new Set(Object.keys(canceledTrips));

  // Filter for Planned: Has >0 trips
  // Also ensure it's not in the canceled list
  const planned = trips.filter(([plate, count]) => count > 0 && !canceledPlates.has(plate));
  
  // Filter for Processed: Has 0 trips OR has history of completion/docking
  // This ensures vehicles that are completed but have new trips planned still show up here.
  const processed = trips.filter(([plate, count]) => {
    if (canceledPlates.has(plate)) return false;
    // If this specific vehicle (plate) has any history in the vehicle log (Docking or Completed), show it.
    // OR if the count is 0 (meaning it was processed down to 0).
    
    const hasHistory = vehicles.some(v => 
        v.licensePlate === plate && 
        (v.status === VehicleStatus.DOCKING || v.status === VehicleStatus.COMPLETED)
    );
    
    return count === 0 || hasHistory;
  });

  if (trips.length === 0 && canceledList.length === 0 && !onOpenEditor) return null;

  const getVehicleStatus = (plate: string): 'DOCKING' | 'COMPLETED' | 'UNKNOWN' => {
    // Find the latest vehicle entry for this plate
    // We sort by arrival time desc to get the very latest status
    const plateVehicles = vehicles.filter(v => v.licensePlate === plate);
    const latestVehicle = plateVehicles.sort((a, b) => new Date(b.arrivalTime).getTime() - new Date(a.arrivalTime).getTime())[0];
    
    if (!latestVehicle) return 'UNKNOWN';
    if (latestVehicle.status === VehicleStatus.DOCKING) return 'DOCKING';
    if (latestVehicle.status === VehicleStatus.COMPLETED) return 'COMPLETED';
    return 'UNKNOWN';
  };

  const renderCard = (plate: string, count: number, type: 'PLANNED' | 'PROCESSED' | 'CANCELED') => {
    const driver = drivers[plate];
    const note = vehicleNotes[plate];
    let status: 'DOCKING' | 'COMPLETED' | 'UNKNOWN' = 'UNKNOWN';
    let tripHistoryCount = 0;
    
    // Check if vehicle is currently waiting in queue
    const isWaitingInQueue = vehicles.some(v => 
        v.licensePlate === plate && 
        v.status === VehicleStatus.WAITING
    );

    // Check if vehicle is currently on a ramp (Docking)
    const isVehicleOnRamp = vehicles.some(v => 
        v.licensePlate === plate && 
        v.status === VehicleStatus.DOCKING
    );
    
    if (type === 'PROCESSED') {
        status = getVehicleStatus(plate);
        // Calculate total trips for this plate
        tripHistoryCount = vehicles.filter(v => v.licensePlate === plate).length;
    }

    const isDocking = status === 'DOCKING';
    const isCompleted = type === 'PROCESSED' && (status === 'COMPLETED');
    const isCanceled = type === 'CANCELED';
    
    return (
        <div 
            key={plate} 
            className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all group ${
                isDocking 
                ? 'bg-orange-50 border-orange-200 shadow-sm' 
                : isCanceled
                    ? 'bg-red-50 border-red-100 opacity-80'
                    : isCompleted 
                        ? 'bg-slate-50 border-slate-100 opacity-60 grayscale-[0.5]' 
                        : 'bg-white border-slate-200 hover:border-orange-200 hover:shadow-md'
            }`}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className={`text-xs mb-1 transition-colors ${isCompleted || isCanceled ? 'text-slate-400' : 'text-slate-400 group-hover:text-orange-500'}`}>
                        Araç Plakası
                    </p>
                    <p className={`text-lg font-bold font-mono ${isCompleted || isCanceled ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-800'}`}>
                        {plate}
                    </p>
                </div>
                {type === 'PROCESSED' ? (
                    <div className="flex flex-col items-end gap-1">
                        {isDocking ? (
                            <div className="flex items-center gap-1 text-orange-700 font-bold text-xs bg-orange-100 px-2 py-1 rounded-lg border border-orange-200 animate-pulse">
                                <Truck size={14} />
                                Rampada
                            </div>
                        ) : isCompleted ? (
                            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">
                                <CheckCircle2 size={14} />
                                Tamam
                            </div>
                        ) : (
                            // Fallback for UNKNOWN status (e.g. canceled history that shouldn't look completed)
                            <div className="flex items-center gap-1 text-slate-400 font-bold text-xs bg-slate-50 px-2 py-1 rounded-lg">
                                <History size={14} />
                                Geçmiş
                            </div>
                        )}
                        
                        {/* Show Trip Count Badge if more than 1 trip */}
                        {tripHistoryCount > 1 && (
                            <div className="flex items-center gap-1 text-slate-600 font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                <RotateCcw size={10} />
                                {tripHistoryCount}. Sefer
                            </div>
                        )}
                    </div>
                ) : isCanceled ? (
                    <div className="flex items-center gap-1 text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded-lg">
                        <XCircle size={14} />
                        İptal
                    </div>
                ) : (
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-400 mb-0.5">Kalan</span>
                        <div className="flex items-center gap-1">
                            {!readOnly && count > 1 && onRemoveOneTrip && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onRemoveOneTrip(plate);
                                    }}
                                    className="p-0.5 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded transition-colors border border-slate-200"
                                    title="Bir sefer eksilt"
                                >
                                    <Minus size={12} />
                                </button>
                            )}
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-100 text-orange-700 font-bold text-sm">
                                {count}
                            </span>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Driver Info Section */}
            <div className={`border-t pt-3 mb-2 space-y-2 ${isDocking ? 'border-orange-200' : isCanceled ? 'border-red-100' : 'border-slate-100'}`}>
                {driver ? (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-600">
                            <User size={14} className="text-slate-400" />
                            <span className="text-sm font-medium truncate">{driver.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Phone size={14} className="text-slate-400" />
                            <span className="text-xs font-mono">{driver.phone}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-slate-400 italic text-xs">
                        <User size={14} />
                        <span>Sürücü kaydı yok</span>
                    </div>
                )}
            </div>

            {/* Note Section */}
            {note && (
                <div className={`mt-1 mb-3 p-2 rounded-lg text-xs flex gap-2 ${isCanceled ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>
                    <StickyNote size={14} className="flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{note}</span>
                </div>
            )}

            {/* Actions */}
            {!readOnly && (
                <div className="flex gap-2 mt-auto relative z-10">
                    {type === 'PLANNED' && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onCancel(plate);
                                }}
                                className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-xs font-bold rounded-lg transition-colors border border-red-100"
                                title="Seferi İptal Et"
                            >
                                <XCircle size={16} />
                            </button>
                            
                            {isVehicleOnRamp ? (
                                <button
                                    type="button"
                                    disabled
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-100 text-orange-600 text-xs font-bold rounded-lg cursor-not-allowed border border-orange-200 opacity-60"
                                >
                                    <Truck size={12} />
                                    Araç Rampada
                                </button>
                            ) : isWaitingInQueue ? (
                                <button
                                    type="button"
                                    disabled
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-amber-100 text-amber-600 text-xs font-bold rounded-lg cursor-not-allowed border border-amber-200 opacity-60"
                                >
                                    <Clock size={12} />
                                    Araç Sırada
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onAssign(plate);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-sm shadow-orange-200 active:scale-95"
                                >
                                    Rampa Ata <ArrowRight size={12} />
                                </button>
                            )}
                        </>
                    )}
                    {type === 'CANCELED' && (
                         <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRestore(plate);
                            }}
                            className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-300 text-xs font-bold rounded-lg transition-colors"
                        >
                            <RotateCcw size={14} />
                            Geri Al
                        </button>
                    )}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="space-y-8 mt-8 pb-12">
        {/* Planned Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                        <CalendarClock size={18} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800">Planlanan Seferler</h2>
                        <p className="text-xs text-slate-500">Rampaya alınmayı bekleyen araçlar</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full flex items-center gap-1">
                        <ListTodo size={12} />
                        {planned.length} Kayıt
                    </span>
                    {!readOnly && onOpenEditor && (
                        <button 
                            onClick={onOpenEditor}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors shadow-sm"
                        >
                            <Edit size={12} />
                            Listeyi Düzenle
                        </button>
                    )}
                </div>
            </div>
            
            {planned.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                    {planned.map(([plate, count]) => renderCard(plate, count, 'PLANNED'))}
                </div>
            ) : (
                <div className="p-8 text-center text-slate-400 italic text-sm">
                    Planlanan sefer bulunmamaktadır. "Listeyi Düzenle" butonunu kullanarak ekleyebilirsiniz.
                </div>
            )}
        </div>

        {/* Processed Section */}
        {processed.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg">
                            <History size={18} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800">İşlemdeki & Tamamlananlar</h2>
                            <p className="text-xs text-slate-500">Rampada olan veya çıkış yapmış araçlar</p>
                        </div>
                    </div>
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {processed.length} Kayıt
                    </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                    {processed.map(([plate, count]) => renderCard(plate, count, 'PROCESSED'))}
                </div>
            </div>
        )}

        {/* Canceled Section */}
        {canceledList.length > 0 && (
            <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-red-50 bg-red-50/30 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                            <XCircle size={18} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-red-900">İptal Olan Araçlar</h2>
                            <p className="text-xs text-red-400">Listeden çıkarılan araçlar</p>
                        </div>
                    </div>
                    <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-1 rounded-full flex items-center gap-1">
                        {canceledList.length} İptal
                    </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                    {canceledList.map(([plate, count]) => renderCard(plate, count, 'CANCELED'))}
                </div>
            </div>
        )}
    </div>
  );
};