import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Heading,
  Image as ImageIcon,
  Loader2,
  RotateCw,
  ScanSearch,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { AuditSeverity, SeoAuditResult } from '../types';

interface SeoAuditSectionProps {
  audits: SeoAuditResult[];
  onSaveAudit: (audit: SeoAuditResult) => Promise<void> | void;
  onDeleteAudit: (auditId: string) => Promise<void> | void;
  onOptimizeInGenerator: (serviceName: string) => void;
  onNotify: (title: string, description?: string, variant?: 'success' | 'error' | 'info') => void;
}

const QUICK_URLS = [
  { label: 'shrishyamconsulting.in', url: 'https://www.shrishyamconsulting.in' },
  { label: 'Google Profile (share.google)', url: 'https://share.google/sZOsh81zkZOerljSO' },
  { label: 'example.com', url: 'https://example.com' },
];

function StatusLabel({ status }: { status: AuditSeverity }) {
  if (status === 'Pass') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Pass</span>
      </span>
    );
  }
  if (status === 'Warning') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>Warning</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 whitespace-nowrap shrink-0">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>Critical</span>
    </span>
  );
}

export function SeoAuditSection({
  audits,
  onSaveAudit,
  onDeleteAudit,
  onOptimizeInGenerator,
  onNotify,
}: SeoAuditSectionProps) {
  const [urlInput, setUrlInput] = useState('https://www.shrishyamconsulting.in');
  const [activeAudit, setActiveAudit] = useState<SeoAuditResult | null>(audits[0] ?? null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageFilter, setImageFilter] = useState<'all' | 'issues'>('all');

  useEffect(() => {
    if (!activeAudit && audits.length > 0) {
      setActiveAudit(audits[0]);
    } else if (activeAudit && audits.length > 0 && !audits.some((a) => a.id === activeAudit.id)) {
      setActiveAudit(audits[0]);
    }
  }, [audits, activeAudit]);

  const runAudit = async (targetUrl: string) => {
    const clean = targetUrl.trim();
    if (!clean) return;

    setUrlInput(clean);
    setIsAuditing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean }),
      });

      const data = (await res.json()) as SeoAuditResult & { error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || `Audit failed with HTTP ${res.status}`);
      }

      setActiveAudit(data);
      await onSaveAudit(data);
      onNotify(
        'SEO Audit Completed',
        `${data.passedChecks}/${data.totalChecks} checks passed for ${data.finalUrl}.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to audit the specified URL.';
      setErrorMsg(msg);
      onNotify('SEO Audit Failed', msg, 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runAudit(urlInput);
  };

  const filteredImages = useMemo(() => {
    if (!activeAudit) return [];
    if (imageFilter === 'issues') {
      return activeAudit.images.items.filter((img) => img.status !== 'valid');
    }
    return activeAudit.images.items;
  }, [activeAudit, imageFilter]);

  const altCoveragePct = useMemo(() => {
    if (!activeAudit) return 100;
    const { totalCount, withAltCount } = activeAudit.images;
    if (totalCount === 0) return 100;
    return Math.round((withAltCount / totalCount) * 100);
  }, [activeAudit]);

  const titleLengthState = useMemo(() => {
    if (!activeAudit) return { label: 'Missing', tone: 'text-red-600 dark:text-red-400' };
    const len = activeAudit.meta.titleLength;
    if (len === 0) return { label: 'Missing', tone: 'text-red-600 dark:text-red-400' };
    if (len >= 25 && len <= 60)
      return { label: 'Optimal (<= 60 chars)', tone: 'text-emerald-600 dark:text-emerald-400' };
    if (len <= 65) return { label: 'Slightly Long', tone: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Too Long (SERP Truncation)', tone: 'text-red-600 dark:text-red-400' };
  }, [activeAudit]);

  const descLengthState = useMemo(() => {
    if (!activeAudit) return { label: 'Missing', tone: 'text-red-600 dark:text-red-400' };
    const len = activeAudit.meta.descriptionLength;
    if (len === 0) return { label: 'Missing', tone: 'text-red-600 dark:text-red-400' };
    if (len >= 100 && len <= 160)
      return { label: 'Optimal (<= 160 chars)', tone: 'text-emerald-600 dark:text-emerald-400' };
    if (len < 100) return { label: 'Too Short', tone: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Too Long (> 160 chars)', tone: 'text-amber-600 dark:text-amber-400' };
  }, [activeAudit]);

  return (
    <div className="space-y-6">
      {/* URL Analyzer Form Card */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              On-Page URL SEO Audit
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Analyze live HTML for meta tag completeness, H1–H6 header hierarchy, and image alt attributes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_URLS.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => void runAudit(preset.url)}
                disabled={isAuditing}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 min-w-0">
            <label
              htmlFor="seo-audit-url"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Target Page URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="seo-audit-url"
                type="text"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://www.shrishyamconsulting.in"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuditing}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Auditing URL...</span>
              </>
            ) : (
              <>
                <ScanSearch className="w-4 h-4" />
                <span>Run SEO Audit</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-700 dark:text-red-300"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              disabled={isAuditing}
              onClick={() => void runAudit(urlInput)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-md transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry Audit</span>
            </button>
          </div>
        )}
      </section>

      {/* Loading Skeleton State */}
      {isAuditing && (
        <div className="space-y-6" aria-busy="true" aria-label="Analyzing target URL">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((slot) => (
              <div
                key={slot}
                className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800/70 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((slot) => (
              <div
                key={slot}
                className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 h-72 space-y-4"
              >
                <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/70 rounded" />
                <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-800/70 rounded" />
                <div className="h-3 w-4/6 bg-slate-100 dark:bg-slate-800/70 rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isAuditing && !activeAudit && (
        <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <div className="max-w-lg mx-auto space-y-3">
            <ScanSearch className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              No Page Audits Recorded Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter any public website URL above to inspect live meta tags, Open Graph metadata,
              H1–H6 heading outline, and image alt attribute coverage.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => void runAudit('https://www.shrishyamconsulting.in')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <ScanSearch className="w-3.5 h-3.5" />
                <span>Audit www.shrishyamconsulting.in</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Populated Card-Based Audit Results */}
      {!isAuditing && activeAudit && (
        <>
          {/* Audited URL Context Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
              <a
                href={activeAudit.finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-full"
              >
                <span className="truncate">{activeAudit.finalUrl}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">HTTP {activeAudit.httpStatus}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{activeAudit.responseTimeMs} ms</span>
              <span aria-hidden="true">·</span>
              <span>Audited {activeAudit.auditedAt}</span>
            </div>

            <button
              type="button"
              onClick={() =>
                onOptimizeInGenerator(
                  activeAudit.meta.title || activeAudit.finalUrl.replace(/^https?:\/\//, '')
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimize in SEO Generator</span>
            </button>
          </div>

          {/* 4 Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Checks Passed
              </p>
              <p className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-2 tabular-nums">
                {activeAudit.passedChecks} / {activeAudit.totalChecks}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
                HTTP {activeAudit.httpStatus} · {activeAudit.responseTimeMs} ms fetch
              </p>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Meta Tags Health
                </p>
                <StatusLabel status={activeAudit.meta.status} />
              </div>
              <p className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-2 tabular-nums">
                {activeAudit.meta.titleLength} / {activeAudit.meta.descriptionLength}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Title &amp; description character lengths
              </p>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Header Hierarchy
                </p>
                <StatusLabel status={activeAudit.headings.status} />
              </div>
              <p className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-2 tabular-nums">
                {activeAudit.headings.h1Count} H1 · {activeAudit.headings.totalCount} Total
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
                {activeAudit.headings.skippedTransitions.length === 0
                  ? 'Sequential H1–H6 nesting'
                  : `${activeAudit.headings.skippedTransitions.length} hierarchy skip(s)`}
              </p>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Image Alt Coverage
                </p>
                <StatusLabel status={activeAudit.images.status} />
              </div>
              <p className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-2 tabular-nums">
                {altCoveragePct}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
                {activeAudit.images.withAltCount} of {activeAudit.images.totalCount} images with alt
              </p>
            </div>
          </div>

          {/* 3-Card Deep Inspection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Card 1: Meta Tags & SERP Preview */}
            <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    Meta Tags &amp; Open Graph
                  </h3>
                </div>
                <StatusLabel status={activeAudit.meta.status} />
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                <div className="p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      Page Title
                    </span>
                    <span className={`font-mono tabular-nums font-semibold ${titleLengthState.tone}`}>
                      {activeAudit.meta.titleLength} chars · {titleLengthState.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
                    {activeAudit.meta.title || 'No <title> tag detected'}
                  </p>
                </div>

                <div className="p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      Meta Description
                    </span>
                    <span className={`font-mono tabular-nums font-semibold ${descLengthState.tone}`}>
                      {activeAudit.meta.descriptionLength} chars · {descLengthState.label}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                    {activeAudit.meta.description || 'No meta description tag detected'}
                  </p>
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-slate-500 dark:text-slate-400 shrink-0">
                      Canonical URL
                    </span>
                    <span className="text-right font-mono text-slate-800 dark:text-slate-200 break-all">
                      {activeAudit.meta.canonical || 'Missing'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-slate-500 dark:text-slate-400 shrink-0">
                      Robots Directive
                    </span>
                    <span className="text-right font-mono text-slate-800 dark:text-slate-200">
                      {activeAudit.meta.robots}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-slate-500 dark:text-slate-400 shrink-0">
                      Mobile Viewport
                    </span>
                    <span className="text-right font-mono text-slate-800 dark:text-slate-200">
                      {activeAudit.meta.viewport || 'Missing'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-slate-500 dark:text-slate-400 shrink-0">
                      Open Graph
                    </span>
                    <span className="text-right text-slate-800 dark:text-slate-200">
                      {activeAudit.meta.ogTitle
                        ? `Present (${activeAudit.meta.ogImage ? 'with og:image' : 'no og:image'})`
                        : 'Missing og:title'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-slate-500 dark:text-slate-400 shrink-0">
                      Twitter Card
                    </span>
                    <span className="text-right font-mono text-slate-800 dark:text-slate-200">
                      {activeAudit.meta.twitterCard || 'Not specified'}
                    </span>
                  </div>
                </div>

                {/* Live SERP Preview */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-b-xl space-y-1">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Search Snippet Preview
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {activeAudit.finalUrl}
                  </p>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400 line-clamp-1">
                    {activeAudit.meta.title || 'Untitled Page'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {activeAudit.meta.description ||
                      'Add a compelling meta description so search engines display an accurate summary.'}
                  </p>
                </div>
              </div>
            </section>

            {/* Card 2: Header Hierarchy (H1-H6) */}
            <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Heading className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    Header Hierarchy (H1–H6)
                  </h3>
                </div>
                <StatusLabel status={activeAudit.headings.status} />
              </div>

              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-6 border border-slate-200 dark:border-slate-800 rounded-lg divide-x divide-slate-200 dark:divide-slate-800 text-center">
                  {(
                    [
                      ['H1', activeAudit.headings.h1Count],
                      ['H2', activeAudit.headings.h2Count],
                      ['H3', activeAudit.headings.h3Count],
                      ['H4', activeAudit.headings.h4Count],
                      ['H5', activeAudit.headings.h5Count],
                      ['H6', activeAudit.headings.h6Count],
                    ] as const
                  ).map(([tag, count]) => (
                    <div key={tag} className="py-2 px-1">
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {tag}
                      </p>
                      <p className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                        {count}
                      </p>
                    </div>
                  ))}
                </div>

                {activeAudit.headings.skippedTransitions.length > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                    Skipped levels: {activeAudit.headings.skippedTransitions.join(' · ')}
                  </p>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {activeAudit.headings.nodes.length === 0 ? (
                  <p className="p-5 text-xs text-slate-500 dark:text-slate-400 text-center">
                    No H1–H6 headings found in the rendered HTML document.
                  </p>
                ) : (
                  activeAudit.headings.nodes.map((node, idx) => {
                    const indentClass =
                      node.level === 1
                        ? 'pl-4'
                        : node.level === 2
                          ? 'pl-7'
                          : node.level === 3
                            ? 'pl-10'
                            : node.level === 4
                              ? 'pl-13'
                              : 'pl-16';
                    return (
                      <div
                        key={`${node.level}-${idx}`}
                        className={`py-2.5 pr-4 ${indentClass} flex items-baseline gap-2.5 text-xs`}
                      >
                        <span
                          className={`font-mono font-semibold shrink-0 ${
                            node.level === 1
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          H{node.level}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 leading-snug break-words">
                          {node.text}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Card 3: Image Alt Text Inspector */}
            <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    Image Alt Text
                  </h3>
                </div>
                <StatusLabel status={activeAudit.images.status} />
              </div>

              <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-3 border border-slate-200 dark:border-slate-800 rounded-lg divide-x divide-slate-200 dark:divide-slate-800 text-center">
                  <div className="py-2 px-2">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      With Alt
                    </p>
                    <p className="text-sm font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {activeAudit.images.withAltCount}
                    </p>
                  </div>
                  <div className="py-2 px-2">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Empty Alt
                    </p>
                    <p className="text-sm font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
                      {activeAudit.images.emptyAltCount}
                    </p>
                  </div>
                  <div className="py-2 px-2">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Missing Alt
                    </p>
                    <p className="text-sm font-bold font-mono tabular-nums text-red-600 dark:text-red-400 mt-0.5">
                      {activeAudit.images.missingAltCount}
                    </p>
                  </div>
                </div>

                <div
                  role="tablist"
                  aria-label="Filter audited images"
                  className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={imageFilter === 'all'}
                    onClick={() => setImageFilter('all')}
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      imageFilter === 'all'
                        ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    All Images ({activeAudit.images.items.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={imageFilter === 'issues'}
                    onClick={() => setImageFilter('issues')}
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      imageFilter === 'issues'
                        ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Needs Attention (
                    {activeAudit.images.emptyAltCount + activeAudit.images.missingAltCount})
                  </button>
                </div>
              </div>

              <div className="max-h-84 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {activeAudit.images.totalCount === 0 ? (
                  <p className="p-5 text-xs text-slate-500 dark:text-slate-400 text-center">
                    No &lt;img&gt; elements detected on this page.
                  </p>
                ) : filteredImages.length === 0 ? (
                  <p className="p-5 text-xs text-emerald-600 dark:text-emerald-400 text-center font-medium">
                    Every detected image has descriptive alt text.
                  </p>
                ) : (
                  filteredImages.map((img, idx) => (
                    <div key={`${img.src}-${idx}`} className="p-3.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-500 dark:text-slate-400 truncate">
                          {img.src}
                        </span>
                        <span
                          className={`font-semibold shrink-0 ${
                            img.status === 'valid'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : img.status === 'empty'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {img.status === 'valid'
                            ? 'Alt OK'
                            : img.status === 'empty'
                              ? 'Empty alt=""'
                              : 'Missing alt'}
                        </span>
                      </div>
                      {img.status === 'valid' && (
                        <p className="text-slate-800 dark:text-slate-200 break-words">
                          &ldquo;{img.alt}&rdquo;
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Recommendations & Recent Saved Audits */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <section className="lg:col-span-7 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Prioritized On-Page Fixes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Actionable technical recommendations generated from the live crawl
                </p>
              </div>
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {activeAudit.recommendations.map((rec, idx) => (
                  <li key={idx} className="p-4 flex items-start gap-3 text-xs sm:text-sm">
                    <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span className="text-slate-700 dark:text-slate-200 leading-relaxed">
                      {rec}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="lg:col-span-5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Saved Audit History
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Click any URL snapshot to review or re-run
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {audits.length} saved
                </span>
              </div>

              {audits.length === 0 ? (
                <p className="p-5 text-xs text-slate-500 dark:text-slate-400">
                  Your recent URL audits will appear here.
                </p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-80 overflow-y-auto">
                  {audits.map((item) => {
                    const isSelected = item.id === activeAudit.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? 'bg-blue-50/60 dark:bg-blue-950/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveAudit(item)}
                          className="text-left min-w-0 flex-1"
                        >
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.finalUrl.replace(/^https?:\/\//, '')}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                            {item.passedChecks}/{item.totalChecks} checks · {item.auditedAt}
                          </p>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => void runAudit(item.url)}
                            aria-label={`Re-run audit for ${item.url}`}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDeleteAudit(item.id)}
                            aria-label={`Delete audit for ${item.url}`}
                            className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
