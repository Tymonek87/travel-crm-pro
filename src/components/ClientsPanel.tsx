import React, { useEffect, useState } from 'react';
import { Phone, Mail, MoreVertical, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  agent: string;
  budget: number;
  destinations: string[];
  contactConsent: {
    phone: boolean;
    email: boolean;
  };
}

type ContactConsentFilter = 'all' | 'phone_only' | 'email_only' | 'both';

const mockClients: Client[] = [
  {
    id: 'C-001',
    name: 'Mateusz Henicz',
    phone: '885992329',
    email: 'mhenicz@itaka.pl',
    agent: '-',
    budget: 4374,
    destinations: ['Algarve', 'Costa Brava', 'Khao Lak', 'Wyspy Kanaryjskie', 'Wyspy Zielonego Przyladka'],
    contactConsent: { phone: true, email: false }
  },
  {
    id: 'C-002',
    name: 'ANNA CIESLICKA',
    phone: '+48 506048186',
    email: 'BIURO@TURKUS-TRAVEL.PL',
    agent: 'K. Mroczek',
    budget: 5648,
    destinations: ['Marsa Alam', 'Side', 'Wyspa Kos'],
    contactConsent: { phone: false, email: true }
  },
  {
    id: 'C-003',
    name: 'RAFAL DABKOWSKI',
    phone: '881227133',
    email: 'RAFAL.DABKOWSKI@WP.PL',
    agent: 'M. Zoltowski',
    budget: 3329,
    destinations: ['Albena', 'Dolina Aosty', 'Marsa Alam'],
    contactConsent: { phone: false, email: true }
  },
  {
    id: 'C-004',
    name: 'JOLANTA MYTNIK',
    phone: '502329807',
    email: 'JOLMY17@GMAIL.COM',
    agent: 'J. Mytnik',
    budget: 7972,
    destinations: ['Madera', 'Mykonos', 'Przy Lotnisku', 'Wycieczka Hiszpania', 'Wycieczka Republika Zielonego Przyladka'],
    contactConsent: { phone: true, email: false }
  },
  {
    id: 'C-005',
    name: 'MACIEJ KRZYSZTOF MERLIN-TEST',
    phone: '1234545678',
    email: 'TEST@TEST.PL',
    agent: 'R. itaka_pl',
    budget: 0,
    destinations: [],
    contactConsent: { phone: true, email: true }
  },
  {
    id: 'C-006',
    name: '116035599',
    phone: '6526',
    email: 'gontarczyk.artur@gmail.com',
    agent: 'A. Stasik',
    budget: 0,
    destinations: [],
    contactConsent: { phone: false, email: true }
  }
];

export const ClientsPanel: React.FC = () => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactConsent, setContactConsent] = useState<ContactConsentFilter>('all');
  const [agent, setAgent] = useState('');
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [draftContactConsent, setDraftContactConsent] = useState<ContactConsentFilter>('all');
  const [draftAgent, setDraftAgent] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [consentModalClientId, setConsentModalClientId] = useState<string | null>(null);
  const [consentDraft, setConsentDraft] = useState<{ phone: boolean; email: boolean } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(value);
  };

  const filteredClients = clients.filter(client => {
    const normalizedQuery = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      client.name.toLowerCase().includes(normalizedQuery) ||
      client.email.toLowerCase().includes(normalizedQuery) ||
      client.phone.includes(searchQuery) ||
      client.id.toLowerCase().includes(normalizedQuery);

    const matchesConsent =
      contactConsent === 'all' ||
      (contactConsent === 'phone_only' && client.contactConsent.phone && !client.contactConsent.email) ||
      (contactConsent === 'email_only' && !client.contactConsent.phone && client.contactConsent.email) ||
      (contactConsent === 'both' && client.contactConsent.phone && client.contactConsent.email);

    const matchesAgent = agent === '' || client.agent.toLowerCase().includes(agent.toLowerCase());

    return matchesSearch && matchesConsent && matchesAgent;
  });

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (filteredClients.length === 0) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, filteredClients.length, totalPages]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setSearchQuery(draftSearchQuery.trim());
    setContactConsent(draftContactConsent);
    setAgent(draftAgent.trim());
    setCurrentPage(1);
    setOpenMenuId(null);
  };

  const handleUpdateConsent = (clientId: string, phone: boolean, email: boolean) => {
    setClients(currentClients =>
      currentClients.map(client =>
        client.id === clientId
          ? {
              ...client,
              contactConsent: {
                phone,
                email
              }
            }
          : client
      )
    );
    setOpenMenuId(null);
  };

  const handleRevokeAllConsents = (clientId: string) => {
    setClients(currentClients =>
      currentClients.map(client =>
        client.id === clientId
          ? { ...client, contactConsent: { phone: false, email: false } }
          : client
      )
    );
    setOpenMenuId(null);
  };

  const handleOpenConsentModal = (clientId: string) => {
    const client = clients.find(item => item.id === clientId);
    if (!client) return;

    setConsentDraft({
      phone: client.contactConsent.phone,
      email: client.contactConsent.email
    });
    setConsentModalClientId(clientId);
    setOpenMenuId(null);
  };

  const handleCloseConsentModal = () => {
    setConsentModalClientId(null);
    setConsentDraft(null);
  };

  const handleSaveConsentChanges = () => {
    if (!consentModalClientId || !consentDraft) return;
    handleUpdateConsent(consentModalClientId, consentDraft.phone, consentDraft.email);
    handleCloseConsentModal();
  };

  const handleViewProfile = (clientId: string) => {
    console.log('Otwieramy profil klienta:', clientId);
    setOpenMenuId(null);
  };

  const consentModalClient = clients.find(client => client.id === consentModalClientId) ?? null;

  return (
    <div className="w-full h-full bg-white">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900">Klienci</h1>
          <button className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors text-sm">
            Dodaj nowego
          </button>
        </div>

        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <form
            onSubmit={event => {
              event.preventDefault();
              handleApplyFilters();
            }}
            className="flex flex-wrap gap-4 items-center"
          >
            <div className="relative flex-1 min-w-xs max-w-sm">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Email, nr telefonu lub ID klienta"
                value={draftSearchQuery}
                onChange={event => setDraftSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <select
              value={draftContactConsent}
              onChange={event => setDraftContactConsent(event.target.value as ContactConsentFilter)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="all">Zgoda na kontakt</option>
              <option value="phone_only">Tylko telefon</option>
              <option value="email_only">Tylko email</option>
              <option value="both">Email i telefon</option>
            </select>

            <input
              type="text"
              placeholder="Ekspedient"
              value={draftAgent}
              onChange={event => setDraftAgent(event.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />

            <button type="submit" className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors text-sm">
              Szukaj
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm border border-slate-100">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Klient</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Ekspedient</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Szacowany budzet za os.</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Preferowane kierunki</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nr telefonu</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                <th colSpan={2} className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  Zgoda na kontakt
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Akcja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewProfile(client.id)}
                      className="text-slate-900 font-semibold underline hover:text-blue-600 text-sm"
                    >
                      {client.name}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">{client.agent}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">{client.budget > 0 ? formatCurrency(client.budget) : '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">
                      {client.destinations.length > 0 ? client.destinations.join(', ') : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">{client.phone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">{client.email}</span>
                  </td>
                  <td className="px-0 py-4 border-r border-slate-200 w-24">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Phone className={`w-4 h-4 ${client.contactConsent.phone ? 'text-emerald-600' : 'text-red-600'}`} />
                      <span className={`text-sm font-medium ${client.contactConsent.phone ? 'text-emerald-600' : 'text-red-600'}`}>
                        {client.contactConsent.phone ? 'Tak' : 'Nie'}
                      </span>
                    </div>
                  </td>
                  <td className="px-0 py-4 w-24">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Mail className={`w-4 h-4 ${client.contactConsent.email ? 'text-emerald-600' : 'text-red-600'}`} />
                      <span className={`text-sm font-medium ${client.contactConsent.email ? 'text-emerald-600' : 'text-red-600'}`}>
                        {client.contactConsent.email ? 'Tak' : 'Nie'}
                      </span>
                    </div>
                  </td>
                  <td className="px-0 py-4 w-20">
                    <div className="flex items-center justify-center gap-1 relative">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                          aria-label={`Otworz menu akcji dla klienta ${client.name}`}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === client.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                            <button
                              onClick={() => handleViewProfile(client.id)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                            >
                              Edytuj dane klienta
                            </button>
                            <button
                              onClick={() => handleOpenConsentModal(client.id)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                            >
                              Edytuj zgody klienta
                            </button>
                            <button
                              onClick={() => handleRevokeAllConsents(client.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Wycofaj wszystkie zgody
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleViewProfile(client.id)}
                        aria-label={`Podejrzyj profil klienta ${client.name}`}
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

        {filteredClients.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Wyniki na stronie:</span>
              <select
                value={itemsPerPage}
                onChange={event => handleItemsPerPageChange(Number(event.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Przejdz do poprzedniej strony"
                className="p-2 text-slate-400 hover:bg-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-slate-600 min-w-fit">
                Strona {currentPage} z {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Przejdz do nastepnej strony"
                className="p-2 text-slate-400 hover:bg-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {consentModalClient && (
          <div
            className="fixed inset-0 z-[60] bg-slate-900/30 flex items-center justify-center p-4"
            onClick={handleCloseConsentModal}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5"
              onClick={event => event.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-slate-900">Edytuj zgody klienta</h2>
              <p className="text-sm text-slate-600 mt-1">{consentModalClient.name}</p>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setConsentDraft({ phone: true, email: false })}
                  className={`w-full px-4 py-2.5 text-left text-sm rounded-lg border transition-colors ${
                    consentDraft?.phone && !consentDraft?.email
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Zgoda: tylko telefon
                </button>
                <button
                  onClick={() => setConsentDraft({ phone: false, email: true })}
                  className={`w-full px-4 py-2.5 text-left text-sm rounded-lg border transition-colors ${
                    !consentDraft?.phone && consentDraft?.email
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Zgoda: tylko email
                </button>
                <button
                  onClick={() => setConsentDraft({ phone: true, email: true })}
                  className={`w-full px-4 py-2.5 text-left text-sm rounded-lg border transition-colors ${
                    consentDraft?.phone && consentDraft?.email
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Zgoda: email i telefon
                </button>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={handleCloseConsentModal}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSaveConsentChanges}
                  disabled={!consentDraft}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredClients.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-500 text-lg">Brak wynikow wyszukiwania</p>
              <p className="text-slate-400 text-sm mt-1">Zmien filtry i sprobuj ponownie</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
