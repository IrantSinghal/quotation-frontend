'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { slugify } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import {
  Input,
  FormField,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/index';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    workspace_slug: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Password is required.';
    if (!form.workspace_slug) e.workspace_slug = 'Workspace slug is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const res = await api.login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        workspace_slug: form.workspace_slug.trim().toLowerCase(),
      });

      if (res.success) {
        login(res.data.user, res.data.workspace, res.data.access_token, res.data.refresh_token);
        toast.success('Signed in successfully!', 'Welcome back to QuoteEngine.');
        router.push('/dashboard');
      } else {
        toast.error('Login failed', res.error || 'Invalid credentials.');
      }
    } catch (err) {
      console.error('Network Error:', err);
      toast.error('Network error', 'Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'workspace_slug'
      ? slugify(e.target.value)
      : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">Sign in to your workspace</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Workspace Slug" htmlFor="workspace_slug" required>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="workspace_slug"
                placeholder="my-company"
                className="pl-10"
                value={form.workspace_slug}
                onChange={set('workspace_slug')}
                error={errors.workspace_slug}
                autoComplete="organization"
              />
            </div>
          </FormField>

          <FormField label="Email address" htmlFor="email" required>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="pl-10"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                autoComplete="email"
              />
            </div>
          </FormField>

          <FormField label="Password" htmlFor="password" required>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={form.password}
                onChange={set('password')}
                error={errors.password}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <Button type="submit" className="w-full" size="lg" loading={isLoading}>
            Sign in
          </Button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground">
            <span className="bg-white px-3">New to QuoteEngine?</span>
          </div>
        </div>

        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create your workspace
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
