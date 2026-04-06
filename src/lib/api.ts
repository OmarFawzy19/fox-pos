// src/lib/api.ts
// Replace your useStore calls with these API functions

const BASE = "/api";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ── Customers ──────────────────────────────────────────────────────────────
export const CustomersAPI = {
  list: () => req<Customer[]>("/customers"),
  add: (data: Omit<Customer, "id" | "balance">) => req<Customer>("/customers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Customer>) => req<void>(`/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => req<void>(`/customers/${id}`, { method: "DELETE" }),
};

// ── Suppliers ──────────────────────────────────────────────────────────────
export const SuppliersAPI = {
  list: () => req<Supplier[]>("/suppliers"),
  add: (data: Omit<Supplier, "id" | "balance">) => req<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Supplier>) => req<void>(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => req<void>(`/suppliers/${id}`, { method: "DELETE" }),
};

// ── Inventory ──────────────────────────────────────────────────────────────
export const InventoryAPI = {
  list: () => req<InventoryItem[]>("/inventory"),
  add: (data: Omit<InventoryItem, "id">) => req<InventoryItem>("/inventory", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<InventoryItem>) => req<void>(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deductStock: (items: { productId: string; quantity: number }[]) =>
    req<void>("/inventory/deduct", { method: "PATCH", body: JSON.stringify({ items }) }),
  delete: (id: string) => req<void>(`/inventory/${id}`, { method: "DELETE" }),
};

// ── Invoices ───────────────────────────────────────────────────────────────
export const InvoicesAPI = {
  list: () => req<Invoice[]>("/invoices"),
  getNextNumber: (type: "sale" | "purchase") => req<{ number: number }>(`/invoices/next-number/${type}`),
  add: (data: Omit<Invoice, "id">) => req<Invoice>("/invoices", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => req<void>(`/invoices/${id}`, { method: "DELETE" }),
};

// ── Payments ───────────────────────────────────────────────────────────────
export const PaymentsAPI = {
  list: () => req<Payment[]>("/payments"),
  add: (data: Omit<Payment, "id">) => req<Payment>("/payments", { method: "POST", body: JSON.stringify(data) }),
};

// ── Wallet ─────────────────────────────────────────────────────────────────
export const WalletAPI = {
  get: () => req<{ balance: number }>("/wallet"),
  add: (amount: number) => req<void>("/wallet/add", { method: "PATCH", body: JSON.stringify({ amount }) }),
  deduct: (amount: number) => req<void>("/wallet/deduct", { method: "PATCH", body: JSON.stringify({ amount }) }),
  listExpenses: () => req<Expense[]>("/wallet/expenses"),
  addExpense: (data: Omit<Expense, "id">) => req<Expense>("/wallet/expenses", { method: "POST", body: JSON.stringify(data) }),
};

// ── Types ──────────────────────────────────────────────────────────────────
export interface Customer {
  id: string; name: string; phone: string; address: string; balance: number;
}
export interface SupplierProduct {
  id: string; name: string; purchasePrice: number;
}
export interface Supplier {
  id: string; name: string; phone: string; address: string; balance: number; products: SupplierProduct[];
}
export interface InventoryItem {
  id: string; name: string; quantity: number; purchasePrice: number; salePrice: number;
}
export interface InvoiceItem {
  productId: string; productName: string; quantity: number; unitPrice: number; total: number;
}
export interface Invoice {
  id: string; number: number; type: "sale" | "purchase"; date: string;
  entityId: string; entityName: string; items: InvoiceItem[];
  total: number; paid: number; remaining: number; status: string;
}
export interface Payment {
  id: string; date: string; entityType: "customer" | "supplier";
  entityId: string; entityName: string; amount: number; note?: string;
}
export interface Expense {
  id: string; date: string; category: string; amount: number; note?: string;
}