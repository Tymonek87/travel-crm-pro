import React, { useEffect, useMemo, useState } from 'react';
import { mockLeads, mockAnalytics, defaultColumns, mockTasks, mockLeadPool } from './data/mockData';
import { KanbanBoard } from './components/KanbanBoard';
import { TrackingSimulator } from './components/TrackingSimulator';
import { CodeViewer } from './components/CodeViewer';
import { NewLeadModal } from './components/NewLeadModal';
import { LeadDetailsModal } from './components/LeadDetailsModal';
import { Reports } from './components/Reports';
import { AdminPanel, ModulePermissions } from './components/AdminPanel';
import { Dashboard } from './components/Dashboard';
import { ClientsPanel } from './components/ClientsPanel';
import { TasksPanel } from './components/TasksPanel';
import { NotificationsPanel } from './components/NotificationsPanel';
import { LeadsPanel } from './components/LeadsPanel';
import { CampaignsPanel } from './components/CampaignsPanel';
import { Plane, LayoutDashboard, BarChart3, Code2, Plus, ChevronLeft, ChevronRight, Menu, FileText, Settings, Layout, Users, CheckCircle2, Bell, UserRoundSearch, Megaphone } from 'lucide-react';
import { Lead, LeadStatus, Column, TaskReportItem, JourneyStage } from './types';
import { formatISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { DropResult } from '@hello-pangea/dnd';
import { cn } from './lib/utils';
import { filterLeadsByProposalFilters } from './features/proposals/filters';
import { getColumnsForStage, getFirstStatusForStage, JOURNEY_STAGE_LABELS } from './features/journey/stageUtils';
import { buildTask, formatLocalDateTime, getDueDateAtHour, splitDateTime } from './features/tasks/taskFactory';

type Tab = 'dashboard' | 'clients' | 'leads' | 'kanban' | 'tasks' | 'campaigns' | 'notifications' | 'reports' | 'admin' | 'architecture';
type LeadPoolItem = Omit<Lead, 'id' | 'status' | 'activities' | 'trackingId'>;
type ProposalsView = 'kanban' | 'table';
type ReservationPoolItem = {
  customerName: string;
  reservationId: string;
};

const mockReservationPool: ReservationPoolItem[] = [
  { customerName: 'Olga Wysocka', reservationId: 'RES-10492' },
  { customerName: 'Jakub Kozak', reservationId: 'RES-11807' },
  { customerName: 'Marta Piasecka', reservationId: 'RES-12341' },
  { customerName: 'Damian Laskowski', reservationId: 'RES-12988' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [leads, setLeads] = useState<Lead[]>(mockLeads.map((lead) => ({ ...lead, journeyStage: lead.journeyStage || 'sales' })));
  const [tasks, setTasks] = useState<TaskReportItem[]>(mockTasks);
  const [leadPool, setLeadPool] = useState<LeadPoolItem[]>(mockLeadPool);
  const [reservationPool, setReservationPool] = useState<ReservationPoolItem[]>(mockReservationPool);
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAutoTaskModal, setShowAutoTaskModal] = useState(false);
  const [autoTaskEditId, setAutoTaskEditId] = useState<string | null>(null);
  const [autoTaskSource, setAutoTaskSource] = useState<'lead' | 'reservation'>('lead');
  const [proposalsView, setProposalsView] = useState<ProposalsView>('kanban');
  const [activeJourneyStage, setActiveJourneyStage] = useState<JourneyStage>('sales');
  const [proposalDirection, setProposalDirection] = useState('');
  const [proposalMinValue, setProposalMinValue] = useState('');
  const [proposalMaxValue, setProposalMaxValue] = useState('');
  const [proposalDepartureFrom, setProposalDepartureFrom] = useState('');
  const [proposalDepartureTo, setProposalDepartureTo] = useState('');
  const [modulePermissions, setModulePermissions] = useState<ModulePermissions>({
    leads: true,
    campaigns: true,
    managerDashboard: false,
  });
  const [autoTaskForm, setAutoTaskForm] = useState({
    title: '',
    dueDate: '',
    dueTime: '10:00',
    assignedTo: 'Ja',
    priority: 'medium' as TaskReportItem['priority'],
    status: 'new' as TaskReportItem['status'],
  });

  // Symulacja kliknięcia w link przez klienta (SignalR / Web API mock)
  const handleSimulateClick = (trackingId: string) => {
    setLeads(currentLeads => 
      currentLeads.map(lead => {
        if (lead.trackingId === trackingId && lead.status === 'OfferSent') {
          const nowIso = formatISO(new Date());
          return {
            ...lead,
            status: 'OfferOpened',
            lastActivityAt: nowIso,
            activities: [
              ...lead.activities,
              {
                id: `status_${Date.now()}`,
                type: 'StatusChanged',
                timestamp: nowIso,
                fromStatus: 'OfferSent',
                toStatus: 'OfferOpened',
                details: 'Automatyczna zmiana statusu po kliknieciu w link'
              },
              {
                id: `sim_${Date.now() + 1}`,
                type: 'LinkClicked',
                timestamp: nowIso,
                details: 'Symulowane kliknięcie w link'
              }
            ]
          };
        }
        return lead;
      })
    );
  };

  const handleAddLead = (newLeadData: Omit<Lead, 'id' | 'status' | 'activities' | 'trackingId'>) => {
    const nowIso = formatISO(new Date());
    const initialStatus = getFirstStatusForStage(columns, 'sales');
    const newLead: Lead = {
      ...newLeadData,
      id: `L-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      journeyStage: 'sales',
      status: initialStatus,
      createdAt: nowIso,
      activities: [
        {
          id: `act_${Date.now()}`,
          type: 'NoteAdded',
          timestamp: nowIso,
          details: 'Lead przejety przez agenta.'
        }
      ],
      trackingId: `trk_${Math.random().toString(36).substring(2, 8)}`
    };
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleAcquireLead = () => {
    if (leadPool.length === 0) {
      alert('Brak leadow w puli do przejecia.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * leadPool.length);
    const pickedLead = leadPool[randomIndex];
    if (!pickedLead) return;

    setLeadPool((prev) => prev.filter((_, idx) => idx !== randomIndex));

    const now = new Date();
    const nowIso = formatISO(now);
    const initialStatus = getFirstStatusForStage(columns, 'sales');
    const newLeadId = `L-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const trackingId = `trk_${Math.random().toString(36).substring(2, 8)}`;

    const newLead: Lead = {
      ...pickedLead,
      id: newLeadId,
      journeyStage: 'sales',
      status: initialStatus,
      createdAt: nowIso,
      activities: [
        {
          id: `act_${Date.now()}`,
          type: 'NoteAdded',
          timestamp: nowIso,
          details: 'Lead przejety automatycznie z puli systemowej.'
        }
      ],
      trackingId
    };

    setLeads((prev) => [newLead, ...prev]);

    const createdDate = formatLocalDateTime(now);
    const dueDate = getDueDateAtHour(now, 1);
    const followUpTask = buildTask({
      title: `Kontakt z klientem: ${pickedLead.customerName}`,
      client: pickedLead.customerName,
      createdDate,
      dueDate,
    });

    setTasks((prev) => [followUpTask, ...prev]);
    setAutoTaskSource('lead');
    setAutoTaskEditId(followUpTask.id);
    const taskDateTime = splitDateTime(dueDate);
    setAutoTaskForm({
      title: followUpTask.title,
      dueDate: taskDateTime.date,
      dueTime: taskDateTime.time,
      assignedTo: followUpTask.assignedTo,
      priority: followUpTask.priority,
      status: followUpTask.status,
    });
    setShowAutoTaskModal(true);
  };

  const handleAcquireReservation = () => {
    if (reservationPool.length === 0) {
      alert('Brak rezerwacji do przejecia z Resabee.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * reservationPool.length);
    const pickedReservation = reservationPool[randomIndex];
    if (!pickedReservation) return;
    setReservationPool((prev) => prev.filter((_, idx) => idx !== randomIndex));

    const now = new Date();
    const createdDate = formatLocalDateTime(now);
    const dueDate = getDueDateAtHour(now, 1);
    const reservationTask = buildTask({
      title: `Rezerwacja Kontakt z klientem: ${pickedReservation.customerName}`,
      client: pickedReservation.customerName,
      createdDate,
      dueDate,
    });

    setTasks((prev) => [reservationTask, ...prev]);
    setAutoTaskSource('reservation');
    setAutoTaskEditId(reservationTask.id);
    const reservationDateTime = splitDateTime(dueDate);
    setAutoTaskForm({
      title: reservationTask.title,
      dueDate: reservationDateTime.date,
      dueTime: reservationDateTime.time,
      assignedTo: reservationTask.assignedTo,
      priority: reservationTask.priority,
      status: reservationTask.status,
    });
    setShowAutoTaskModal(true);

    alert(`Zasymulowano nadpisanie rezerwacji ${pickedReservation.reservationId} w systemie Resabee.`);
  };

  const closeAutoTaskModal = () => {
    setShowAutoTaskModal(false);
    setAutoTaskEditId(null);
  };

  const handleSaveAutoTask = () => {
    if (!autoTaskEditId) return;
    if (!autoTaskForm.title.trim()) {
      alert('Nazwa zadania jest wymagana.');
      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === autoTaskEditId
          ? {
              ...task,
              title: autoTaskForm.title.trim(),
              dueDate: `${autoTaskForm.dueDate} ${autoTaskForm.dueTime}`,
              assignedTo: autoTaskForm.assignedTo || 'Ja',
              priority: autoTaskForm.priority,
              status: autoTaskForm.status,
            }
          : task
      )
    );

    closeAutoTaskModal();
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as LeadStatus;
    const destinationColumn = columns.find((column) => column.id === newStatus);
    if (!destinationColumn) return;
    let generatedStageTask: TaskReportItem | null = null;

    setLeads(prevLeads => {
      const updatedLeads = [...prevLeads];
      const leadIndex = updatedLeads.findIndex(l => l.id === draggableId);

      if (leadIndex !== -1) {
        const lead = updatedLeads[leadIndex];
        const currentStage = lead.journeyStage || 'sales';
        const destinationStage = destinationColumn.stage || 'sales';
        if (currentStage !== destinationStage) {
          return updatedLeads;
        }
        const oldStatus = lead.status;
        const nowIso = formatISO(new Date());
        const nextActivities = [
          ...lead.activities,
          {
            id: `status_${Date.now()}`,
            type: 'StatusChanged' as const,
            timestamp: nowIso,
            fromStatus: oldStatus,
            toStatus: newStatus,
            details: `Zmiana statusu: ${oldStatus} -> ${newStatus}`
          },
          {
            id: `move_${Date.now() + 1}`,
            type: 'NoteAdded' as const,
            timestamp: nowIso,
            details: `Zmiana statusu: ${oldStatus} -> ${newStatus} (Drag & Drop)`
          }
        ];

        let nextLead: Lead = {
          ...lead,
          status: newStatus,
          lastActivityAt: nowIso,
          activities: nextActivities,
        };

        if (currentStage === 'sales' && destinationColumn.isWon) {
          const preTripFirstStatus = getFirstStatusForStage(columns, 'pre_trip');
          if (preTripFirstStatus) {
            const departureDate = lead.departureDate || formatISO(new Date(Date.now() + 1000 * 60 * 60 * 24 * 30));
            const returnDate = lead.returnDate || formatISO(new Date(Date.now() + 1000 * 60 * 60 * 24 * 37));
            nextLead = {
              ...nextLead,
              journeyStage: 'pre_trip',
              status: preTripFirstStatus,
              departureDate,
              returnDate,
              activities: [
                ...nextActivities,
                {
                  id: `stage_${Date.now() + 2}`,
                  type: 'StatusChanged',
                  timestamp: nowIso,
                  fromStatus: newStatus,
                  toStatus: preTripFirstStatus,
                  details: 'Automatyczne przejscie do etapu przed wyjazdem po sprzedazy.',
                },
              ],
            };

            const now = new Date();
            const createdDate = formatLocalDateTime(now);
            const dueDate = getDueDateAtHour(now, 1);
            generatedStageTask = buildTask({
              title: `Dosprzedaz uslug przed wyjazdem: ${lead.customerName}`,
              client: lead.customerName,
              createdDate,
              dueDate,
            });
          }
        }

        updatedLeads[leadIndex] = nextLead;
      }

      return updatedLeads;
    });

    if (generatedStageTask) {
      setTasks((prev) => [generatedStageTask as TaskReportItem, ...prev]);
    }
  };

  useEffect(() => {
    if (activeTab === 'leads' && !modulePermissions.leads) {
      setActiveTab('dashboard');
    }
    if (activeTab === 'campaigns' && !modulePermissions.campaigns) {
      setActiveTab('dashboard');
    }
  }, [activeTab, modulePermissions]);

  useEffect(() => {
    const postTripFirstStatus = getFirstStatusForStage(columns, 'post_trip');
    if (!postTripFirstStatus) return;

    const movedLeads: Lead[] = [];
    const now = new Date();
    const nowIso = formatISO(now);

    setLeads((prevLeads) => {
      let hasChanges = false;
      const updatedLeads = prevLeads.map((lead) => {
        if ((lead.journeyStage || 'sales') !== 'pre_trip' || !lead.returnDate) {
          return lead;
        }

        const returnDate = new Date(lead.returnDate);
        if (Number.isNaN(returnDate.getTime()) || returnDate > now) {
          return lead;
        }

        hasChanges = true;
        movedLeads.push(lead);
        return {
          ...lead,
          journeyStage: 'post_trip',
          status: postTripFirstStatus,
          lastActivityAt: nowIso,
          activities: [
            ...lead.activities,
            {
              id: `post_trip_${Date.now()}_${lead.id}`,
              type: 'StatusChanged',
              timestamp: nowIso,
              fromStatus: lead.status,
              toStatus: postTripFirstStatus,
              details: 'Automatyczne przejscie do etapu po powrocie klienta.',
            },
          ],
        };
      });

      return hasChanges ? updatedLeads : prevLeads;
    });

    if (movedLeads.length > 0) {
      const createdDate = formatLocalDateTime(now);
      const dueDate = getDueDateAtHour(now, 2);
      const followUpTasks: TaskReportItem[] = movedLeads.map((lead) =>
        buildTask({
          title: `Ankieta po powrocie: ${lead.customerName}`,
          client: lead.customerName,
          createdDate,
          dueDate,
        })
      );

      setTasks((prev) => [...followUpTasks, ...prev]);
    }
  }, [leads, columns]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { id: 'clients', label: 'Klienci', icon: Users },
    { id: 'leads', label: 'Leady', icon: UserRoundSearch },
    { id: 'kanban', label: 'Propozycje', icon: LayoutDashboard },
    { id: 'tasks', label: 'Zadania', icon: CheckCircle2 },
    { id: 'campaigns', label: 'Kampanie', icon: Megaphone },
    { id: 'notifications', label: 'Powiadomienia', icon: Bell },
    { id: 'reports', label: 'Raporty', icon: FileText },
    { id: 'admin', label: 'Administracja', icon: Settings },
    { id: 'architecture', label: 'Architektura .NET', icon: Code2 },
  ].filter((item) => {
    if (item.id === 'leads') return modulePermissions.leads;
    if (item.id === 'campaigns') return modulePermissions.campaigns;
    return true;
  });

  const stageColumns = useMemo(() => getColumnsForStage(columns, activeJourneyStage), [columns, activeJourneyStage]);
  const stageLeads = useMemo(
    () => leads.filter((lead) => (lead.journeyStage || 'sales') === activeJourneyStage),
    [leads, activeJourneyStage]
  );
  const filteredStageLeads = useMemo(
    () =>
      filterLeadsByProposalFilters(stageLeads, {
        direction: proposalDirection,
        minValue: proposalMinValue,
        maxValue: proposalMaxValue,
        departureFrom: proposalDepartureFrom,
        departureTo: proposalDepartureTo,
      }),
    [stageLeads, proposalDirection, proposalMinValue, proposalMaxValue, proposalDepartureFrom, proposalDepartureTo]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        className="bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-20 shadow-sm"
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 overflow-hidden shrink-0">
          <div className="flex items-center gap-3 min-w-max">
            <div className="bg-blue-600 p-2 rounded-lg shrink-0">
              <Plane className="w-5 h-5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold text-slate-800 tracking-tight whitespace-nowrap"
              >
                CJH
              </motion.h1>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => setActiveTab(item.id as Tab)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                  activeTab === item.id 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 shrink-0 transition-colors",
                  activeTab === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                )} />
                {!isSidebarCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-30">
                    {item.label}
                  </div>
                )}
              </button>

              {item.id === 'kanban' && activeTab === 'kanban' && !isSidebarCollapsed && (
                <div className="ml-8 mt-1 space-y-1">
                  {(['sales', 'pre_trip', 'post_trip'] as JourneyStage[]).map((stage) => (
                    <button
                      key={stage}
                      onClick={() => {
                        setActiveTab('kanban');
                        setActiveJourneyStage(stage);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        activeJourneyStage === stage
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      {JOURNEY_STAGE_LABELS[stage]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer / Collapse Toggle */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Zwiń menu</span>
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <main className="flex-1 overflow-hidden flex flex-col relative">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto"
              >
                <Dashboard 
                  leads={leads} 
                  columns={columns}
                  tasks={tasks}
                  canViewAgencySummary={modulePermissions.managerDashboard}
                  onAcquireLeadClick={handleAcquireLead}
                  onViewKanbanClick={() => setActiveTab('kanban')}
                />
              </motion.div>
            )}

            {activeTab === 'kanban' && (
              <motion.div 
                key="kanban"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8 w-full"
              >
                <div className="mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Lejek sprzedazowy</h2>
                    <p className="text-slate-500 mt-1">Zarzadzaj etapem: {JOURNEY_STAGE_LABELS[activeJourneyStage]}.</p>
                    <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 gap-1">
                      <button
                        onClick={() => setProposalsView('kanban')}
                        className={cn(
                          'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                          proposalsView === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                        )}
                      >
                        Kanban
                      </button>
                      <button
                        onClick={() => setProposalsView('table')}
                        className={cn(
                          'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                          proposalsView === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                        )}
                      >
                        Tabela
                      </button>
                    </div>
                    <button 
                      onClick={handleAcquireLead}
                      className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                      Przejmij Leada
                    </button>
                  </div>
                  <TrackingSimulator leads={filteredStageLeads} onSimulateClick={handleSimulateClick} />
                </div>
                <div className="mb-5 p-4 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3 gap-3">
                    <h3 className="text-sm font-semibold text-slate-800">Filtry propozycji</h3>
                    <div className="text-xs text-slate-500">
                      Wyniki: <span className="font-semibold text-slate-700">{filteredStageLeads.length}</span> / {stageLeads.length}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                    <input
                      type="text"
                      value={proposalDirection}
                      onChange={(e) => setProposalDirection(e.target.value)}
                      placeholder="Kierunek (np. Grecja)"
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      min="0"
                      value={proposalMinValue}
                      onChange={(e) => setProposalMinValue(e.target.value)}
                      placeholder="Min wartosc"
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      min="0"
                      value={proposalMaxValue}
                      onChange={(e) => setProposalMaxValue(e.target.value)}
                      placeholder="Max wartosc"
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Termin wyjazdu od</label>
                      <input
                        type="date"
                        value={proposalDepartureFrom}
                        onChange={(e) => setProposalDepartureFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Termin wyjazdu do</label>
                      <input
                        type="date"
                        value={proposalDepartureTo}
                        onChange={(e) => setProposalDepartureTo(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        setProposalDirection('');
                        setProposalMinValue('');
                        setProposalMaxValue('');
                        setProposalDepartureFrom('');
                        setProposalDepartureTo('');
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      Wyczysc filtry
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  {proposalsView === 'kanban' ? (
                    <KanbanBoard 
                      leads={filteredStageLeads} 
                      columns={stageColumns}
                      onLeadClick={setSelectedLead} 
                      onDragEnd={handleDragEnd}
                    />
                  ) : (
                    <div className="h-full overflow-auto bg-white rounded-xl border border-slate-200">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Klient</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Kierunek</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Wartosc</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Ostatnia aktywnosc</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Akcje</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredStageLeads.map((lead) => {
                            const statusLabel = stageColumns.find((col) => col.id === lead.status)?.title || lead.status;
                            return (
                              <tr key={lead.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-medium text-slate-900">{lead.customerName}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{lead.destination}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{statusLabel}</td>
                                <td className="px-4 py-3 text-sm text-slate-900 text-right">
                                  {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(lead.value)}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">{lead.lastActivityAt ? new Date(lead.lastActivityAt).toLocaleString('pl-PL') : '-'}</td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => setSelectedLead(lead)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                                  >
                                    Szczegoly
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredStageLeads.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                                Brak propozycji spelniajacych aktualne filtry w etapie {JOURNEY_STAGE_LABELS[activeJourneyStage]}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'clients' && (
              <motion.div 
                key="clients"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <ClientsPanel />
              </motion.div>
            )}

            {activeTab === 'leads' && modulePermissions.leads && (
              <motion.div
                key="leads"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <LeadsPanel
                  leads={leads}
                  leadPool={leadPool}
                />
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div 
                key="tasks"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <TasksPanel
                  tasks={tasks}
                  onTasksChange={setTasks}
                  onAcquireLead={handleAcquireLead}
                  onAcquireReservation={handleAcquireReservation}
                  leadPoolCount={leadPool.length}
                  reservationPoolCount={reservationPool.length}
                />
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div 
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <NotificationsPanel />
              </motion.div>
            )}

            {activeTab === 'campaigns' && modulePermissions.campaigns && (
              <motion.div
                key="campaigns"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <CampaignsPanel />
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
              >
                <div className="mb-8 max-w-6xl mx-auto">
                  <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Centrum Raportowe</h2>
                  <p className="text-slate-500 mt-1">Szczegółowe zestawienia danych i wydajności lejka.</p>
                </div>
                <Reports leads={leads} analytics={mockAnalytics} tasks={tasks} />
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div 
                key="admin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
              >
                <div className="mb-8 max-w-4xl mx-auto">
                  <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Ustawienia Systemowe</h2>
                  <p className="text-slate-500 mt-1">Konfiguracja struktury lejka i parametrów CRM.</p>
                </div>
                <AdminPanel
                  columns={columns}
                  onUpdateColumns={setColumns}
                  modulePermissions={modulePermissions}
                  onModulePermissionsChange={setModulePermissions}
                />
              </motion.div>
            )}

            {activeTab === 'architecture' && (
              <motion.div 
                key="architecture"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-900"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Implementacja Backend (.NET 8)</h2>
                    <p className="text-slate-400 mt-1">Modele Entity Framework, Background Service dla automatyzacji oraz kontroler śledzący.</p>
                  </div>
                  <CodeViewer />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <NewLeadModal 
        isOpen={isNewLeadModalOpen} 
        onClose={() => setIsNewLeadModalOpen(false)} 
        onAdd={handleAddLead} 
      />

      <LeadDetailsModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
      />

      {showAutoTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {autoTaskSource === 'lead' ? 'Nowe zadanie po przejeciu leada' : 'Nowe zadanie po przejeciu rezerwacji'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {autoTaskSource === 'lead'
                  ? 'Zweryfikuj szczegoly i nanies ewentualne zmiany.'
                  : 'Zweryfikuj zadanie utworzone po synchronizacji z Resabee i nanies ewentualne zmiany.'}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nazwa zadania</label>
                <input
                  type="text"
                  value={autoTaskForm.title}
                  onChange={(e) => setAutoTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Termin</label>
                  <input
                    type="date"
                    value={autoTaskForm.dueDate}
                    onChange={(e) => setAutoTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Godzina</label>
                  <input
                    type="time"
                    value={autoTaskForm.dueTime}
                    onChange={(e) => setAutoTaskForm((prev) => ({ ...prev, dueTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priorytet</label>
                  <select
                    value={autoTaskForm.priority}
                    onChange={(e) => setAutoTaskForm((prev) => ({ ...prev, priority: e.target.value as TaskReportItem['priority'] }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="low">Niski</option>
                    <option value="medium">Normalny</option>
                    <option value="high">Wysoki</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={autoTaskForm.status}
                    onChange={(e) => setAutoTaskForm((prev) => ({ ...prev, status: e.target.value as TaskReportItem['status'] }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="new">Nowe</option>
                    <option value="in-progress">W trakcie</option>
                    <option value="completed">Ukonczone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Przypisane do</label>
                  <input
                    type="text"
                    value={autoTaskForm.assignedTo}
                    onChange={(e) => setAutoTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={closeAutoTaskModal}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 text-sm font-medium"
              >
                Zamknij
              </button>
              <button
                onClick={handleSaveAutoTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Zapisz zadanie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



