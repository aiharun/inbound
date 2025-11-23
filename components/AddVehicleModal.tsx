import React, { useState, useEffect } from 'react';
import { X, Truck, Package, Anchor, ChevronDown, AlertCircle, User, Phone } from 'lucide-react';
import { Ramp, Vehicle } from '../types';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { licensePlate: string; productCount: number; rampId: string | null; driverName?: string; driverPhone?: string }) => void;
  ramps: Ramp[];
  currentVehicles: Vehicle[];
  availablePlates: string[];
  onAddPlate: (plate: string) => void;
  initialPlate?: string;
  initialProductCount?: number | null;
  allRegisteredPlates?: string[];
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    ramps, 
    availablePlates,
    onAddPlate,
    initialPlate = '',
    initialProductCount = null,
    allRegisteredPlates = []
}) => {
  const [licensePlate, setLicensePlate] = useState('');
  const [productCount, setProductCount] = useState<string>('');
  const [selectedRampId, setSelectedRampId] = useState<string>('');
  
  // New fields for driver info
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
        setLicensePlate(initialPlate || '');
        setProductCount(initialProductCount !== null ? initialProductCount.toString() : '');
        setSelectedRampId('');
        setDriverName('');
        setDriverPhone('');
        setError('');
    }
  }, [isOpen, initialPlate, initialProductCount]);

  if (!isOpen) return null;

  // Turkish License Plate Regex: 
  // Starts with 01-81, followed by 1-3 letters, followed by 2-5 digits
  const TURKISH_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|8[01])\s*[A-Z]{1,3}\s*\d{2,5}$/;

  const formatPhoneNumber = (value: string) => {
    // Strip all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Ensure it starts with 0
    let formatted = numbers;
    if (numbers.length > 0 && numbers[0] !== '0') {
        formatted = '0' + numbers;
    }
    
    // Limit to 11 digits (05XX XXX XX XX)
    formatted = formatted.slice(0, 11);

    // Apply formatting
    if (formatted.length > 7) {
        return `${formatted.slice(0, 4)} ${formatted.slice(4, 7)} ${formatted.slice(7, 9)} ${formatted.slice(9)}`;
    } else if (formatted.length > 4) {
        return `${formatted.slice(0, 4)} ${formatted.slice(4)}`;
    } else {
        return formatted;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setDriverPhone(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate || !productCount) return;

    const normalizedPlate = licensePlate.toUpperCase().trim();

    // --- VALIDATION START ---

    // 1. Check duplicate for unplanned vehicles
    if (!initialPlate) {
        // Remove ALL spaces from input for comparison
        const inputStripped = normalizedPlate.replace(/\s/g, '');
        
        const isDuplicate = allRegisteredPlates.some(regPlate => 
            regPlate.toUpperCase().replace(/\s/g, '') === inputStripped
        );

        if (isDuplicate) {
            setError('Bu araç zaten sistemde kayıtlıdır. Lütfen sefer planlayın.');
            return;
        }

        // 2. Validate Turkish Plate Format
        if (!TURKISH_PLATE_REGEX.test(normalizedPlate)) {
            setError('Geçersiz plaka formatı! Örn: 34 ABC 123');
            return;
        }

        // 3. Validate Driver Info for Extra Vehicles
        if (!driverName.trim()) {
            setError('Lütfen sürücü adını giriniz.');
            return;
        }

        if (driverPhone.replace(/\s/g, '').length < 11) {
            setError('Lütfen geçerli bir telefon numarası giriniz (05XX...)');
            return;
        }
    }

    // --- VALIDATION END ---

    onSubmit({
      licensePlate: normalizedPlate,
      productCount: parseInt(productCount),
      rampId: selectedRampId || null,
      driverName: !initialPlate ? driverName : undefined,
      driverPhone: !initialPlate ? driverPhone : undefined
    });
    
    // Reset form
    setLicensePlate('');
    setProductCount('');
    setSelectedRampId('');
    setDriverName('');
    setDriverPhone('');
    setError('');
    onClose();
  };

  const handleSelectPlate = (plate: string) => {
    if (initialPlate) return; 
    setLicensePlate(plate);
    if (error) setError('');
    if (!productCount) {
        setProductCount(Math.floor(Math.random() * 500 + 100).toString());
    }
  };

  const freeRamps = ramps.filter(r => r.status === 'FREE');
  
  const getButtonText = () => {
    if (initialPlate) {
        return selectedRampId ? 'Rampaya Gönder' : 'Giriş Yap';
    }
    return 'Kaydet';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{initialPlate ? 'Araç Kabul & Rampa' : 'Ekstra Araç Girişi'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* License Plate Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Araç Plakası</label>
            <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    list={!initialPlate ? "plate-suggestions" : undefined}
                    value={licensePlate}
                    onChange={(e) => {
                        setLicensePlate(e.target.value);
                        if (error) setError('');
                    }}
                    placeholder="34 ABC 123"
                    disabled={!!initialPlate}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono uppercase transition-all ${initialPlate ? 'opacity-75 cursor-not-allowed bg-slate-100 font-bold text-slate-700' : ''} ${error && error.includes('plaka') ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                    autoFocus={!initialPlate}
                    maxLength={12}
                />
                {!initialPlate && (
                    <datalist id="plate-suggestions">
                        {availablePlates.map(plate => (
                            <option key={plate} value={plate} />
                        ))}
                    </datalist>
                )}
            </div>
            {!initialPlate && (
                <p className="text-[10px] text-slate-400 mt-1 ml-1">Format: 06 ANK 06 (İl Kodu + Harf + Rakam)</p>
            )}
            
            {/* Quick Select Chips - Hide if plate is locked */}
            {!initialPlate && availablePlates.length > 0 && (
                <div className="mt-3">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-slate-400">Hızlı Seçim:</p>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                        {availablePlates.map((plate) => (
                            <button
                                key={plate}
                                type="button"
                                onClick={() => handleSelectPlate(plate)}
                                className="text-xs font-mono bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 px-2 py-1 rounded transition-colors flex items-center gap-1"
                            >
                                {plate}
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>

          {/* Driver Info - Only show for Extra Vehicles (unlocked plate) */}
          {!initialPlate && (
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Sürücü Adı</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            placeholder="Ad Soyad"
                            className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            value={driverPhone}
                            onChange={handlePhoneChange}
                            placeholder="05XX..."
                            maxLength={14}
                            className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-mono"
                        />
                    </div>
                </div>
            </div>
          )}

          {/* Product Count */}
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Yük (Adet)</label>
              <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                  type="number"
                  value={productCount}
                  onChange={(e) => setProductCount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  autoFocus={!!initialPlate}
              />
              </div>
          </div>

          {/* Ramp Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Doğrudan Rampa Atama</label>
            <div className="relative">
               <Anchor className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
               <select
                 value={selectedRampId}
                 onChange={(e) => setSelectedRampId(e.target.value)}
                 className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer text-slate-700"
               >
                 <option value="">Rampasız Giriş (Sadece Kayıt)</option>
                 {freeRamps.map(ramp => (
                   <option key={ramp.id} value={ramp.id}>
                     {ramp.name} (Müsait)
                   </option>
                 ))}
               </select>
               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
            </div>
          )}

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
              className="flex-1 px-4 py-3 text-white font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-95"
            >
              {getButtonText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};