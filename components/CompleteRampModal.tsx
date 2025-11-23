
import React, { useState } from 'react';
import { X, CheckCircle2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface CompleteRampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (incoming: number, outgoing: number) => void;
  vehiclePlate: string;
}

export const CompleteRampModal: React.FC<CompleteRampModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm,
    vehiclePlate
}) => {
  const [incoming, setIncoming] = useState<string>('');
  const [outgoing, setOutgoing] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inc = incoming ? parseInt(incoming) : 0;
    const out = outgoing ? parseInt(outgoing) : 0;
    
    onConfirm(inc, out);
    setIncoming('');
    setOutgoing('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-600" size={24} />
            İşlemi Tamamla
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
            <span className="font-bold font-mono text-slate-800">{vehiclePlate}</span> plakalı aracın çıkış işlemleri için çuval bilgilerini giriniz.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Alınan Çuval Adedi</label>
            <div className="relative">
              <ArrowDownToLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="number"
                value={incoming}
                onChange={(e) => setIncoming(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="0"
                autoFocus
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Verilen Çuval Adedi</label>
            <div className="relative">
              <ArrowUpFromLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="number"
                value={outgoing}
                onChange={(e) => setOutgoing(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors"
            >
              Kaydet ve Bitir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
