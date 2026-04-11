import React from 'react';
import { Lead, LeadStatus, Column } from '../types';
import { differenceInHours, parseISO } from 'date-fns';
import { AlertCircle, Clock, MailOpen, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface KanbanBoardProps {
  leads: Lead[];
  columns: Column[];
  onLeadClick: (lead: Lead) => void;
  onDragEnd: (result: DropResult) => void;
}

const DraggableAny = Draggable as any;

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, columns, onLeadClick, onDragEnd }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(value);
  };

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full w-full gap-4 overflow-x-auto pb-4">
        {sortedColumns.map((col) => {
          const columnLeads = leads.filter((l) => l.status === col.id);
          const columnTotal = columnLeads.reduce((sum, l) => sum + l.value, 0);

          return (
            <div key={col.id} className={cn("flex-shrink-0 w-80 rounded-xl flex flex-col max-h-full", col.color)}>
              {/* Column Header */}
              <div className="p-4 border-b border-black/5">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-slate-800">{col.title}</h3>
                  <span className="bg-white/60 text-slate-600 text-xs font-medium px-2 py-1 rounded-full">
                    {columnLeads.length}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-500">
                  {formatCurrency(columnTotal)}
                </div>
              </div>

              {/* Column Body */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "p-3 flex-1 overflow-y-auto flex flex-col gap-3 transition-colors",
                      snapshot.isDraggingOver ? "bg-black/5" : ""
                    )}
                  >
                    {columnLeads.map((lead, index) => {
                      // Automation Logic: Stale Offer Check
                      let isStale = false;
                      let hoursSinceSent = 0;
                      
                      if (lead.status === 'OfferSent' && lead.offerSentAt) {
                        hoursSinceSent = differenceInHours(new Date(), parseISO(lead.offerSentAt));
                        if (hoursSinceSent >= 24) {
                          isStale = true;
                        }
                      }

                      return (
                        <DraggableAny key={lead.id} draggableId={lead.id} index={index}>
                          {(provided: any, snapshot: any) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onLeadClick(lead)}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1
                              }}
                              className={cn(
                                "bg-white p-4 rounded-lg shadow-sm border transition-all hover:shadow-md cursor-pointer active:scale-[0.98]",
                                isStale ? "border-red-400 ring-1 ring-red-400 bg-red-50/30" : "border-slate-200",
                                snapshot.isDragging ? "shadow-xl ring-2 ring-blue-500 border-transparent" : ""
                              )}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                                  <User className="w-4 h-4 text-slate-400" />
                                  <span className="truncate">{lead.customerName}</span>
                                </div>
                                {isStale && (
                                  <div className="flex items-center text-red-600 animate-pulse" title="Brak reakcji > 24h!">
                                    <AlertCircle className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-sm text-slate-600 mb-3 line-clamp-2">
                                {lead.destination}
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-700">
                                  {formatCurrency(lead.value)}
                                </span>
                                
                                {/* Status Icon / Time */}
                                <div className="flex items-center text-xs text-slate-500 gap-1">
                                  {lead.status === 'OfferSent' && (
                                    <>
                                      <Clock className={cn("w-3.5 h-3.5", isStale ? "text-red-500" : "")} />
                                      <span className={isStale ? "text-red-600 font-medium" : ""}>
                                        {hoursSinceSent}h temu
                                      </span>
                                    </>
                                  )}
                                  {lead.status === 'OfferOpened' && (
                                    <>
                                      <MailOpen className="w-3.5 h-3.5 text-indigo-500" />
                                      <span>Otwarte</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </DraggableAny>
                      );
                    })}
                    {provided.placeholder}
                    
                    {columnLeads.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center p-4 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                        Brak leadów
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

