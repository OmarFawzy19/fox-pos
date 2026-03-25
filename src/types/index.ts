export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  products: SupplierProduct[];
  balance: number; // owed to supplier
}

export interface SupplierProduct {
  id: string;
  name: string;
  purchasePrice: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number; // owed by customer
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: number;
  type: 'purchase' | 'sale';
  date: string;
  entityId: string;
  entityName: string;
  items: InvoiceItem[];
  total: number;
  paid: number;
  remaining: number;
  status: 'مدفوع' | 'جزئي' | 'آجل';
}

export interface Payment {
  id: string;
  date: string;
  entityType: 'supplier' | 'customer';
  entityId: string;
  entityName: string;
  amount: number;
  invoiceId?: string;
  note?: string;
}
