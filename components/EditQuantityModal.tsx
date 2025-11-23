
import React, { useState, useEffect } from 'react';
import { X, Package, Save, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface EditQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (count: number, incomingSacks: number, outgoingSacks: number) => void;
  currentQuantity: number;
  currentIncomingSacks: number;
  currentOutgoingSacks: number;
  hideSackFields?: boolean;
}

export const EditQuantityModal: React.FC<EditQuantityModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    currentQuantity,
    currentIncomingSacks,
    currentOutgoingSacks,
    hideSackFields = false
}) => {
  const [count, setCount] = useState<string>('');
  const [incoming, setIncoming] = useState<string>('');
  const [outgoing, setOutgoing] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCount(currentQuantity.toString());
      setIncoming(currentIncomingSacks.toString());
      setOutgoing(currentOutgoingSacks.toString());
    }
  }, [isOpen, currentQuantity, currentIncomingSacks, currentOutgoingSacks]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(count);
    const inc = incoming ? parseInt(incoming) : 0;
    const out = outgoing ? parseInt(outgoing) : 0;

    if (!isNaN(val) && val >= 0) {
      onSave(val, inc, out);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-orange-600" size={24} />
            {hideSackFields ? 'Yük Adedi Düzenle' : 'Yük & Çuval Düzenle'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Yük Adedi</label>
                <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xl font-mono font-bold text-center text-slate-800"
                    autoFocus
                    min="0"
                />
            </div>

            {!hideSackFields && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                            <ArrowDownToLine size={12} className="text-blue-500" /> Alınan Çuval
                        </label>
                        <input
                            type="number"
                            value={incoming}
                            onChange={(e) => setIncoming(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center"
                            placeholder="0"
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                            <ArrowUpFromLine size={12} className="text-purple-500" /> Verilen Çuval
                        </label>
                        <input
                            type="number"
                            value={outgoing}
                            onChange={(e) => setOutgoing(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-center"
                            placeholder="0"
                            min="0"
                        />
                    </div>
                </div>
            )}

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
                    className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Save size={18} />
                    Güncelle
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
