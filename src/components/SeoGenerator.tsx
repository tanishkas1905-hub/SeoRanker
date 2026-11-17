import { useEffect, useState } from 'react';
import { AlertCircle, Check, Copy, Loader2, Sparkles } from 'lucide-react';
import type { SeoPackage } from '../types';

interface SeoGeneratorProps {
  initialServiceName?: string;
  initialCategory?: string;
  history: SeoPackage[];
  onGenerated: (pkg: SeoPackage) => void;
  onNotify: (title: string, description?: string, variant?: 'success' | 'error' | 'info') => void;
}

const PRESET_PROMPTS = [
  {
    serviceName: 'Java Developer Staffing',
    targetLocation: 'PAN India',
    category: 'HR Recruitment & Staffing',
  },
  {
    serviceName: 'Real Estate AI Voice Agent',
    targetLocation: 'Bengaluru & Mumbai',
    category: 'AI Automation & Agents',
  },
  {
    serviceName: 'Payroll Outsourcing & PF Compliance',
    targetLocation: 'Durg, Chhattisgarh',
    category: 'Payroll & Compliance',
  },
];

export function SeoGenerator({
  initialServiceName,
  initialCategory,
  history,
  onGenerated,
  onNotify,
}: SeoGeneratorProps) {
  const [serviceName, setServiceName] = useState(initialServiceName || 'Java Developer Staffing');
  const [targetLocation, setTargetLocation] = useState('PAN India');
  const [category, setCategory] = useState(initialCategory || 'HR Recruitment & Staffing');
  const [activePackage, setActivePackage] = useState<SeoPackage>(history[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (initialServiceName) {
      setServiceName(initialServiceName);
    }
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialServiceName, initialCategory]);

  const handleCopy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      onNotify(`${label} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      onNotify('Clipboard access blocked', 'Please select and copy manually.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: serviceName.trim(),
          targetLocation: targetLocation.trim() || 'PAN India',
          category,
        }),
      });

      const data = (await res.json()) as {
        pageTitle?: string;
        metaDescription?: string;
        lsiKeywords?: string[];
        urlSlug?: string;
        schemaJsonLd?: string;
        error?: string;
      };

      if (!res.ok || data.error) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const generated: SeoPackage = {
        id: `seo-${Date.now()}`,
        serviceName: serviceName.trim(),
        targetLocation: targetLocation.trim() || 'PAN India',
        category,
        pageTitle: data.pageTitle || '',
        metaDescription: data.metaDescription || '',
        lsiKeywords: data.lsiKeywords || [],
        urlSlug: data.urlSlug || '/services',
        schemaJsonLd: data.schemaJsonLd || '{}',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setActivePackage(generated);
      onGenerated(generated);
      onNotify('SEO Tags Generated!', `Title, Meta, LSI keywords & JSON-LD ready for ${generated.serviceName}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to generate SEO package.';
      setErrorMsg(msg);
      onNotify('Generation failed', msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const schemaSnippet = `<script type="application/ld+json">\n${activePackage.schemaJsonLd}\n</script>`;

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              One-Click Auto-SEO Content & Meta Generator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Generate search-engine-ready page titles, high-CTR meta descriptions, LSI keywords, and Schema.org JSON-LD
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_PROMPTS.map((preset) => (
              <button
                key={preset.serviceName}
                type="button"
                onClick={() => {
                  setServiceName(preset.serviceName);
                  setTargetLocation(preset.targetLocation);
                  setCategory(preset.category);
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                {preset.serviceName}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label
              htmlFor="seo-service-name"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Service Name or Job Role
            </label>
            <input
              id="seo-service-name"
              type="text"
              required
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g., Java Developer Staffing or Real Estate AI Voice Agent"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="seo-target-location"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Target Location
            </label>
            <input
              id="seo-target-location"
              type="text"
              required
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              placeholder="PAN India, Durg CG, Bengaluru..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="seo-category"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Division
            </label>
            <select
              id="seo-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="HR Recruitment & Staffing">HR Staffing</option>
              <option value="AI Automation & Agents">AI Automation</option>
              <option value="Payroll & Compliance">Compliance</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate SEO</span>
                </>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              Retry Now
            </button>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-7 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800">
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Google Search Result Preview
              </span>
              <a
                href="https://www.shrishyamconsulting.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 underline-offset-2 hover:underline"
              >
                www.shrishyamconsulting.in{activePackage.urlSlug}
              </a>
            </div>
            <p className="text-lg font-semibold text-blue-700 dark:text-blue-400 leading-snug">
              {activePackage.pageTitle}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              {activePackage.metaDescription}
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  SEO Page Title
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      activePackage.pageTitle.length <= 60
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {activePackage.pageTitle.length} / 60 chars
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('Page Title', activePackage.pageTitle)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copiedField === 'Page Title' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5">
                {activePackage.pageTitle}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  High-CTR Meta Description
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      activePackage.metaDescription.length <= 160
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {activePackage.metaDescription.length} / 160 chars
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('Meta Description', activePackage.metaDescription)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copiedField === 'Meta Description' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 leading-relaxed">
                {activePackage.metaDescription}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  LSI & Long-Tail Keywords ({activePackage.lsiKeywords.length})
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('LSI Keywords', activePackage.lsiKeywords.join(', '))}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {copiedField === 'LSI Keywords' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy Comma-Separated</span>
                </button>
              </div>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
                {activePackage.lsiKeywords.map((kw, idx) => (
                  <li key={kw} className="flex items-baseline gap-2">
                    <span className="font-mono text-slate-400 tabular-nums shrink-0">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span className="truncate">{kw}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="xl:col-span-5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col">
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                JSON-LD Schema Markup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rich result structured data snippet
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('JSON-LD Schema', schemaSnippet)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {copiedField === 'JSON-LD Schema' ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>Copy Code</span>
            </button>
          </div>

          <div className="p-5 sm:p-6 flex-1 flex flex-col">
            <pre className="flex-1 text-xs font-mono text-slate-800 dark:text-emerald-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 overflow-x-auto leading-relaxed max-h-[360px]">
              <code>{schemaSnippet}</code>
            </pre>

            {history.length > 1 && (
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Recent Generations
                </p>
                <div className="space-y-1.5">
                  {history.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePackage(item)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors ${
                        activePackage.id === item.id
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">
                        {item.serviceName} · {item.targetLocation}
                      </span>
                      <span className="font-mono text-slate-400 shrink-0">{item.createdAt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
