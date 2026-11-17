import { useMemo, useState } from 'react';
import {
  Check,
  CheckSquare,
  Copy,
  ExternalLink,
  Globe,
  MapPin,
  Plus,
  Square,
  Star,
  X,
} from 'lucide-react';
import { GBP_LOCAL_PACK_RANKS } from '../data/seedData';
import type { ChecklistCategory, ChecklistItem } from '../types';

interface LocalSeoChecklistProps {
  items: ChecklistItem[];
  onToggleItem: (id: string) => void;
  onAddItem: (item: Omit<ChecklistItem, 'id' | 'completed'>) => void;
}

const CATEGORIES: readonly ('All' | ChecklistCategory)[] = [
  'All',
  'Google Business Profile',
  'Local & PAN India Directories',
  'Automated Blog & Backlinks',
];

const GBP_SHARE_URL = 'https://share.google/lpfED2zhNx6e5Te5m';
const WEBSITE_URL = 'https://www.shrishyamconsulting.in';

const GBP_SCHEMA_SNIPPET = `<script type="application/ld+json">
${JSON.stringify(
  {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Shri Shyam Consulting',
    url: WEBSITE_URL,
    sameAs: [GBP_SHARE_URL],
    areaServed: ['Chhattisgarh', 'India'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Paras Complex, Near Gurudwara Road',
      addressLocality: 'Durg',
      addressRegion: 'Chhattisgarh',
      addressCountry: 'IN',
    },
    knowsAbout: [
      'HR & Manpower Recruitment',
      'PAN India IT & Non-IT Staffing',
      'Payroll Outsourcing & Compliance',
      'AI Business Automation',
    ],
  },
  null,
  2
)}
</script>`;

const REVIEW_TEMPLATE =
  'Namaste! Thank you for partnering with Shri Shyam Consulting (www.shrishyamconsulting.in). Your feedback helps businesses across Durg, Chhattisgarh & PAN India discover reliable HR & AI Automation solutions. Please share a quick review on our Google Business Profile: https://share.google/lpfED2zhNx6e5Te5m';

export function LocalSeoChecklist({
  items,
  onToggleItem,
  onAddItem,
}: LocalSeoChecklistProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | ChecklistCategory>('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<'schema' | 'review' | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ChecklistCategory>('Google Business Profile');
  const [region, setRegion] = useState('Durg, Chhattisgarh');
  const [cadence, setCadence] = useState('Weekly');

  const completedCount = useMemo(() => items.filter((i) => i.completed).length, [items]);
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  const handleCopy = async (key: 'schema' | 'review', value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddItem({
      title: title.trim(),
      description:
        description.trim() || 'Targeted regional SEO & citation task for Shri Shyam Consulting.',
      category,
      region: region.trim() || 'PAN India',
      cadence: cadence.trim() || 'Monthly',
      impact: 'High',
    });
    setTitle('');
    setDescription('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Official Website & Google Business Profile Ranking Hub
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Connected digital properties for Shri Shyam Consulting · Paras Complex, Near Gurudwara Road, Durg, Chhattisgarh
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>www.shrishyamconsulting.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={GBP_SHARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Open Google Business Profile</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 overflow-x-auto">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Google Map Pack & Local Search Rankings
            </p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-3">Local Search Query</th>
                  <th className="py-2.5 px-3 text-right">Map Rank</th>
                  <th className="py-2.5 px-3 text-right hidden sm:table-cell">Searches/mo</th>
                  <th className="py-2.5 pl-3 text-right">GBP Calls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {GBP_LOCAL_PACK_RANKS.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{row.query}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{row.cityHub}</p>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      #{row.mapPackRank} Pack
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 hidden sm:table-cell">
                      {row.monthlyLocalSearches.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono tabular-nums text-blue-600 dark:text-blue-400 font-medium">
                      {row.actionCalls}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>5-Star GBP Review Booster Message</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('review', REVIEW_TEMPLATE)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {copiedKey === 'review' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'review' ? 'Copied' : 'Copy Template'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {REVIEW_TEMPLATE}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Website + GBP Entity Schema (JSON-LD)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('schema', GBP_SCHEMA_SNIPPET)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {copiedKey === 'schema' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'schema' ? 'Copied' : 'Copy Schema'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Links <span className="font-mono">www.shrishyamconsulting.in</span> directly to your Google Business Profile (<span className="font-mono">sameAs</span>) to strengthen Local Pack & PAN India Knowledge Graph authority.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Backlink & Local SEO Booster Checklist
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Google Business Profile optimization, Durg & Chhattisgarh directory citations, and automated blog publishing cadence
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add SEO Task</span>
          </button>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Authority Completion Progress
            </span>
            <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
              {completedCount} of {items.length} tasks ({pct}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggleItem(item.id)}
                className="w-full text-left px-5 sm:px-6 py-4 flex items-start gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                {item.completed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium leading-snug ${
                      item.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.region}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.cadence}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        item.impact === 'High'
                          ? 'text-blue-600 dark:text-blue-400 font-medium'
                          : ''
                      }
                    >
                      {item.impact} Impact
                    </span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {isAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-task-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
        >
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3
                id="add-task-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Add Local SEO / Backlink Task
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Publish Durg Steel Plant Staffing Case Study"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Execution Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline directory URL, schema, or target anchor text..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Checklist Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ChecklistCategory)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Google Business Profile">Google Business Profile</option>
                  <option value="Local & PAN India Directories">Local & PAN India Directories</option>
                  <option value="Automated Blog & Backlinks">Automated Blog & Backlinks</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Region
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Cadence
                  </label>
                  <input
                    type="text"
                    value={cadence}
                    onChange={(e) => setCadence(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
