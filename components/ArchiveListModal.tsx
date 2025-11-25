
import React, { useEffect, useState } from 'react';
import { X, Calendar, ArrowRight, ExternalLink, Archive, Trash2 } from 'lucide-react';
import { getDailyArchives, deleteDailyArchive } from '../services/firebase';
import { DailyArchive } from '../types';

interface ArchiveListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchiveListModal: React.FC<ArchiveListModalProps> = ({ isOpen, onClose }) => {
  const [archives, setArchives] = useState<DailyArchive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getDailyArchives().then((data: any[]) => {
        setArchives(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenArchive = (id: string) => {
    // Open current URL with query param in new tab
    const url = new URL(window.location.href);
    url.searchParams.set('archiveId', id);
    window.open(url.toString(), '_blank');
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("Bu geçmiş kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
          await deleteDailyArchive(id);
          setArchives(prev => prev.filter(a => a.id !== id));
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                <Archive size={24} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Geçmiş Operasyon Kayıtları</h2>
                <p className="text-sm text-slate-500">Son 7 günün operasyon verileri</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        {loading ? (
            <div className="py-12 flex justify-center text-slate-400">
                <span className="animate-pulse">Kayıtlar yükleniyor...</span>
            </div>
        ) : archives.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
                <Calendar size={48} className="mb-3 opacity-20" />
                <p>Henüz arşivlenmiş bir kayıt bulunmamaktadır.</p>
            </div>
        ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {archives.map(archive => (
                    <div key={archive.id} className="p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <Calendar size={16} className="text-indigo-500" />
                                    {new Date(archive.date).toLocaleDateString('tr-TR', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </h3>
                                <div className="text-xs text-slate-500 mt-1 flex gap-3">
                                    <span>Kapatan: <span className="font-medium">{archive.closedBy}</span></span>
                                    <span>Saat: {new Date(archive.date).toLocaleTimeString('tr-TR')}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleOpenArchive(archive.id)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors shadow-sm"
                                    title="İncele"
                                >
                                    <ExternalLink size={14} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(archive.id)}
                                    className="flex items-center justify-center p-2 bg-white text-red-500 border border-red-100 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors shadow-sm"
                                    title="Kaydı Sil"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Mini Stats Summary */}
                        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                            <div className="text-center">
                                <span className="block text-[10px] text-slate-400 uppercase">Araç</span>
                                <span className="font-mono font-bold text-slate-700">{archive.stats.totalVehicles}</span>
                            </div>
                            <div className="text-center border-l border-slate-100">
                                <span className="block text-[10px] text-slate-400 uppercase">Adet</span>
                                <span className="font-mono font-bold text-slate-700">{archive.stats.totalProducts.toLocaleString()}</span>
                            </div>
                            <div className="text-center border-l border-slate-100">
                                <span className="block text-[10px] text-slate-400 uppercase">Süre</span>
                                <span className="font-mono font-bold text-slate-700">{archive.stats.avgTurnaroundMinutes} dk</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-center text-slate-400">
            Sistem sadece son 7 günün kaydını saklamaktadır.
        </div>
      </div>
    </div>
  );
};