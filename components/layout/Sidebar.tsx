'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Dashboard',   icon: LayoutDashboard, exact: true },
  { href: '/dashboard/quotations', label: 'Quotations',  icon: FileText },
  { href: '/dashboard/clients',    label: 'Clients',     icon: Users },
  { href: '/dashboard/products',   label: 'Products',    icon: Package },
  { href: '/dashboard/settings',   label: 'Settings',    icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, workspace, logout } = useAuth();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
          <Zap className="h-4 w-4 text-white fill-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">
            {workspace?.name || 'QuoteEngine'}
          </p>
          <p className="text-xs text-slate-400 truncate">{workspace?.slug}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Main Menu
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'sidebar-link group',
              isActive(href, exact) && 'active'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {isActive(href, exact) && (
              <ChevronRight className="h-3 w-3 opacity-60" />
            )}
          </Link>
        ))}
      </nav>

      {/* User area */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {getInitials(user?.full_name || user?.email || 'U')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="sidebar-link w-full mt-1 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
