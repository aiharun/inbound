import React, { useState } from 'react';
import { X, Phone, Search, User, Truck } from 'lucide-react';
import { DriverInfo } from '../data/drivers';

interface DriverListModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Record<string, DriverInfo>;
}

export const DriverListModal: React.FC<DriverListModalProps> = ({ 
    isOpen, 
    onClose, 
    drivers
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const driverList = Object.entries(drivers).map(([plate, info]) => ({
    plate,
    ...(info as DriverInfo)
  }));

  const filteredDrivers = driverList.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 m-4 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Sürücü Rehberi</h2>
            <p className="text-sm text-slate-500">Sürücü iletişim bilgileri ve arama</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 flex-shrink-0">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                    type="text"
                    placeholder="Sürücü adı, plaka veya telefon ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
            </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
            {filteredDrivers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic">
                    Aranan kriterlere uygun sürücü bulunamadı.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {filteredDrivers.map((driver) => (
                        <div key={driver.plate} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-all group">
                            <div className="flex items-start sm:items-center gap-4 mb-3 sm:mb-0">
                                <div className="p-3 bg-slate-100 rounded-full text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{driver.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1 text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                                            <Truck size={12} />
                                            {driver.plate}
                                        </span>
                                        <span className="text-sm text-slate-500">{driver.phone}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <a 
                                href={`tel:${driver.phone.replace(/\s/g, '')}`}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-emerald-200 active:scale-95 font-medium text-sm"
                            >
                                <Phone size={16} />
                                Ara
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="pt-4 mt-4 border-t border-slate-100 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Kapat
            </button>
        </div>
      </div>
    </div>
  );
};