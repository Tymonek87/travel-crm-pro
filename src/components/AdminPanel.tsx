import React, { useEffect, useMemo, useState } from 'react';
import { Column } from '../types';
import { Settings, Plus, GripVertical, Trash2, Save, Shield, Users, X, Edit3 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '../lib/utils';

interface AdminPanelProps {
  columns: Column[];
  onUpdateColumns: (columns: Column[]) => void;
  modulePermissions: ModulePermissions;
  onModulePermissionsChange: (permissions: ModulePermissions) => void;
}

type AdminSection = 'statuses' | 'permissions';
type StatusModalMode = 'create' | 'edit';

interface StatusFormState {
  title: string;
  color: string;
}

interface PermissionRule {
  module: string;
  admin: boolean;
  manager: boolean;
  agent: boolean;
  viewer: boolean;
}

export interface ModulePermissions {
  leads: boolean;
  campaigns: boolean;
}

const COLOR_OPTIONS = [
  { label: 'Slate', value: 'bg-slate-100' },
  { label: 'Blue', value: 'bg-blue-50' },
  { label: 'Indigo', value: 'bg-indigo-50' },
  { label: 'Purple', value: 'bg-purple-50' },
  { label: 'Emerald', value: 'bg-emerald-50' },
  { label: 'Rose', value: 'bg-rose-50' },
  { label: 'Amber', value: 'bg-amber-50' },
  { label: 'Cyan', value: 'bg-cyan-50' },
];

const PERMISSION_RULES: PermissionRule[] = [
  { module: 'Leady', admin: true, manager: true, agent: true, viewer: true },
  { module: 'Kampanie', admin: true, manager: true, agent: true, viewer: true },
  { module: 'Zadania', admin: true, manager: true, agent: true, viewer: true },
  { module: 'Raporty', admin: true, manager: true, agent: false, viewer: true },
  { module: 'Administracja', admin: true, manager: false, agent: false, viewer: false },
  { module: 'Powiadomienia', admin: true, manager: true, agent: true, viewer: true },
];

const DraggableAny = Draggable as any;

export const AdminPanel: React.FC<AdminPanelProps> = ({
  columns,
  onUpdateColumns,
  modulePermissions,
  onModulePermissionsChange,
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('statuses');
  const [localColumns, setLocalColumns] = useState<Column[]>([...columns].sort((a, b) => a.order - b.order));
  const [localModulePermissions, setLocalModulePermissions] = useState<ModulePermissions>(modulePermissions);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalMode, setStatusModalMode] = useState<StatusModalMode>('create');
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [statusForm, setStatusForm] = useState<StatusFormState>({
    title: '',
    color: COLOR_OPTIONS[0].value,
  });

  const statusCount = useMemo(() => localColumns.length, [localColumns]);

  useEffect(() => {
    setLocalModulePermissions(modulePermissions);
  }, [modulePermissions]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localColumns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    if (!reorderedItem) return;
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => Object.assign({}, item, { order: index })) as Column[];
    setLocalColumns(updatedItems);
  };

  const openCreateStatusModal = () => {
    setStatusModalMode('create');
    setEditingStatusId(null);
    setStatusForm({ title: '', color: COLOR_OPTIONS[0].value });
    setShowStatusModal(true);
  };

  const openEditStatusModal = (id: string) => {
    const status = localColumns.find((col) => col.id === id);
    if (!status) return;

    setStatusModalMode('edit');
    setEditingStatusId(id);
    setStatusForm({ title: status.title, color: status.color });
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setEditingStatusId(null);
  };

  const handleSaveStatusFromModal = () => {
    if (!statusForm.title.trim()) {
      alert('Nazwa statusu jest wymagana.');
      return;
    }

    if (statusModalMode === 'create') {
      const newStatus: Column = {
        id: `col_${Date.now()}`,
        title: statusForm.title.trim(),
        color: statusForm.color,
        order: localColumns.length,
      };
      setLocalColumns((prev) => [...prev, newStatus]);
    } else if (statusModalMode === 'edit' && editingStatusId) {
      setLocalColumns((prev) =>
        prev.map((col) => (col.id === editingStatusId ? { ...col, title: statusForm.title.trim(), color: statusForm.color } : col))
      );
    }

    closeStatusModal();
  };

  const handleDeleteColumn = (id: string) => {
    if (confirm('Czy na pewno chcesz usunac ten status? Leady z tego statusu moga stac sie niewidoczne na tablicy.')) {
      const filtered = localColumns.filter((col) => col.id !== id);
      const reordered = filtered.map((col, index) => ({ ...col, order: index }));
      setLocalColumns(reordered);
    }
  };

  const handleSave = () => {
    onUpdateColumns(localColumns);
    alert('Zapisano nowa konfiguracje statusow.');
  };

  const handleSaveModulePermissions = () => {
    onModulePermissionsChange(localModulePermissions);
    alert('Zapisano uprawnienia do modulow.');
  };

  const renderPermissionCell = (value: boolean) => {
    return value ? (
      <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Tak</span>
    ) : (
      <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">Brak</span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-white rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Administracja systemu</h2>
              <p className="text-sm text-slate-500">Zarzadzaj sekcjami administracyjnymi: statusami i uprawnieniami.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection('statuses')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                activeSection === 'statuses' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              )}
            >
              Statusy
            </button>
            <button
              onClick={() => setActiveSection('permissions')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                activeSection === 'permissions' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              )}
            >
              Uprawnienia
            </button>
          </div>
        </div>

        {activeSection === 'statuses' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Zarzadzanie statusami</h3>
                <p className="text-sm text-slate-500">Dodawaj, edytuj i zmieniaj kolejnosc statusow Kanban.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                  Statusy: {statusCount}
                </span>
                <button
                  onClick={openCreateStatusModal}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj status
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-md"
                >
                  <Save className="w-4 h-4" />
                  Zapisz zmiany
                </button>
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="admin-columns">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {localColumns.map((col, index) => (
                      <DraggableAny key={col.id} draggableId={col.id} index={index}>
                        {(provided: any, snapshot: any) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              'flex items-center gap-4 p-4 bg-white border rounded-xl transition-all',
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 border-transparent z-50' : 'border-slate-200 shadow-sm'
                            )}
                          >
                            <div {...provided.dragHandleProps} className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-5 h-5" />
                            </div>

                            <div className={cn('w-10 h-10 rounded-lg shrink-0 border border-black/5 shadow-inner', col.color)}></div>

                            <div className="flex-1 min-w-0">
                              <div className="text-base font-semibold text-slate-800 truncate">{col.title}</div>
                              <div className="text-xs text-slate-400 font-mono mt-1">ID: {col.id}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditStatusModal(col.id)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edytuj status"
                              >
                                <Edit3 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteColumn(col.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Usun status"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </DraggableAny>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {localColumns.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                Brak zdefiniowanych statusow. Kliknij "Dodaj status", aby rozpoczac.
              </div>
            )}
          </div>
        )}

        {activeSection === 'permissions' && (
          <div className="p-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">Widocznosc modulow w menu</h4>
                <p className="text-sm text-slate-500">To ustawienie decyduje, czy zakladki beda widoczne dla uzytkownikow.</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <span className="text-sm font-medium text-slate-800">Modul Leady</span>
                  <input
                    type="checkbox"
                    checked={localModulePermissions.leads}
                    onChange={(event) =>
                      setLocalModulePermissions((prev) => ({ ...prev, leads: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <span className="text-sm font-medium text-slate-800">Modul Kampanie</span>
                  <input
                    type="checkbox"
                    checked={localModulePermissions.campaigns}
                    onChange={(event) =>
                      setLocalModulePermissions((prev) => ({ ...prev, campaigns: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveModulePermissions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Zapisz uprawnienia
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Uprawnienia i role</h3>
                <p className="text-sm text-slate-500">Przeglad dostepow do modulow dla typowych rol w systemie CJH.</p>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-xl border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Modul</th>
                    <th className="px-4 py-3 text-center">Admin</th>
                    <th className="px-4 py-3 text-center">Manager</th>
                    <th className="px-4 py-3 text-center">Agent</th>
                    <th className="px-4 py-3 text-center">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERMISSION_RULES.map((rule) => (
                    <tr key={rule.module}>
                      <td className="px-4 py-3 font-medium text-slate-800">{rule.module}</td>
                      <td className="px-4 py-3 text-center">{renderPermissionCell(rule.admin)}</td>
                      <td className="px-4 py-3 text-center">{renderPermissionCell(rule.manager)}</td>
                      <td className="px-4 py-3 text-center">{renderPermissionCell(rule.agent)}</td>
                      <td className="px-4 py-3 text-center">{renderPermissionCell(rule.viewer)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
              <div className="p-2 bg-amber-200 text-amber-800 rounded-lg shrink-0 h-fit">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">Uwaga</h4>
                <p className="text-xs text-amber-800 leading-relaxed mt-1">
                  Ta sekcja pokazuje aktualny model dostepow. Jesli chcesz, w kolejnym kroku moge dodac edycje uprawnien per rola
                  i zapisywanie konfiguracji do stanu aplikacji.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">
                {statusModalMode === 'create' ? 'Dodaj status' : 'Edytuj status'}
              </h4>
              <button onClick={closeStatusModal} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nazwa statusu</label>
                <input
                  type="text"
                  value={statusForm.title}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Np. Oferta wyslana"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kolor statusu</label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatusForm((prev) => ({ ...prev, color: opt.value }))}
                      className={cn(
                        'p-2 rounded-lg border text-left transition-all',
                        statusForm.color === opt.value ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className={cn('h-6 rounded-md border border-black/5', opt.value)}></div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={closeStatusModal}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveStatusFromModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                {statusModalMode === 'create' ? 'Dodaj status' : 'Zapisz status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
