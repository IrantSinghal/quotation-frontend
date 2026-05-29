'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, FormField, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import type { Client, Product } from '@/types';

interface LineItem {
    product_id: string;
    quantity: number;
    discount_percent: number;
    description: string;
}

export default function NewQuotationPage() {
    const router = useRouter();
    const { workspace } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [clientId, setClientId] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [notes, setNotes] = useState('');
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { product_id: '', quantity: 1, discount_percent: 0, description: '' },
    ]);
    const [submitting, setSubmitting] = useState(false);
    const currency = workspace?.currency_code || 'INR';

    useEffect(() => {
        const load = async () => {
            const [clientsRes, productsRes] = await Promise.all([
                api.getClients({ limit: 100 }),
                api.getProducts({ limit: 100 }),
            ]);
            if (clientsRes.success) setClients(clientsRes.data.data);
            if (productsRes.success) setProducts(productsRes.data.data);
        };
        load();
    }, []);

    const addLineItem = () => {
        setLineItems(prev => [
            ...prev,
            { product_id: '', quantity: 1, discount_percent: 0, description: '' },
        ]);
    };

    const removeLineItem = (index: number) => {
        setLineItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
        setLineItems(prev => prev.map((item, i) => {
            if (i !== index) return item;
            const updated = { ...item, [field]: value };
            // Auto-fill description from product name
            if (field === 'product_id') {
                const product = products.find(p => p.id === value);
                if (product) updated.description = product.name;
            }
            return updated;
        }));
    };

    const getProduct = (id: string) => products.find(p => p.id === id);

    const calculateLineTotal = (item: LineItem): number => {
        const product = getProduct(item.product_id);
        if (!product) return 0;
        const price = parseFloat(product.base_price);
        const subtotal = price * item.quantity;
        const discount = subtotal * (item.discount_percent / 100);
        const taxable = subtotal - discount;
        const tax = taxable * (parseFloat(product.tax_rate) / 100);
        return taxable + tax;
    };

    const grandTotal = lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);

    const handleSubmit = async () => {
        if (!clientId) { toast.error('Please select a client'); return; }
        const validItems = lineItems.filter(i => i.product_id && i.quantity > 0);
        if (validItems.length === 0) { toast.error('Add at least one line item'); return; }

        setSubmitting(true);
        try {
            const res = await api.createQuotation({
                client_id: clientId,
                valid_until: validUntil || undefined,
                notes: notes || undefined,
                line_items: validItems.map(i => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    discount_percent: i.discount_percent || undefined,
                    description: i.description || undefined,
                })),
            });
            if (res.success) {
                toast.success('Quotation created!', res.data.quotation_number);
                router.push(`/dashboard/quotations/${res.data.id}`);
            } else {
                toast.error('Failed to create quotation', res.error);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/quotations">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                </Button>
                <div>
                    <h2 className="page-title">New Quotation</h2>
                    <p className="page-subtitle">Fill in the details to create a quotation</p>
                </div>
            </div>

            {/* Client + Meta */}
            <Card>
                <CardHeader><CardTitle>Quotation Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Client" htmlFor="client" required>
                            <select
                                id="client"
                                value={clientId}
                                onChange={e => setClientId(e.target.value)}
                                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">Select a client…</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.company_name}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Valid Until" htmlFor="valid_until">
                            <Input
                                id="valid_until"
                                type="date"
                                value={validUntil}
                                onChange={e => setValidUntil(e.target.value)}
                            />
                        </FormField>
                    </div>
                    <FormField label="Notes" htmlFor="notes">
                        <Input
                            id="notes"
                            placeholder="Any additional notes for this quotation…"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </FormField>
                </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Line Items</CardTitle>
                    <Button variant="outline" size="sm" onClick={addLineItem}>
                        <Plus className="h-4 w-4" /> Add Item
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {lineItems.map((item, index) => {
                        const product = getProduct(item.product_id);
                        const lineTotal = calculateLineTotal(item);
                        return (
                            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-slate-50 border border-slate-200">
                                {/* Product */}
                                <div className="col-span-4">
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Product</label>
                                    <select
                                        value={item.product_id}
                                        onChange={e => updateLineItem(index, 'product_id', e.target.value)}
                                        className="flex h-9 w-full rounded-lg border border-input bg-white px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="">Select product…</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} — {formatCurrency(p.base_price, currency)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Description */}
                                <div className="col-span-3">
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                                    <Input
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={e => updateLineItem(index, 'description', e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                {/* Qty */}
                                <div className="col-span-1">
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Qty</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={e => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                {/* Discount */}
                                <div className="col-span-1">
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Disc%</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={item.discount_percent}
                                        onChange={e => updateLineItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                {/* Total */}
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Total</label>
                                    <div className="h-9 flex items-center px-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900">
                                        {formatCurrency(lineTotal, currency)}
                                    </div>
                                </div>
                                {/* Remove */}
                                <div className="col-span-1 flex justify-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeLineItem(index)}
                                        disabled={lineItems.length === 1}
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                {/* Stock warning */}
                                {product && item.quantity > product.stock_quantity && (
                                    <div className="col-span-12">
                                        <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                            ⚠ Only {product.stock_quantity} {product.unit} in stock
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Grand Total */}
                    <div className="flex justify-end pt-3 border-t border-slate-200">
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Estimated Grand Total</p>
                            <p className="text-2xl font-bold text-primary">
                                {formatCurrency(grandTotal, currency)}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">Final amount calculated by server</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" asChild>
                    <Link href="/dashboard/quotations">Cancel</Link>
                </Button>
                <Button size="lg" onClick={handleSubmit} loading={submitting}>
                    Create Quotation
                </Button>
            </div>
        </div>
    );
}