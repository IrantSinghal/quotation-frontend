'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Users,
  Package,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { RecentQuotations } from '@/components/dashboard/RecentQuotations';
import { QuickActions } from '@/components/dashboard/QuickActions';
import type { Quotation, QuotationStatus } from '@/types';

interface DashboardData {
  totalQuotations: number;
  totalClients: number;
  totalProducts: number;
  grandTotalRevenue: number;
  quotationsByStatus: Record<QuotationStatus, number>;
  recentQuotations: Quotation[];
  monthlyRevenue: Array<{ month: string; total: number }>;
}

const EMPTY_STATUS: Record<QuotationStatus, number> = {
  draft: 0, sent: 0, accepted: 0, rejected: 0, expired: 0,
};

// Build monthly revenue buckets from accepted quotations
function buildMonthlyRevenue(quotations: Quotation[]): Array<{ month: string; total: number }> {
  const accepted = quotations.filter(q => q.status === 'accepted');
  const buckets = new Map<string, number>();

  // Last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    buckets.set(key, 0);
  }

  for (const q of accepted) {
    const d = new Date(q.created_at);
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + parseFloat(q.grand_total));
    }
  }

  return Array.from(buckets.entries()).map(([month, total]) => ({ month, total }));
}

export default function DashboardPage() {
  const { workspace } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [quotationsRes, clientsRes, productsRes] = await Promise.all([
        api.getQuotations({ limit: 100 }), // fetch enough for stats
        api.getClients({ limit: 1 }),
        api.getProducts({ limit: 1 }),
      ]);

      const quotations = quotationsRes.success ? quotationsRes.data.data : [];
      const totalClients = clientsRes.success ? clientsRes.data.total : 0;
      const totalProducts = productsRes.success ? productsRes.data.total : 0;

      // Compute status counts
      const statusCounts = { ...EMPTY_STATUS };
      let totalRevenue = 0;
      for (const q of quotations) {
        statusCounts[q.status] = (statusCounts[q.status] || 0) + 1;
        if (q.status === 'accepted') {
          totalRevenue += parseFloat(q.grand_total);
        }
      }

      // Sort by most recent for the "recent" widget (top 5)
      const sorted = [...quotations].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setData({
        totalQuotations: quotationsRes.success ? quotationsRes.data.total : 0,
        totalClients,
        totalProducts,
        grandTotalRevenue: totalRevenue,
        quotationsByStatus: statusCounts,
        recentQuotations: sorted.slice(0, 5),
        monthlyRevenue: buildMonthlyRevenue(quotations),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const currency = workspace?.currency_code || 'INR';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Good {getGreeting()},{' '}
            <span className="text-primary">
              {workspace?.name || 'your workspace'}
            </span>
          </h2>
          <p className="page-subtitle">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Quotations"
          value={isLoading ? '—' : data?.totalQuotations ?? 0}
          subtitle="all time"
          icon={FileText}
          iconColor="text-primary"
          iconBg="bg-primary/10"
          loading={isLoading}
        />
        <StatCard
          title="Total Clients"
          value={isLoading ? '—' : data?.totalClients ?? 0}
          subtitle="registered"
          icon={Users}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          loading={isLoading}
        />
        <StatCard
          title="Products"
          value={isLoading ? '—' : data?.totalProducts ?? 0}
          subtitle="in catalogue"
          icon={Package}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          loading={isLoading}
        />
        <StatCard
          title="Revenue"
          value={isLoading ? '—' : formatCurrency(data?.grandTotalRevenue ?? 0, currency)}
          subtitle="from accepted quotes"
          icon={TrendingUp}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          loading={isLoading}
        />
      </div>

      {/* Charts + Quick Actions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueChart
            data={data?.monthlyRevenue ?? []}
            currencyCode={currency}
            loading={isLoading}
          />
        </div>
        <div className="space-y-5">
          <StatusChart
            data={data?.quotationsByStatus ?? EMPTY_STATUS}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Recent quotations + Quick actions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RecentQuotations
            quotations={data?.recentQuotations ?? []}
            currencyCode={currency}
            loading={isLoading}
          />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
