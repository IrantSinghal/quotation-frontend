import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata: Metadata = {
  title: {
    default: 'QuoteEngine',
    template: '%s — QuoteEngine',
  },
  description: 'Professional quotation management for your business',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
