
import React, { useState } from 'react';
import { Vehicle, VehicleStatus } from '../types';
import { CheckCircle2, Clock, Truck, ArrowRight, CalendarDays, Hash, MapPin, Search, ChevronLeft, ChevronRight, Filter, Trash2, XCircle, Edit2 } from 'lucide-react';

interface VehicleListProps {
  vehicles: Vehicle[];
  onAssignRamp: (vehicleId: string) => void;
  onCancelWaiting?: (vehicleId: string) => void;
  onEditQuantity?: (vehicleId: string, currentCount: number, incomingSacks?: number, outgoingSacks?: number, hideSacks?: boolean) => void;
  readOnly?: boolean;
}

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onAssignRamp, onCancelWaiting, onEditQuantity, readOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | VehicleStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and Sort Logic
  const filteredVehicles = vehicles
    .filter(v => {
      const matchesSearch = v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.arrivalTime).getTime() - new Date(a.arrivalTime).getTime());

  // Pagination Logic
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVehicles = filteredVehicles.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.WAITING:
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Sırada
            </span>
        );
      case VehicleStatus.DOCKING:
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-100 text-xs font-bold">
                <Truck size={14}/> Rampada
            </span>
        );
      case VehicleStatus.COMPLETED:
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium">
                <CheckCircle2 size={14}/> Tamamlandı
            </span>
        );
      case VehicleStatus.CANCELED:
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 text-xs font-medium">
                <XCircle size={14}/> İptal
            </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header & Controls */}
      <div className="px-6 py-6 border-b border-slate-100 bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600">
                    <CalendarDays size={22} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-800 text-lg leading-tight">Araç Hareket Günlüğü</h2>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">Giriş ve çıkış yapan tüm araçların listesi</p>
                </div>
            </div>
             <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Toplam</span>
                <span className="text-sm font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
                    {vehicles.length}
                </span>
            </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text"
                    placeholder="Plaka ara..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to page 1 on search
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
            </div>

            {/* Status Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto">
                {[
                    { key: 'ALL', label: 'Tümü' },
                    { key: VehicleStatus.WAITING, label: 'Sırada' },
                    { key: VehicleStatus.DOCKING, label: 'Rampada' },
                    { key: VehicleStatus.COMPLETED, label: 'Tamamlandı' }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setStatusFilter(tab.key as any);
                            setCurrentPage(1);
                        }}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
                            statusFilter === tab.key 
                                ? 'bg-white text-slate-800 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider w-48">Plaka</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Durum</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Giriş</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Konum</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Yük (Adet)</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Çıkış</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">{!readOnly && "İşlem"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentVehicles.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 6 : 7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <Filter className="w-8 h-8 opacity-20" />
                    </div>
                    <span className="text-sm font-medium">
                        {vehicles.length === 0 ? "Bugün henüz bir araç hareketi kaydedilmedi." : "Aranan kriterlere uygun araç bulunamadı."}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              currentVehicles.map((vehicle) => {
                const isWaiting = vehicle.status === VehicleStatus.WAITING;
                const isCompleted = vehicle.status === VehicleStatus.COMPLETED;
                const isCanceled = vehicle.status === VehicleStatus.CANCELED;
                
                return (
                <tr key={vehicle.id} className={`group transition-colors hover:bg-slate-50/80 ${isWaiting ? 'bg-amber-50/10' : isCanceled ? 'opacity-60 bg-red-50/10' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-8 rounded-full ${isWaiting ? 'bg-amber-400' : isCompleted ? 'bg-slate-200' : isCanceled ? 'bg-red-200' : 'bg-orange-500'}`}></div>
                        <div>
                          <span className={`font-bold font-mono text-base tracking-tight block ${isCanceled ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                              {vehicle.licensePlate}
                          </span>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(vehicle.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock size={14} className="text-slate-400"/>
                        <span className="font-mono text-sm font-medium">
                            {new Date(vehicle.arrivalTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {vehicle.rampId ? (
                       <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-orange-400" />
                          <span className="text-sm font-semibold text-slate-900">
                             Rampa {parseInt(vehicle.rampId) + 1}
                          </span>
                       </div>
                    ) : (
                        <span className="text-slate-400 text-xs font-medium px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
                            -
                        </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 group/edit">
                        <div className="flex items-center gap-1.5">
                            <Hash size={14} className="text-slate-400" />
                            <span className="font-medium text-slate-700 font-mono">
                                {vehicle.productCount.toLocaleString()}
                            </span>
                        </div>
                        {!readOnly && onEditQuantity && !isCompleted && !isCanceled && (
                            <button
                                onClick={() => onEditQuantity(vehicle.id, vehicle.productCount, vehicle.incomingSackCount || 0, vehicle.outgoingSackCount || 0, isWaiting)}
                                className="ml-2 p-1.5 text-slate-500 hover:text-orange-600 bg-slate-100 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-md transition-all shadow-sm opacity-100"
                                title="Adet Düzenle"
                            >
                                <Edit2 size={14} />
                            </button>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {vehicle.exitTime ? (
                        <span className="font-mono text-slate-500 text-sm">
                            {new Date(vehicle.exitTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    ) : (
                        <span className="text-slate-300 text-lg leading-none">--:--</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!readOnly && isWaiting && (
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => onAssignRamp(vehicle.id)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white rounded-lg transition-all text-xs font-bold shadow-sm hover:shadow-md"
                            >
                                Atama Yap <ArrowRight size={14} />
                            </button>
                            {onCancelWaiting && (
                                <button 
                                    onClick={() => onCancelWaiting(vehicle.id)}
                                    className="inline-flex items-center justify-center p-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all shadow-sm"
                                    title="Sıradan Sil"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    )}
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
                Toplam <span className="font-bold">{filteredVehicles.length}</span> kayıttan <span className="font-bold">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredVehicles.length)}</span> arası gösteriliyor
            </span>
            <div className="flex gap-2">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-orange-600 hover:border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                >
                    <ChevronLeft size={16} />
                </button>
                <div className="flex items-center px-2">
                    <span className="text-xs font-medium text-slate-600">
                        Sayfa {currentPage} / {totalPages}
                    </span>
                </div>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-orange-600 hover:border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
