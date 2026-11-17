import { useMemo, useState } from 'react';
import { ArrowUpRight, Minus, Plus, Search, Sparkles, TrendingUp, X } from 'lucide-react';
import type { KeywordRank, ServiceCategory } from '../types';

interface KeywordTrackerProps {
  keywords: KeywordRank[];
  onAddKeyword: (kw: Omit<KeywordRank, 'id' | 'lastUpdated'>) => void;
  onOptimizeKeyword: (keyword: string, category: ServiceCategory) => void;
}

export function KeywordTracker({
  keywords,
  onAddKeyword,
  onOptimizeKeyword,
}: KeywordTrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ServiceCategory>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState<ServiceCategory>('HR Staffing');
  const [newRank, setNewRank] = useState('2');
  const [newVolume, setNewVolume] = useState('4200');
  const [newUrl, setNewUrl] = useState('/services/enterprise-hiring');

  const filteredKeywords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return keywords.filter((item) => {
      const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesQuery =
        !q ||
        item.keyword.toLowerCase().includes(q) ||
        item.targetUrl.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [keywords, searchQuery, categoryFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const rankNum = Math.max(1, Math.min(100, Number(newRank) || 1));
    onAddKeyword({
      keyword: newKeyword.trim(),
      category: newCategory,
      rank: rankNum,
      previousRank: rankNum + 2,
      monthlyVolume: Math.max(100, Number(newVolume) || 1200),
      targetUrl: newUrl.trim() || '/services',
      intent: 'High Commercial',
    });
    setNewKeyword('');
    setIsAddModalOpen(false);
  };

  return (
    <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl">
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Live Keyword Rank Tracker
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Google India SERP positions across HR recruitment, compliance, and AI automation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keywords..."
              aria-label="Search tracked keywords"
              className="w-full sm:w-52 pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Track Keyword</span>
          </button>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto">
        {(['All', 'HR Staffing', 'AI Automation', 'Compliance'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              categoryFilter === cat
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredKeywords.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            No matching keywords found
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Adjust your search filter or add a new target keyword to monitor.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All');
            }}
            className="mt-4 px-4 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 pl-5 sm:pl-6 pr-3">Target Keyword</th>
                <th className="py-3 px-3 text-right">Rank</th>
                <th className="py-3 px-3 text-right">Delta</th>
                <th className="py-3 px-3 text-right hidden md:table-cell">Monthly Vol</th>
                <th className="py-3 px-3 hidden lg:table-cell">Landing Page</th>
                <th className="py-3 pl-3 pr-5 sm:pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {filteredKeywords.map((row) => {
                const delta = row.previousRank - row.rank;
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 pl-5 sm:pl-6 pr-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100 leading-snug">
                        {row.keyword}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{row.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{row.intent}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          row.rank === 1
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        #{row.rank}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-xs">
                      {delta > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <TrendingUp className="w-3.5 h-3.5" />
                          +{delta}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                          <Minus className="w-3.5 h-3.5" />
                          0
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-xs text-slate-700 dark:text-slate-300 hidden md:table-cell">
                      {row.monthlyVolume.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-xs text-slate-500 dark:text-slate-400 hidden lg:table-cell max-w-[200px] truncate">
                      {row.targetUrl}
                    </td>

                    <td className="py-3.5 pl-3 pr-5 sm:pr-6 text-right">
                      <button
                        type="button"
                        onClick={() => onOptimizeKeyword(row.keyword, row.category)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors whitespace-nowrap shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Optimize Meta</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-keyword-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
        >
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3
                id="add-keyword-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Track New Search Keyword
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Keyword Phrase
                </label>
                <input
                  type="text"
                  required
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g., Executive Search Firm Raipur"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Service Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ServiceCategory)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="HR Staffing">HR Staffing</option>
                    <option value="AI Automation">AI Automation</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Current SERP Rank
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newRank}
                    onChange={(e) => setNewRank(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Monthly Search Vol
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={newVolume}
                    onChange={(e) => setNewVolume(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Target URL Path
                  </label>
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Add to Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
