import React from 'react';
import { Lead, Column } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Globe, ArrowRight, MapPin, Briefcase, Lightbulb, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { differenceInHours, parseISO } from 'date-fns';

interface DashboardProps {
  leads: Lead[];
  columns: Column[];
  onAcquireLeadClick?: () => void;
  onViewKanbanClick?: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  leads, 
  columns, 
  onAcquireLeadClick, 
  onViewKanbanClick 
}) => {
  // Calculate KPIs
  const totalValue = leads.reduce((sum, l) => sum + l.value, 0);
  const wonLeads = leads.filter(l => l.status === 'Won').length;
  const conversionRate = leads.length > 0 ? ((wonLeads / leads.length) * 100).toFixed(1) : '0.0';
  
  // Leads by status
  const statusDistribution = columns.map(col => ({
    name: col.title,
    count: leads.filter(l => l.status === col.id).length,
    value: leads.filter(l => l.status === col.id).reduce((sum, l) => sum + l.value, 0),
    color: col.color
  }));

  const leadCountByStatus = (statusId: string) => leads.filter((lead) => lead.status === statusId).length;
  const activePipelineCount = leads.filter((lead) => lead.status !== 'Won' && lead.status !== 'Lost').length;
  const offerSentCount = leadCountByStatus('OfferSent');
  const offerOpenedCount = leadCountByStatus('OfferOpened');
  const negotiatingCount = leadCountByStatus('Negotiating');
  const wonCount = leadCountByStatus('Won');

  const staleOfferSentLeads = leads.filter((lead) => {
    if (lead.status !== 'OfferSent' || !lead.offerSentAt) return false;
    return differenceInHours(new Date(), parseISO(lead.offerSentAt)) >= 24;
  });

  const smartActions = (() => {
    const actions: Array<{
      id: string;
      level: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      icon: React.ReactNode;
      badge: string;
      badgeClass: string;
      cardClass: string;
    }> = [];

    if (activePipelineCount < 5) {
      actions.push({
        id: 'pipeline-low',
        level: 'high',
        title: 'Lejek jest zbyt plytki',
        description: `Masz tylko ${activePipelineCount} aktywnych leadow. Warto przejac kolejny lead, aby zbudowac stabilniejszy pipeline na kolejne dni.`,
        icon: <AlertTriangle className="w-4 h-4" />,
        badge: 'Priorytet wysoki',
        badgeClass: 'bg-rose-100 text-rose-700',
        cardClass: 'border-rose-200 bg-rose-50/60',
      });
    }

    if (staleOfferSentLeads.length >= 2) {
      actions.push({
        id: 'offer-followup',
        level: 'high',
        title: 'Oferty wyslane bez otwarcia',
        description: `${staleOfferSentLeads.length} leadow ma status "Oferta wyslana" ponad 24h. Zaplanuj follow-up (np. telefon/mail), komunikacja zgodna z RODO: celowa, proporcjonalna i z jasna mozliwoscia rezygnacji.`,
        icon: <ShieldCheck className="w-4 h-4" />,
        badge: 'RODO + follow-up',
        badgeClass: 'bg-blue-100 text-blue-700',
        cardClass: 'border-blue-200 bg-blue-50/60',
      });
    }

    if (negotiatingCount >= 3 && wonCount === 0) {
      actions.push({
        id: 'negotiation-bottleneck',
        level: 'medium',
        title: 'Mozliwe waskie gardlo w negocjacjach',
        description: `W statusie "Negocjacje" jest ${negotiatingCount} leadow, a brak wygranych. Sprawdz obiekcje klientow i przygotuj gotowe odpowiedzi/oferty alternatywne.`,
        icon: <Lightbulb className="w-4 h-4" />,
        badge: 'Optymalizacja procesu',
        badgeClass: 'bg-amber-100 text-amber-700',
        cardClass: 'border-amber-200 bg-amber-50/60',
      });
    }

    if (offerSentCount > 0 && offerOpenedCount === 0) {
      actions.push({
        id: 'open-rate-zero',
        level: 'medium',
        title: 'Niska otwieralnosc ofert',
        description: 'Brak leadow ze statusem "Oferta otwarta". Warto przetestowac temat maila, godziny wysylki oraz krotsze intro w tresci.',
        icon: <TrendingDown className="w-4 h-4" />,
        badge: 'Testy komunikacji',
        badgeClass: 'bg-slate-100 text-slate-700',
        cardClass: 'border-slate-200 bg-slate-50/80',
      });
    }

    if (actions.length === 0) {
      actions.push({
        id: 'all-good',
        level: 'low',
        title: 'Lejek wyglada stabilnie',
        description: 'Brak krytycznych sygnalow. Kontynuuj regularne follow-upy i monitoruj czas leadow na statusach.',
        icon: <CheckCircle2 className="w-4 h-4" />,
        badge: 'Sytuacja dobra',
        badgeClass: 'bg-emerald-100 text-emerald-700',
        cardClass: 'border-emerald-200 bg-emerald-50/60',
      });
    }

    return actions.sort((a, b) => {
      const weight = { high: 0, medium: 1, low: 2 };
      return weight[a.level] - weight[b.level];
    });
  })();

  // Destinations stats
  const destinationStats = leads.reduce((acc: Record<string, { count: number; value: number }>, lead) => {
    const dest = lead.destination.split(' - ')[0]; // Get destination without duration
    if (!acc[dest]) acc[dest] = { count: 0, value: 0 };
    acc[dest].count++;
    acc[dest].value += lead.value;
    return acc;
  }, {});

  const topDestinations = Object.entries(destinationStats)
    .map(([name, stats]) => ({
      name,
      count: (stats as { count: number; value: number }).count,
      value: (stats as { count: number; value: number }).value
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Revenue trend (mock)
  const revenueTrend = [
    { week: 'Ty1', revenue: 45000 },
    { week: 'Ty2', revenue: 52000 },
    { week: 'Ty3', revenue: 48000 },
    { week: 'Ty4', revenue: 61000 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Pulpit Nawigacyjny Travel CRM</h1>
          <p className="text-slate-600">Przegląd leads'ów i statystyk sprzedaży</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Leads */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Ogółem Leads</h3>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{leads.length}</div>
            <p className="text-xs text-blue-600 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +3 w tym tygodniu
            </p>
          </div>

          {/* Total Value */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Całkowita Wartość</h3>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-emerald-600 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +12% vs zeszłym miesiącem
            </p>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Konwersja</h3>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{conversionRate}%</div>
            <p className="text-xs text-purple-600 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> {wonLeads} wygrane
            </p>
          </div>

          {/* Avg Deal Value */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Średnia Wartość</h3>
              <Briefcase className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(leads.length > 0 ? totalValue / leads.length : 0)}</div>
            <p className="text-xs text-orange-600 mt-2">Na jeden lead</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Trend */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Przychody - Trend Tygodniowy</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Rozkład Statusów</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution.filter(s => s.count > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name} (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Smart Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Podpowiedzi dla agenta
            </h2>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              Dynamiczne rekomendacje
            </span>
          </div>

          <div className="space-y-3">
            {smartActions.map((action) => (
              <div key={action.id} className={cn('rounded-lg border p-4', action.cardClass)}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 text-slate-800">
                    {action.icon}
                    <h3 className="font-semibold">{action.title}</h3>
                  </div>
                  <span className={cn('text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full', action.badgeClass)}>
                    {action.badge}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{action.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Destinations */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-500" />
              Top Destynacje
            </h2>
            <div className="space-y-4">
              {topDestinations.map((dest, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{dest.name}</p>
                      <p className="text-sm text-slate-500">{dest.count} zapytań</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(dest.value)}</p>
                    <p className="text-xs text-emerald-600">+{((dest.value / totalValue) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Szybkie Akcje</h2>
            <div className="space-y-3">
              <button
                onClick={onAcquireLeadClick}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Przejmij Leada
              </button>
              <button
                onClick={onViewKanbanClick}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Propozycje
              </button>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-3">Status Leads'ów</p>
                {statusDistribution.slice(0, 3).map((status, idx) => (
                  <div key={idx} className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-600">{status.name}</p>
                    <span className="text-sm font-semibold text-slate-900">{status.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
