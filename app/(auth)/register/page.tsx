'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Building2 } from 'lucide-react';
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

export default function RegisterPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    workspace_name: '',
    workspace_slug: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  // Auto-generate slug from workspace name unless user has manually edited it
  useEffect(() => {
    if (!slugEdited && form.workspace_name) {
      setForm(prev => ({ ...prev, workspace_slug: slugify(form.workspace_name) }));
    }
  }, [form.workspace_name, slugEdited]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Your name is required.';
    if (!form.email) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Password must include at least one uppercase letter.';
    else if (!/[0-9]/.test(form.password)) e.password = 'Password must include at least one number.';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.';
    if (!form.workspace_name.trim()) e.workspace_name = 'Workspace name is required.';
    if (!form.workspace_slug) e.workspace_slug = 'Workspace slug is required.';
    else if (!/^[a-z0-9-]+$/.test(form.workspace_slug)) e.workspace_slug = 'Slug may only contain lowercase letters, numbers, and hyphens.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await api.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        full_name: form.full_name.trim(),
        workspace_name: form.workspace_name.trim(),
        workspace_slug: form.workspace_slug.trim(),
      });
      if (res.success) {
        login(res.data.user, res.data.workspace, res.data.access_token, res.data.refresh_token);
        toast.success('Workspace created!', `Welcome to QuoteEngine, ${res.data.user.full_name.split(' ')[0]}!`);
        router.push('/dashboard');
      } else {
        toast.error('Registration failed', res.error);
        if (res.code === 'CONFLICT' && res.error.includes('slug')) {
          setErrors(prev => ({ ...prev, workspace_slug: 'This slug is already taken. Try another.' }));
        }
      }
    } catch {
      toast.error('Network error', 'Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (field === 'workspace_slug') {
      value = slugify(value);
      setSlugEdited(true);
    }
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl text-center">Create your workspace</CardTitle>
        <CardDescription className="text-center">
          Set up your business and start creating quotations
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Workspace section */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Workspace Details
            </p>
            <FormField label="Workspace Name" htmlFor="workspace_name" required>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="workspace_name"
                  placeholder="Acme Corporation"
                  className="pl-10 bg-white"
                  value={form.workspace_name}
                  onChange={set('workspace_name')}
                  error={errors.workspace_name}
                />
              </div>
            </FormField>
            <FormField label="Workspace Slug" htmlFor="workspace_slug" required>
              <div className="relative">
                <Input
                  id="workspace_slug"
                  placeholder="acme-corporation"
                  className="bg-white font-mono text-sm"
                  value={form.workspace_slug}
                  onChange={set('workspace_slug')}
                  error={errors.workspace_slug}
                />
              </div>
              {!errors.workspace_slug && (
                <p className="text-xs text-slate-400 mt-1">
                  Used to identify your workspace at login. Cannot be changed later.
                </p>
              )}
            </FormField>
          </div>

          {/* User section */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Your Account
            </p>
            <FormField label="Full Name" htmlFor="full_name" required>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="full_name"
                  placeholder="Jane Doe"
                  className="pl-10 bg-white"
                  value={form.full_name}
                  onChange={set('full_name')}
                  error={errors.full_name}
                  autoComplete="name"
                />
              </div>
            </FormField>

            <FormField label="Email Address" htmlFor="email" required>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@acme.com"
                  className="pl-10 bg-white"
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
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className="pl-10 pr-10 bg-white"
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                  autoComplete="new-password"
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

            <FormField label="Confirm Password" htmlFor="confirm_password" required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-white"
                  value={form.confirm_password}
                  onChange={set('confirm_password')}
                  error={errors.confirm_password}
                  autoComplete="new-password"
                />
              </div>
            </FormField>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={isLoading}>
            Create workspace & account
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
