'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/index';
import type { QuotationStatus } from '@/types';

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:    { label: 'Draft',    color: '#94a3b8' },
  sent:     { label: 'Sent',     color: '#3b82f6' },
  accepted: { label: 'Accepted', color: '#22c55e' },
  rejected: { label: 'Rejected', color: '#ef4444' },
  expired:  { label: 'Expired',  color: '#f59e0b' },
};

interface StatusChartProps {
  data: Record<QuotationStatus, number>;
  loading?: boolean;
}

export function StatusChart({ data, loading }: StatusChartProps) {
  const chartData = Object.entries(data)
    .map(([status, count]) => ({
      name: STATUS_META[status]?.label || status,
      value: count,
      color: STATUS_META[status]?.color || '#94a3b8',
    }))
    .filter(d => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Quote Status</CardTitle></CardHeader>
        <CardContent>
          <div className="h-52 bg-slate-100 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Status</CardTitle>
        <p className="text-sm text-slate-500 mt-0.5">{total} total quotations</p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-52 flex items-center justify-center">
            <p className="text-sm text-slate-400">No quotations yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} (${Math.round((value / total) * 100)}%)`,
                  name,
                ]}
                contentStyle={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
