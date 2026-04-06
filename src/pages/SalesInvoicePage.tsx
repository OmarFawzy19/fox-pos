import { useState, useMemo } from 'react';
import { useCustomers, useInventory, useInvoices } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, getPaymentStatus } from '@/lib/formatters';
import { Plus, Trash2 } from 'lucide-react';
import { Invoice, InvoiceItem } from '@/types';
import { toast } from 'sonner';
import InvoicePreview from '@/components/InvoicePreview';

export default function SalesInvoicePage() {
  const { customers, updateCustomer } = useCustomers();
  const { inventory, deductStock } = useInventory();
  const { addInvoice, getNextNumber } = useInvoices();

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState('');
  const [paid, setPaid] = useState('');
  const [discount, setDiscount] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const customer = useMemo(() => customers.find(c => c.id === customerId), [customers, customerId]);
  const availableProducts = inventory.filter(i => i.quantity > 0);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.total, 0), [items]);
  const discountPercent = Math.min(100, Math.max(0, Number(discount) || 0));
  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount;
  const remaining = total - (Number(paid) || 0);

  const addItemToInvoice = () => {
    if (!selectedProduct || !qty) return;
    const product = inventory.find(p => p.id === selectedProduct);
    if (!product) return;
    const quantity = Number(qty);
    if (quantity > product.quantity) {
      toast.error(`الكمية المتاحة: ${product.quantity}`);
      return;
    }
    setItems(prev => [...prev, {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.salePrice,
      total: quantity * product.salePrice,
    }]);
    setSelectedProduct(''); setQty('');
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    if (!customer || items.length === 0) {
      toast.error('يرجى اختيار العميل وإضافة منتجات');
      return;
    }
    const paidAmount = Number(paid) || 0;
    const status = getPaymentStatus(paidAmount, total);

    const invoice = addInvoice({
      number: getNextNumber('sale'),
      type: 'sale',
      date: new Date().toISOString(),
      entityId: customer.id,
      entityName: customer.name,
      items,
      total,
      paid: paidAmount,
      remaining: total - paidAmount,
      status,
    });

    // Deduct from inventory
    deductStock(items.map(i => ({ productId: i.productId, quantity: i.quantity })));

    // Update customer balance
    if (total - paidAmount > 0) {
      updateCustomer(customer.id, { balance: customer.balance + (total - paidAmount) });
    }

    toast.success('تم إنشاء فاتورة البيع بنجاح');
    setPreviewInvoice(invoice);
    setCustomerId(''); setItems([]); setPaid('');
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">فاتورة بيع</h1>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <Label>اختر العميل</Label>
            <Select value={customerId} onValueChange={v => { setCustomerId(v); setItems([]); }}>
              <SelectTrigger><SelectValue placeholder="اختر العميل" /></SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {customer && (
            <>
              <div className="border-t border-border pt-4">
                <Label className="text-base font-semibold">إضافة منتجات من المخزن</Label>
                <div className="flex gap-2 mt-2">
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="اختر المنتج" /></SelectTrigger>
                    <SelectContent>
                      {availableProducts.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} (متاح: {p.quantity}) - {formatCurrency(p.salePrice)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={qty} onChange={e => setQty(e.target.value)} type="number" placeholder="الكمية" className="w-24" />
                  <Button type="button" onClick={addItemToInvoice}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              {items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-right py-2 text-muted-foreground">المنتج</th>
                        <th className="text-right py-2 text-muted-foreground">الكمية</th>
                        <th className="text-right py-2 text-muted-foreground">السعر</th>
                        <th className="text-right py-2 text-muted-foreground">الإجمالي</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-border/50">
                          <td className="py-2">{item.productName}</td>
                          <td className="py-2">{item.quantity}</td>
                          <td className="py-2">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-2">{formatCurrency(item.total)}</td>
                          <td className="py-2"><button onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4 text-destructive" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between text-base">
                  <span>المجموع الفرعي</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div>
                  <Label>نسبة الخصم (%)</Label>
                  <Input value={discount} onChange={e => {
                    const v = Number(e.target.value);
                    if (e.target.value === '' || (v >= 0 && v <= 100)) setDiscount(e.target.value);
                  }} type="number" min="0" max="100" placeholder="0" />
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>الخصم ({discountPercent}%)</span>
                    <span>- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div>
                  <Label>المدفوع (ج.م)</Label>
                  <Input value={paid} onChange={e => setPaid(e.target.value)} type="number" placeholder="0" />
                </div>
                <div className="flex justify-between text-lg font-bold text-destructive">
                  <span>الباقي</span>
                  <span>{formatCurrency(Math.max(0, remaining))}</span>
                </div>
                <Button onClick={handleSubmit} className="w-full" size="lg">إنشاء الفاتورة</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <InvoicePreview
        invoice={previewInvoice}
        open={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
      />
    </div>
  );
}
