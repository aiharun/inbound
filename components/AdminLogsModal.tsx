import React, { useState } from 'react';
import { X, Search, FileClock, User, Filter, ArrowDown, ArrowUp } from 'lucide-react';
import { SystemLog } from '../types';

interface AdminLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SystemLog[];
}

export const AdminLogsModal: React.FC<AdminLogsModalProps> = ({ isOpen, onClose, logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedByName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = actionFilter === 'ALL' || log.actionType === actionFilter;
    return matchesSearch && matchesFilter;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
        case 'LOGIN': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">GİRİŞ</span>;
        case 'LOGOUT': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">ÇIKIŞ</span>;
        case 'VEHICLE_ADD': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">ARAÇ GİRİŞ</span>;
        case 'RAMP_ASSIGN': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700">RAMPA ATA</span>;
        case 'RAMP_CLEAR': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">BOŞALTMA</span>;
        case 'CANCEL': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">İPTAL</span>;
        case 'RESET': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white">SİSTEM SIFIRLAMA</span>;
        case 'UPDATE': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">DÜZENLEME</span>;
        case 'USER_MGMT': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">KULLANICI</span>;
        default: return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">{action}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-6 m-4 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                <FileClock size={24} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Sistem Kayıtları (Log)</h2>
                <p className="text-sm text-slate-500">Tüm kullanıcı işlemleri ve hareket dökümü</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 flex-shrink-0">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text"
                    placeholder="İşlem, kullanıcı veya açıklama ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
            <select 
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
                <option value="ALL">Tüm İşlemler</option>
                <option value="LOGIN">Giriş/Çıkış</option>
                <option value="VEHICLE_ADD">Araç Giriş</option>
                <option value="RAMP_ASSIGN">Rampa Atama</option>
                <option value="RAMP_CLEAR">Rampa Boşaltma</option>
                <option value="CANCEL">İptal İşlemleri</option>
                <option value="UPDATE">Veri Düzenleme</option>
                <option value="RESET">Sistem Sıfırlama</option>
                <option value="USER_MGMT">Kullanıcı Yönetimi</option>
            </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl custom-scrollbar bg-slate-50/30">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-6 py-3">Tarih/Saat</th>
                        <th className="px-6 py-3">Kullanıcı</th>
                        <th className="px-6 py-3">İşlem Tipi</th>
                        <th className="px-6 py-3">Açıklama</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredLogs.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                                Kayıt bulunamadı.
                            </td>
                        </tr>
                    ) : (
                        filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-indigo-50/20 transition-colors">
                                <td className="px-6 py-3 whitespace-nowrap font-mono text-xs text-slate-500">
                                    {new Date(log.timestamp).toLocaleString('tr-TR')}
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-slate-400" />
                                        <div>
                                            <p className="font-bold text-slate-700 text-xs">{log.performedByName}</p>
                                            <p className="text-[10px] text-slate-400">@{log.performedBy}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    {getActionBadge(log.actionType)}
                                </td>
                                <td className="px-6 py-3 text-slate-600">
                                    {log.description}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        <div className="pt-4 flex justify-end text-xs text-slate-400">
             Son 200 işlem gösterilmektedir.
        </div>
      </div>
    </div>
  );
};