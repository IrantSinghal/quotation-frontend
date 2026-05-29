import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: number; // percentage change
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  trend,
  loading = false,
}: StatCardProps) {
  const TrendIcon = trend === 0 ? Minus : trend && trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend === 0
    ? 'text-slate-500'
    : trend && trend > 0
    ? 'text-green-600'
    : 'text-red-500';

  if (loading) {
    return (
      <div className="stat-card">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums truncate">{value}</p>
          {(subtitle || trend !== undefined) && (
            <div className="flex items-center gap-2 mt-1.5">
              {trend !== undefined && (
                <span className={cn('flex items-center gap-0.5 text-xs font-medium', trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(trend)}%
                </span>
              )}
              {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl shrink-0', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
    </div>
  );
}
