import Cookies from 'js-cookie';
import type {
  ApiResponse,
  AuthResult,
  Workspace,
  Product,
  Client,
  Quotation,
  PaginatedResult,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────────────────────────────────────

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return Cookies.get('access_token') || null;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: { skipAuth?: boolean; isFormData?: boolean }
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};

    if (!options?.isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token && !options?.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: options?.isFormData
        ? (body as FormData)
        : body !== undefined
        ? JSON.stringify(body)
        : undefined,
    });

    const data = await res.json();

    // If token expired, attempt refresh
    if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${this.getToken()}`;
        const retryRes = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return retryRes.json();
      } else {
        // Refresh failed — clear auth and redirect to login
        this.clearAuth();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }

    return data;
  }

  private async refreshTokens(): Promise<boolean> {
    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const data = await res.json();
      if (data.success) {
        this.setTokens(data.data.access_token, data.data.refresh_token);
        return true;
      }
    } catch {}
    return false;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    Cookies.set('access_token', accessToken, { expires: 7, sameSite: 'strict' });
    Cookies.set('refresh_token', refreshToken, { expires: 30, sameSite: 'strict' });
  }

  clearAuth(): void {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    Cookies.remove('workspace_slug');
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async register(payload: {
    email: string;
    password: string;
    full_name: string;
    workspace_name: string;
    workspace_slug: string;
  }): Promise<ApiResponse<AuthResult>> {
    return this.request<AuthResult>('POST', '/api/auth/register', payload, { skipAuth: true });
  }

  async login(payload: {
    email: string;
    password: string;
    workspace_slug: string;
  }): Promise<ApiResponse<AuthResult>> {
    return this.request<AuthResult>('POST', '/api/auth/login', payload, { skipAuth: true });
  }

  async googleAuth(payload: {
    id_token: string;
    workspace_slug: string;
  }): Promise<ApiResponse<AuthResult>> {
    return this.request<AuthResult>('POST', '/api/auth/google', payload, { skipAuth: true });
  }

  async logout(): Promise<void> {
    await this.request('POST', '/api/auth/logout');
    this.clearAuth();
  }

  async getMe(): Promise<ApiResponse<{ user_id: string; email: string; workspace_id: string; role: string }>> {
    return this.request('GET', '/api/auth/me');
  }

  // ── Workspace ─────────────────────────────────────────────────────────────

  async getWorkspace(): Promise<ApiResponse<Workspace>> {
    return this.request<Workspace>('GET', '/api/workspace');
  }

  async updateWorkspace(payload: Partial<Workspace>): Promise<ApiResponse<Workspace>> {
    return this.request<Workspace>('PATCH', '/api/workspace', payload);
  }

  // ── Products ──────────────────────────────────────────────────────────────

  async getProducts(params?: {
    page?: number;
    limit?: number;
    active_only?: boolean;
  }): Promise<ApiResponse<PaginatedResult<Product>>> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.active_only !== undefined) q.set('active_only', String(params.active_only));
    return this.request<PaginatedResult<Product>>('GET', `/api/products?${q.toString()}`);
  }

  async createProduct(payload: {
    sku: string;
    name: string;
    description?: string;
    base_price: number;
    tax_rate?: number;
    stock_quantity?: number;
    unit?: string;
  }): Promise<ApiResponse<Product>> {
    return this.request<Product>('POST', '/api/products', payload);
  }

  async updateProduct(id: string, payload: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.request<Product>('PATCH', `/api/products/${id}`, payload);
  }

  async deleteProduct(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('DELETE', `/api/products/${id}`);
  }

  async bulkImportProducts(file: File): Promise<ApiResponse<{
    total_rows: number;
    inserted: number;
    updated: number;
    errors: Array<{ row_index: number; sku?: string; error: string }>;
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('POST', '/api/products/bulk-import', formData, { isFormData: true });
  }

  // ── Clients ───────────────────────────────────────────────────────────────

  async getClients(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResult<Client>>> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return this.request<PaginatedResult<Client>>('GET', `/api/clients?${q.toString()}`);
  }

  async createClient(payload: {
    company_name: string;
    contact_name: string;
    email: string;
    phone?: string;
    billing_address?: string;
    gst_number?: string;
  }): Promise<ApiResponse<Client>> {
    return this.request<Client>('POST', '/api/clients', payload);
  }

  async updateClient(id: string, payload: Partial<Client>): Promise<ApiResponse<Client>> {
    return this.request<Client>('PATCH', `/api/clients/${id}`, payload);
  }

  // ── Quotations ────────────────────────────────────────────────────────────

  async getQuotations(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResult<Quotation>>> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    return this.request<PaginatedResult<Quotation>>('GET', `/api/quotations?${q.toString()}`);
  }

  async getQuotation(id: string): Promise<ApiResponse<Quotation>> {
    return this.request<Quotation>('GET', `/api/quotations/${id}`);
  }

  async createQuotation(payload: {
    client_id: string;
    valid_until?: string;
    notes?: string;
    line_items: Array<{
      product_id: string;
      quantity: number;
      discount_percent?: number;
      description?: string;
    }>;
  }): Promise<ApiResponse<Quotation>> {
    return this.request<Quotation>('POST', '/api/quotations', payload);
  }

  async updateQuotationStatus(id: string, status: string): Promise<ApiResponse<Quotation>> {
    return this.request<Quotation>('PATCH', `/api/quotations/${id}/status`, { status });
  }

  getQuotationPdfUrl(id: string): string {
    const token = this.getToken();
    return `${this.baseUrl}/api/quotations/${id}/pdf?token=${token}`;
  }

  async downloadQuotationPdf(id: string, quotationNumber: string): Promise<void> {
    const token = this.getToken();
    const res = await fetch(`${this.baseUrl}/api/quotations/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to download PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quotationNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const api = new ApiClient(API_URL);
