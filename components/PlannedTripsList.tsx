import React, { useState } from 'react';
import { CalendarClock, ListTodo, CheckCircle2, ArrowRight, User, Phone, Truck, History, XCircle, RotateCcw, Minus, StickyNote, Clock, Pencil, Edit, Package, ArrowDownToLine, ArrowUpFromLine, LogIn, LogOut, Search } from 'lucide-react';
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
  onEditQuantity?: (vehicleId: string, currentCount: number, incomingSacks?: number, outgoingSacks?: number, hideSacks?: boolean) => void;
  onAssignRamp?: (vehicleId: string) => void;
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
  onOpenEditor,
  onEditQuantity,
  onAssignRamp
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const trips = (Object.entries(scheduledTrips) as [string, number][])
    .sort((a, b) => b[1] - a[1]);

  const canceledEntries = (Object.entries(canceledTrips) as [string, number][]);
  const canceledPlates = new Set(Object.keys(canceledTrips));

  // Helper to filter by search term
  const matchesSearch = (plate: string) => {
    return plate.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Filter for Planned: Has >0 trips, not canceled, matches search
  const planned = trips.filter(([plate, count]) => 
    count > 0 && !canceledPlates.has(plate) && matchesSearch(plate)
  );
  
  // Filter for Processed: Actual Vehicle entries from history
  // We filter out INCOMING (handled elsewhere usually) and CANCELED (handled in canceled list)
  // We show DOCKING, WAITING, and COMPLETED
  const processedVehicles = vehicles
    .filter(v => 
        (v.status === VehicleStatus.DOCKING || v.status === VehicleStatus.COMPLETED || v.status === VehicleStatus.WAITING) &&
        matchesSearch(v.licensePlate)
    );

  // Group processed vehicles by plate for display
  const groupedProcessed = processedVehicles.reduce((acc, v) => {
    if (!acc[v.licensePlate]) acc[v.licensePlate] = [];
    acc[v.licensePlate].push(v);
    return acc;
  }, {} as Record<string, Vehicle[]>);

  // Sort groups by latest activity
  const sortedProcessedGroups = Object.entries(groupedProcessed).sort(
    ([, vehiclesA]: [string, Vehicle[]], [, vehiclesB]: [string, Vehicle[]]) => {
      const latestA = Math.max(...vehiclesA.map(v => new Date(v.arrivalTime).getTime()));
      const latestB = Math.max(...vehiclesB.map(v => new Date(v.arrivalTime).getTime()));
      return latestB - latestA;
    }
  );

  // Filter for Canceled: Matches search
  const canceledList = canceledEntries.filter(([plate]) => matchesSearch(plate));

  if (trips.length === 0 && canceledEntries.length === 0 && !onOpenEditor && processedVehicles.length === 0) return null;

  // --- RENDERERS ---

  // Renderer for INDIVIDUAL PLANNED CARD (Used inside the grouped loop or single)
  const renderPlannedCard = (plate: string, tripIndex: number, totalPlanned: number, type: 'PLANNED' | 'CANCELED') => {
    const driver = drivers[plate];
    const isCanceled = type === 'CANCELED';
    
    // Determine the actual sequential trip number
    // Get history count (Completed/Docking/Waiting)
    const historyCount = vehicles.filter(v => 
        v.licensePlate === plate && 
        v.status !== VehicleStatus.CANCELED && 
        v.status !== VehicleStatus.INCOMING
    ).length;

    // The trip number for THIS specific card
    // tripIndex is 0-based index within the remaining planned trips.
    // Example: History has 1 trip. Remaining is 2. 
    // Card 1 (index 0) is Trip #2. Card 2 (index 1) is Trip #3.
    const specificTripNumber = historyCount + tripIndex + 1;
    
    // Retrieve note using specific key first, fallback to general key
    const note = vehicleNotes[`${plate}-${specificTripNumber}`] || vehicleNotes[plate];
    
    // LOGIC: Enable assignment only if previous trip is active/done
    // Trip #1 is always enabled.
    // Trip #N is enabled only if Trip #(N-1) exists in history (meaning it started).
    
    let isActionable = true;
    let actionMessage = "";

    if (specificTripNumber > 1) {
        // Find the status of the previous trip (Trip #N-1)
        const previousTrip = vehicles.find(v => v.licensePlate === plate && v.tripCount === specificTripNumber - 1);
        
        if (!previousTrip) {
            // Previous trip hasn't even started yet
            isActionable = false;
            actionMessage = `${specificTripNumber - 1}. Sefer Bekleniyor`;
        } else {
            // Previous trip exists. Check status.
            if (previousTrip.status === VehicleStatus.WAITING) {
                isActionable = false;
                actionMessage = "Önceki Sırada";
            } else if (previousTrip.status === VehicleStatus.DOCKING) {
                isActionable = false;
                actionMessage = "Önceki Rampada";
            } else if (previousTrip.status !== VehicleStatus.COMPLETED && previousTrip.status !== VehicleStatus.CANCELED) {
                // If not completed or canceled (meaning it's active somehow), block next step
                isActionable = false;
                actionMessage = "Önceki İşlemde";
            }
        }
    }
    
    // Also check generic status (is vehicle currently physically occupied?)
    const isVehicleOnRamp = vehicles.some(v => v.licensePlate === plate && v.status === VehicleStatus.DOCKING);
    
    // If we are trying to plan Trip 1 but vehicle is on ramp (maybe unrelated logic error, but safe to check)
    if (isActionable && isVehicleOnRamp && specificTripNumber === 1) {
         // This implies a data inconsistency or manual reset without clearing vehicles, but let's handle it safely
         isActionable = false;
         actionMessage = "Araç Rampada";
    }

    return (
        <div 
            key={`${plate}-${tripIndex}`} 
            className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all group h-full ${
                isCanceled
                    ? 'bg-red-50 border-red-100 opacity-80'
                    : 'bg-white border-slate-200 hover:border-orange-200 hover:shadow-md'
            }`}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className={`text-xs transition-colors ${isCanceled ? 'text-slate-400' : 'text-slate-400 group-hover:text-orange-500'}`}>
                            Araç Plakası
                        </p>
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">
                            {specificTripNumber}. Sefer
                        </span>
                    </div>
                    <p className={`text-lg font-bold font-mono ${isCanceled ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-800'}`}>
                        {plate}
                    </p>
                </div>
                
                {isCanceled ? (
                    <div className="flex items-center gap-1 text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded-lg">
                        <XCircle size={14} />
                        İptal
                    </div>
                ) : (
                    <div className="flex flex-col items-end">
                        {!readOnly && totalPlanned > 1 && tripIndex === totalPlanned - 1 && onRemoveOneTrip && (
                            // Only show minus button on the LAST card of the sequence
                             <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onRemoveOneTrip(plate);
                                }}
                                className="p-0.5 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded transition-colors border border-slate-200 mb-1"
                                title="Son seferi sil"
                            >
                                <Minus size={12} />
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            {/* Driver Info Section */}
            <div className={`border-t pt-3 mb-2 space-y-2 ${isCanceled ? 'border-red-100' : 'border-slate-100'}`}>
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
                    {/* PLANNED CARD ACTIONS */}
                    {type === 'PLANNED' && (
                        <>
                            {tripIndex === 0 && (
                                // Only show cancel on the first available card, or maybe all? 
                                // Let's allow canceling the whole plate plan via the first card, or specific?
                                // Context: onCancel takes a plate and cancels ALL remaining.
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onCancel(plate);
                                    }}
                                    className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-xs font-bold rounded-lg transition-colors border border-red-100"
                                    title="Tüm Seferleri İptal Et"
                                >
                                    <XCircle size={16} />
                                </button>
                            )}
                            
                            {!isActionable ? (
                                 <button
                                    type="button"
                                    disabled
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed border border-slate-200"
                                >
                                    <Clock size={12} />
                                    {actionMessage}
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

                    {/* CANCELED CARD ACTIONS */}
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

  const renderProcessedCard = (vehicle: Vehicle) => {
    const isWaiting = vehicle.status === VehicleStatus.WAITING;
    const isDocking = vehicle.status === VehicleStatus.DOCKING;
    const isCompleted = vehicle.status === VehicleStatus.COMPLETED;
    const driver = drivers[vehicle.licensePlate];
    // Retrieve note for this specific trip
    const note = vehicleNotes[`${vehicle.licensePlate}-${vehicle.tripCount}`] || vehicleNotes[vehicle.licensePlate];
    
    // Determine status color/text
    let statusColor = 'slate';
    let statusText = 'Bilinmiyor';
    let borderColor = 'border-slate-200';
    let bgColor = 'bg-white';

    if (isWaiting) {
        statusColor = 'amber';
        statusText = 'Sırada';
        borderColor = 'border-amber-200';
        bgColor = 'bg-amber-50/50';
    } else if (isDocking) {
        statusColor = 'orange';
        statusText = 'Rampada';
        borderColor = 'border-orange-200';
        bgColor = 'bg-orange-50/50';
    } else if (isCompleted) {
        statusColor = 'emerald';
        statusText = 'Tamamlandı';
        borderColor = 'border-emerald-200';
        bgColor = 'bg-emerald-50/50';
    }

    return (
        <div 
            key={vehicle.id} 
            className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all group h-full ${borderColor} ${bgColor}`}
        >
             {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-${statusColor}-100 bg-${statusColor}-50 text-${statusColor}-600 uppercase`}>
                            {statusText}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                            {vehicle.tripCount}. Sefer
                        </span>
                    </div>
                    <p className="text-lg font-bold font-mono text-slate-800">
                        {vehicle.licensePlate}
                    </p>
                </div>
                 {/* Optional: Edit button for quantity if not completed? */}
                 {!readOnly && onEditQuantity && !isCompleted && (
                     <button
                        onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             onEditQuantity(vehicle.id, vehicle.productCount, vehicle.incomingSackCount || 0, vehicle.outgoingSackCount || 0, isWaiting);
                        }}
                        className="p-1 text-slate-400 hover:text-orange-600 rounded transition-colors"
                        title="Düzenle"
                     >
                         <Edit size={14} />
                     </button>
                 )}
            </div>

            {/* Details */}
             <div className="border-t border-slate-200/50 pt-3 mb-2 space-y-2">
                 {/* Driver */}
                {driver && (
                    <div className="flex items-center gap-2 text-slate-600">
                        <User size={14} className="text-slate-400" />
                        <span className="text-sm font-medium truncate">{driver.name}</span>
                    </div>
                )}
                {/* Product Count */}
                 <div className="flex items-center gap-2 text-slate-600">
                    <Package size={14} className="text-slate-400" />
                    <span className="text-sm font-mono">{vehicle.productCount} Adet</span>
                </div>
                {/* Note Section */}
                {note && (
                    <div className="mt-1 mb-1 p-2 rounded-lg text-xs flex gap-2 bg-yellow-50 text-yellow-700">
                        <StickyNote size={14} className="flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{note}</span>
                    </div>
                )}
                {/* Time */}
                {vehicle.dockingStartTime && (
                    <div className="flex items-center gap-2 text-slate-500">
                        <LogIn size={14} className="text-orange-400" />
                        <span className="text-xs font-mono">
                            Giriş: {new Date(vehicle.dockingStartTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                )}
                {vehicle.exitTime && (
                    <div className="flex items-center gap-2 text-slate-500">
                        <LogOut size={14} className="text-emerald-400" />
                        <span className="text-xs font-mono">
                            Çıkış: {new Date(vehicle.exitTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                )}
                {(!vehicle.dockingStartTime && !vehicle.exitTime) && (
                     <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs font-mono">
                            {new Date(vehicle.arrivalTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                )}
             </div>

             {/* Sack Counts Display */}
             {(vehicle.incomingSackCount !== undefined || vehicle.outgoingSackCount !== undefined) && (
                 <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/50">
                     <div className="flex flex-col items-center bg-blue-50/50 p-1.5 rounded-lg border border-blue-100">
                         <span className="text-[10px] text-blue-500 font-bold mb-0.5 flex items-center gap-1">
                             <ArrowDownToLine size={10} /> Alınan
                         </span>
                         <span className="text-sm font-mono font-bold text-slate-700">
                             {vehicle.incomingSackCount || 0}
                         </span>
                     </div>
                     <div className="flex flex-col items-center bg-purple-50/50 p-1.5 rounded-lg border border-purple-100">
                         <span className="text-[10px] text-purple-500 font-bold mb-0.5 flex items-center gap-1">
                             <ArrowUpFromLine size={10} /> Verilen
                         </span>
                         <span className="text-sm font-mono font-bold text-slate-700">
                             {vehicle.outgoingSackCount || 0}
                         </span>
                     </div>
                 </div>
             )}

             {/* Actions */}
             {!readOnly && isWaiting && onAssignRamp && (
                 <div className="mt-auto pt-2">
                     <button
                        onClick={() => onAssignRamp(vehicle.id)}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                     >
                         Rampa Ata <ArrowRight size={12} />
                     </button>
                 </div>
             )}
             
             {isDocking && (
                  <div className="mt-auto pt-2 text-center text-xs font-bold text-orange-600 animate-pulse">
                      İşlem Sürüyor...
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

            {/* Search Bar */}
            <div className="px-6 pt-4 pb-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text"
                        placeholder="Seferlerde plaka ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                </div>
            </div>
            
            {planned.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                    {planned.map(([plate, count]) => {
                        // SINGLE TRIP
                        if (count === 1) {
                            return renderPlannedCard(plate, 0, 1, 'PLANNED');
                        }

                        // MULTI TRIP GROUP (Green Border)
                        // Calculate grid columns for inner content
                        let containerClass = "col-span-1";
                        let innerGridClass = "grid-cols-1";
                        if (count >= 4) {
                            containerClass = "col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4";
                            innerGridClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
                        } else if (count === 3) {
                             containerClass = "col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-3";
                             innerGridClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3";
                        } else if (count === 2) {
                             containerClass = "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2";
                             innerGridClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2";
                        }

                        return (
                             <div key={plate} className={`${containerClass} border-2 border-emerald-400/50 rounded-2xl p-5 bg-emerald-50/20`}>
                                  <div className="flex items-center gap-2 mb-4">
                                     <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                        <ListTodo size={16} className="text-emerald-600" />
                                     </div>
                                     <h3 className="font-bold text-slate-700 text-lg font-mono">{plate}</h3>
                                     <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md border border-emerald-200">
                                         Kalan {count} Sefer
                                     </span>
                                  </div>
                                  <div className={`grid ${innerGridClass} gap-4`}>
                                      {Array.from({ length: count }).map((_, idx) => (
                                          renderPlannedCard(plate, idx, count, 'PLANNED')
                                      ))}
                                  </div>
                             </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-8 text-center text-slate-400 italic text-sm">
                    {searchTerm ? "Aranan kriterlere uygun planlanmış sefer bulunamadı." : 'Planlanan sefer bulunmamaktadır. "Listeyi Düzenle" butonunu kullanarak ekleyebilirsiniz.'}
                </div>
            )}
        </div>

        {/* Processed Section (Individual Vehicle Entries) */}
        {sortedProcessedGroups.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg">
                            <History size={18} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800">İşlemdeki & Tamamlananlar</h2>
                            <p className="text-xs text-slate-500">Sırada, rampada veya çıkış yapmış araç hareketleri</p>
                        </div>
                    </div>
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {processedVehicles.length} Hareket
                    </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                    {sortedProcessedGroups.map(([plate, groupVehicles]) => {
                         const vehicles = groupVehicles as Vehicle[];
                         const sortedVehicles = [...vehicles].sort((a,b) => a.tripCount - b.tripCount);
                         
                         // Single item
                         if (sortedVehicles.length === 1) {
                             return renderProcessedCard(sortedVehicles[0]);
                         }

                         // Multiple items: Render container with orange border
                         // DYNAMIC SPAN CALCULATION
                         const count = sortedVehicles.length;
                         let containerClass = "col-span-1";
                         let innerGridClass = "grid-cols-1";

                         if (count >= 4) {
                             containerClass = "col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4";
                             innerGridClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
                         } else if (count === 3) {
                             containerClass = "col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-3";
                             innerGridClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3";
                         } else if (count === 2) {
                             containerClass = "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2";
                             innerGridClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2";
                         }

                         return (
                             <div key={plate} className={`${containerClass} border-2 border-orange-400/50 rounded-2xl p-5 bg-orange-50/20 mt-2 mb-2`}>
                                  <div className="flex items-center gap-2 mb-4">
                                     <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                        <Truck size={16} className="text-orange-600" />
                                     </div>
                                     <h3 className="font-bold text-slate-700 text-lg font-mono">{plate}</h3>
                                     <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-md border border-orange-200">
                                         Toplam {sortedVehicles.length} Sefer
                                     </span>
                                  </div>
                                  <div className={`grid ${innerGridClass} gap-4`}>
                                      {sortedVehicles.map(v => renderProcessedCard(v))}
                                  </div>
                             </div>
                         );
                    })}
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
                    {canceledList.map(([plate, count]) => renderPlannedCard(plate, 0, count, 'CANCELED'))}
                </div>
            </div>
        )}
    </div>
  );
};