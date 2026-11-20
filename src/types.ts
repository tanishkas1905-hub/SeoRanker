export type NavSection =
  | 'dashboard'
  | 'seo-audit'
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

export type AuditSeverity = 'Pass' | 'Warning' | 'Critical';

export interface AuditHeadingNode {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface AuditImageItem {
  src: string;
  alt: string;
  status: 'valid' | 'empty' | 'missing';
}

export interface SeoAuditResult {
  id: string;
  url: string;
  finalUrl: string;
  httpStatus: number;
  responseTimeMs: number;
  auditedAt: string;
  passedChecks: number;
  totalChecks: number;
  meta: {
    status: AuditSeverity;
    title: string;
    titleLength: number;
    description: string;
    descriptionLength: number;
    canonical: string;
    robots: string;
    viewport: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    twitterCard: string;
  };
  headings: {
    status: AuditSeverity;
    totalCount: number;
    h1Count: number;
    h2Count: number;
    h3Count: number;
    h4Count: number;
    h5Count: number;
    h6Count: number;
    skippedTransitions: string[];
    nodes: AuditHeadingNode[];
  };
  images: {
    status: AuditSeverity;
    totalCount: number;
    withAltCount: number;
    emptyAltCount: number;
    missingAltCount: number;
    items: AuditImageItem[];
  };
  recommendations: string[];
}

export type AutopilotCadence = 'manual' | 'daily' | '3days' | 'weekly';

export interface GrowthCyclePack {
  id: string;
  focusZone: string;
  generatedAt: string;
  gbpPost: {
    headline: string;
    body: string;
    ctaLabel: string;
    ctaUrl: string;
  };
  newKeywords: Omit<KeywordRank, 'id' | 'lastUpdated'>[];
  seoPackage: SeoPackage;
  trafficTask: Omit<ChecklistItem, 'id' | 'completed'>;
  keywordsPromoted: number;
  trafficLiftEstimate: number;
}
