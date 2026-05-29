'use client';

import Link from 'next/link';
import { Plus, Upload, Users, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/index';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

const ACTIONS = [
  {
    label: 'New Quotation',
    description: 'Create a quote for a client',
    icon: Plus,
    href: '/dashboard/quotations/new',
    color: 'bg-primary/10 text-primary hover:bg-primary/20',
  },
  {
    label: 'Add Client',
    description: 'Register a new customer',
    icon: Users,
    href: '/dashboard/clients?action=new',
    color: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
  },
  {
    label: 'Add Product',
    description: 'Add to your catalogue',
    icon: Package,
    href: '/dashboard/products?action=new',
    color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  },
  {
    label: 'Bulk Import',
    description: 'Upload Excel/CSV products',
    icon: Upload,
    href: '/dashboard/products?action=import',
    color: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
  },
];

export function QuickActions() {
  const { workspace } = useAuth();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ACTIONS.map(({ label, description, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${color}`}
          >
            <div className="shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">{label}</p>
              <p className="text-xs opacity-70 truncate">{description}</p>
            </div>
          </Link>
        ))}
      </CardContent>

      {workspace && (
        <div className="px-6 pb-5 border-t border-slate-100 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Workspace
          </p>
          <div className="space-y-2">
            {workspace.business_email && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Email</span>
                <span className="text-xs text-slate-700 font-medium truncate max-w-[160px]">
                  {workspace.business_email}
                </span>
              </div>
            )}
            {workspace.gst_number && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">GSTIN</span>
                <span className="text-xs text-slate-700 font-medium font-mono">
                  {workspace.gst_number}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Currency</span>
              <span className="text-xs text-slate-700 font-medium">{workspace.currency_code}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Member since</span>
              <span className="text-xs text-slate-700 font-medium">
                {formatDate(workspace.created_at)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
