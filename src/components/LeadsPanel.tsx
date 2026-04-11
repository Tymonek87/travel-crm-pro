import React from 'react';
import { Users, ListChecks, Clock3 } from 'lucide-react';
import { Lead } from '../types';

type LeadPoolItem = Omit<Lead, 'id' | 'status' | 'activities' | 'trackingId'>;

interface LeadsPanelProps {
  leads: Lead[];
  leadPool: LeadPoolItem[];
}

export const LeadsPanel: React.FC<LeadsPanelProps> = ({ leads, leadPool }) => {
  const waitingForOpen = leads.filter((lead) => lead.status === 'OfferSent').length;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Leady</h2>
            <p className="text-slate-500 mt-1">Pula leadow dostepnych do przejecia przez agentow.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Users className="w-4 h-4" />
              Aktywne leady
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{leads.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <ListChecks className="w-4 h-4" />
              Leady w puli
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{leadPool.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Clock3 className="w-4 h-4" />
              Oferty wyslane
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{waitingForOpen}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Pula leadow</h3>
          </div>
          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Klient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Kierunek</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Wartosc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leadPool.map((lead, index) => (
                  <tr key={`${lead.customerName}_${index}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{lead.customerName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{lead.destination}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(lead.value)}
                    </td>
                  </tr>
                ))}
                {leadPool.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-500">
                      Brak leadow w puli.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
