import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

// ── Input ─────────────────────────────────────────────────────────────────────

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <input
        className={cn(
          'flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-150',
          error
            ? 'border-destructive focus-visible:ring-destructive'
            : 'border-input hover:border-slate-400',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ── Textarea ──────────────────────────────────────────────────────────────────

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ className, error, ...props }, ref) => (
  <div className="w-full">
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border bg-background px-3 py-2 text-sm',
        'placeholder:text-muted-foreground resize-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150',
        error ? 'border-destructive' : 'border-input hover:border-slate-400',
        className
      )}
      ref={ref}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

// ── Label ─────────────────────────────────────────────────────────────────────

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-sm font-medium text-slate-700 leading-none', className)}
    {...props}
  />
));
Label.displayName = 'Label';

// ── FormField ─────────────────────────────────────────────────────────────────

function FormField({
  label,
  htmlFor,
  children,
  required,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1 p-6 pb-4', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-slate-900', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({
  children,
  className,
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline';
}) {
  const variants = {
    default:     'bg-primary/10 text-primary',
    secondary:   'bg-slate-100 text-slate-700',
    success:     'bg-green-50 text-green-700',
    destructive: 'bg-red-50 text-red-700',
    warning:     'bg-amber-50 text-amber-700',
    outline:     'border border-border text-slate-600',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ── Separator ─────────────────────────────────────────────────────────────────

function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px bg-border', className)} />;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200', className)} />;
}

export {
  Input,
  Textarea,
  Label,
  FormField,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Separator,
  Skeleton,
};
