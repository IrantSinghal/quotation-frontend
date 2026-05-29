'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Download, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, STATUS_CONFIG } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Badge, Card, CardContent, Skeleton } from '@/components/ui/index';
import type { Quotation, QuotationStatus } from '@/types';

const STATUS_TABS: Array<{ key: string; label: string }> = [
  { key: '', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'expired', label: 'Expired' },
];

export default function QuotationsPage() {
  const { workspace } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const currency = workspace?.currency_code || 'INR';

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getQuotations({
        page,
        limit: 20,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setQuotations(res.data.data);
        setTotal(res.data.total);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDownloadPdf = async (q: Quotation) => {
    setDownloadingId(q.id);
    try {
      await api.downloadQuotationPdf(q.id, q.quotation_number);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Download failed', 'Could not generate the PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = search
    ? quotations.filter(q =>
      q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      q.client?.company_name?.toLowerCase().includes(search.toLowerCase())
    )
    : quotations;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Quotations</h2>
          <p className="page-subtitle">{total} total quotations</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/quotations/new">
            <Plus className="h-4 w-4" /> New Quotation
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by number or client…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${statusFilter === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Number</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Client</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Valid Until</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Total</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="h-8 w-8 text-slate-300" />
                        <p className="font-medium">No quotations found</p>
                        <p className="text-xs">Try adjusting your filters or create a new quotation.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((q) => {
                    const statusCfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.draft;
                    return (
                      <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/dashboard/quotations/${q.id}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {q.quotation_number}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">
                          {q.client?.company_name || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{formatDate(q.issue_date)}</td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {q.valid_until ? formatDate(q.valid_until) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(q.grand_total, currency)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={`${statusCfg.bg} ${statusCfg.color}`}>
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={downloadingId === q.id}
                            onClick={() => handleDownloadPdf(q)}
                            title="Download PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * 20 >= total}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
