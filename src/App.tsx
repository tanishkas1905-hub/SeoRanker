import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckSquare,
  Download,
  ExternalLink,
  FileText,
  Globe,
  MapPin,
  Menu,
  Moon,
  Send,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react';
import {
  INITIAL_CHECKLIST,
  INITIAL_KEYWORDS,
  INITIAL_LEADS,
  INITIAL_SEO_SAMPLE,
  PAN_INDIA_HUBS,
  TRAFFIC_TREND_30D,
} from './data/seedData';
import type {
  ChecklistItem,
  ClientLead,
  KeywordRank,
  LeadAutomationStatus,
  NavSection,
  SeoPackage,
  ServiceCategory,
  ToastItem,
} from './types';
import { ToastContainer } from './components/ToastContainer';
import { TrafficChart } from './components/TrafficChart';
import { KeywordTracker } from './components/KeywordTracker';
import { SeoGenerator } from './components/SeoGenerator';
import { ClientFastTrackPortal } from './components/ClientFastTrackPortal';
import { CrmPipeline } from './components/CrmPipeline';
import { LocalSeoChecklist } from './components/LocalSeoChecklist';
import { SeoPerformanceReport } from './components/SeoPerformanceReport';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';

const STORAGE_KEYS = {
  theme: 'rankflow_theme_v1',
  keywords: 'rankflow_keywords_v1',
  leads: 'rankflow_leads_v1',
  checklist: 'rankflow_checklist_v1',
  seoHistory: 'rankflow_seo_history_v1',
  webhookUrl: 'rankflow_webhook_url_v1',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    return saved ? saved === 'dark' : true;
  });

  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobilePortalOpen, setIsMobilePortalOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const [keywords, setKeywords] = useState<KeywordRank[]>(() =>
    loadStored(STORAGE_KEYS.keywords, INITIAL_KEYWORDS)
  );
  const [leads, setLeads] = useState<ClientLead[]>(() =>
    loadStored(STORAGE_KEYS.leads, INITIAL_LEADS)
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() =>
    loadStored(STORAGE_KEYS.checklist, INITIAL_CHECKLIST)
  );
  const [seoHistory, setSeoHistory] = useState<SeoPackage[]>(() =>
    loadStored(STORAGE_KEYS.seoHistory, [INITIAL_SEO_SAMPLE])
  );
  const [webhookUrl, setWebhookUrl] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.webhookUrl) || ''
  );

  const [seoSeedInput, setSeoSeedInput] = useState<{
    serviceName?: string;
    category?: string;
  }>({});

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.keywords, JSON.stringify(keywords));
  }, [keywords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(checklist));
  }, [checklist]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.seoHistory, JSON.stringify(seoHistory));
  }, [seoHistory]);

  const addToast = useCallback(
    (title: string, description?: string, variant: 'success' | 'error' | 'info' = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const topOneCount = useMemo(
    () => keywords.filter((k) => k.rank === 1).length + 14,
    [keywords]
  );

  const topThreeCount = useMemo(
    () => keywords.filter((k) => k.rank <= 3).length + 28,
    [keywords]
  );

  const leadsTodayCount = useMemo(() => 20 + leads.length, [leads.length]);

  const handleAddKeyword = (kw: Omit<KeywordRank, 'id' | 'lastUpdated'>) => {
    const created: KeywordRank = {
      ...kw,
      id: `kw-${Date.now()}`,
      lastUpdated: 'Just now',
    };
    setKeywords((prev) => [created, ...prev]);
    addToast('Keyword Added to Tracker', `Monitoring "${created.keyword}" at Rank #${created.rank}.`);
  };

  const handleOptimizeKeyword = (keyword: string, category: ServiceCategory) => {
    const mappedCategory =
      category === 'AI Automation'
        ? 'AI Automation & Agents'
        : category === 'Compliance'
          ? 'Payroll & Compliance'
          : 'HR Recruitment & Staffing';
    setSeoSeedInput({ serviceName: keyword, category: mappedCategory });
    setActiveNav('seo-generator');
    addToast('Loaded into SEO Generator', `Ready to generate meta & schema for "${keyword}".`, 'info');
  };

  const forwardLeadToWebhook = async (lead: ClientLead): Promise<boolean> => {
    if (!webhookUrl) return false;
    try {
      const res = await fetch('/api/webhook/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          payload: lead,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Webhook delivery failed');
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Webhook failed';
      addToast('Make.com Webhook Warning', msg, 'error');
      return false;
    }
  };

  const handleSubmitLead = async (newLead: ClientLead) => {
    let synced = false;
    if (webhookUrl) {
      synced = await forwardLeadToWebhook(newLead);
    }
    setLeads((prev) => [{ ...newLead, webhookSynced: synced }, ...prev]);
    setIsMobilePortalOpen(false);
    addToast(
      'VIP Client Routed to CRM!',
      `${newLead.companyName} tagged Priority #1 VIP · WhatsApp & Email proposal dispatched.`
    );
  };

  const handleUpdateLeadStatus = (leadId: string, status: LeadAutomationStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
    addToast('CRM Status Updated', `Lead ${leadId} moved to "${status}".`);
  };

  const handleSaveWebhookUrl = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem(STORAGE_KEYS.webhookUrl, url);
    addToast(
      url ? 'Make.com Webhook Saved' : 'Webhook Cleared',
      url
        ? 'New Fast-Track VIP leads will forward automatically to Make.com.'
        : 'Webhook forwarding disabled.'
    );
  };

  const handleTestWebhook = async (lead: ClientLead) => {
    const ok = await forwardLeadToWebhook(lead);
    if (ok) {
      addToast('Webhook Payload Delivered', `Sent ${lead.companyName} (${lead.id}) to Make.com.`);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Lead ID',
      'Company Name',
      'Contact Name',
      'Email',
      'Phone',
      'PAN India Region',
      'Service Track',
      'Requirement',
      'Priority Tag',
      'Status',
      'Channels',
      'Captured',
    ];
    const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const rows = leads.map((l) =>
      [
        l.id,
        l.companyName,
        l.contactName,
        l.email,
        l.phone,
        l.region || 'PAN India (Multi-City)',
        l.serviceTrack,
        l.requirement,
        l.priorityTag,
        l.status,
        l.dispatchedChannels,
        l.createdAt,
      ]
        .map(escapeCell)
        .join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shri-shyam-consulting-vip-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Leads Exported to CSV', `${leads.length} VIP CRM records downloaded.`);
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddChecklistItem = (item: Omit<ChecklistItem, 'id' | 'completed'>) => {
    setChecklist((prev) => [{ ...item, id: `chk-${Date.now()}`, completed: false }, ...prev]);
    addToast('SEO Task Added', item.title);
  };

  const navItems: readonly { id: NavSection; label: string; icon: typeof BarChart3 }[] = [
    { id: 'dashboard', label: 'Overview & Rankings', icon: BarChart3 },
    { id: 'performance-report', label: 'SEO Performance Report', icon: FileText },
    { id: 'seo-generator', label: 'Auto-SEO Generator', icon: Sparkles },
    { id: 'local-seo', label: 'Local SEO & Backlinks', icon: CheckSquare },
    { id: 'crm-pipeline', label: 'CRM Pipeline & Webhook', icon: Users },
  ];

  const activeNavLabel = navItems.find((n) => n.id === activeNav)?.label || 'Overview & Rankings';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 z-30">
        <div className="h-16 px-6 flex items-center border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              RankFlow AI
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">Shri Shyam Consulting</p>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="flex-1 px-3 py-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="space-y-1.5 text-xs">
            <a
              href="https://www.shrishyamconsulting.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">shrishyamconsulting.in</span>
              </span>
              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
            </a>
            <a
              href="https://share.google/lpfED2zhNx6e5Te5m"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Google Business Profile</span>
              </span>
              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
            </a>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            {!avatarFailed ? (
              <img
                src="/src/assets/images/avatar_agency_lead_1794911593753.jpg"
                alt="Managing Director portrait"
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                RS
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                Rajesh Sharma
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Managing Partner · PAN India
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-full bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  RankFlow AI
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Shri Shyam Consulting</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveNav(item.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb on left, concise controls on right */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline whitespace-nowrap">
                Shri Shyam Consulting
              </span>
              <span className="text-slate-400 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {activeNavLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setIsMobilePortalOpen(true)}
              className="xl:hidden inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Lead Simulator</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Leads to CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shrink-0"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              {/* 4 KPI Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Organic Website Traffic
                  </p>
                  <p className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-2 tabular-nums">
                    48,920
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 tabular-nums">
                    +34.2% vs prior 30 days
                  </p>
                </div>

                <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Top #1 Ranked Keywords
                  </p>
                  <p className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-2 tabular-nums">
                    {topOneCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
                    {topThreeCount} keywords in Top 3 · PAN India
                  </p>
                </div>

                <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Incoming Client Leads Today
                  </p>
                  <p className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-2 tabular-nums">
                    {leadsTodayCount}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1.5">
                    Priority #1 VIP auto-routed
                  </p>
                </div>

                <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Auto-Conversion Rate
                  </p>
                  <p className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-2 tabular-nums">
                    38.6%
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1.5 tabular-nums">
                    +6.4% via instant proposal dispatch
                  </p>
                </div>
              </div>

              {/* Main Workspace Split: Analytics + Right Client Fast-Track Portal */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-8 space-y-6 min-w-0">
                  <TrafficChart data={TRAFFIC_TREND_30D} isDark={isDark} />
                  <KeywordTracker
                    keywords={keywords}
                    onAddKeyword={handleAddKeyword}
                    onOptimizeKeyword={handleOptimizeKeyword}
                  />
                  <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        PAN India Regional SEO & Mandate Coverage
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Active recruitment hubs, #1 search dominance, and regional routing desks across India
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <th className="py-3 pl-5 sm:pl-6 pr-3">Zone & Major Cities</th>
                            <th className="py-3 px-3 text-right">#1 Ranks</th>
                            <th className="py-3 px-3 text-right">Active Mandates</th>
                            <th className="py-3 pl-3 pr-5 sm:pr-6 hidden md:table-cell">Assigned Desk</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                          {PAN_INDIA_HUBS.map((hub) => (
                            <tr
                              key={hub.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="py-3.5 pl-5 sm:pl-6 pr-3">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {hub.zone}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {hub.cities}
                                </div>
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                                {hub.topKeywords}
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                                {hub.activeMandates}
                              </td>
                              <td className="py-3.5 pl-3 pr-5 sm:pr-6 text-xs text-slate-600 dark:text-slate-300 hidden md:table-cell">
                                {hub.assignedDesk}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  <CrmPipeline
                    leads={leads}
                    onUpdateStatus={handleUpdateLeadStatus}
                    webhookUrl={webhookUrl}
                    onSaveWebhookUrl={handleSaveWebhookUrl}
                    onTestWebhook={handleTestWebhook}
                    onExportCsv={handleExportCsv}
                  />
                </div>

                <div className="hidden xl:block xl:col-span-4 sticky top-22">
                  <ClientFastTrackPortal
                    onSubmitLead={handleSubmitLead}
                    webhookEnabled={Boolean(webhookUrl)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeNav === 'performance-report' && (
            <SeoPerformanceReport
              trafficTrend={TRAFFIC_TREND_30D}
              keywords={keywords}
              leads={leads}
              checklist={checklist}
              hubs={PAN_INDIA_HUBS}
              isDark={isDark}
              onNotify={addToast}
            />
          )}

          {activeNav === 'seo-generator' && (
            <SeoGenerator
              initialServiceName={seoSeedInput.serviceName}
              initialCategory={seoSeedInput.category}
              history={seoHistory}
              onGenerated={(pkg) => setSeoHistory((prev) => [pkg, ...prev])}
              onNotify={addToast}
            />
          )}

          {activeNav === 'local-seo' && (
            <LocalSeoChecklist
              items={checklist}
              onToggleItem={handleToggleChecklist}
              onAddItem={handleAddChecklistItem}
            />
          )}

          {activeNav === 'crm-pipeline' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-8 min-w-0">
                <CrmPipeline
                  leads={leads}
                  onUpdateStatus={handleUpdateLeadStatus}
                  webhookUrl={webhookUrl}
                  onSaveWebhookUrl={handleSaveWebhookUrl}
                  onTestWebhook={handleTestWebhook}
                  onExportCsv={handleExportCsv}
                  showWebhookConfig
                />
              </div>
              <div className="hidden xl:block xl:col-span-4 sticky top-22">
                <ClientFastTrackPortal
                  onSubmitLead={handleSubmitLead}
                  webhookEnabled={Boolean(webhookUrl)}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile / Tablet Slide-over for Client Fast-Track Portal */}
      {isMobilePortalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Client Fast-Track Portal Simulator"
          className="fixed inset-0 z-50 xl:hidden flex justify-end"
        >
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setIsMobilePortalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-slate-50 dark:bg-[#0B1120] p-4 overflow-y-auto z-10">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setIsMobilePortalOpen(false)}
                aria-label="Close lead simulator"
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ClientFastTrackPortal
              onSubmitLead={handleSubmitLead}
              webhookEnabled={Boolean(webhookUrl)}
            />
          </div>
        </div>
      )}

      <OfflineIndicator />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
