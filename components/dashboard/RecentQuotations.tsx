'use client';

import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui/index';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, STATUS_CONFIG } from '@/lib/utils';
import type { Quotation } from '@/types';

interface RecentQuotationsProps {
  quotations: Quotation[];
  currencyCode?: string;
  loading?: boolean;
}

export function RecentQuotations({ quotations, currencyCode = 'INR', loading }: RecentQuotationsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>Recent Quotations</CardTitle>
          <p className="text-sm text-slate-500 mt-0.5">Your latest 5 quotes</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/quotations" className="flex items-center gap-1.5">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="flex-1 h-4 w-24 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
                <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : quotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No quotations yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Create your first quotation to get started</p>
            <Button size="sm" asChild>
              <Link href="/dashboard/quotations">Create quotation</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {quotations.map((q) => {
              const statusCfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.draft;
              return (
                <Link
                  key={q.id}
                  href={`/dashboard/quotations/${q.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                      {q.quotation_number}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {q.client?.company_name || 'Unknown client'} · {formatDate(q.issue_date)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                    {formatCurrency(q.grand_total, currencyCode)}
                  </p>
                  <Badge className={`${statusCfg.bg} ${statusCfg.color} shrink-0`}>
                    {statusCfg.label}
                  </Badge>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
