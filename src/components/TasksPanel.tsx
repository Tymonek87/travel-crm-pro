import React, { useState, useRef } from 'react';
import { Search, MoreVertical, Eye, X, UserPlus, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { TaskReportItem } from '../types';

interface DateRange {
  from: string;
  to: string;
}

type Task = TaskReportItem;

interface UserTaskReportGroup {
  assignee: string;
  tasks: Task[];
  statusCounts: Record<Task['status'], number>;
  tasksByStatus: Record<Task['status'], Task[]>;
}

type ReportType = 'general' | 'detailed';

const STATUS_ORDER: Task['status'][] = ['new', 'in-progress', 'completed'];

interface TasksPanelProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onAcquireLead: () => void;
  onAcquireReservation: () => void;
  leadPoolCount: number;
  reservationPoolCount: number;
}


const STATUS_LABELS = {
  'new': 'Nowe',
  'in-progress': 'W trakcie',
  'completed': 'Ukończone'
};

const STATUS_COLORS = {
  'new': 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  'completed': 'bg-emerald-100 text-emerald-700'
};

const PRIORITY_LABELS = {
  'low': 'Niski',
  'medium': 'Normalny',
  'high': 'Wysoki'
};

const PRIORITY_COLORS = {
  'low': 'text-slate-600',
  'medium': 'text-slate-600',
  'high': 'text-red-600'
};

export const TasksPanel: React.FC<TasksPanelProps> = ({
  tasks,
  onTasksChange,
  onAcquireLead,
  onAcquireReservation,
  leadPoolCount,
  reservationPoolCount,
}) => {
  const pad2 = (value: number) => String(value).padStart(2, '0');

  const formatLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    return `${year}-${month}-${day}`;
  };

  const parseTaskDateTime = (value: string) => {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?$/);

    if (match) {
      const [, y, m, d, hh = '00', mm = '00'] = match;
      return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), 0, 0);
    }

    return new Date(value);
  };

  const getStartOfDay = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  const getEndOfDay = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  };

  const formatLocalDateTimeKey = (date: Date) => {
    return `${formatLocalDateKey(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'in-progress' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  
  const [filterCreatedDateRange, setFilterCreatedDateRange] = useState<DateRange>({ from: '', to: '' });
  const [filterDueDateRange, setFilterDueDateRange] = useState<DateRange>({ from: '', to: '' });
  const [openDatePicker, setOpenDatePicker] = useState<'created' | 'due' | null>(null);
  const [tempDateRange, setTempDateRange] = useState<DateRange>({ from: '', to: '' });
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [selectedTaskPreview, setSelectedTaskPreview] = useState<string | null>(null);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskFormMode, setTaskFormMode] = useState<'create' | 'edit'>('create');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '00:00',
    assignedTo: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'new' as 'new' | 'in-progress' | 'completed',
  });
  
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('general');

  const updateTasks = (updater: Task[] | ((prev: Task[]) => Task[])) => {
    const nextTasks = typeof updater === 'function' ? updater(tasks) : updater;
    onTasksChange(nextTasks);
  };
  
  const createdDatePickerRef = useRef<HTMLDivElement>(null);
  const dueDatePickerRef = useRef<HTMLDivElement>(null);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.taskId.toString().includes(searchQuery);
    
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    const matchesAssignedTo = filterAssignedTo === '' || task.assignedTo.toLowerCase().includes(filterAssignedTo.toLowerCase());
    
    const createdDate = parseTaskDateTime(task.createdDate);
    const matchesCreatedDate = (!filterCreatedDateRange.from || createdDate >= getStartOfDay(filterCreatedDateRange.from)) &&
                               (!filterCreatedDateRange.to || createdDate <= getEndOfDay(filterCreatedDateRange.to));
    
    const dueDate = parseTaskDateTime(task.dueDate);
    const matchesDueDate = (!filterDueDateRange.from || dueDate >= getStartOfDay(filterDueDateRange.from)) &&
                           (!filterDueDateRange.to || dueDate <= getEndOfDay(filterDueDateRange.to));
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignedTo && matchesCreatedDate && matchesDueDate;
  });

  const handleOpenDatePicker = (type: 'created' | 'due') => {
    if (type === 'created') {
      setTempDateRange(filterCreatedDateRange);
    } else {
      setTempDateRange(filterDueDateRange);
    }
    setCalendarMonth(new Date());
    setSelectingStartDate(true);
    setOpenDatePicker(type);
  };

  const handleApplyDateRange = () => {
    if (openDatePicker === 'created') {
      setFilterCreatedDateRange(tempDateRange);
    } else if (openDatePicker === 'due') {
      setFilterDueDateRange(tempDateRange);
    }
    setOpenDatePicker(null);
  };

  const handleClearDateRange = (type: 'created' | 'due') => {
    if (type === 'created') {
      setFilterCreatedDateRange({ from: '', to: '' });
    } else if (type === 'due') {
      setFilterDueDateRange({ from: '', to: '' });
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const sundayBased = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return (sundayBased + 6) % 7;
  };

  const handleDateClick = (day: number) => {
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const dateStr = formatLocalDateKey(date);
    
    if (selectingStartDate) {
      setTempDateRange({ from: dateStr, to: '' });
      setSelectingStartDate(false);
    } else {
      const start = new Date(tempDateRange.from!);
      if (date < start) {
        setTempDateRange({ from: dateStr, to: tempDateRange.from });
      } else {
        setTempDateRange({ from: tempDateRange.from, to: dateStr });
      }
      setSelectingStartDate(true);
    }
  };

  const isDateInRange = (day: number) => {
    if (!tempDateRange.from) return false;
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const dateStr = formatLocalDateKey(date);
    
    return dateStr >= tempDateRange.from && (!tempDateRange.to || dateStr <= tempDateRange.to);
  };

  const handleOpenCreateTaskModal = () => {
    setTaskFormMode('create');
    setEditingTaskId(null);
    setTaskForm({
      title: '',
      description: '',
      dueDate: formatLocalDateKey(new Date()),
      dueTime: '00:00',
      assignedTo: '',
      priority: 'medium',
      status: 'new',
    });
    setShowTaskModal(true);
  };

  const handleOpenEditTaskModal = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setTaskFormMode('edit');
      setEditingTaskId(taskId);
      const [date, time] = task.dueDate.split(' ');
      setTaskForm({
        title: task.title,
        description: '',
        dueDate: date,
        dueTime: time,
        assignedTo: task.assignedTo,
        priority: task.priority,
        status: task.status,
      });
      setShowTaskModal(true);
    }
    setOpenActionMenu(null);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setEditingTaskId(null);
  };

  const handleTaskFormChange = (field: string, value: any) => {
    setTaskForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveTask = () => {
    if (!taskForm.title.trim()) {
      alert('Nazwa zadania jest wymagana');
      return;
    }

    if (taskFormMode === 'create') {
      const newTask: Task = {
        id: `T-${String(Math.random()).slice(2, 8)}`,
        taskId: Math.floor(Math.random() * 1000000),
        title: taskForm.title,
        status: taskForm.status,
        createdDate: formatLocalDateTimeKey(new Date()),
        dueDate: `${taskForm.dueDate} ${taskForm.dueTime}`,
        priority: taskForm.priority,
        client: '-',
        assignedTo: taskForm.assignedTo || '-',
      };
      updateTasks((prev) => [...prev, newTask]);
    } else if (taskFormMode === 'edit' && editingTaskId) {
      updateTasks((prev) => prev.map(t => 
        t.id === editingTaskId 
          ? {
              ...t,
              title: taskForm.title,
              status: taskForm.status,
              dueDate: `${taskForm.dueDate} ${taskForm.dueTime}`,
              priority: taskForm.priority,
              assignedTo: taskForm.assignedTo || '-',
            }
          : t
      ));
    }

    handleCloseTaskModal();
  };

  const formatDateRangeDisplay = (range: DateRange) => {
    if (!range.from && !range.to) return 'Wybierz zakres';
    if (range.from && range.to) {
      const from = getStartOfDay(range.from).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' });
      const to = getStartOfDay(range.to).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' });
      return `${from} - ${to}`;
    }
    if (range.from) {
      return getStartOfDay(range.from).toLocaleDateString('pl-PL');
    }
    return getStartOfDay(range.to!).toLocaleDateString('pl-PL');
  };

  const formatDateTime = (dateStr: string) => {
    const date = parseTaskDateTime(dateStr);
    return date.toLocaleString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getReportStats = () => {
    const totalTasks = tasks.length;
    const newTasks = tasks.filter(t => t.status === 'new').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    
    const lowPriority = tasks.filter(t => t.priority === 'low').length;
    const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const tasksByPerson: Record<string, number> = {};
    tasks.forEach(task => {
      if (task.assignedTo && task.assignedTo !== '-') {
        tasksByPerson[task.assignedTo] = (tasksByPerson[task.assignedTo] || 0) + 1;
      }
    });
    
    return {
      totalTasks,
      newTasks,
      inProgressTasks,
      completedTasks,
      lowPriority,
      mediumPriority,
      highPriority,
      completionRate,
      tasksByPerson,
    };
  };

  const getDetailedReportGroups = (): UserTaskReportGroup[] => {
    const groups = tasks.reduce((acc, task) => {
      const assignee = task.assignedTo && task.assignedTo !== '-' ? task.assignedTo : 'Nieprzypisane';

      if (!acc[assignee]) {
        acc[assignee] = {
          assignee,
          tasks: [],
          statusCounts: {
            'new': 0,
            'in-progress': 0,
            'completed': 0,
          },
          tasksByStatus: {
            'new': [],
            'in-progress': [],
            'completed': [],
          },
        };
      }

      acc[assignee].tasks.push(task);
      acc[assignee].statusCounts[task.status] += 1;
      acc[assignee].tasksByStatus[task.status].push(task);

      return acc;
    }, {} as Record<string, UserTaskReportGroup>);

    return (Object.values(groups) as UserTaskReportGroup[]).sort((a, b) => b.tasks.length - a.tasks.length);
  };

  const escapeHtml = (value: string) => {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const handleGeneratePdf = () => {
    const stats = getReportStats();
    const groups = getDetailedReportGroups();
    const generatedAt = new Date().toLocaleString('pl-PL');
    const reportTitle = reportType === 'general' ? 'Raport ogolny' : 'Raport szczegolowy';

    const generalSection = `
      <section>
        <h2>Podsumowanie</h2>
        <div class="grid">
          <div class="card"><span>Razem zadan</span><strong>${stats.totalTasks}</strong></div>
          <div class="card"><span>Nowe</span><strong>${stats.newTasks}</strong></div>
          <div class="card"><span>W trakcie</span><strong>${stats.inProgressTasks}</strong></div>
          <div class="card"><span>Ukonczone</span><strong>${stats.completedTasks}</strong></div>
          <div class="card"><span>Niski priorytet</span><strong>${stats.lowPriority}</strong></div>
          <div class="card"><span>Normalny priorytet</span><strong>${stats.mediumPriority}</strong></div>
          <div class="card"><span>Wysoki priorytet</span><strong>${stats.highPriority}</strong></div>
          <div class="card"><span>Procent ukonczenia</span><strong>${stats.completionRate}%</strong></div>
        </div>
      </section>
    `;

    const detailedSection = `
      <section>
        <h2>Lista zadan wg userow i statusu</h2>
        ${groups.map((group) => `
          <article class="user-block">
            <h3>${escapeHtml(group.assignee)} (${group.tasks.length})</h3>
            <p>Nowe: ${group.statusCounts.new} | W trakcie: ${group.statusCounts['in-progress']} | Ukonczone: ${group.statusCounts.completed}</p>
            ${STATUS_ORDER.map((status) => `
              <h4>${STATUS_LABELS[status]}</h4>
              ${group.tasksByStatus[status].length === 0 ? '<p class="muted">Brak zadan</p>' : `
                <table>
                  <thead>
                    <tr>
                      <th>Nr</th>
                      <th>Nazwa</th>
                      <th>Status</th>
                      <th>Termin</th>
                      <th>Priorytet</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${group.tasksByStatus[status].map((task) => `
                      <tr>
                        <td>${task.taskId}</td>
                        <td>${escapeHtml(task.title)}</td>
                        <td>${STATUS_LABELS[task.status]}</td>
                        <td>${escapeHtml(formatDateTime(task.dueDate))}</td>
                        <td>${PRIORITY_LABELS[task.priority]}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `}
            `).join('')}
          </article>
        `).join('')}
      </section>
    `;

    const html = `
      <!doctype html>
      <html lang="pl">
        <head>
          <meta charset="utf-8" />
          <title>${reportTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1, h2, h3, h4 { margin: 0 0 10px; }
            .meta { color: #475569; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
            .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
            .card span { font-size: 12px; color: #475569; }
            .card strong { font-size: 20px; }
            .user-block { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 14px; page-break-inside: avoid; }
            .muted { color: #64748b; font-size: 13px; margin: 0 0 10px; }
            table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; }
            th, td { border: 1px solid #e2e8f0; padding: 6px; font-size: 12px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <p class="meta">Wygenerowano: ${generatedAt}</p>
          ${generalSection}
          ${reportType === 'detailed' ? detailedSection : ''}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Nie mozna otworzyc okna drukowania. Sprawdz blokowanie popupow.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 150);
  };

  const reportStats = getReportStats();
  const detailedReportGroups = getDetailedReportGroups();

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">Zadania</h1>
        <div className="flex gap-3">
          <button
            onClick={onAcquireLead}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Przejmij Leada
            <span className="inline-flex min-w-6 h-6 px-2 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
              {leadPoolCount}
            </span>
          </button>
          <button
            onClick={onAcquireReservation}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Przejmij rezerwacje
            <span className="inline-flex min-w-6 h-6 px-2 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
              {reservationPoolCount}
            </span>
          </button>
          <button 
            onClick={() => {
              setReportType('general');
              setShowReport(true);
            }}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-full font-medium transition-colors text-sm">
            Raport zadań
          </button>
          <button 
            onClick={handleOpenCreateTaskModal}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors text-sm">
            + Utwórz zadanie
          </button>
        </div>
      </div>

      {/* Report View */}
      {showReport && (
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-wrap gap-3 items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                {reportType === 'general' ? 'Raport ogolny' : 'Raport szczegolowy'}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setReportType('general')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    reportType === 'general'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  Raport ogolny
                </button>
                <button
                  onClick={() => setReportType('detailed')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    reportType === 'detailed'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  Raport szczegolowy
                </button>
                <button
                  onClick={handleGeneratePdf}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Generuj PDF
                </button>
                <button
                  onClick={() => setShowReport(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Wroc do zadan
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">Razem zadan</p>
                <p className="text-3xl font-bold text-slate-900">{reportStats.totalTasks}</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">Procent ukonczenia</p>
                <p className="text-3xl font-bold text-emerald-600">{reportStats.completionRate}%</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">W trakcie</p>
                <p className="text-3xl font-bold text-blue-600">{reportStats.inProgressTasks}</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">Nowe</p>
                <p className="text-3xl font-bold text-slate-600">{reportStats.newTasks}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Rozklad statusow</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Nowe</span>
                    <div className="flex items-center gap-2">
                      <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-400"
                          style={{ width: `${reportStats.totalTasks > 0 ? (reportStats.newTasks / reportStats.totalTasks) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 w-8 text-right">{reportStats.newTasks}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">W trakcie</span>
                    <div className="flex items-center gap-2">
                      <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400"
                          style={{ width: `${reportStats.totalTasks > 0 ? (reportStats.inProgressTasks / reportStats.totalTasks) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 w-8 text-right">{reportStats.inProgressTasks}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Ukonczone</span>
                    <div className="flex items-center gap-2">
                      <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${reportStats.totalTasks > 0 ? (reportStats.completedTasks / reportStats.totalTasks) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 w-8 text-right">{reportStats.completedTasks}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Rozklad priorytetow</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Niski</span>
                    <div className="flex items-center gap-2">
                      <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-400"
                          style={{ width: `${reportStats.totalTasks > 0 ? (reportStats.lowPriority / reportStats.totalTasks) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 w-8 text-right">{reportStats.lowPriority}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Normalny</span>
                    <div className="flex items-center gap-2">
                      <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${reportStats.totalTasks > 0 ? (reportStats.mediumPriority / reportStats.totalTasks) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 w-8 text-right">{reportStats.mediumPriority}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Wysoki</span>
                    <div className="flex items-center gap-2">
                      <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400"
                          style={{ width: `${reportStats.totalTasks > 0 ? (reportStats.highPriority / reportStats.totalTasks) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 w-8 text-right">{reportStats.highPriority}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {Object.keys(reportStats.tasksByPerson).length > 0 && (
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Zadania per osoba</h3>
                <div className="space-y-3">
                  {Object.entries(reportStats.tasksByPerson).map(([person, count]) => (
                    <div key={person} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{person}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400"
                            style={{ width: `${reportStats.totalTasks > 0 ? (count / reportStats.totalTasks) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportType === 'detailed' && (
              <div className="mt-8 space-y-6">
                <h3 className="text-xl font-semibold text-slate-900">Lista zadan z podzialem na userow i status</h3>
                {detailedReportGroups.map((group) => (
                  <div key={group.assignee} className="bg-white rounded-lg border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <h4 className="text-lg font-semibold text-slate-900">{group.assignee}</h4>
                      <p className="text-sm text-slate-600">
                        Razem: {group.tasks.length} | Nowe: {group.statusCounts.new} | W trakcie: {group.statusCounts['in-progress']} | Ukonczone: {group.statusCounts.completed}
                      </p>
                    </div>

                    {STATUS_ORDER.map((status) => (
                      <div key={`${group.assignee}-${status}`} className="mb-5 last:mb-0">
                        <h5 className="text-sm font-semibold text-slate-700 mb-2">
                          {STATUS_LABELS[status]} ({group.tasksByStatus[status].length})
                        </h5>
                        {group.tasksByStatus[status].length === 0 ? (
                          <p className="text-sm text-slate-500">Brak zadan w tym statusie.</p>
                        ) : (
                          <div className="overflow-auto border border-slate-200 rounded-lg">
                            <table className="w-full border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Nr</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Nazwa</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Termin</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Priorytet</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {group.tasksByStatus[status].map((task) => (
                                  <tr key={task.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 text-sm text-slate-800">{task.taskId}</td>
                                    <td className="px-4 py-2 text-sm text-slate-800">{task.title}</td>
                                    <td className="px-4 py-2 text-sm text-slate-600">{STATUS_LABELS[task.status]}</td>
                                    <td className="px-4 py-2 text-sm text-slate-600">{formatDateTime(task.dueDate)}</td>
                                    <td className="px-4 py-2 text-sm text-slate-600">{PRIORITY_LABELS[task.priority]}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tasks View */}
      {!showReport && (
        <>
      {/* Filters */}
      <div className="relative p-6 border-b border-slate-200 bg-slate-50 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-xs max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Wyszukaj zadanie"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="all">Status</option>
            <option value="new">Nowe</option>
            <option value="in-progress">W trakcie</option>
            <option value="completed">Ukończone</option>
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Data utworzenia</label>
            <button
              onClick={() => handleOpenDatePicker('created')}
              ref={createdDatePickerRef}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white whitespace-nowrap"
            >
              {formatDateRangeDisplay(filterCreatedDateRange)}
            </button>
            {filterCreatedDateRange.from || filterCreatedDateRange.to ? (
              <button
                onClick={() => handleClearDateRange('created')}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Termin</label>
            <button
              onClick={() => handleOpenDatePicker('due')}
              ref={dueDatePickerRef}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white whitespace-nowrap"
            >
              {formatDateRangeDisplay(filterDueDateRange)}
            </button>
            {filterDueDateRange.from || filterDueDateRange.to ? (
              <button
                onClick={() => handleClearDateRange('due')}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="all">Priorytet</option>
            <option value="low">Niski</option>
            <option value="medium">Normalny</option>
            <option value="high">Wysoki</option>
          </select>

          <input
            type="text"
            placeholder="Osoba przypisana"
            value={filterAssignedTo}
            onChange={(e) => setFilterAssignedTo(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />

          <button className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors text-sm">
            Szukaj
          </button>
        </div>
      </div>

      {/* Date Range Picker Modal */}
      {openDatePicker && (
        <div 
          className="absolute bg-white rounded-lg shadow-2xl border border-slate-200 z-50"
          style={{
            top: openDatePicker === 'created' ? (createdDatePickerRef.current?.offsetTop ?? 0) + (createdDatePickerRef.current?.offsetHeight ?? 0) + 8 : 
                 (dueDatePickerRef.current?.offsetTop ?? 0) + (dueDatePickerRef.current?.offsetHeight ?? 0) + 8,
            left: openDatePicker === 'created' ? (createdDatePickerRef.current?.offsetLeft ?? 0) : (dueDatePickerRef.current?.offsetLeft ?? 0),
            width: '380px'
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900">
                  {tempDateRange.from ? (
                    new Date(tempDateRange.from).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  ) : (
                    'Wybierz datę'
                  )}
                  {tempDateRange.to && (
                    <> - {new Date(tempDateRange.to).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpenDatePicker(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Calendar */}
            <div className="p-3 bg-slate-50 rounded-lg">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 text-sm"
                >
                  ‹
                </button>
                <h4 className="text-center font-semibold text-slate-900 text-sm w-32">
                  {calendarMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
                </h4>
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 text-sm"
                >
                  ›
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-0.5 mb-2">
                {['PON', 'WTO', 'ŚRO', 'CZW', 'PIA', 'SOB', 'NIE'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-600 h-7 flex items-center justify-center">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: getFirstDayOfMonth(calendarMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-7"></div>
                ))}
                {Array.from({ length: getDaysInMonth(calendarMonth) }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                  const dateStr = formatLocalDateKey(date);
                  const isStart = dateStr === tempDateRange.from;
                  const isEnd = dateStr === tempDateRange.to;
                  const inRange = isDateInRange(day);

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={cn(
                        'h-7 rounded text-xs font-medium transition-colors',
                        isStart || isEnd ? 'bg-red-600 text-white' : inRange ? 'bg-red-100 text-red-700' : 'text-slate-700 hover:bg-slate-200'
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setTempDateRange({ from: '', to: '' });
                  setSelectingStartDate(true);
                }}
                className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded text-sm font-medium transition-colors"
              >
                Wyczyść
              </button>
              <button
                onClick={handleApplyDateRange}
                className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-sm font-medium transition-colors"
              >
                Potwierdź
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Preview Modal */}
      {selectedTaskPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-auto">
            {tasks.find(t => t.id === selectedTaskPreview) && (
              <>
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{tasks.find(t => t.id === selectedTaskPreview)?.title}</h2>
                      <p className="text-sm text-slate-500 mt-1">ID: {tasks.find(t => t.id === selectedTaskPreview)?.taskId}</p>
                    </div>
                    <button
                      onClick={() => setSelectedTaskPreview(null)}
                      className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Status and Priority */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                      <span className={cn("px-3 py-1.5 rounded-full text-sm font-medium inline-block", STATUS_COLORS[tasks.find(t => t.id === selectedTaskPreview)?.status || 'new'])}>
                        {STATUS_LABELS[tasks.find(t => t.id === selectedTaskPreview)?.status || 'new']}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Priorytet</label>
                      <span className={cn("font-medium", PRIORITY_COLORS[tasks.find(t => t.id === selectedTaskPreview)?.priority || 'low'])}>
                        {PRIORITY_LABELS[tasks.find(t => t.id === selectedTaskPreview)?.priority || 'low']}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Data utworzenia</label>
                      <p className="text-slate-600">{formatDateTime(tasks.find(t => t.id === selectedTaskPreview)?.createdDate || '')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Termin</label>
                      <p className="text-slate-600">{formatDateTime(tasks.find(t => t.id === selectedTaskPreview)?.dueDate || '')}</p>
                    </div>
                  </div>

                  {/* Assignment */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Klient</label>
                      <p className="text-slate-600">{tasks.find(t => t.id === selectedTaskPreview)?.client || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Przypisane do</label>
                      <p className="text-slate-600">{tasks.find(t => t.id === selectedTaskPreview)?.assignedTo || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-200 flex gap-3">
                  <button
                    onClick={() => setSelectedTaskPreview(null)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                  >
                    Zamknij
                  </button>
                  <button
                    onClick={() => {
                      if (selectedTaskPreview) {
                        handleOpenEditTaskModal(selectedTaskPreview);
                      }
                      setSelectedTaskPreview(null);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Edytuj
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <table className="w-full border-collapse rounded-lg overflow-hidden border border-slate-200">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nr zadania</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nazwa</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Data utworzenia</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Termin</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Priorytet</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Klient</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Osoba przypisana</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredTasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{task.taskId}</td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-slate-900 underline hover:text-blue-600 font-medium transition-colors">
                    {task.title}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium", STATUS_COLORS[task.status])}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {formatDateTime(task.createdDate)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {formatDateTime(task.dueDate)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={cn("font-medium", PRIORITY_COLORS[task.priority])}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {task.client && task.client !== '-' ? (
                    <button className="text-slate-900 underline hover:text-blue-600 font-medium transition-colors">
                      {task.client}
                    </button>
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {task.assignedTo}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 relative">
                    <div className="relative">
                      <button 
                        onClick={() => setOpenActionMenu(openActionMenu === task.id ? null : task.id)}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openActionMenu === task.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-40">
                          <button
                            onClick={() => handleOpenEditTaskModal(task.id)}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-200 transition-colors"
                          >
                            Edytuj
                          </button>
                          <button
                            onClick={() => {
                              updateTasks((prev) => prev.filter(t => t.id !== task.id));
                              setOpenActionMenu(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Usuń
                          </button>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedTaskPreview(task.id)}
                      className="p-2 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {taskFormMode === 'create' ? 'Nowe zadanie' : 'Edycja zadania'}
              </h2>
              <button
                onClick={handleCloseTaskModal}
                className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-96 overflow-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">* Nazwa</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => handleTaskFormChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">* Opis</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => handleTaskFormChange('description', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-20 resize-none"
                />
              </div>

              {/* Due Date and Time on same row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Termin</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => handleTaskFormChange('dueDate', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Godzina</label>
                  <input
                    type="time"
                    value={taskForm.dueTime}
                    onChange={(e) => handleTaskFormChange('dueTime', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Assigned Person */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">* Osoba przypisana</label>
                <input
                  type="text"
                  value={taskForm.assignedTo}
                  onChange={(e) => handleTaskFormChange('assignedTo', e.target.value)}
                  placeholder="Wpisz imię i nazwisko"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Assign to me link */}
              <div>
                <button
                  onClick={() => handleTaskFormChange('assignedTo', 'Ja')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Przypisz do mnie
                </button>
              </div>

              {/* Priority and Status on same row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">* Priorytet</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => handleTaskFormChange('priority', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="low">Niski</option>
                    <option value="medium">Normalny</option>
                    <option value="high">Wysoki</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">* Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => handleTaskFormChange('status', e.target.value as any)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="new">Nowe</option>
                    <option value="in-progress">W trakcie</option>
                    <option value="completed">Ukończone</option>
                  </select>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Załączniki</label>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  + Dodaj załącznik
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={handleCloseTaskModal}
                className="px-6 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveTask}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                {taskFormMode === 'create' ? 'Utwórz zadanie' : 'Edytuj zadanie'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 text-lg">Brak zadań spełniających kryteria</p>
            <p className="text-slate-400 text-sm mt-1">Zmień filtry i spróbuj ponownie</p>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
