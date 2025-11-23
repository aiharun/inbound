import React, { useState, useEffect } from 'react';
import { X, Search, Save, Truck, User, Plus, Phone, AlertCircle, Trash2 } from 'lucide-react';
import { DriverInfo } from '../data/drivers';

interface PlannedTripsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Record<string, DriverInfo>;
  availablePlates: string[];
  scheduledTrips: Record<string, number>;
  onSave: (updates: Record<string, number>, newDrivers?: Record<string, DriverInfo>, deletedPlates?: string[]) => void;
}

export const PlannedTripsEditorModal: React.FC<PlannedTripsEditorModalProps> = ({
  isOpen,
  onClose,
  drivers,
  availablePlates,
  scheduledTrips,
  onSave
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localTrips, setLocalTrips] = useState<Record<string, number>>({});
  
  // New Vehicle Entry State
  const [newPlate, setNewPlate] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [error, setError] = useState('');
  
  // Store newly added drivers locally until save
  const [pendingNewDrivers, setPendingNewDrivers] = useState<Record<string, DriverInfo>>({});
  
  // Store deleted plates locally until save
  const [deletedPlates, setDeletedPlates] = useState<Set<string>>(new Set());

  // Initialize local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalTrips({ ...scheduledTrips });
      setSearchTerm('');
      setNewPlate('');
      setNewDriverName('');
      setNewDriverPhone('');
      setPendingNewDrivers({});
      setDeletedPlates(new Set());
      setError('');
    }
  }, [isOpen, scheduledTrips]);

  if (!isOpen) return null;

  // Merge all known plates (Available + Drivers + Scheduled + Newly Added) - Exclude Deleted
  const allPlates = Array.from(new Set([
    ...availablePlates, 
    ...Object.keys(drivers), 
    ...Object.keys(localTrips),
    ...Object.keys(pendingNewDrivers)
  ])).filter(plate => !deletedPlates.has(plate));

  const filteredPlates = allPlates.filter(plate => 
    plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (drivers[plate]?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pendingNewDrivers[plate]?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Ensure it starts with 0
    let formatted = numbers;
    if (numbers.length > 0 && numbers[0] !== '0') {
        formatted = '0' + numbers;
    }
    
    // Limit max length (05XX XXX XX XX = 11 digits)
    if (formatted.length > 11) formatted = formatted.slice(0, 11);

    // Apply formatting
    if (formatted.length > 4) {
        formatted = `${formatted.slice(0, 4)} ${formatted.slice(4)}`;
    }
    if (formatted.length > 8) {
        formatted = `${formatted.slice(0, 8)} ${formatted.slice(8)}`;
    }
    if (formatted.length > 11) {
        formatted = `${formatted.slice(0, 11)} ${formatted.slice(11)}`;
    }

    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setNewDriverPhone(formatted);
    if (error) setError('');
  };

  const validateTurkishPlate = (plate: string) => {
    // Standard Turkish Plate Regex with REQUIRED SPACES: 
    // (01-81) [Space] (Letter Sequence) [Space] (Number Sequence)
    // Examples: 34 ABC 123
    const regex = /^(0[1-9]|[1-7][0-9]|8[01])\s[A-Z]{1,3}\s\d{2,4}$/;
    return regex.test(plate.trim());
  };

  const validateTurkishPhone = (phone: string) => {
    // Expect format: 05XX XXX XX XX
    const regex = /^05\d{2}\s\d{3}\s\d{2}\s\d{2}$/;
    return regex.test(phone);
  };

  const handleAddNewPlate = () => {
    setError('');
    const plateKey = newPlate.toUpperCase().trim();

    // 1. Validation: Empty Fields
    if (!plateKey || !newDriverName || !newDriverPhone) {
        setError('Lütfen tüm alanları doldurunuz.');
        return;
    }

    // 2. Validation: Turkish Plate Format with Spaces
    if (!validateTurkishPlate(plateKey)) {
        setError('Geçersiz format. Plaka boşluklu olmalı. (Örn: 34 ABC 123)');
        return;
    }

    // 3. Validation: Duplicate Plate (unless it was in deleted list, then we restore it)
    if (allPlates.includes(plateKey) && !deletedPlates.has(plateKey)) {
        setError('Bu plaka sistemde zaten kayıtlı.');
        return;
    }

    // 4. Validation: Turkish Phone Format
    if (!validateTurkishPhone(newDriverPhone)) {
        setError('Geçersiz telefon formatı. (Örn: 05XX XXX XX XX)');
        return;
    }
        
    // If it was marked for deletion, un-delete it
    if (deletedPlates.has(plateKey)) {
        const newDeleted = new Set(deletedPlates);
        newDeleted.delete(plateKey);
        setDeletedPlates(newDeleted);
    }

    // Add to trips with default 1 (Implicitly added to plan)
    setLocalTrips(prev => ({
        ...prev,
        [plateKey]: 1
    }));

    // Add to pending drivers
    setPendingNewDrivers(prev => ({
        ...prev,
        [plateKey]: {
            name: newDriverName,
            phone: newDriverPhone
        }
    }));

    // Reset inputs
    setNewPlate('');
    setNewDriverName('');
    setNewDriverPhone('');
  };

  const handleDeletePlate = (plate: string) => {
    // Mark as deleted
    const newDeleted = new Set(deletedPlates);
    newDeleted.add(plate);
    setDeletedPlates(newDeleted);
    
    // Also remove from pending if it was just added
    if (pendingNewDrivers[plate]) {
        const newPending = { ...pendingNewDrivers };
        delete newPending[plate];
        setPendingNewDrivers(newPending);
    }
  };

  const handleSave = () => {
    onSave(localTrips, pendingNewDrivers, Array.from(deletedPlates));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 m-4 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Sefer Listesini Düzenle</h2>
            <p className="text-sm text-slate-500">Araç ve sürücü listesini yönetin</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        {/* Add New Section */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 flex-shrink-0 space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <Truck size={16} className="text-orange-600" />
                <span className="text-sm font-bold text-slate-700">Yeni Araç & Sürücü Ekle</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input 
                    type="text"
                    placeholder="Plaka (34 ABC 123)"
                    value={newPlate}
                    onChange={(e) => {
                        setNewPlate(e.target.value.toUpperCase());
                        if(error) setError('');
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none font-mono uppercase text-sm focus:ring-2 focus:ring-orange-200"
                    maxLength={14}
                />
                <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Sürücü Adı"
                        value={newDriverName}
                        onChange={(e) => setNewDriverName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-orange-200"
                    />
                </div>
                <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="05XX XXX XX XX"
                        value={newDriverPhone}
                        onChange={handlePhoneChange}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-orange-200"
                        maxLength={14}
                    />
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            <button 
                onClick={handleAddNewPlate}
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
                <Plus size={16} />
                Listeye Ekle
            </button>
        </div>

        {/* Search */}
        <div className="mb-4 flex-shrink-0">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                    type="text"
                    placeholder="Mevcut listede ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl mb-4 bg-white">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0 z-10">
                    <tr>
                        <th className="px-4 py-3">Plaka</th>
                        <th className="px-4 py-3">Sürücü</th>
                        <th className="px-4 py-3 text-right">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredPlates.map(plate => {
                        const driver = drivers[plate] || pendingNewDrivers[plate];
                        const isNew = !!pendingNewDrivers[plate];

                        return (
                            <tr key={plate} className={`transition-colors hover:bg-slate-50 ${isNew ? 'bg-emerald-50/30' : ''}`}>
                                <td className="px-4 py-3 font-mono font-bold text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Truck size={14} className="text-slate-400" />
                                        {plate}
                                        {isNew && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-bold">YENİ</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {driver ? (
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 font-medium">
                                                <User size={14} className="text-slate-400" />
                                                {driver.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 ml-5.5">
                                                {driver.phone}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 italic text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => handleDeletePlate(plate)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Listeden Sil"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredPlates.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">
                                Kayıt bulunamadı.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Footer */}
        <div className="pt-2 flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 text-white font-bold bg-orange-600 hover:bg-orange-700 rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Değişiklikleri Kaydet
            </button>
        </div>
      </div>
    </div>
  );
};