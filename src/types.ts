export type NavSection =
  | 'dashboard'
  | 'seo-generator'
  | 'local-seo'
  | 'crm-pipeline'
  | 'performance-report';

export type ServiceCategory = 'HR Staffing' | 'AI Automation' | 'Compliance';

export type IndiaZone =
  | 'PAN India (Multi-City)'
  | 'Central India (Durg / Raipur)'
  | 'North India (Delhi NCR)'
  | 'West India (Mumbai / Pune)'
  | 'South India (Bengaluru / Hyderabad / Chennai)'
  | 'East India (Kolkata / Bhubaneswar)';

export interface PanIndiaHub {
  id: string;
  zone: string;
  cities: string;
  topKeywords: number;
  activeMandates: number;
  assignedDesk: string;
}

export interface KeywordRank {
  id: string;
  keyword: string;
  category: ServiceCategory;
  region?: string;
  rank: number;
  previousRank: number;
  monthlyVolume: number;
  targetUrl: string;
  intent: 'High Commercial' | 'Transactional' | 'Local B2B';
  lastUpdated: string;
}

export interface TrafficPoint {
  date: string;
  organicVisits: number;
  qualifiedLeads: number;
}

export type LeadServiceTrack = 'HR & Manpower Hiring' | 'AI Business Automation';

export type LeadAutomationStatus =
  | 'Instant Proposal Sent'
  | 'AI Screening Scheduled'
  | 'Discovery Call Booked';

export interface ClientLead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  region?: string;
  serviceTrack: LeadServiceTrack;
  requirement: string;
  priorityTag: 'Priority #1 VIP';
  status: LeadAutomationStatus;
  dispatchedChannels: string;
  whatsappPreview: string;
  emailSubject: string;
  emailBody: string;
  createdAt: string;
  webhookSynced?: boolean;
}

export interface SeoPackage {
  id: string;
  serviceName: string;
  targetLocation: string;
  category: string;
  pageTitle: string;
  metaDescription: string;
  lsiKeywords: string[];
  urlSlug: string;
  schemaJsonLd: string;
  createdAt: string;
}

export type ChecklistCategory =
  | 'Google Business Profile'
  | 'Local & PAN India Directories'
  | 'Automated Blog & Backlinks';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: ChecklistCategory;
  region: string;
  cadence: string;
  impact: 'High' | 'Medium';
  completed: boolean;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'info';
}
