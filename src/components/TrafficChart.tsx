import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrafficPoint } from '../types';

interface TrafficChartProps {
  data: TrafficPoint[];
  isDark: boolean;
}

type RangeOption = '7d' | '14d' | '30d';
type MetricOption = 'both' | 'organicVisits' | 'qualifiedLeads';

export function TrafficChart({ data, isDark }: TrafficChartProps) {
  const [range, setRange] = useState<RangeOption>('30d');
  const [metric, setMetric] = useState<MetricOption>('both');

  const filteredData = useMemo(() => {
    if (range === '7d') return data.slice(-5);
    if (range === '14d') return data.slice(-9);
    return data;
  }, [data, range]);

  const axisColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Organic Traffic & Lead Velocity
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            30-day search impression capture and inbound qualification trend
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Chart metric selection"
            className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg"
          >
            {(
              [
                { id: 'both', label: 'Combined' },
                { id: 'organicVisits', label: 'Traffic' },
                { id: 'qualifiedLeads', label: 'Leads' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMetric(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  metric === opt.id
                    ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Chart timeframe"
            className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg"
          >
            {(['7d', '14d', '30d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-2.5 py-1.5 text-xs font-medium font-mono rounded-md transition-colors whitespace-nowrap shrink-0 uppercase focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  range === r
                    ? 'bg-white dark:bg-[#0F172A] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 pt-4 pb-2 text-xs text-slate-600 dark:text-slate-400">
        {(metric === 'both' || metric === 'organicVisits') && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-[#2563EB] inline-block" aria-hidden="true" />
            <span>Daily Organic Visits</span>
          </div>
        )}
        {(metric === 'both' || metric === 'qualifiedLeads') && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-[#10B981] inline-block" aria-hidden="true" />
            <span>Qualified Client Leads</span>
          </div>
        )}
      </div>

      <div className="h-[280px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="organicVisitsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="qualifiedLeadsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={axisColor}
              tick={{ fontSize: 12, fill: axisColor }}
              tickLine={false}
              axisLine={false}
            />
            {(metric === 'both' || metric === 'organicVisits') && (
              <YAxis
                yAxisId="left"
                stroke={axisColor}
                tick={{ fontSize: 12, fill: axisColor }}
                tickLine={false}
                axisLine={false}
              />
            )}
            {(metric === 'both' || metric === 'qualifiedLeads') && (
              <YAxis
                yAxisId="right"
                orientation={metric === 'qualifiedLeads' ? 'left' : 'right'}
                stroke={axisColor}
                tick={{ fontSize: 12, fill: axisColor }}
                tickLine={false}
                axisLine={false}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: isDark ? '#F1F5F9' : '#0F172A',
              }}
              labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
            />
            {(metric === 'both' || metric === 'organicVisits') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="organicVisits"
                name="Organic Visits"
                stroke="#2563EB"
                strokeWidth={2.25}
                fillOpacity={1}
                fill="url(#organicVisitsFill)"
                activeDot={{ r: 5, strokeWidth: 0, fill: '#2563EB' }}
              />
            )}
            {(metric === 'both' || metric === 'qualifiedLeads') && (
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="qualifiedLeads"
                name="Qualified Leads"
                stroke="#10B981"
                strokeWidth={2.25}
                fillOpacity={1}
                fill="url(#qualifiedLeadsFill)"
                activeDot={{ r: 5, strokeWidth: 0, fill: '#10B981' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
