'use client';

import { useState, useEffect } from 'react';
import { Save, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input, Textarea, FormField, Card, CardHeader, CardTitle, CardContent, Separator } from '@/components/ui/index';

export default function SettingsPage() {
  const { workspace, refreshWorkspace } = useAuth();
  const [form, setForm] = useState({
    name: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    gst_number: '',
    terms_and_conditions: '',
    currency_code: '',
    logo_url: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workspace) {
      setForm({
        name: workspace.name || '',
        business_email: workspace.business_email || '',
        business_phone: workspace.business_phone || '',
        business_address: workspace.business_address || '',
        gst_number: workspace.gst_number || '',
        terms_and_conditions: workspace.terms_and_conditions || '',
        currency_code: workspace.currency_code || 'INR',
        logo_url: workspace.logo_url || '',
      });
    }
  }, [workspace]);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateWorkspace(form);
      if (res.success) {
        toast.success('Settings saved successfully');
        await refreshWorkspace();
      } else {
        toast.error('Failed to save settings', res.error);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">Manage your workspace configuration and PDF invoice details</p>
      </div>

      {/* Business Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Business Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Workspace / Business Name" htmlFor="name" required>
            <Input id="name" value={form.name} onChange={set('name')} placeholder="Acme Corporation" />
          </FormField>
          <FormField label="Logo URL" htmlFor="logo_url">
            <Input id="logo_url" value={form.logo_url} onChange={set('logo_url')} placeholder="https://yourdomain.com/logo.png" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Business Email" htmlFor="business_email">
              <Input id="business_email" type="email" value={form.business_email} onChange={set('business_email')} placeholder="hello@acme.com" />
            </FormField>
            <FormField label="Business Phone" htmlFor="business_phone">
              <Input id="business_phone" value={form.business_phone} onChange={set('business_phone')} placeholder="+91 98765 43210" />
            </FormField>
          </div>
          <FormField label="Business Address" htmlFor="business_address">
            <Textarea
              id="business_address"
              value={form.business_address}
              onChange={set('business_address')}
              placeholder="123 MG Road, Mumbai, Maharashtra 400001"
              rows={2}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Tax & Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Tax & Currency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="GST / Tax Number" htmlFor="gst_number">
              <Input
                id="gst_number"
                value={form.gst_number}
                onChange={set('gst_number')}
                placeholder="27AABCU9603R1ZX"
                className="font-mono uppercase"
              />
            </FormField>
            <FormField label="Currency Code" htmlFor="currency_code">
              <Input
                id="currency_code"
                value={form.currency_code}
                onChange={set('currency_code')}
                placeholder="INR"
                maxLength={3}
                className="font-mono uppercase"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
          <p className="text-sm text-slate-500">
            This text appears at the bottom of every PDF quotation you generate.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            id="terms_and_conditions"
            value={form.terms_and_conditions}
            onChange={set('terms_and_conditions')}
            rows={6}
            placeholder="1. All prices are subject to change without notice.&#10;2. Payment is due within 30 days of invoice.&#10;3. Goods once sold will not be taken back."
          />
        </CardContent>
      </Card>

      {/* Workspace Info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Workspace Slug</span>
            <span className="text-sm font-mono font-medium text-slate-700">{workspace?.slug}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Workspace ID</span>
            <span className="text-xs font-mono text-slate-400">{workspace?.id}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-slate-500">Created</span>
            <span className="text-sm text-slate-700">
              {workspace?.created_at
                ? new Date(workspace.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                : '—'}
            </span>
          </div>
          <p className="text-xs text-slate-400">The workspace slug cannot be changed after creation.</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4" /> Save Settings
        </Button>
      </div>
    </div>
  );
}
