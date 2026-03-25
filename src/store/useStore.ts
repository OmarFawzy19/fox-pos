import { useState, useEffect, useCallback } from 'react';
import { Supplier, Customer, InventoryItem, Invoice, Payment } from '@/types';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage('fox_suppliers', []));
  useEffect(() => saveToStorage('fox_suppliers', suppliers), [suppliers]);

  const addSupplier = useCallback((s: Omit<Supplier, 'id' | 'balance'>) => {
    setSuppliers(prev => [...prev, { ...s, id: crypto.randomUUID(), balance: 0 }]);
  }, []);

  const updateSupplier = useCallback((id: string, data: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }, []);

  return { suppliers, setSuppliers, addSupplier, updateSupplier, deleteSupplier };
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage('fox_customers', []));
  useEffect(() => saveToStorage('fox_customers', customers), [customers]);

  const addCustomer = useCallback((c: Omit<Customer, 'id' | 'balance'>) => {
    setCustomers(prev => [...prev, { ...c, id: crypto.randomUUID(), balance: 0 }]);
  }, []);

  const updateCustomer = useCallback((id: string, data: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  return { customers, setCustomers, addCustomer, updateCustomer, deleteCustomer };
}

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadFromStorage('fox_inventory', []));
  useEffect(() => saveToStorage('fox_inventory', inventory), [inventory]);

  const addItem = useCallback((item: Omit<InventoryItem, 'id'>) => {
    setInventory(prev => {
      const existing = prev.find(i => i.name === item.name);
      if (existing) {
        return prev.map(i => i.name === item.name ? { ...i, quantity: i.quantity + item.quantity, purchasePrice: item.purchasePrice, salePrice: item.salePrice } : i);
      }
      return [...prev, { ...item, id: crypto.randomUUID() }];
    });
  }, []);

  const updateItem = useCallback((id: string, data: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  }, []);

  const deductStock = useCallback((items: { productId: string; quantity: number }[]) => {
    setInventory(prev => prev.map(i => {
      const deduction = items.find(item => item.productId === i.id);
      if (deduction) {
        return { ...i, quantity: Math.max(0, i.quantity - deduction.quantity) };
      }
      return i;
    }));
  }, []);

  return { inventory, setInventory, addItem, updateItem, deleteItem, deductStock };
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadFromStorage('fox_invoices', []));
  useEffect(() => saveToStorage('fox_invoices', invoices), [invoices]);

  const addInvoice = useCallback((inv: Omit<Invoice, 'id'>) => {
    const invoice = { ...inv, id: crypto.randomUUID() };
    setInvoices(prev => [...prev, invoice]);
    return invoice;
  }, []);

  const getNextNumber = useCallback((type: 'purchase' | 'sale') => {
    const filtered = invoices.filter(i => i.type === type);
    return filtered.length + 1;
  }, [invoices]);

  return { invoices, setInvoices, addInvoice, getNextNumber };
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>(() => loadFromStorage('fox_payments', []));
  useEffect(() => saveToStorage('fox_payments', payments), [payments]);

  const addPayment = useCallback((p: Omit<Payment, 'id'>) => {
    setPayments(prev => [...prev, { ...p, id: crypto.randomUUID() }]);
  }, []);

  return { payments, addPayment };
}
