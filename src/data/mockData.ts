import { Lead, AnalyticsData, Column, TaskReportItem } from '../types';
import { subDays, subHours, subMinutes, formatISO } from 'date-fns';

export const defaultColumns: Column[] = [
  { id: 'New', title: 'Nowe', color: 'bg-slate-100', order: 0, stage: 'sales', isWon: false, isLost: false },
  { id: 'OfferSent', title: 'Oferta Wyslana', color: 'bg-blue-50', order: 1, stage: 'sales', isWon: false, isLost: false },
  { id: 'OfferOpened', title: 'Oferta Otwarta', color: 'bg-indigo-50', order: 2, stage: 'sales', isWon: false, isLost: false },
  { id: 'Negotiating', title: 'Negocjacje', color: 'bg-purple-50', order: 3, stage: 'sales', isWon: false, isLost: false },
  { id: 'Won', title: 'Wygrane', color: 'bg-emerald-50', order: 4, stage: 'sales', isWon: true, isLost: false },
  { id: 'Lost', title: 'Przegrane', color: 'bg-rose-50', order: 5, stage: 'sales', isWon: false, isLost: true },
  { id: 'PreTripDocs', title: 'Dokumenty i formalnosci', color: 'bg-cyan-50', order: 6, stage: 'pre_trip', isWon: false, isLost: false },
  { id: 'PreTripUpsell', title: 'Dosprzedaz uslug', color: 'bg-amber-50', order: 7, stage: 'pre_trip', isWon: false, isLost: false },
  { id: 'PreTripReady', title: 'Gotowy do wyjazdu', color: 'bg-teal-50', order: 8, stage: 'pre_trip', isWon: true, isLost: false },
  { id: 'PostTripSurvey', title: 'Ankieta po powrocie', color: 'bg-fuchsia-50', order: 9, stage: 'post_trip', isWon: false, isLost: false },
  { id: 'PostTripFollowup', title: 'Follow-up i kolejna oferta', color: 'bg-violet-50', order: 10, stage: 'post_trip', isWon: true, isLost: false },
];

const now = new Date();

export const mockLeads: Lead[] = [
  {
    id: 'L-001',
    customerName: 'Jan Kowalski',
    destination: 'Malediwy - 14 dni',
    value: 25000,
    createdAt: formatISO(subHours(now, 10)),
    journeyStage: 'sales',
    status: 'New',
    activities: [],
    trackingId: 'trk_abc123'
  },
  {
    id: 'L-002',
    customerName: 'Anna Nowak',
    destination: 'Grecja (Kreta) - All Inclusive',
    value: 8500,
    createdAt: formatISO(subHours(now, 30)),
    journeyStage: 'sales',
    status: 'OfferSent',
    offerSentAt: formatISO(subHours(now, 26)),
    lastActivityAt: formatISO(subHours(now, 26)),
    activities: [
      { id: 'a1s', type: 'StatusChanged', timestamp: formatISO(subHours(now, 26)), fromStatus: 'New', toStatus: 'OfferSent' },
      { id: 'a1', type: 'EmailSent', timestamp: formatISO(subHours(now, 26)) }
    ],
    trackingId: 'trk_def456'
  },
  {
    id: 'L-003',
    customerName: 'Piotr Wisniewski',
    destination: 'Japonia - Wycieczka objazdowa',
    value: 32000,
    createdAt: formatISO(subHours(now, 8)),
    journeyStage: 'sales',
    status: 'OfferSent',
    offerSentAt: formatISO(subHours(now, 5)),
    lastActivityAt: formatISO(subHours(now, 5)),
    activities: [
      { id: 'a2s', type: 'StatusChanged', timestamp: formatISO(subHours(now, 5)), fromStatus: 'New', toStatus: 'OfferSent' },
      { id: 'a2', type: 'EmailSent', timestamp: formatISO(subHours(now, 5)) }
    ],
    trackingId: 'trk_ghi789'
  },
  {
    id: 'L-004',
    customerName: 'Katarzyna Wojcik',
    destination: 'Hiszpania (Majorka)',
    value: 12000,
    createdAt: formatISO(subDays(now, 3)),
    journeyStage: 'sales',
    status: 'OfferOpened',
    offerSentAt: formatISO(subDays(now, 2)),
    lastActivityAt: formatISO(subMinutes(now, 45)),
    activities: [
      { id: 'a3s', type: 'StatusChanged', timestamp: formatISO(subDays(now, 2)), fromStatus: 'New', toStatus: 'OfferSent' },
      { id: 'a3', type: 'EmailSent', timestamp: formatISO(subDays(now, 2)) },
      { id: 'a4s', type: 'StatusChanged', timestamp: formatISO(subMinutes(now, 45)), fromStatus: 'OfferSent', toStatus: 'OfferOpened' },
      { id: 'a4', type: 'EmailOpened', timestamp: formatISO(subMinutes(now, 45)) }
    ],
    trackingId: 'trk_jkl012'
  },
  {
    id: 'L-005',
    customerName: 'Tomasz Kaminski',
    destination: 'Tajlandia - 10 dni',
    value: 18000,
    createdAt: formatISO(subDays(now, 7)),
    journeyStage: 'sales',
    status: 'Negotiating',
    offerSentAt: formatISO(subDays(now, 5)),
    lastActivityAt: formatISO(subHours(now, 2)),
    activities: [
      { id: 'a5s', type: 'StatusChanged', timestamp: formatISO(subDays(now, 5)), fromStatus: 'New', toStatus: 'OfferSent' },
      { id: 'a5', type: 'EmailSent', timestamp: formatISO(subDays(now, 5)) },
      { id: 'a6s', type: 'StatusChanged', timestamp: formatISO(subDays(now, 4)), fromStatus: 'OfferSent', toStatus: 'OfferOpened' },
      { id: 'a6', type: 'EmailOpened', timestamp: formatISO(subDays(now, 4)) },
      { id: 'a7s', type: 'StatusChanged', timestamp: formatISO(subHours(now, 2)), fromStatus: 'OfferOpened', toStatus: 'Negotiating' },
      { id: 'a7', type: 'LinkClicked', timestamp: formatISO(subHours(now, 2)) }
    ],
    trackingId: 'trk_mno345'
  },
  {
    id: 'L-006',
    customerName: 'Marta Lubinska',
    destination: 'Bali - 12 dni',
    value: 21500,
    createdAt: formatISO(subDays(now, 18)),
    journeyStage: 'pre_trip',
    status: 'PreTripUpsell',
    departureDate: formatISO(subDays(now, -20)),
    returnDate: formatISO(subDays(now, -8)),
    lastActivityAt: formatISO(subHours(now, 12)),
    activities: [
      { id: 'a8s', type: 'StatusChanged', timestamp: formatISO(subDays(now, 17)), fromStatus: 'Negotiating', toStatus: 'Won' },
      { id: 'a9s', type: 'StatusChanged', timestamp: formatISO(subDays(now, 16)), fromStatus: 'Won', toStatus: 'PreTripDocs' },
      { id: 'a10s', type: 'StatusChanged', timestamp: formatISO(subDays(now, 12)), fromStatus: 'PreTripDocs', toStatus: 'PreTripUpsell' }
    ],
    trackingId: 'trk_pqr678'
  },
  {
    id: 'L-007',
    customerName: 'Adam Rogalski',
    destination: 'Madera - 8 dni',
    value: 13200,
    createdAt: formatISO(subDays(now, 45)),
    journeyStage: 'post_trip',
    status: 'PostTripSurvey',
    departureDate: formatISO(subDays(now, 30)),
    returnDate: formatISO(subDays(now, 20)),
    lastActivityAt: formatISO(subDays(now, 1)),
    activities: [
      { id: 'a11s', type: 'StatusChanged', timestamp: formatISO(subDays(now, 44)), fromStatus: 'OfferOpened', toStatus: 'Won' },
      { id: 'a12s', type: 'StatusChanged', timestamp: formatISO(subDays(now, 40)), fromStatus: 'Won', toStatus: 'PreTripReady' },
      { id: 'a13s', type: 'StatusChanged', timestamp: formatISO(subDays(now, 19)), fromStatus: 'PreTripReady', toStatus: 'PostTripSurvey' }
    ],
    trackingId: 'trk_stu901'
  }
];

export const mockAnalytics: AnalyticsData = {
  conversionRate: 24.5,
  avgDecisionTimeDays: 4.2,
  yoyRevenue: [
    { month: 'Sty', currentYear: 120000, previousYear: 95000 },
    { month: 'Lut', currentYear: 145000, previousYear: 110000 },
    { month: 'Mar', currentYear: 180000, previousYear: 160000 },
    { month: 'Kwi', currentYear: 150000, previousYear: 175000 }, // Spadek YoY
    { month: 'Maj', currentYear: 210000, previousYear: 190000 },
  ],
  trendingDestinations: [
    { name: 'Albania', growth: 45, recommendation: 'Zwiększ budżet reklamowy na FB/IG. Klienci szukają tańszych alternatyw dla Chorwacji.' },
    { name: 'Zanzibar', growth: 30, recommendation: 'Przygotuj pakiety dla par (podróże poślubne).' },
    { name: 'Turcja', growth: -15, recommendation: 'Spadek zainteresowania. Zaoferuj zniżki na pakiety rodzinne.' }
  ]
};

export const mockLeadPool: Array<Omit<Lead, 'id' | 'status' | 'activities' | 'trackingId'>> = [
  {
    customerName: 'Monika Zielinska',
    destination: 'Portugalia (Algarve) - 7 dni',
    value: 9800,
  },
  {
    customerName: 'Rafal Nowicki',
    destination: 'Egipt (Marsa Alam) - 10 dni',
    value: 11200,
  },
  {
    customerName: 'Alicja Pawlak',
    destination: 'Wlochy (Sycylia) - 8 dni',
    value: 12600,
  },
  {
    customerName: 'Michal Krawiec',
    destination: 'Hiszpania (Teneryfa) - 14 dni',
    value: 15400,
  },
  {
    customerName: 'Joanna Gorska',
    destination: 'Grecja (Rodos) - 7 dni',
    value: 8900,
  },
];

export const mockTasks: TaskReportItem[] = [
  {
    id: 'T-001',
    taskId: 170258,
    title: 'Kontakt follow-up po wysylce oferty',
    status: 'in-progress',
    createdDate: '2026-01-19 15:00',
    dueDate: '2026-01-20 22:59',
    priority: 'medium',
    client: '118385133',
    assignedTo: 'Tomasz Krason'
  },
  {
    id: 'T-002',
    taskId: 171998,
    title: 'Przygotowac nowa kalkulacje',
    status: 'in-progress',
    createdDate: '2026-02-17 08:26',
    dueDate: '2026-02-19 09:00',
    priority: 'high',
    client: '-',
    assignedTo: 'Tomasz Krason'
  },
  {
    id: 'T-003',
    taskId: 172637,
    title: 'Weryfikacja dokumentow klienta',
    status: 'new',
    createdDate: '2026-02-25 08:06',
    dueDate: '2026-02-26 11:11',
    priority: 'medium',
    client: '-',
    assignedTo: 'Marek Herz'
  },
  {
    id: 'T-004',
    taskId: 173190,
    title: 'Wyslac przypomnienie o zaliczce',
    status: 'new',
    createdDate: '2026-02-27 08:16',
    dueDate: '2026-02-27 09:00',
    priority: 'low',
    client: '-',
    assignedTo: 'Tomasz Krason'
  },
  {
    id: 'T-005',
    taskId: 173191,
    title: 'Uzgodnic zmiane terminu lotu',
    status: 'completed',
    createdDate: '2026-02-27 08:18',
    dueDate: '2026-02-27 09:00',
    priority: 'low',
    client: '-',
    assignedTo: 'Tomasz Krason'
  },
  {
    id: 'T-006',
    taskId: 175455,
    title: 'Zebrac dokumenty do rozliczenia',
    status: 'new',
    createdDate: '2026-03-09 14:54',
    dueDate: '2026-03-10 11:11',
    priority: 'medium',
    client: '116038022',
    assignedTo: 'Marek Herz'
  }
];


