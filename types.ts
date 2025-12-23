export type InvoiceStatus = 'draft' | 'pending' | 'paid';
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  currency: string;
  taxRate: number;
  notes: string;
  terms: string;
  items: InvoiceItem[];
}

export interface QuotationData {
  id: string;
  quotationNumber: string;
  status: QuotationStatus;
  date: string;
  validUntil: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  currency: string;
  taxRate: number;
  notes: string;
  terms: string;
  items: InvoiceItem[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  password?: string;
  active?: boolean;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  gstNumber?: string;
  defaultTaxRate: number;
  currencySymbol: string;
  logoUrl?: string;
}