import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { ClientLead, IndiaZone, LeadServiceTrack } from '../types';

const INDIA_ZONES: readonly IndiaZone[] = [
  'PAN India (Multi-City)',
  'Central India (Durg / Raipur)',
  'North India (Delhi NCR)',
  'West India (Mumbai / Pune)',
  'South India (Bengaluru / Hyderabad / Chennai)',
  'East India (Kolkata / Bhubaneswar)',
];

interface ClientFastTrackPortalProps {
  onSubmitLead: (lead: ClientLead) => Promise<void>;
  webhookEnabled: boolean;
}

const QUICK_FILLS: Record<
  LeadServiceTrack,
  { companyName: string; requirement: string; contactName: string; email: string; phone: string }
> = {
  'HR & Manpower Hiring': {
    companyName: 'Chhattisgarh Steel & Power Ltd',
    requirement: '25 Mechanical Engineers & 60 Skilled Plant Technicians for Raipur & Durg units',
    contactName: 'Arvind Tiwari',
    email: 'a.tiwari@cgsteelpower.in',
    phone: '+91 98261 77410',
  },
  'AI Business Automation': {
    companyName: 'Apex Realty Group Pune',
    requirement: 'Multilingual AI Voice Agent + Automated WhatsApp Site-Visit Booking & CRM Sync',
    contactName: 'Neha Deshpande',
    email: 'neha@apexrealtypune.in',
    phone: '+91 97654 22180',
  },
};

export function ClientFastTrackPortal({
  onSubmitLead,
  webhookEnabled,
}: ClientFastTrackPortalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [serviceTrack, setServiceTrack] = useState<LeadServiceTrack>('HR & Manpower Hiring');
  const [region, setRegion] = useState<IndiaZone>('PAN India (Multi-City)');
  const [companyName, setCompanyName] = useState('');
  const [requirement, setRequirement] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchedLead, setDispatchedLead] = useState<ClientLead | null>(null);

  const handleSelectTrack = (track: LeadServiceTrack) => {
    setServiceTrack(track);
    setStep(2);
  };

  const handleAutofill = () => {
    const sample = QUICK_FILLS[serviceTrack];
    setCompanyName(sample.companyName);
    setRequirement(sample.requirement);
    setContactName(sample.contactName);
    setEmail(sample.email);
    setPhone(sample.phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !requirement.trim() || !contactName.trim() || !email.trim()) return;

    setIsSubmitting(true);

    const isHr = serviceTrack === 'HR & Manpower Hiring';
    const newLead: ClientLead = {
      id: `LD-${Math.floor(9410 + Math.random() * 580)}`,
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      phone: phone.trim() || '+91 98260 00100',
      region,
      serviceTrack,
      requirement: requirement.trim(),
      priorityTag: 'Priority #1 VIP',
      status: isHr ? 'Instant Proposal Sent' : 'AI Screening Scheduled',
      dispatchedChannels: 'WhatsApp + Email',
      whatsappPreview: isHr
        ? `Namaste ${contactName.trim()}, Shri Shyam Consulting (${region}) has assigned Priority #1 VIP routing for ${companyName.trim()}. Our Staffing & Compliance Proposal for "${requirement.trim()}" has been sent to ${email.trim()}.`
        : `Hello ${contactName.trim()}, Shri Shyam Consulting AI Lab (${region}) has received ${companyName.trim()}'s automation mandate ("${requirement.trim()}"). Architecture brief emailed to ${email.trim()} and AI Screening is scheduled.`,
      emailSubject: `Priority #1 VIP Proposal (${region}): ${serviceTrack} — ${companyName.trim()}`,
      emailBody: `Dear ${contactName.trim()},\n\nThank you for connecting with Shri Shyam Consulting via our Client Fast-Track Portal.\n\nTarget Region: ${region}\nRequirement: ${requirement.trim()}\nAssigned Track: ${serviceTrack}\nSLA: Dedicated Lead Consultant response within 15 minutes.\n\nWarm regards,\nShri Shyam Consulting · PAN India Desk\nWeb: https://www.shrishyamconsulting.in\nGoogle Business Profile: https://share.google/lpfED2zhNx6e5Te5m`,
      createdAt: 'Just now',
      webhookSynced: webhookEnabled,
    };

    try {
      await onSubmitLead(newLead);
      setDispatchedLead(newLead);
      setCompanyName('');
      setRequirement('');
      setContactName('');
      setEmail('');
      setPhone('');
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Client Fast-Track Portal
          </h2>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
            Step {step} / 2
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Live website lead simulator · Instant VIP qualification & proposal dispatch
        </p>
      </div>

      <div className="p-5 flex-1">
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                1. Select Client Requirement Track
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Simulates an inbound B2B visitor choosing a service line
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSelectTrack('HR & Manpower Hiring')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 bg-slate-50/60 dark:bg-slate-900/60 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        HR & Manpower Hiring
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        PAN India IT/Non-IT staffing, bulk plant recruitment, and PF/ESIC payroll compliance
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 mt-1 transition-colors" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTrack('AI Business Automation')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 bg-slate-50/60 dark:bg-slate-900/60 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        AI Business Automation
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Custom AI voice agents, WhatsApp lead bots, Make.com workflows, and CRM pipelines
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-1 transition-colors" />
                </div>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Auto-assigns Priority #1 VIP Tag on submission</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Dispatches WhatsApp + Email proposal deck</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← Change Track
              </button>
              <button
                type="button"
                onClick={handleAutofill}
                className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline"
              >
                Quick Fill Sample
              </button>
            </div>

            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Selected Track: <span className="text-slate-900 dark:text-white font-semibold">{serviceTrack}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                PAN India Hub / Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as IndiaZone)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {INDIA_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Jindal Industrial Services"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hiring or Automation Requirement
              </label>
              <textarea
                rows={2}
                required
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="Describe roles, headcount, or workflow scope..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.in"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98261..."
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Routing VIP Lead...' : 'Submit & Auto-Dispatch Proposal'}</span>
            </button>
          </form>
        )}
      </div>

      {dispatchedLead && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispatch-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
        >
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3
                    id="dispatch-modal-title"
                    className="text-base font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Instant Proposal Dispatched
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {dispatchedLead.companyName} · {dispatchedLead.priorityTag} · {dispatchedLead.status}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispatchedLead(null)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Simulated WhatsApp Alert ({dispatchedLead.phone})</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {dispatchedLead.whatsappPreview}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-400 mb-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Simulated Email Proposal ({dispatchedLead.email})</span>
                </div>
                <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                  Subject: {dispatchedLead.emailSubject}
                </p>
                <pre className="whitespace-pre-wrap font-sans text-slate-600 dark:text-slate-300 leading-relaxed">
                  {dispatchedLead.emailBody}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setDispatchedLead(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
