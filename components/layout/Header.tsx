'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':            'Dashboard',
  '/dashboard/quotations': 'Quotations',
  '/dashboard/clients':    'Clients',
  '/dashboard/products':   'Products',
  '/dashboard/settings':   'Settings',
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Prefix match for nested routes
  const match = Object.keys(PAGE_TITLES)
    .filter(k => k !== '/dashboard')
    .find(k => pathname.startsWith(k));
  return match ? PAGE_TITLES[match] : 'QuoteEngine';
}

export function Header() {
  const pathname = usePathname();
  const { workspace } = useAuth();

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-white border-b border-slate-200">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{getPageTitle(pathname)}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Currency badge */}
        {workspace?.currency_code && (
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {workspace.currency_code}
          </span>
        )}
        {/* Notification bell (placeholder for future) */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
