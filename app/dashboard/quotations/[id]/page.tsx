'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, STATUS_CONFIG } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, Badge, Skeleton } from '@/components/ui/index';
import type { Quotation, QuotationStatus } from '@/types';

const STATUS_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  draft:    ['sent', 'expired'],
  sent:     ['accepted', 'rejected', 'expired'],
  accepted: [],
  rejected: [],
  expired:  [],
};

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { workspace } = useAuth();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const currency = workspace?.currency_code || 'INR';

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.getQuotation(id);
        if (res.success) setQuotation(res.data);
        else toast.error('Could not load quotation');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleDownload = async () => {
    if (!quotation) return;
    setDownloading(true);
    try {
      await api.downloadQuotationPdf(quotation.id, quotation.quotation_number);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleStatusChange = async (status: QuotationStatus) => {
    if (!quotation) return;
    setShowStatusMenu(false);
    setUpdatingStatus(true);
    try {
      const res = await api.updateQuotationStatus(quotation.id, status);
      if (res.success) {
        setQuotation(prev => prev ? { ...prev, status: res.data.status } : prev);
        toast.success(`Status updated to ${STATUS_CONFIG[status].label}`);
      } else {
        toast.error('Failed to update status', res.error);
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-5">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Quotation not found.</p>
        <Button variant="link" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[quotation.status] || STATUS_CONFIG.draft;
  const transitions = STATUS_TRANSITIONS[quotation.status] || [];

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/quotations">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">{quotation.quotation_number}</h2>
            <Badge className={`${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Created {formatDate(quotation.created_at)}
            {quotation.created_by_user && ` · by ${quotation.created_by_user.full_name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Status transition dropdown */}
          {transitions.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                loading={updatingStatus}
                onClick={() => setShowStatusMenu(v => !v)}
              >
                Change Status <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[140px] py-1 animate-fade-in">
                  {transitions.map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`w-full text-left px-4 py-2 text-sm ${STATUS_CONFIG[s]?.color} hover:bg-slate-50 transition-colors`}
                    >
                      Mark as {STATUS_CONFIG[s]?.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Button onClick={handleDownload} loading={downloading}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Client + Quote Meta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Bill To</p>
            <p className="font-bold text-slate-900 text-lg">{quotation.client?.company_name}</p>
            <p className="text-sm text-slate-600">{quotation.client?.contact_name}</p>
            <p className="text-sm text-slate-500">{quotation.client?.email}</p>
            {quotation.client?.phone && <p className="text-sm text-slate-500">{quotation.client.phone}</p>}
            {quotation.client?.billing_address && (
              <p className="text-sm text-slate-400 mt-2 whitespace-pre-line">{quotation.client.billing_address}</p>
            )}
            {quotation.client?.gst_number && (
              <p className="text-xs font-mono text-slate-400 mt-1">GSTIN: {quotation.client.gst_number}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quote Details</p>
            <div className="space-y-2">
              {[
                ['Issue Date', formatDate(quotation.issue_date)],
                ['Valid Until', quotation.valid_until ? formatDate(quotation.valid_until) : 'No expiry'],
                ['Status', statusCfg.label],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-800">{value}</span>
                </div>
              ))}
            </div>
            {quotation.notes && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</p>
                <p className="text-sm text-slate-600 whitespace-pre-line">{quotation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Description</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Qty</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Unit Price</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Disc%</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Tax%</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(quotation.line_items || []).map((li, i) => (
                  <tr key={li.id} className={i % 2 === 1 ? 'bg-slate-50/50' : ''}>
                    <td className="px-5 py-3.5 text-slate-400">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{li.description}</p>
                      <p className="text-xs text-slate-400 font-mono">{li.product?.sku}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700 tabular-nums">{li.quantity}</td>
                    <td className="px-5 py-3.5 text-right text-slate-700 tabular-nums">
                      {formatCurrency(li.unit_price_at_creation, currency)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-500">
                      {parseFloat(li.discount_percent).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-500">
                      {parseFloat(li.tax_rate).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(li.line_total, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end p-5 border-t border-slate-100">
            <div className="w-64 space-y-2">
              {[
                ['Subtotal', quotation.subtotal],
                ['Discount', `- ${formatCurrency(quotation.total_discount, currency)}`],
                ['Tax (GST)', quotation.total_tax],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-700">
                    {label === 'Discount' ? value : formatCurrency(value as string, currency)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
                <span className="text-slate-900">Grand Total</span>
                <span className="text-primary">{formatCurrency(quotation.grand_total, currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
