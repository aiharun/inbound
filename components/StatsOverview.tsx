
import React from 'react';
import { WarehouseStats } from '../types';
import { Truck, Timer, Boxes, Hourglass, XCircle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface StatsOverviewProps {
  stats: WarehouseStats;
  isLoggedIn?: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, isLoggedIn = false }) => {
  const cards = [
    { 
        label: 'Gelecek Araç', 
        value: stats.waitingCount, 
        sub: 'Listeden Kalan', 
        icon: Hourglass, 
        color: 'rose' 
    },
    { 
        label: 'Gelen Araç', 
        value: stats.totalVehicles, 
        sub: 'Bugün', 
        icon: Truck, 
        color: 'orange' 
    },
    { 
        label: 'Toplam Adet', 
        value: stats.totalProducts.toLocaleString(), 
        sub: 'Birim İşlenen', 
        icon: Boxes, 
        color: 'emerald' 
    },
    { 
        label: 'İptal Edilen', 
        value: stats.canceledCount, 
        sub: 'Sefer İptali', 
        icon: XCircle, 
        color: 'red' 
    },
    { 
        label: 'Ort. İşlem Süresi', 
        value: `${stats.avgTurnaroundMinutes} dk`, 
        sub: 'Rampa - Çıkış', 
        icon: Timer, 
        color: 'slate',
        requiresLogin: true
    },
    { 
        label: 'Alınan Çuval', 
        value: stats.totalIncomingSacks.toLocaleString(), 
        sub: 'İndirilen', 
        icon: ArrowDownToLine, 
        color: 'blue' 
    },
    { 
        label: 'Verilen Çuval', 
        value: stats.totalOutgoingSacks.toLocaleString(), 
        sub: 'Yüklenen', 
        icon: ArrowUpFromLine, 
        color: 'purple' 
    },
  ];

  const visibleCards = cards.filter(c => !c.requiresLogin || isLoggedIn);
  
  // Grid Layout: 1 col mobile, 2 cols tablet, 4 cols desktop.
  // With 7 items (when logged in), 4 cols results in 4 items on row 1, and 3 items on row 2.
  const gridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8";

  return (
    <div className={gridClass}>
      {visibleCards.map((card, idx) => (
        <div key={idx} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{card.value}</h3>
            <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
          </div>
          <div className={`p-3 rounded-lg bg-${card.color}-50 text-${card.color}-600`}>
            <card.icon size={24} />
          </div>
        </div>
      ))}
    </div>
  );
};
