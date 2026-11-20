import { useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { AutopilotCadence, GrowthCyclePack } from '../types';

interface RankAutopilotCardProps {
  cadence: AutopilotCadence;
  focusZone: string;
  lastRunIso: string | null;
  latestPack: GrowthCyclePack | null;
  isRunning: boolean;
  errorMsg: string | null;
  webhookEnabled: boolean;
  onChangeCadence: (cadence: AutopilotCadence) => void;
  onChangeFocusZone: (zone: string) => void;
  onRunNow: () => Promise<void>;
  onDispatchWebhook: (pack: GrowthCyclePack) => Promise<void>;
  onOpenSeoGenerator: (serviceName: string) => void;
}

const FOCUS_OPTIONS = [
  'PAN India HR & AI Growth',
  'Durg & Chhattisgarh Local Pack',
  'Enterprise IT & Non-IT Staffing',
  'AI Voice Agents & CRM Automation',
] as const;

const CADENCE_OPTIONS: readonly { id: AutopilotCadence; label: string; intervalLabel: string }[] = [
  { id: 'manual', label: 'Manual', intervalLabel: 'On demand' },
  { id: 'daily', label: 'Daily', intervalLabel: 'Every 24 hours' },
  { id: '3days', label: '3 Days', intervalLabel: 'Every 72 hours' },
  { id: 'weekly', label: 'Weekly', intervalLabel: 'Every 7 days' },
];

export function RankAutopilotCard({
  cadence,
  focusZone,
  lastRunIso,
  latestPack,
  isRunning,
  errorMsg,
  webhookEnabled,
  onChangeCadence,
  onChangeFocusZone,
  onRunNow,
  onDispatchWebhook,
  onOpenSeoGenerator,
}: RankAutopilotCardProps) {
  const [copiedPost, setCopiedPost] = useState(false);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  const scheduleSummary = useMemo(() => {
    if (cadence === 'manual') return 'Manual updates only';
    const msMap: Record<Exclude<AutopilotCadence, 'manual'>, number> = {
      daily: 24 * 60 * 60 * 1000,
      '3days': 3 * 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
    };
    const base = lastRunIso ? new Date(lastRunIso).getTime() : Date.now();
    const nextDate = new Date(base + msMap[cadence]);
    return `Next auto-update: ${nextDate.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })}, ${nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }, [cadence, lastRunIso]);

  const handleCopyGbpPost = async () => {
    if (!latestPack) return;
    const text = `${latestPack.gbpPost.headline}\n\n${latestPack.gbpPost.body}\n\n${latestPack.gbpPost.ctaLabel}: ${latestPack.gbpPost.ctaUrl}\nGoogle Profile: https://share.google/sZOsh81zkZOerljSO`;
    await navigator.clipboard.writeText(text);
    setCopiedPost(true);
    setTimeout(() => setCopiedPost(false), 1800);
  };

  const handleSendWebhook = async () => {
    if (!latestPack) return;
    setIsSendingWebhook(true);
    try {
      await onDispatchWebhook(latestPack);
    } finally {
      setIsSendingWebhook(false);
    }
  };

  return (
    <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl">
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Shri Shyam Consulting · Rank &amp; Traffic Autopilot
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Regularly refresh SERP rankings, discover high-intent keywords, and generate Google Business Profile &amp; blog traffic packs for{' '}
            <span className="font-mono text-slate-700 dark:text-slate-300">shrishyamconsulting.in</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isRunning}
            onClick={() => void onRunNow()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating Ranks &amp; Traffic...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Run Rank &amp; Traffic Update</span>
              </>
            )}
          </button>

          {webhookEnabled && latestPack && (
            <button
              type="button"
              disabled={isSendingWebhook}
              onClick={() => void handleSendWebhook()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isSendingWebhook ? 'Dispatching...' : 'Send to Make.com'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Controls Bar: Focus Area + Regular Update Schedule */}
      <div className="p-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 min-w-0">
          <label
            htmlFor="autopilot-focus-select"
            className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap"
          >
            Growth Focus:
          </label>
          <select
            id="autopilot-focus-select"
            value={focusZone}
            onChange={(e) => onChangeFocusZone(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {FOCUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
            <CalendarClock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Auto-Update Cadence:</span>
          </span>
          <div
            role="group"
            aria-label="Regular SEO update schedule"
            className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto"
          >
            {CADENCE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeCadence(opt.id)}
                title={opt.intervalLabel}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  cadence === opt.id
                    ? 'bg-white dark:bg-[#0F172A] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mx-5 sm:mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300"
        >
          {errorMsg}
        </div>
      )}

      {/* Latest Growth Pack Output or Ready State */}
      {latestPack ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Google Business Profile Post */}
          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Google Business Profile Post (Ready to Publish)
              </h3>
              <button
                type="button"
                onClick={() => void handleCopyGbpPost()}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
              >
                {copiedPost ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPost ? 'Copied Post' : 'Copy GBP Post'}</span>
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {latestPack.gbpPost.headline}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {latestPack.gbpPost.body}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <a
                href="https://share.google/sZOsh81zkZOerljSO"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <span>Open Google Profile (share.google)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-400" aria-hidden="true">
                ·
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                CTA: {latestPack.gbpPost.ctaLabel}
              </span>
            </div>
          </div>

          {/* High-Traffic SEO Landing Brief & Run Summary */}
          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Traffic Landing Page &amp; Schema Added
              </h3>
              <button
                type="button"
                onClick={() => onOpenSeoGenerator(latestPack.seoPackage.serviceName)}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open in SEO Generator</span>
              </button>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                {latestPack.seoPackage.pageTitle}
              </p>
              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                www.shrishyamconsulting.in{latestPack.seoPackage.urlSlug}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {latestPack.seoPackage.metaDescription}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span>+{latestPack.newKeywords.length} keywords tracked</span>
              <span aria-hidden="true">·</span>
              <span>{latestPack.keywordsPromoted} rank improvements</span>
              <span aria-hidden="true">·</span>
              <span>+{latestPack.trafficLiftEstimate} visits logged</span>
              <span aria-hidden="true">·</span>
              <span>+1 checklist task</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Ready to launch your first Ranking &amp; Traffic Cycle
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click &ldquo;Run Rank &amp; Traffic Update&rdquo; to refresh keyword ranks, log new organic visits, and generate a ready-to-publish Google Business Profile post + SEO landing brief.
            </p>
          </div>
        </div>
      )}

      {/* Quiet Footer Schedule Strip */}
      <div className="px-5 sm:px-6 py-3 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 rounded-b-xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {latestPack ? `Last updated ${latestPack.generatedAt} (${latestPack.focusZone})` : 'No growth cycle run yet'}
        </span>
        <span>{scheduleSummary}</span>
      </div>
    </section>
  );
}
