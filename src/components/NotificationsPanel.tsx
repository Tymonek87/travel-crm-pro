import React, { useState } from 'react';
import { Bell, Trash2, Check, X, Mail, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const mockNotifications: Notification[] = [
  {
    id: 'N-001',
    type: 'success',
    title: 'Lead został wygrany!',
    message: 'Mateusz Henicz potwierdził zakup wycieczki do Algarve. Przychód: 4 374 PLN',
    timestamp: '2026-04-10T14:30:00',
    read: false
  },
  {
    id: 'N-002',
    type: 'info',
    title: 'Nowa wiadomość od klienta',
    message: 'ANNA CIEŚLICKA wysłała zapytanie o dostępność wyjazdów w lipcu',
    timestamp: '2026-04-10T12:15:00',
    read: false
  },
  {
    id: 'N-003',
    type: 'warning',
    title: 'Lead oczekuje na ofertę',
    message: 'RAFAL DABKOWSKI oczekuje na odpowiedź od 3 dni',
    timestamp: '2026-04-10T10:00:00',
    read: true
  },
  {
    id: 'N-004',
    type: 'error',
    title: 'Błąd wysyłki',
    message: 'Nie udało się wysłać oferty do: JOLANTA MYTNIK. Email: JOLMY17@GMAIL.COM',
    timestamp: '2026-04-09T16:20:00',
    read: true
  },
  {
    id: 'N-005',
    type: 'info',
    title: 'Raport dzienny gotowy',
    message: 'Raport ze sprzedaży za dzień 10.04.2026 jest dostępny do pobrania',
    timestamp: '2026-04-09T22:00:00',
    read: true
  },
  {
    id: 'N-006',
    type: 'success',
    title: 'Oferta zostały otwarta',
    message: 'MACIEJ KRZYSZTOF MERLIN-TEST otworzył wysłaną ofertę',
    timestamp: '2026-04-09T14:45:00',
    read: true
  }
];

const NOTIFICATION_ICONS = {
  success: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  warning: { icon: AlertCircle, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  error: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' }
};

export const NotificationsPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter(notif => {
    if (filterRead === 'unread') return !notif.read;
    if (filterRead === 'read') return notif.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notifId: string) => {
    setNotifications(notifications.map(n =>
      n.id === notifId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notifId: string) => {
    setNotifications(notifications.filter(n => n.id !== notifId));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Właśnie teraz';
    if (diffMins < 60) return `${diffMins}m temu`;
    if (diffHours < 24) return `${diffHours}h temu`;
    if (diffDays < 7) return `${diffDays}d temu`;
    return date.toLocaleDateString('pl-PL');
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Powiadomienia</h1>
          {unreadCount > 0 && (
            <p className="text-slate-500 text-sm mt-1">
              <span className="font-semibold text-blue-600">{unreadCount}</span> nieprzeczytanych
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Oznacz wszystkie jako przeczytane
            </button>
          )}
          <button
            onClick={clearAll}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Wyczyść wszystko
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-2">
        <button
          onClick={() => setFilterRead('all')}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            filterRead === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          )}
        >
          Wszystkie
        </button>
        <button
          onClick={() => setFilterRead('unread')}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            filterRead === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          )}
        >
          Nieprzeczytane ({unreadCount})
        </button>
        <button
          onClick={() => setFilterRead('read')}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            filterRead === 'read'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          )}
        >
          Przeczytane
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">Brak powiadomień</p>
              <p className="text-slate-400 text-sm mt-1">Wszystkie powiadomienia zostały przeczytane</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredNotifications.map((notif) => {
              const { icon: IconComponent, color, bgColor } = NOTIFICATION_ICONS[notif.type];
              return (
                <div
                  key={notif.id}
                  className={cn(
                    "p-4 hover:bg-slate-50 transition-colors flex gap-4",
                    !notif.read && 'bg-blue-50'
                  )}
                >
                  <div className={cn("p-3 rounded-lg flex-shrink-0", bgColor)}>
                    <IconComponent className={cn("w-5 h-5", color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-semibold text-sm transition-all",
                          !notif.read ? 'text-slate-900' : 'text-slate-700'
                        )}>
                          {notif.title}
                          {!notif.read && <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          {formatTime(notif.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Oznacz jako przeczytane"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Usuń"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
