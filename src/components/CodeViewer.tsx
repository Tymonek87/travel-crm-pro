import React from 'react';

const coreModelsCode = `// src/types.ts
export type LeadStatus = string;

export interface Column {
  id: string;
  title: string;
  color: string;
  order: number;
}

export interface Activity {
  id: string;
  type: 'EmailSent' | 'EmailOpened' | 'LinkClicked' | 'NoteAdded' | 'StatusChanged';
  timestamp: string;
  details?: string;
  fromStatus?: LeadStatus;
  toStatus?: LeadStatus;
}

export interface Lead {
  id: string;
  customerName: string;
  destination: string;
  value: number;
  status: LeadStatus;
  createdAt?: string;
  offerSentAt?: string;
  lastActivityAt?: string;
  activities: Activity[];
  trackingId: string;
}

export interface TaskReportItem {
  id: string;
  taskId: number;
  title: string;
  status: 'new' | 'in-progress' | 'completed';
  createdDate: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  client: string;
  assignedTo: string;
}`;

const integrationSnapshotCode = `// Aktualny stan integracji (frontend)
// 1) HTTP API calls:
// - Brak aktywnych fetch/axios w src/*
// - Dane pochodza z mockow i stanu React

// 2) Symulowane integracje:
// - Tracking oferty:
//   TrackingSimulator -> App.handleSimulateClick(trackingId)
//   (lokalna zmiana statusu OfferSent -> OfferOpened)
//
// - Resabee (mock):
//   App.handleAcquireReservation()
//   (symulacja przejecia rezerwacji + utworzenie zadania follow-up)
//
// - Pula leadow:
//   App.handleAcquireLead()
//   (przeniesienie rekordu z leadPool do aktywnych leadow + auto-task)`;

export const CodeViewer: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Widok pokazuje aktualny snapshot projektu, a nie przykladowy pseudokod backendu.
        </p>
      </div>

      <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-lg border border-slate-700">
        <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-slate-400 text-xs font-mono ml-2">CoreModels.ts (snapshot)</span>
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-[#d4d4d4]">
            <code>{coreModelsCode}</code>
          </pre>
        </div>
      </div>

      <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-lg border border-slate-700">
        <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-slate-400 text-xs font-mono ml-2">ApiAndIntegrations.md (snapshot)</span>
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-[#d4d4d4]">
            <code>{integrationSnapshotCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
