import React from 'react';
import { X, User, MapPin, DollarSign, Calendar, History, Info } from 'lucide-react';
import { Lead } from '../types';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

interface LeadDetailsModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ lead, onClose }) => {
  if (!lead) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'd MMMM yyyy, HH:mm', { locale: pl });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Szczegóły Leada</div>
            <h2 className="text-2xl font-bold text-slate-800">{lead.customerName}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-white rounded-full shadow-sm">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Info */}
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Informacje podstawowe
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Kierunek</div>
                      <div className="font-medium text-slate-800">{lead.destination}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Wartość oferty</div>
                      <div className="font-bold text-slate-800">{formatCurrency(lead.value)}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Status</div>
                      <div className="inline-block px-2 py-1 rounded-md bg-slate-200 text-slate-700 text-xs font-bold mt-1">
                        {lead.status}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <h4 className="text-sm font-bold text-indigo-800 mb-2">Tracking ID</h4>
                <code className="text-xs bg-white/50 px-2 py-1 rounded border border-indigo-200 text-indigo-600 block truncate">
                  {lead.trackingId}
                </code>
                <p className="text-[10px] text-indigo-500 mt-2">
                  Unikalny identyfikator używany do śledzenia otwarć maili i kliknięć w linki.
                </p>
              </section>
            </div>

            {/* Right Column: Activity Log */}
            <section>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <History className="w-4 h-4" /> Historia aktywności
              </h3>
              <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {lead.activities.length === 0 ? (
                  <div className="text-sm text-slate-400 italic pl-8">Brak zarejestrowanych aktywności.</div>
                ) : (
                  lead.activities.map((activity, idx) => (
                    <div key={activity.id} className="relative pl-10">
                      <div className="absolute left-0 top-1 w-9 h-9 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center z-10">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="text-xs text-slate-400 mb-0.5">{formatDate(activity.timestamp)}</div>
                      <div className="text-sm font-semibold text-slate-700">{activity.type}</div>
                      {activity.details && (
                        <div className="text-xs text-slate-500 mt-1 bg-slate-50 p-2 rounded border border-slate-100 italic">
                          "{activity.details}"
                        </div>
                      )}
                    </div>
                  ))
                ).reverse()}
              </div>
            </section>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
