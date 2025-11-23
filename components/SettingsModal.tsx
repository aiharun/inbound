import React, { useState } from 'react';
import { X, Search, Save, Edit2, User, Phone, Truck, Trash2, AlertTriangle } from 'lucide-react';
import { DriverInfo } from '../data/drivers';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Record<string, DriverInfo>;
  onUpdateDriver: (plate: string, name: string, phone: string) => void;
  availablePlates: string[];
  onSystemReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  drivers,
  onUpdateDriver,
  availablePlates,
  onSystemReset
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlate, setEditingPlate] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  if (!isOpen) return null;

  // Combine available plates with drivers registry to ensure we show all relevant plates
  const allPlates = Array.from(new Set([...Object.keys(drivers), ...availablePlates]));
  
  const filteredPlates = allPlates.filter(plate => 
    plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (drivers[plate]?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEdit = (plate: string) => {
    const info = drivers[plate] || { name: '', phone: '' };
    setEditingPlate(plate);
    setEditName(info.name);
    setEditPhone(info.phone);
  };

  const saveEdit = () => {
    if (editingPlate) {
        onUpdateDriver(editingPlate, editName, editPhone);
        setEditingPlate(null);
    }
  };

  const cancelEdit = () => {
    setEditingPlate(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 m-4 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
         {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Yönetim Paneli</h2>
            <p className="text-sm text-slate-500">Sürücü ve araç bilgilerini düzenle</p>
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
                    placeholder="Plaka veya sürücü adı ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
            </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl custom-scrollbar mb-4">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-6 py-4">Plaka</th>
                        <th className="px-6 py-4">Sürücü Adı</th>
                        <th className="px-6 py-4">Telefon</th>
                        <th className="px-6 py-4 text-right">İşlemler</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredPlates.map(plate => {
                        const isEditing = editingPlate === plate;
                        const driver = drivers[plate] || { name: '-', phone: '-' };

                        return (
                            <tr key={plate} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold font-mono text-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Truck size={16} className="text-slate-400" />
                                        {plate}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-slate-400" />
                                            <input 
                                                type="text" 
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none"
                                                placeholder="Ad Soyad"
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <span className={!drivers[plate] ? "text-slate-400 italic" : ""}>
                                            {driver.name}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="text-slate-400" />
                                            <input 
                                                type="text" 
                                                value={editPhone}
                                                onChange={(e) => setEditPhone(e.target.value)}
                                                className="w-full p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none"
                                                placeholder="5XX XXX XX XX"
                                            />
                                        </div>
                                    ) : (
                                        <span className={!drivers[plate] ? "text-slate-400 italic" : "font-mono text-xs"}>
                                            {driver.phone}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {isEditing ? (
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={cancelEdit}
                                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="İptal"
                                            >
                                                <X size={18} />
                                            </button>
                                            <button 
                                                onClick={saveEdit}
                                                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                                title="Kaydet"
                                            >
                                                <Save size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => startEdit(plate)}
                                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        {/* Footer Actions / Danger Zone */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-500" />
                <span>Sistem verileri sadece yönetici onayı ile silinmelidir.</span>
            </div>
            <button
                onClick={onSystemReset}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors text-sm font-bold border border-red-100 shadow-sm"
            >
                <Trash2 size={16} />
                Sistemi Sıfırla (Reset)
            </button>
        </div>
      </div>
    </div>
  );
};