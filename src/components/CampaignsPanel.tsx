import React from 'react';
import { Megaphone, PlayCircle, PauseCircle, CheckCircle2 } from 'lucide-react';

type CampaignStatus = 'active' | 'planned' | 'completed';

interface Campaign {
  id: string;
  name: string;
  channel: string;
  targetGroup: string;
  budget: number;
  status: CampaignStatus;
  startDate: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: 'K-001',
    name: 'Wakacje Lato 2026',
    channel: 'Email + SMS',
    targetGroup: 'Rodziny 30-45',
    budget: 12000,
    status: 'active',
    startDate: '2026-04-01'
  },
  {
    id: 'K-002',
    name: 'City Break Premium',
    channel: 'Meta Ads',
    targetGroup: 'Single 25-40',
    budget: 7500,
    status: 'planned',
    startDate: '2026-04-20'
  },
  {
    id: 'K-003',
    name: 'Egzotyka First Minute',
    channel: 'Google Ads',
    targetGroup: 'Klienci VIP',
    budget: 18000,
    status: 'completed',
    startDate: '2026-02-10'
  }
];

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  active: { label: 'Aktywna', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  planned: { label: 'Zaplanowana', className: 'text-blue-700 bg-blue-50 border-blue-200' },
  completed: { label: 'Zakonczona', className: 'text-slate-700 bg-slate-100 border-slate-200' }
};

export const CampaignsPanel: React.FC = () => {
  const activeCount = mockCampaigns.filter((campaign) => campaign.status === 'active').length;
  const plannedCount = mockCampaigns.filter((campaign) => campaign.status === 'planned').length;
  const completedCount = mockCampaigns.filter((campaign) => campaign.status === 'completed').length;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Kampanie</h2>
          <p className="text-slate-500 mt-1">Planowanie i monitoring kampanii sprzedazowych w jednym miejscu.</p>
          <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold">
            Modul w budowie: wymaga dostosowania do obecnych standardow.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <PlayCircle className="w-4 h-4" />
              Kampanie aktywne
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <PauseCircle className="w-4 h-4" />
              Kampanie planowane
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{plannedCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Kampanie zakonczone
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{completedCount}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Lista kampanii</h3>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
              <Megaphone className="w-4 h-4" />
              Nowa kampania
            </button>
          </div>

          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Nazwa</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Kanal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Grupa docelowa</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Budzet</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Start</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {mockCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{campaign.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{campaign.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{campaign.channel}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{campaign.targetGroup}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(campaign.budget)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(campaign.startDate).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${statusConfig[campaign.status].className}`}>
                        {statusConfig[campaign.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
