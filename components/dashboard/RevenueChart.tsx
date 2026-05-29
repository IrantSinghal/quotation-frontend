'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/index';

interface RevenueChartProps {
  data: Array<{ month: string; total: number }>;
  currencyCode?: string;
  loading?: boolean;
}

function CustomTooltip({
  active,
  payload,
  label,
  currencyCode,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  currencyCode: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2.5">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-900">
        {new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: currencyCode,
          maximumFractionDigits: 0,
        }).format(payload[0].value)}
      </p>
    </div>
  );
}

export function RevenueChart({ data, currencyCode = 'INR', loading }: RevenueChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const isEmpty = !data || data.length === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>Revenue Overview</CardTitle>
          <p className="text-sm text-slate-500 mt-0.5">Accepted quotation totals by month</p>
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">No revenue data yet</p>
              <p className="text-xs text-slate-400 mt-1">Create and accept quotations to see data here</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e40af" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  new Intl.NumberFormat('en-IN', {
                    notation: 'compact',
                    maximumFractionDigits: 1,
                  }).format(v)
                }
                width={55}
              />
              <Tooltip content={<CustomTooltip currencyCode={currencyCode} />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#1e40af"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#1e40af', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
