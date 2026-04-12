export type LeadStatus = string;
export type JourneyStage = 'sales' | 'pre_trip' | 'post_trip';

export interface Column {
  id: string;
  title: string;
  color: string;
  order: number;
  stage?: JourneyStage;
  isWon?: boolean;
  isLost?: boolean;
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
  journeyStage?: JourneyStage;
  status: LeadStatus;
  createdAt?: string; // ISO date string
  departureDate?: string; // ISO date string
  returnDate?: string; // ISO date string
  offerSentAt?: string; // ISO date string
  lastActivityAt?: string; // ISO date string
  activities: Activity[];
  trackingId: string;
}

export interface AnalyticsData {
  conversionRate: number;
  avgDecisionTimeDays: number;
  yoyRevenue: { month: string; currentYear: number; previousYear: number }[];
  trendingDestinations: { name: string; growth: number; recommendation: string }[];
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
}
