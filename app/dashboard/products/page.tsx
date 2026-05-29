'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Search, Upload, Package, Pencil, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input, Card, CardContent, Skeleton, FormField, Badge } from '@/components/ui/index';
import type { Product } from '@/types';

function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product?: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    base_price: product ? parseFloat(product.base_price) : 0,
    tax_rate: product ? parseFloat(product.tax_rate) : 18,
    stock_quantity: product?.stock_quantity || 0,
    unit: product?.unit || 'pcs',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = ['base_price', 'tax_rate', 'stock_quantity'].includes(field)
      ? parseFloat(e.target.value) || 0
      : e.target.value;
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.sku.trim()) e.sku = 'SKU is required.';
    if (!form.name.trim()) e.name = 'Name is required.';
    if (form.base_price < 0) e.base_price = 'Price must be non-negative.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = product
        ? await api.updateProduct(product.id, {
          ...form,
          sku: undefined,
          base_price: form.base_price.toString(), // 👈 Cast number to string
          tax_rate: form.tax_rate.toString()     // 👈 Cast number to string (if required by your type definition)
        })
        : await api.createProduct({
          ...form,
          base_price: form.base_price, // 👈 Pass number directly
          tax_rate: form.tax_rate
        });
      if (res.success) {
        toast.success(product ? 'Product updated' : 'Product created');
        onSaved();
      } else {
        toast.error('Failed to save product', res.error);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold">{product ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="SKU" htmlFor="sku" required>
              <Input
                id="sku"
                value={form.sku}
                onChange={set('sku')}
                error={errors.sku}
                disabled={!!product}
                className="font-mono uppercase"
                placeholder="PROD-001"
              />
            </FormField>
            <FormField label="Unit" htmlFor="unit">
              <Input id="unit" value={form.unit} onChange={set('unit')} placeholder="pcs" />
            </FormField>
          </div>
          <FormField label="Product Name" htmlFor="name" required>
            <Input id="name" value={form.name} onChange={set('name')} error={errors.name} placeholder="Premium Widget" />
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Base Price (₹)" htmlFor="base_price" required>
              <Input id="base_price" type="number" min={0} step={0.01} value={form.base_price} onChange={set('base_price')} error={errors.base_price} />
            </FormField>
            <FormField label="Tax Rate (%)" htmlFor="tax_rate">
              <Input id="tax_rate" type="number" min={0} max={100} step={0.1} value={form.tax_rate} onChange={set('tax_rate')} />
            </FormField>
            <FormField label="Stock Qty" htmlFor="stock_quantity">
              <Input id="stock_quantity" type="number" min={0} step={1} value={form.stock_quantity} onChange={set('stock_quantity')} />
            </FormField>
          </div>
          <FormField label="Description" htmlFor="description">
            <Input id="description" value={form.description} onChange={set('description')} placeholder="Optional description" />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            {product ? 'Save Changes' : 'Add Product'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BulkImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    total_rows: number; inserted: number; updated: number;
    errors: Array<{ row_index: number; sku?: string; error: string }>;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.bulkImportProducts(file);
      if (res.success) {
        setResult(res.data);
        if (res.data.inserted > 0 || res.data.updated > 0) {
          toast.success('Import complete', `${res.data.inserted} inserted, ${res.data.updated} updated`);
          onDone();
        }
      } else {
        toast.error('Import failed', res.error);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold">Bulk Import Products</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Upload Excel or CSV file</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Required columns: sku, name, price. Optional: tax rate, stock, unit, description.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              {file ? file.name : 'Choose file'}
            </Button>
          </div>

          {result && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">Rows processed: <strong>{result.total_rows}</strong></span>
                <span className="text-green-600">Inserted: <strong>{result.inserted}</strong></span>
                <span className="text-blue-600">Updated: <strong>{result.updated}</strong></span>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-600">
                      <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{err.error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleUpload} loading={uploading} disabled={!file}>
            <Upload className="h-4 w-4" /> Import
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { workspace } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState<Product | 'new' | null>(null);
  const [showImport, setShowImport] = useState(false);
  const currency = workspace?.currency_code || 'INR';

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getProducts({ page, limit: 20, active_only: false });
      if (res.success) { setProducts(res.data.data); setTotal(res.data.total); }
    } finally { setIsLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
    : products;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Products</h2>
          <p className="page-subtitle">{total} products in catalogue</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4" /> Bulk Import
          </Button>
          <Button onClick={() => setModalProduct('new')}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search by name or SKU…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">SKU</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Price</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Tax</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Stock</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-full" /></td>
                    ))}</tr>
                  ))
                  : filtered.length === 0
                    ? (
                      <tr><td colSpan={7} className="px-5 py-16 text-center">
                        <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400">No products found</p>
                      </td></tr>
                    )
                    : filtered.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{p.sku}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-900">{p.name}</p>
                          {p.description && <p className="text-xs text-slate-400 truncate max-w-[200px]">{p.description}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(p.base_price, currency)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-600">{parseFloat(p.tax_rate).toFixed(1)}%</td>
                        <td className="px-5 py-3.5 text-right tabular-nums">
                          <span className={p.stock_quantity === 0 ? 'text-red-600 font-semibold' : p.stock_quantity < 10 ? 'text-amber-600 font-semibold' : 'text-slate-700'}>
                            {p.stock_quantity} {p.unit}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {p.is_active
                            ? <Badge variant="success">Active</Badge>
                            : <Badge variant="secondary">Inactive</Badge>}
                        </td>
                        <td className="px-5 py-3.5">
                          <Button variant="ghost" size="sm" onClick={() => setModalProduct(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
          {total > 20 && (
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {modalProduct !== null && (
        <ProductFormModal
          product={modalProduct === 'new' ? undefined : modalProduct}
          onClose={() => setModalProduct(null)}
          onSaved={() => { setModalProduct(null); load(); }}
        />
      )}
      {showImport && (
        <BulkImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); load(); }} />
      )}
    </div>
  );
}
