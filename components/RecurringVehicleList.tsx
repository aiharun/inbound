import React from 'react';
import { Vehicle } from '../types';
import { Repeat, TrendingUp } from 'lucide-react';

interface RecurringVehicleListProps {
  vehicles: Vehicle[];
}

export const RecurringVehicleList: React.FC<RecurringVehicleListProps> = ({ vehicles }) => {
  // Filter vehicles that have made more than 1 trip
  const recurringVehicles = vehicles.filter(v => v.tripCount > 1);

  // Sort by trip count (descending) then by latest arrival
  const sortedVehicles = [...recurringVehicles].sort((a, b) => {
    if (b.tripCount !== a.tripCount) return b.tripCount - a.tripCount;
    return new Date(b.arrivalTime).getTime() - new Date(a.arrivalTime).getTime();
  });

  if (sortedVehicles.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                <Repeat size={18} />
            </div>
            <div>
                <h2 className="font-semibold text-indigo-900">Mükerrer Sefer Listesi</h2>
                <p className="text-xs text-indigo-500">Bugün birden fazla giriş yapan araçlar</p>
            </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
            <TrendingUp size={12} />
            {sortedVehicles.length} Araç
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-3">Plaka</th>
              <th className="px-6 py-3">Toplam Sefer</th>
              <th className="px-6 py-3">Son Giriş Saati</th>
              <th className="px-6 py-3">Son Durum</th>
              <th className="px-6 py-3">Toplam Yük (Son)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-50">
            {sortedVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-indigo-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 font-mono">{vehicle.licensePlate}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                        {vehicle.tripCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {new Date(vehicle.arrivalTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {vehicle.status === 'COMPLETED' ? 'Çıkış Yaptı' : 'İçeride'}
                  </td>
                  <td className="px-6 py-4">{vehicle.productCount}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};