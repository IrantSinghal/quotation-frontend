export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  business_address: string | null;
  business_email: string | null;
  business_phone: string | null;
  gst_number: string | null;
  terms_and_conditions: string | null;
  currency_code: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  workspace_id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  phone_verified: boolean;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface AuthResult {
  access_token: string;
  refresh_token: string;
  user: User;
  workspace: Workspace;
}

export interface Product {
  id: string;
  workspace_id: string;
  sku: string;
  name: string;
  description: string | null;
  base_price: string;
  tax_rate: string;
  stock_quantity: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  workspace_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  billing_address: string | null;
  gst_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuotationLineItem {
  id: string;
  quotation_id: string;
  product_id: string;
  description: string;
  quantity: number;
  unit_price_at_creation: string;
  discount_percent: string;
  tax_rate: string;
  line_subtotal: string;
  line_discount_amount: string;
  line_tax_amount: string;
  line_total: string;
  sort_order: number;
  product: Product;
}

export interface Quotation {
  id: string;
  workspace_id: string;
  client_id: string;
  created_by: string;
  quotation_number: string;
  status: QuotationStatus;
  issue_date: string;
  valid_until: string | null;
  notes: string | null;
  subtotal: string;
  total_discount: string;
  total_tax: string;
  grand_total: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  line_items?: QuotationLineItem[];
  created_by_user?: User;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Dashboard stats shape
export interface DashboardStats {
  totalQuotations: number;
  totalClients: number;
  totalProducts: number;
  totalRevenue: string;
  quotationsByStatus: Record<QuotationStatus, number>;
  recentQuotations: Quotation[];
  monthlyRevenue: Array<{ month: string; total: number }>;
}
