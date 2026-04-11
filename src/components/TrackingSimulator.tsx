import React, { useState } from 'react';
import { Lead } from '../types';
import { MousePointerClick, CheckCircle2 } from 'lucide-react';

interface TrackingSimulatorProps {
  leads: Lead[];
  onSimulateClick: (trackingId: string) => void;
}

export const TrackingSimulator: React.FC<TrackingSimulatorProps> = ({ leads, onSimulateClick }) => {
  const [simulatedId, setSimulatedId] = useState<string | null>(null);

  const handleSimulate = (trackingId: string) => {
    onSimulateClick(trackingId);
    setSimulatedId(trackingId);
    setTimeout(() => setSimulatedId(null), 3000);
  };

  const sentLeads = leads.filter(l => l.status === 'OfferSent');

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <MousePointerClick className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">Symulator Klienta</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Zasymuluj kliknięcie w link przez klienta. W rzeczywistości klient klika w link z maila, co odpytuje API .NET i aktualizuje status przez SignalR.
      </p>
      
      <div className="space-y-2">
        {sentLeads.length === 0 ? (
          <div className="text-sm text-slate-400 italic">Brak ofert o statusie "Wysłana".</div>
        ) : (
          sentLeads.map(lead => (
            <button
              key={lead.id}
              onClick={() => handleSimulate(lead.trackingId)}
              disabled={simulatedId !== null}
              className="w-full flex items-center justify-between p-2 text-sm border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <span className="truncate mr-2">{lead.customerName}</span>
              {simulatedId === lead.trackingId ? (
                <span className="flex items-center text-emerald-600 text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Otwarte
                </span>
              ) : (
                <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded">
                  Symuluj kliknięcie
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
