import React from 'react';
import { Plus } from 'lucide-react';
import { DropResult } from '@hello-pangea/dnd';
import { Lead, Column, JourneyStage } from '../types';
import { KanbanBoard } from './KanbanBoard';
import { TrackingSimulator } from './TrackingSimulator';
import { cn } from '../lib/utils';
import { JOURNEY_STAGE_LABELS } from '../features/journey/stageUtils';

type ProposalsView = 'kanban' | 'table';

interface ProposalsPanelProps {
  activeJourneyStage: JourneyStage;
  proposalsView: ProposalsView;
  stageColumns: Column[];
  stageLeadsCount: number;
  filteredStageLeads: Lead[];
  proposalDirection: string;
  proposalMinValue: string;
  proposalMaxValue: string;
  proposalDepartureFrom: string;
  proposalDepartureTo: string;
  onProposalsViewChange: (view: ProposalsView) => void;
  onProposalDirectionChange: (value: string) => void;
  onProposalMinValueChange: (value: string) => void;
  onProposalMaxValueChange: (value: string) => void;
  onProposalDepartureFromChange: (value: string) => void;
  onProposalDepartureToChange: (value: string) => void;
  onClearFilters: () => void;
  onAcquireLead: () => void;
  onSimulateClick: (trackingId: string) => void;
  onLeadClick: (lead: Lead) => void;
  onDragEnd: (result: DropResult) => void;
}

export const ProposalsPanel: React.FC<ProposalsPanelProps> = ({
  activeJourneyStage,
  proposalsView,
  stageColumns,
  stageLeadsCount,
  filteredStageLeads,
  proposalDirection,
  proposalMinValue,
  proposalMaxValue,
  proposalDepartureFrom,
  proposalDepartureTo,
  onProposalsViewChange,
  onProposalDirectionChange,
  onProposalMinValueChange,
  onProposalMaxValueChange,
  onProposalDepartureFromChange,
  onProposalDepartureToChange,
  onClearFilters,
  onAcquireLead,
  onSimulateClick,
  onLeadClick,
  onDragEnd,
}) => {
  return (
    <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8 w-full">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Lejek sprzedazowy</h2>
          <p className="text-slate-500 mt-1">Zarzadzaj etapem: {JOURNEY_STAGE_LABELS[activeJourneyStage]}.</p>
          <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 gap-1">
            <button
              onClick={() => onProposalsViewChange('kanban')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                proposalsView === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              Kanban
            </button>
            <button
              onClick={() => onProposalsViewChange('table')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                proposalsView === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              Tabela
            </button>
          </div>
          <button
            onClick={onAcquireLead}
            className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Przejmij Leada
          </button>
        </div>
        <TrackingSimulator leads={filteredStageLeads} onSimulateClick={onSimulateClick} />
      </div>

      <div className="mb-5 p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between mb-3 gap-3">
          <h3 className="text-sm font-semibold text-slate-800">Filtry propozycji</h3>
          <div className="text-xs text-slate-500">
            Wyniki: <span className="font-semibold text-slate-700">{filteredStageLeads.length}</span> / {stageLeadsCount}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <input
            type="text"
            value={proposalDirection}
            onChange={(e) => onProposalDirectionChange(e.target.value)}
            placeholder="Kierunek (np. Grecja)"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            min="0"
            value={proposalMinValue}
            onChange={(e) => onProposalMinValueChange(e.target.value)}
            placeholder="Min wartosc"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            min="0"
            value={proposalMaxValue}
            onChange={(e) => onProposalMaxValueChange(e.target.value)}
            placeholder="Max wartosc"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Termin wyjazdu od</label>
            <input
              type="date"
              value={proposalDepartureFrom}
              onChange={(e) => onProposalDepartureFromChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Termin wyjazdu do</label>
            <input
              type="date"
              value={proposalDepartureTo}
              onChange={(e) => onProposalDepartureToChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={onClearFilters}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Wyczysc filtry
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {proposalsView === 'kanban' ? (
          <KanbanBoard leads={filteredStageLeads} columns={stageColumns} onLeadClick={onLeadClick} onDragEnd={onDragEnd} />
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
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {lead.lastActivityAt ? new Date(lead.lastActivityAt).toLocaleString('pl-PL') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onLeadClick(lead)}
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
    </div>
  );
};
