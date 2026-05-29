'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Building2, Mail, Phone, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Card, CardContent, Skeleton, FormField, Textarea } from '@/components/ui/index';
import type { Client } from '@/types';

function ClientFormModal({
  client,
  onClose,
  onSaved,
}: {
  client?: Client;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    company_name: client?.company_name || '',
    contact_name: client?.contact_name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    billing_address: client?.billing_address || '',
    gst_number: client?.gst_number || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.company_name.trim()) e.company_name = 'Company name is required.';
    if (!form.contact_name.trim()) e.contact_name = 'Contact name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = client
        ? await api.updateClient(client.id, form)
        : await api.createClient(form);
      if (res.success) {
        toast.success(client ? 'Client updated' : 'Client created');
        onSaved();
      } else {
        toast.error('Failed to save client', res.error);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">
            {client ? 'Edit Client' : 'Add Client'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Company Name" htmlFor="company_name" required>
              <Input id="company_name" value={form.company_name} onChange={set('company_name')} error={errors.company_name} />
            </FormField>
            <FormField label="Contact Name" htmlFor="contact_name" required>
              <Input id="contact_name" value={form.contact_name} onChange={set('contact_name')} error={errors.contact_name} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" htmlFor="email" required>
              <Input id="email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
            </FormField>
            <FormField label="Phone" htmlFor="phone">
              <Input id="phone" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            </FormField>
          </div>
          <FormField label="GST Number" htmlFor="gst_number">
            <Input id="gst_number" value={form.gst_number} onChange={set('gst_number')} placeholder="27AABCU9603R1ZX" className="font-mono" />
          </FormField>
          <FormField label="Billing Address" htmlFor="billing_address">
            <Textarea id="billing_address" value={form.billing_address} onChange={set('billing_address')} rows={2} placeholder="123 MG Road, Mumbai 400001" />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            {client ? 'Save Changes' : 'Add Client'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalClient, setModalClient] = useState<Client | 'new' | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getClients({ page, limit: 20 });
      if (res.success) {
        setClients(res.data.data);
        setTotal(res.data.total);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? clients.filter(c =>
        c.company_name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Clients</h2>
          <p className="page-subtitle">{total} total clients</p>
        </div>
        <Button onClick={() => setModalClient('new')}>
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by company or email…"
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardContent>
              </Card>
            ))
          : filtered.length === 0
          ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
              <Building2 className="h-10 w-10 mb-3 text-slate-300" />
              <p className="font-medium text-slate-500">No clients found</p>
              <p className="text-sm mt-1">Add your first client to get started.</p>
            </div>
          )
          : filtered.map(client => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{client.company_name}</p>
                    <p className="text-sm text-slate-500 truncate">{client.contact_name}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setModalClient(client)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.gst_number && (
                    <p className="text-xs text-slate-400 font-mono">GSTIN: {client.gst_number}</p>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-3">Added {formatDate(client.created_at)}</p>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {total > 20 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {modalClient !== null && (
        <ClientFormModal
          client={modalClient === 'new' ? undefined : modalClient}
          onClose={() => setModalClient(null)}
          onSaved={() => { setModalClient(null); load(); }}
        />
      )}
    </div>
  );
}
