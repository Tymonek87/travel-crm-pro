import React, { useEffect, useState } from 'react';
import { Lead, Column, TaskReportItem } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Globe,
  ArrowRight,
  MapPin,
  Briefcase,
  Lightbulb,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { differenceInHours, parseISO } from 'date-fns';

interface DashboardProps {
  leads: Lead[];
  columns: Column[];
  tasks: TaskReportItem[];
  canViewAgencySummary: boolean;
  onAcquireLeadClick?: () => void;
  onViewKanbanClick?: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

type DashboardView = 'personal' | 'agency';

export const Dashboard: React.FC<DashboardProps> = ({
  leads,
  columns,
  tasks,
  canViewAgencySummary,
  onAcquireLeadClick,
  onViewKanbanClick,
}) => {
  const [activeView, setActiveView] = useState<DashboardView>('personal');
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  const parseSafeDueDate = (value: unknown): Date | null => {
    if (typeof value !== 'string' || value.trim() === '') return null;
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  useEffect(() => {
    if (!canViewAgencySummary && activeView === 'agency') {
      setActiveView('personal');
    }
  }, [canViewAgencySummary, activeView]);

  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const wonLeads = leads.filter((lead) => lead.status === 'Won').length;
  const conversionRate = leads.length > 0 ? ((wonLeads / leads.length) * 100).toFixed(1) : '0.0';

  const statusDistribution = sortedColumns.map((column) => ({
    name: column.title,
    count: leads.filter((lead) => lead.status === column.id).length,
    value: leads.filter((lead) => lead.status === column.id).reduce((sum, lead) => sum + lead.value, 0),
    color: column.color,
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
        description: `Masz tylko ${activePipelineCount} aktywnych leadow. Warto przejac kolejny lead, aby utrzymac stabilny pipeline.`,
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
        description: `${staleOfferSentLeads.length} leadow ma status "Oferta wyslana" ponad 24h. Zaplanuj follow-up i sprawdz kanal kontaktu.`,
        icon: <ShieldCheck className="w-4 h-4" />,
        badge: 'Follow-up',
        badgeClass: 'bg-blue-100 text-blue-700',
        cardClass: 'border-blue-200 bg-blue-50/60',
      });
    }

    if (negotiatingCount >= 3 && wonCount === 0) {
      actions.push({
        id: 'negotiation-bottleneck',
        level: 'medium',
        title: 'Waskie gardlo w negocjacjach',
        description: `W statusie "Negocjacje" jest ${negotiatingCount} leadow, a brak wygranych. Warto przeanalizowac obiekcje klientow.`,
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
        description: 'Brak leadow ze statusem "Oferta otwarta". Przetestuj temat maila i godziny wysylki.',
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

  const destinationStats = leads.reduce((acc: Record<string, { count: number; value: number }>, lead) => {
    const destination = lead.destination.split(' - ')[0];
    if (!acc[destination]) acc[destination] = { count: 0, value: 0 };
    acc[destination].count += 1;
    acc[destination].value += lead.value;
    return acc;
  }, {});

  const topDestinations = Object.entries(destinationStats)
    .map(([name, stats]) => ({ name, count: stats.count, value: stats.value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const revenueTrend = [
    { week: 'Ty1', revenue: 45000 },
    { week: 'Ty2', revenue: 52000 },
    { week: 'Ty3', revenue: 48000 },
    { week: 'Ty4', revenue: 61000 },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(value);

  const now = new Date();
  const agentSummary = Object.values(
    safeTasks.reduce((acc, task) => {
      const agentName = typeof task.assignedTo === 'string' && task.assignedTo.trim() ? task.assignedTo.trim() : 'Nieprzypisane';
      const dueDate = parseSafeDueDate(task.dueDate);
      const isOverdue = dueDate !== null && dueDate < now && task.status !== 'completed';

      if (!acc[agentName]) {
        acc[agentName] = { agentName, total: 0, completed: 0, inProgress: 0, newCount: 0, overdue: 0 };
      }

      acc[agentName].total += 1;
      if (task.status === 'completed') acc[agentName].completed += 1;
      if (task.status === 'in-progress') acc[agentName].inProgress += 1;
      if (task.status === 'new') acc[agentName].newCount += 1;
      if (isOverdue) acc[agentName].overdue += 1;

      return acc;
    }, {} as Record<string, { agentName: string; total: number; completed: number; inProgress: number; newCount: number; overdue: number }>)
  )
    .map((agent) => ({
      ...agent,
      completionRate: agent.total > 0 ? Math.round((agent.completed / agent.total) * 100) : 0,
    }))
    .sort((a, b) => b.completed - a.completed || b.completionRate - a.completionRate);

  const agencyTotals = {
    agents: agentSummary.length,
    tasks: safeTasks.length,
    completed: safeTasks.filter((task) => task.status === 'completed').length,
    overdue: safeTasks.filter((task) => {
      const dueDate = parseSafeDueDate(task.dueDate);
      return dueDate !== null && dueDate < now && task.status !== 'completed';
    }).length,
  };
  const agencyCompletionRate = agencyTotals.tasks > 0 ? Math.round((agencyTotals.completed / agencyTotals.tasks) * 100) : 0;

  const salesColumns = sortedColumns.filter((column) => (column.stage || 'sales') === 'sales');
  const proposalStages = salesColumns.map((column) => {
    const stageLeads = leads.filter((lead) => lead.status === column.id);
    const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);

    return {
      statusId: column.id,
      label: column.title,
      count: stageLeads.length,
      value: stageValue,
      wonLike: !!column.isWon,
      lostLike: !!column.isLost,
    };
  });

  const proposalsCount = proposalStages.reduce((sum, stage) => sum + stage.count, 0);
  const proposalsValue = proposalStages.reduce((sum, stage) => sum + stage.value, 0);
  const wonProposals = proposalStages.filter((stage) => stage.wonLike).reduce((sum, stage) => sum + stage.count, 0);
  const wonProposalsValue = proposalStages.filter((stage) => stage.wonLike).reduce((sum, stage) => sum + stage.value, 0);
  const lostProposals = proposalStages.filter((stage) => stage.lostLike).reduce((sum, stage) => sum + stage.count, 0);
  const wonStatusesCount = proposalStages.filter((stage) => stage.wonLike).length;
  const lostStatusesCount = proposalStages.filter((stage) => stage.lostLike).length;
  const activeProposals = proposalStages
    .filter((stage) => !stage.wonLike && !stage.lostLike)
    .reduce((sum, stage) => sum + stage.count, 0);
  const proposalCloseRate = proposalsCount > 0 ? Math.round((wonProposals / proposalsCount) * 100) : 0;
  const journeyStageSummary = {
    sales: leads.filter((lead) => (lead.journeyStage || 'sales') === 'sales').length,
    preTrip: leads.filter((lead) => lead.journeyStage === 'pre_trip').length,
    postTrip: leads.filter((lead) => lead.journeyStage === 'post_trip').length,
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Pulpit Nawigacyjny Travel CRM</h1>
          <p className="text-slate-600">Przeglad leadow i statystyk sprzedazy</p>
        </div>
        {canViewAgencySummary && (
          <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 gap-1">
            <button
              onClick={() => setActiveView('personal')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                activeView === 'personal' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              Moj pulpit
            </button>
            <button
              onClick={() => setActiveView('agency')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                activeView === 'agency' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              Agencja
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Ogolna liczba leadow</h3>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{leads.length}</div>
            <p className="text-xs text-blue-600 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +3 w tym tygodniu
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Calkowita wartosc</h3>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-emerald-600 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +12% vs poprzedni miesiac
            </p>
          </div>

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

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Srednia wartosc</h3>
              <Briefcase className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(leads.length > 0 ? totalValue / leads.length : 0)}</div>
            <p className="text-xs text-orange-600 mt-2">Na jeden lead</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Przychody - trend tygodniowy</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <RechartsTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Rozklad statusow</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution.filter((status) => status.count > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name} (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {activeView === 'personal' && (
          <>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-blue-500" />
                  Top destynacje
                </h2>
                <div className="space-y-4">
                  {topDestinations.map((destination) => (
                    <div key={destination.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{destination.name}</p>
                          <p className="text-sm text-slate-500">{destination.count} zapytan</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatCurrency(destination.value)}</p>
                        <p className="text-xs text-emerald-600">
                          +{totalValue > 0 ? ((destination.value / totalValue) * 100).toFixed(0) : '0'}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Szybkie akcje</h2>
                <div className="space-y-3">
                  <button
                    onClick={onAcquireLeadClick}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Przejmij leada
                  </button>
                  <button
                    onClick={onViewKanbanClick}
                    className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Propozycje
                  </button>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-3">Status leadow</p>
                    {statusDistribution.slice(0, 3).map((status) => (
                      <div key={status.name} className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-600">{status.name}</p>
                        <span className="text-sm font-semibold text-slate-900">{status.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeView === 'agency' && canViewAgencySummary && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Aktywni agenci</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{agencyTotals.agents}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Zadania w agencji</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{agencyTotals.tasks}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Skutecznosc</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{agencyCompletionRate}%</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Zadania opoznione</p>
                <p className="mt-2 text-3xl font-bold text-rose-600">{agencyTotals.overdue}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Etap: sprzedaz</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{journeyStageSummary.sales}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Etap: przed wyjazdem</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{journeyStageSummary.preTrip}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Etap: po powrocie</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{journeyStageSummary.postTrip}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-semibold text-slate-900">Propozycje i sprzedaz</h2>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  Fokus managerski
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                  <p className="text-sm text-slate-500">Propozycje lacznie</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{proposalsCount}</p>
                  <p className="text-xs text-slate-600 mt-1">{formatCurrency(proposalsValue)}</p>
                </div>
                <div className="rounded-xl border border-blue-200 p-4 bg-blue-50">
                  <p className="text-sm text-blue-700">Aktywne propozycje</p>
                  <p className="mt-2 text-2xl font-bold text-blue-900">{activeProposals}</p>
                  <p className="text-xs text-blue-700 mt-1">Do dalszego domkniecia</p>
                </div>
                <div className="rounded-xl border border-emerald-200 p-4 bg-emerald-50">
                  <p className="text-sm text-emerald-700">Wygrane propozycje</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-800">{wonProposals}</p>
                  <p className="text-xs text-emerald-700 mt-1">{formatCurrency(wonProposalsValue)}</p>
                </div>
                <div className="rounded-xl border border-amber-200 p-4 bg-amber-50">
                  <p className="text-sm text-amber-700">Skutecznosc propozycji</p>
                  <p className="mt-2 text-2xl font-bold text-amber-900">{proposalCloseRate}%</p>
                  <p className="text-xs text-amber-700 mt-1">Wygrane / wszystkie propozycje</p>
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-slate-200 p-4 bg-slate-50">
                <p className="text-xs text-slate-600">
                  Statusy i ich kolejnosc sa pobierane dynamicznie z konfiguracji administracyjnej.
                  Status koncowy wygranej/przegranej jest liczony na podstawie flag ustawionych w module Administracja.
                  Skonfigurowane statusy koncowe: wygrane <span className="font-semibold text-slate-800">{wonStatusesCount}</span>, przegrane{' '}
                  <span className="font-semibold text-slate-800">{lostStatusesCount}</span>. Aktualnie przegrane propozycje:{' '}
                  <span className="font-semibold text-slate-800">{lostProposals}</span>.
                </p>
              </div>

              <div className="overflow-x-auto border rounded-xl border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Status propozycji</th>
                      <th className="px-4 py-3 text-right">Liczba</th>
                      <th className="px-4 py-3 text-right">Wartosc</th>
                      <th className="px-4 py-3 text-right">Udzial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proposalStages.map((stage) => (
                      <tr key={stage.statusId}>
                        <td className="px-4 py-3 font-medium text-slate-900">{stage.label}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{stage.count}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(stage.value)}</td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {proposalsCount > 0 ? `${Math.round((stage.count / proposalsCount) * 100)}%` : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Podsumowanie pracy agentow</h2>
              {agentSummary.length === 0 ? (
                <p className="text-sm text-slate-500">Brak danych o zadaniach agentow.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Agent</th>
                        <th className="px-4 py-3 text-right">Wszystkie</th>
                        <th className="px-4 py-3 text-right">Nowe</th>
                        <th className="px-4 py-3 text-right">W trakcie</th>
                        <th className="px-4 py-3 text-right">Ukonczone</th>
                        <th className="px-4 py-3 text-right">Opoznione</th>
                        <th className="px-4 py-3 text-right">Skutecznosc</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {agentSummary.map((agent) => (
                        <tr key={agent.agentName}>
                          <td className="px-4 py-3 font-medium text-slate-900">{agent.agentName}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{agent.total}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{agent.newCount}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{agent.inProgress}</td>
                          <td className="px-4 py-3 text-right text-emerald-700 font-semibold">{agent.completed}</td>
                          <td className="px-4 py-3 text-right text-rose-700 font-semibold">{agent.overdue}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{agent.completionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
