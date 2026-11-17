import { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  Webhook,
  X,
} from 'lucide-react';
import type { ClientLead, LeadAutomationStatus } from '../types';

interface CrmPipelineProps {
  leads: ClientLead[];
  onUpdateStatus: (leadId: string, status: LeadAutomationStatus) => void;
  webhookUrl: string;
  onSaveWebhookUrl: (url: string) => void;
  onTestWebhook: (lead: ClientLead) => Promise<void>;
  onExportCsv: () => void;
  showWebhookConfig?: boolean;
}

export function CrmPipeline({
  leads,
  onUpdateStatus,
  webhookUrl,
  onSaveWebhookUrl,
  onTestWebhook,
  onExportCsv,
  showWebhookConfig = false,
}: CrmPipelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | LeadAutomationStatus>('All');
  const [selectedLead, setSelectedLead] = useState<ClientLead | null>(null);
  const [draftWebhook, setDraftWebhook] = useState(webhookUrl);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const sampleWebhookPayload = useMemo(
    () =>
      JSON.stringify(
        {
          source: 'RankFlow AI - Shri Shyam Consulting',
          id: 'LD-9412',
          priorityTag: 'Priority #1 VIP',
          region: 'PAN India (Multi-City)',
          serviceTrack: 'HR & Manpower Hiring',
          companyName: 'Bharat Heavy Industries',
          contactName: 'Suresh Verma',
          email: 's.verma@bharatheavy.in',
          phone: '+91 98261 77410',
          requirement: '30 SAP & Java Engineers across Bengaluru & Raipur',
          status: 'Instant Proposal Sent',
        },
        null,
        2
      ),
    []
  );

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
      const matchesQuery =
        !q ||
        lead.companyName.toLowerCase().includes(q) ||
        lead.contactName.toLowerCase().includes(q) ||
        lead.requirement.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [leads, searchQuery, statusFilter]);

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWebhookUrl(draftWebhook.trim());
  };

  return (
    <div className="space-y-6">
      {showWebhookConfig && (
        <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-2.5">
              <Webhook className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Make.com Webhook & Auto-Routing Bridge
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Optional: Connect a live Make.com Custom Webhook URL to sync Fast-Track VIP leads into Google Sheets, Gmail & WhatsApp Business API
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveWebhook} className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={draftWebhook}
              onChange={(e) => setDraftWebhook(e.target.value)}
              placeholder="https://hook.eu2.make.com/your-webhook-id"
              aria-label="Make.com Webhook URL"
              className="flex-1 px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Save Webhook URL
            </button>
            {webhookUrl && leads[0] && (
              <button
                type="button"
                disabled={isTestingWebhook}
                onClick={async () => {
                  setIsTestingWebhook(true);
                  try {
                    await onTestWebhook(leads[0]);
                  } finally {
                    setIsTestingWebhook(false);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {isTestingWebhook ? 'Sending...' : 'Send Test Payload'}
              </button>
            )}
          </form>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowBlueprint((prev) => !prev)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showBlueprint
                ? 'Hide PAN India Make.com Router Blueprint'
                : 'View PAN India Make.com Router Blueprint (Google Sheets + Gmail + WhatsApp)'}
            </button>

            {showBlueprint && (
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    4-Module Make.com PAN India Workflow
                  </p>
                  <ol className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                    <li>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">01.</span>{' '}
                      <span className="font-medium text-slate-800 dark:text-slate-200">Custom Webhook Trigger:</span>{' '}
                      Paste the Make.com URL above to receive every Fast-Track VIP lead JSON in real time.
                    </li>
                    <li>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">02.</span>{' '}
                      <span className="font-medium text-slate-800 dark:text-slate-200">PAN India Zone Router:</span>{' '}
                      Filter by <code className="font-mono">region</code> (Central CG, North, West, South, East) and <code className="font-mono">serviceTrack</code>.
                    </li>
                    <li>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">03.</span>{' '}
                      <span className="font-medium text-slate-800 dark:text-slate-200">Google Sheets CRM Sync:</span>{' '}
                      Append row with Lead ID, Priority #1 VIP, Company, Region, and Requirement.
                    </li>
                    <li>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">04.</span>{' '}
                      <span className="font-medium text-slate-800 dark:text-slate-200">Gmail + WhatsApp Business Cloud:</span>{' '}
                      Send <code className="font-mono">emailSubject</code> / <code className="font-mono">emailBody</code> and WhatsApp template alert automatically.
                    </li>
                  </ol>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Webhook JSON Schema
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(sampleWebhookPayload);
                        setCopiedPayload(true);
                        setTimeout(() => setCopiedPayload(false), 1800);
                      }}
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                      {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-700 dark:text-emerald-300 overflow-x-auto leading-relaxed">
                    <code>{sampleWebhookPayload}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Live CRM Pipeline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time captured leads with automated Priority #1 VIP tagging and proposal status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company or contact..."
                aria-label="Search CRM leads"
                className="w-full sm:w-56 pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Leads to CSV</span>
            </button>
          </div>
        </div>

        <div className="px-5 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto">
          {(
            [
              'All',
              'Instant Proposal Sent',
              'AI Screening Scheduled',
              'Discovery Call Booked',
            ] as const
          ).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {filteredLeads.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No CRM leads match your current filter
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Use the Client Fast-Track Portal to capture a new VIP lead or clear your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 pl-5 sm:pl-6 pr-3">Company & Contact</th>
                  <th className="py-3 px-3 hidden md:table-cell">Service Track</th>
                  <th className="py-3 px-3">Priority & Status</th>
                  <th className="py-3 px-3 hidden lg:table-cell">Dispatch</th>
                  <th className="py-3 pl-3 pr-5 sm:pr-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 pl-5 sm:pl-6 pr-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {lead.companyName}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{lead.contactName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{lead.region || 'PAN India'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{lead.createdAt}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 hidden md:table-cell">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {lead.serviceTrack}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px] mt-0.5">
                        {lead.requirement}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>{lead.priorityTag}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{lead.status}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                      {lead.dispatchedChannels}
                    </td>

                    <td className="py-3.5 pl-3 pr-5 sm:pr-6 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLead(lead)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedLead && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
        >
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3
                  id="lead-detail-title"
                  className="text-base font-semibold text-slate-900 dark:text-slate-100"
                >
                  {selectedLead.companyName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedLead.id} · {selectedLead.contactName} · {selectedLead.region || 'PAN India'} · {selectedLead.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Pipeline Status
                </label>
                <select
                  value={selectedLead.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value as LeadAutomationStatus;
                    onUpdateStatus(selectedLead.id, nextStatus);
                    setSelectedLead({ ...selectedLead, status: nextStatus });
                  }}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Instant Proposal Sent">Instant Proposal Sent</option>
                  <option value="AI Screening Scheduled">AI Screening Scheduled</option>
                  <option value="Discovery Call Booked">Discovery Call Booked</option>
                </select>
              </div>
              <div>
                <span className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Requirement Summary
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                  {selectedLead.requirement}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Dispatched WhatsApp Log ({selectedLead.phone})</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedLead.whatsappPreview}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-400 mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Dispatched Email Proposal</span>
                </div>
                <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                  {selectedLead.emailSubject}
                </p>
                <pre className="whitespace-pre-wrap font-sans text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedLead.emailBody}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {webhookUrl ? (
                <button
                  type="button"
                  onClick={() => onTestWebhook(selectedLead)}
                  className="px-3.5 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Push to Make.com Webhook
                </button>
              ) : (
                <span className="text-xs text-slate-400">Make.com webhook not configured</span>
              )}
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
