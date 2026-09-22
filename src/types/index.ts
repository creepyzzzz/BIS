export type UserRole = "super_admin" | "agent";
export type DocStatus = "available" | "missing" | "not_applicable";
export type InvoiceType = "proforma" | "final";
export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone?: string | null;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  default_fee: number;
  created_at?: string;
}

export interface CategoryRequirement {
  id: string;
  category_id: string;
  document_type_id: string;
  is_mandatory: boolean;
  document_types?: DocumentType;
}

export interface Shop {
  id: string;
  created_by?: string | null;
  shop_name: string;
  owner_name: string;
  phone: string;
  address: string;
  created_at?: string;
}

export interface Audit {
  id: string;
  shop_id: string;
  agent_id: string;
  inspection_date: string;
  place: string;
  signature_url?: string | null;
  auto_notes?: string | null;
  created_at?: string;
  shops?: Shop;
  profiles?: Profile;
}

export interface AuditDocument {
  id: string;
  audit_id: string;
  document_type_id: string;
  status: DocStatus;
  file_url?: string | null;
  r2_key?: string | null;
  notes?: string | null;
  updated_at?: string;
  document_types?: DocumentType;
}

export interface InvoiceLineItem {
  code: string;
  title: string;
  fee: number;
  status: string;
}

export interface Invoice {
  id: string;
  shop_id: string;
  audit_id?: string | null;
  type: InvoiceType;
  status: InvoiceStatus;
  total_amount: number;
  line_items: InvoiceLineItem[];
  pdf_url?: string | null;
  created_at?: string;
  shops?: Shop;
  audits?: Audit;
}
