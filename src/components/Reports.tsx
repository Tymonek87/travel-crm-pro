import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, AnalyticsData, TaskReportItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { FileText, ChevronRight, BarChart2, Clock, DollarSign, Users, Target, Lightbulb, TrendingUp, TrendingDown, ClipboardList, Building2, Wallet, LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { differenceInHours, parseISO } from 'date-fns';

interface ReportsProps {
  leads: Lead[];
  analytics?: AnalyticsData;
  tasks?: TaskReportItem[];
}

type ReportType =
  | 'proposals-summary'
  | 'proposals-timing'
  | 'proposals-analytics'
  | 'tasks-summary'
  | 'tasks-by-user'
  | 'clients-portfolio'
  | 'finance-cashflow';

type ReportSection = 'proposals' | 'tasks' | 'clients' | 'finance';

interface ReportSectionConfig {
  id: ReportSection;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface ReportOption {
  id: ReportType;
  section: ReportSection;
  title: string;
  description: string;
  icon: LucideIcon;
  available: boolean;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  New: 'Nowe',
  OfferSent: 'Oferta Wysłana',
  OfferOpened: 'Oferta Otwarta',
  Negotiating: 'Negocjacje',
  Won: 'Wygrane',
  Lost: 'Przegrane'
};

const TASK_STATUS_LABELS: Record<TaskReportItem['status'], string> = {
  'new': 'Nowe',
  'in-progress': 'W trakcie',
  'completed': 'Ukonczone',
};

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#10b981', '#f43f5e'];

const REPORT_SECTIONS: ReportSectionConfig[] = [
  { id: 'proposals', title: 'Propozycje', description: 'Raporty dotyczace lejka i ofert', icon: FileText },
  { id: 'tasks', title: 'Zadania', description: 'Raporty operacyjne zespolu', icon: ClipboardList },
  { id: 'clients', title: 'Klienci', description: 'Raporty relacji i portfela', icon: Building2 },
  { id: 'finance', title: 'Finanse', description: 'Raporty przychodow i kosztow', icon: Wallet },
];

const SECTION_THEME: Record<
  ReportSection,
  { card: string; icon: string; badge: string; label: string }
> = {
  proposals: {
    card: 'bg-gradient-to-br from-blue-50 to-white border-blue-100',
    icon: 'bg-blue-100 text-blue-700',
    badge: 'bg-blue-100 text-blue-600',
    label: 'text-blue-500',
  },
  tasks: {
    card: 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100',
    icon: 'bg-emerald-100 text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-600',
    label: 'text-emerald-500',
  },
  clients: {
    card: 'bg-gradient-to-br from-amber-50 to-white border-amber-100',
    icon: 'bg-amber-100 text-amber-700',
    badge: 'bg-amber-100 text-amber-600',
    label: 'text-amber-500',
  },
  finance: {
    card: 'bg-gradient-to-br from-violet-50 to-white border-violet-100',
    icon: 'bg-violet-100 text-violet-700',
    badge: 'bg-violet-100 text-violet-600',
    label: 'text-violet-500',
  },
};

export const Reports: React.FC<ReportsProps> = ({ leads, analytics, tasks = [] }) => {
  const [activeReport, setActiveReport] = useState<ReportType>('proposals-summary');

  const reportOptions: ReportOption[] = [
    {
      id: 'proposals-summary',
      section: 'proposals',
      title: 'Podsumowanie etapow',
      description: 'Liczba i wartosc leadow',
      icon: BarChart2,
      available: true,
    },
    {
      id: 'proposals-timing',
      section: 'proposals',
      title: 'Czas na statusie',
      description: 'Sredni czas przebywania',
      icon: Clock,
      available: true,
    },
    {
      id: 'proposals-analytics',
      section: 'proposals',
      title: 'Analityka YoY',
      description: 'Rok do roku i trendy',
      icon: TrendingUp,
      available: Boolean(analytics),
    },
    {
      id: 'tasks-summary',
      section: 'tasks',
      title: 'Podsumowanie zadan',
      description: 'Statusy i realizacja',
      icon: ClipboardList,
      available: tasks.length > 0,
    },
    {
      id: 'tasks-by-user',
      section: 'tasks',
      title: 'Zadania per user',
      description: 'Obciazenie i statusy',
      icon: Users,
      available: tasks.length > 0,
    },
    {
      id: 'clients-portfolio',
      section: 'clients',
      title: 'Portfolio klientow',
      description: 'Segmenty i aktywnosc',
      icon: Building2,
      available: leads.length > 0,
    },
    {
      id: 'finance-cashflow',
      section: 'finance',
      title: 'Cashflow',
      description: 'Przychody i marza',
      icon: Wallet,
      available: leads.length > 0,
    },
  ];

  const activeReportConfig = reportOptions.find((r) => r.id === activeReport) ?? reportOptions[0];

  const getStatusLabel = (status: string) => {
    return STATUS_LABELS[status as LeadStatus] ?? status;
  };

  const summaryData = useMemo(() => {
    const stats = Object.keys(STATUS_LABELS).map((status) => {
      const filteredLeads = leads.filter(l => l.status === status);
      return {
        name: STATUS_LABELS[status as LeadStatus],
        count: filteredLeads.length,
        value: filteredLeads.reduce((sum, l) => sum + l.value, 0),
        status: status as LeadStatus
      };
    });
    return stats;
  }, [leads]);

  const timingData = useMemo(() => {
    const now = new Date();
    const statusPool = Array.from(new Set([...Object.keys(STATUS_LABELS), ...leads.map((lead) => String(lead.status))]));

    const getCurrentStatusStart = (lead: Lead): Date => {
      const statusEvents = lead.activities
        .filter((activity) => activity.type === 'StatusChanged' && activity.toStatus === lead.status)
        .sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());

      if (statusEvents.length > 0) {
        return parseISO(statusEvents[0].timestamp);
      }

      if (lead.status === 'OfferSent' && lead.offerSentAt) {
        return parseISO(lead.offerSentAt);
      }

      if (lead.lastActivityAt) {
        return parseISO(lead.lastActivityAt);
      }

      if (lead.createdAt) {
        return parseISO(lead.createdAt);
      }

      if (lead.activities.length > 0) {
        const first = [...lead.activities].sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime())[0];
        return parseISO(first.timestamp);
      }

      return now;
    };

    return statusPool
      .filter((status) => status !== 'Won' && status !== 'Lost')
      .map((status) => {
        const leadsInStatus = leads.filter((lead) => String(lead.status) === status);
        const durations = leadsInStatus.map((lead) => Math.max(0, differenceInHours(now, getCurrentStatusStart(lead))));
        const totalHours = durations.reduce((sum, value) => sum + value, 0);
        const avgHours = durations.length > 0 ? Math.round((totalHours / durations.length) * 10) / 10 : 0;
        const maxHours = durations.length > 0 ? Math.max(...durations) : 0;

        return {
          status,
          name: getStatusLabel(status),
          count: leadsInStatus.length,
          avgHours,
          maxHours,
        };
      })
      .sort((a, b) => b.avgHours - a.avgHours);
  }, [leads]);

  const bottleneckStatus = timingData.length > 0 ? timingData[0] : null;

  const tasksSummaryData = useMemo(() => {
    const statuses: TaskReportItem['status'][] = ['new', 'in-progress', 'completed'];
    return statuses.map((status) => ({
      status,
      name: TASK_STATUS_LABELS[status],
      count: tasks.filter((task) => task.status === status).length,
    }));
  }, [tasks]);

  const tasksByUserData = useMemo(() => {
    const grouped = tasks.reduce((acc, task) => {
      const user = task.assignedTo || 'Nieprzypisane';
      if (!acc[user]) acc[user] = [];
      acc[user].push(task);
      return acc;
    }, {} as Record<string, TaskReportItem[]>);

    return (Object.entries(grouped) as Array<[string, TaskReportItem[]]>)
      .map(([user, userTasks]) => ({
        user,
        total: userTasks.length,
        newCount: userTasks.filter((task) => task.status === 'new').length,
        inProgressCount: userTasks.filter((task) => task.status === 'in-progress').length,
        completedCount: userTasks.filter((task) => task.status === 'completed').length,
      }))
      .sort((a, b) => b.total - a.total);
  }, [tasks]);

  const clientsPortfolioData = useMemo(() => {
    const grouped = leads.reduce((acc, lead) => {
      if (!acc[lead.customerName]) {
        acc[lead.customerName] = { count: 0, value: 0 };
      }
      acc[lead.customerName].count += 1;
      acc[lead.customerName].value += lead.value;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    return (Object.entries(grouped) as Array<[string, { count: number; value: number }]>)
      .map(([customerName, metrics]) => ({
        customerName,
        leadsCount: metrics.count,
        totalValue: metrics.value,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);
  }, [leads]);

  const financeData = useMemo(() => {
    const wonValue = leads.filter((lead) => lead.status === 'Won').reduce((sum, lead) => sum + lead.value, 0);
    const pipelineValue = leads
      .filter((lead) => lead.status !== 'Lost' && lead.status !== 'Won')
      .reduce((sum, lead) => sum + lead.value, 0);
    const lostValue = leads.filter((lead) => lead.status === 'Lost').reduce((sum, lead) => sum + lead.value, 0);
    const total = wonValue + pipelineValue + lostValue;

    return {
      wonValue,
      pipelineValue,
      lostValue,
      total,
      wonShare: total > 0 ? Math.round((wonValue / total) * 100) : 0,
      pipelineShare: total > 0 ? Math.round((pipelineValue / total) * 100) : 0,
      lostShare: total > 0 ? Math.round((lostValue / total) * 100) : 0,
    };
  }, [leads]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 h-full">
      {/* Sidebar Selection */}
      <div className="w-full md:w-80 shrink-0 space-y-4">
        <div className="px-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Centrum raportow CJH</h3>
          <p className="text-[11px] text-slate-500 mt-1">Najpierw wybierz modul, potem konkretny raport.</p>
        </div>

        {REPORT_SECTIONS.map((section) => {
          const sectionReports = reportOptions.filter((report) => report.section === section.id);
          const SectionIcon = section.icon;
          const theme = SECTION_THEME[section.id];

          return (
            <div key={section.id} className={cn('rounded-2xl p-3 border', theme.card)}>
              <div className="flex items-start justify-between gap-3 px-2 pb-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className={cn('p-2 rounded-lg', theme.icon)}>
                  <SectionIcon className="w-4 h-4" />
                </div>
                <div>
                    <p className={cn('text-[10px] font-bold uppercase tracking-wider', theme.label)}>Modul</p>
                    <h4 className="text-sm font-semibold text-slate-900">{section.title}</h4>
                  <p className="text-[11px] text-slate-500">{section.description}</p>
                </div>
                </div>
                <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full', theme.badge)}>
                  Sekcja
                </span>
              </div>

              <div className="pt-2 space-y-1">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Raporty modulu</p>
                {sectionReports.map((report) => {
                  const isActive = activeReport === report.id;
                  const ReportIcon = report.icon;

                  return (
                    <button
                      key={report.id}
                      onClick={() => report.available && setActiveReport(report.id)}
                      disabled={!report.available}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-xl border transition-all',
                        isActive
                          ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100'
                          : 'bg-transparent border-transparent text-slate-600 hover:bg-white',
                        !report.available && 'opacity-60 cursor-not-allowed hover:bg-transparent'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500')}>
                          <ReportIcon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className={cn('font-semibold text-sm', isActive ? 'text-slate-900' : 'text-slate-700')}>{report.title}</div>
                          <div className="text-[10px] text-slate-500">{report.description}</div>
                        </div>
                      </div>
                      {report.available ? (
                        <ChevronRight className={cn('w-4 h-4 transition-transform', isActive ? 'translate-x-0 text-blue-600' : '-translate-x-2 opacity-0')} />
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Soon</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {!activeReportConfig.available && (
          <div className="p-8 h-full flex items-center justify-center">
            <div className="max-w-xl text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <activeReportConfig.icon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{activeReportConfig.title}</h2>
              <p className="text-sm text-slate-500 mt-2">
                Ten raport jest zaplanowany dla sekcji {REPORT_SECTIONS.find((s) => s.id === activeReportConfig.section)?.title}.
                Widok jest gotowy pod dalsze wdrozenie danych i eksportow.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase bg-amber-100 text-amber-700">
                W przygotowaniu
              </div>
            </div>
          </div>
        )}

        {activeReport === 'proposals-summary' && (
          <div className="p-8 space-y-8 flex-1 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Raport: Podsumowanie Etapów</h2>
                <p className="text-sm text-slate-500">Analiza rozkładu wolumenu i wartości finansowej w lejku.</p>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Suma Wartości</div>
                  <div className="text-lg font-bold text-blue-600">{formatCurrency(summaryData.reduce((s, i) => s + i.value, 0))}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Liczba Leadów</div>
                  <div className="text-lg font-bold text-slate-800">{leads.length}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" /> Rozkład Ilościowy
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fontSize: '12px' }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="count" name="Liczba Leadów" radius={[0, 4, 4, 0]}>
                        {summaryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> Rozkład Wartościowy
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summaryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {summaryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-xl border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Etap</th>
                    <th className="px-4 py-3 text-right">Liczba</th>
                    <th className="px-4 py-3 text-right">Wartość</th>
                    <th className="px-4 py-3 text-right">% Wartości</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {summaryData.map((item, idx) => {
                    const totalValue = summaryData.reduce((s, i) => s + i.value, 0);
                    const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-right">{item.count}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.value)}</td>
                        <td className="px-4 py-3 text-right text-slate-400">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport === 'proposals-timing' && (
          <div className="p-8 space-y-8 flex-1 flex flex-col">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Raport: Czas na Statusie</h2>
              <p className="text-sm text-slate-500">Średni czas (w godzinach) jaki lead spędza na danym etapie przed zmianą.</p>
            </div>

            <div className="flex-1 min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timingData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} axisLine={false} tickLine={false} style={{ fontSize: '12px' }} />
                  <YAxis axisLine={false} tickLine={false} label={{ value: 'Godziny', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700">
                            <div className="text-xs font-bold uppercase text-slate-400 mb-1">{payload[0].payload.name}</div>
                            <div className="text-lg font-bold">{payload[0].value} <span className="text-xs font-normal">godzin</span></div>
                            <div className="text-[10px] text-slate-400 mt-1 italic">Średni czas przebywania</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgHours" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40}>
                    {timingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.avgHours > 48 ? '#f43f5e' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4 items-start">
              <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-900">Wnioski z raportu</h4>
                <p className="text-xs text-blue-700 leading-relaxed mt-1">
                  Najdluzszy sredni czas przebywania odnotowano na etapie <strong>{bottleneckStatus ? bottleneckStatus.name : '-'}</strong> ({bottleneckStatus ? `${bottleneckStatus.avgHours}h` : '0h'}).
                  Taki etap moze byc potencjalnym waskim gardlem i wart go monitorowac.
                  Statusy oznaczone na <span className="text-rose-600 font-bold">czerwono</span> przekraczaja 48h.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'proposals-analytics' && analytics && (
          <div className="p-8 space-y-8 flex-1 overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Raport: Analityka i Trendy</h2>
              <p className="text-sm text-slate-500">Porównanie rok do roku oraz rekomendacje systemowe.</p>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 text-slate-500 mb-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium">Konwersja (Leady -&gt; Wygrane)</h3>
                </div>
                <div className="text-3xl font-bold text-slate-800">{analytics.conversionRate}%</div>
                <div className="text-sm text-emerald-600 flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" /> +2.1% vs zeszły miesiąc
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 text-slate-500 mb-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-medium">Średni czas decyzji</h3>
                </div>
                <div className="text-3xl font-bold text-slate-800">{analytics.avgDecisionTimeDays} dni</div>
                <div className="text-sm text-emerald-600 flex items-center mt-2">
                  <TrendingDown className="w-4 h-4 mr-1" /> -0.5 dnia (szybciej)
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-slate-200">
                <div className="flex items-center gap-3 text-indigo-700 mb-2">
                  <Lightbulb className="w-5 h-5" />
                  <h3 className="font-medium">Wskazówka AI</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Wykryto <strong>15% spadek</strong> otwarć ofert w weekendy. Rozważ automatyzację wysyłki na poniedziałek rano (godz. 8:00-10:00).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* YoY Chart */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 lg:col-span-2">
                <h3 className="font-semibold text-slate-800 mb-6 text-lg">Przychody: Rok do Roku (YoY)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.yoyRevenue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                      <RechartsTooltip 
                        formatter={(value: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(value)}
                        cursor={{fill: '#f1f5f9'}}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="previousYear" name="Poprzedni Rok" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="currentYear" name="Obecny Rok" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trending Destinations */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4 text-lg">Trendy Kierunków</h3>
                <div className="space-y-4">
                  {analytics.trendingDestinations.map((dest, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-white border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-slate-800">{dest.name}</span>
                        <span className={cn(
                          "text-sm font-semibold flex items-center px-2 py-1 rounded-full",
                          dest.growth > 0 ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"
                        )}>
                          {dest.growth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {Math.abs(dest.growth)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {dest.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'tasks-summary' && (
          <div className="p-8 space-y-8 flex-1 overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Raport: Podsumowanie zadan</h2>
              <p className="text-sm text-slate-500">Przekroj statusow oraz obciazenia zadan w systemie.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-xs uppercase text-slate-500 font-semibold">Liczba zadan</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{tasks.length}</p>
              </div>
              {tasksSummaryData.map((item) => (
                <div key={item.status} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <p className="text-xs uppercase text-slate-500 font-semibold">{item.name}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{item.count}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Rozklad statusow</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tasksSummaryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'tasks-by-user' && (
          <div className="p-8 space-y-8 flex-1 overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Raport: Zadania per user</h2>
              <p className="text-sm text-slate-500">Podzial zadan i statusow dla kazdej osoby.</p>
            </div>

            <div className="overflow-x-auto border rounded-xl border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3 text-right">Razem</th>
                    <th className="px-4 py-3 text-right">Nowe</th>
                    <th className="px-4 py-3 text-right">W trakcie</th>
                    <th className="px-4 py-3 text-right">Ukonczone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasksByUserData.map((row) => (
                    <tr key={row.user}>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.user}</td>
                      <td className="px-4 py-3 text-right">{row.total}</td>
                      <td className="px-4 py-3 text-right">{row.newCount}</td>
                      <td className="px-4 py-3 text-right">{row.inProgressCount}</td>
                      <td className="px-4 py-3 text-right">{row.completedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport === 'clients-portfolio' && (
          <div className="p-8 space-y-8 flex-1 overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Raport: Portfolio klientow</h2>
              <p className="text-sm text-slate-500">Top klienci wg lacznej wartosci zapytan.</p>
            </div>

            <div className="overflow-x-auto border rounded-xl border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Klient</th>
                    <th className="px-4 py-3 text-right">Liczba leadow</th>
                    <th className="px-4 py-3 text-right">Laczna wartosc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientsPortfolioData.map((row) => (
                    <tr key={row.customerName}>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.customerName}</td>
                      <td className="px-4 py-3 text-right">{row.leadsCount}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(row.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport === 'finance-cashflow' && (
          <div className="p-8 space-y-8 flex-1 overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Raport: Cashflow</h2>
              <p className="text-sm text-slate-500">Podzial wartosci leadow na wygrane, pipeline i utracone.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
                <p className="text-xs uppercase text-emerald-700 font-semibold">Wygrane</p>
                <p className="text-2xl font-bold text-emerald-900 mt-2">{formatCurrency(financeData.wonValue)}</p>
                <p className="text-xs text-emerald-700 mt-2">{financeData.wonShare}% calosci</p>
              </div>
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                <p className="text-xs uppercase text-blue-700 font-semibold">Pipeline</p>
                <p className="text-2xl font-bold text-blue-900 mt-2">{formatCurrency(financeData.pipelineValue)}</p>
                <p className="text-xs text-blue-700 mt-2">{financeData.pipelineShare}% calosci</p>
              </div>
              <div className="bg-rose-50 p-5 rounded-xl border border-rose-200">
                <p className="text-xs uppercase text-rose-700 font-semibold">Utracone</p>
                <p className="text-2xl font-bold text-rose-900 mt-2">{formatCurrency(financeData.lostValue)}</p>
                <p className="text-xs text-rose-700 mt-2">{financeData.lostShare}% calosci</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Struktura wartosci</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Wygrane', value: financeData.wonValue },
                        { name: 'Pipeline', value: financeData.pipelineValue },
                        { name: 'Utracone', value: financeData.lostValue },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f43f5e" />
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

