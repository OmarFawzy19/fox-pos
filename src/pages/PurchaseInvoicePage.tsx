import { useState, useMemo } from 'react';
import { useSuppliers, useInvoices } from '@/store/useStore';
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

export default function PurchaseInvoicePage() {
  const { suppliers, updateSupplier } = useSuppliers();
  const { addInvoice, getNextNumber } = useInvoices();

  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState('');
  const [paid, setPaid] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const supplier = useMemo(() => suppliers.find(s => s.id === supplierId), [suppliers, supplierId]);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.total, 0), [items]);
  const remaining = total - (Number(paid) || 0);

  const addItemToInvoice = () => {
    if (!supplier || !selectedProduct || !qty) return;
    const product = supplier.products.find(p => p.id === selectedProduct);
    if (!product) return;
    const quantity = Number(qty);
    setItems(prev => [...prev, {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.purchasePrice,
      total: quantity * product.purchasePrice,
    }]);
    setSelectedProduct('');
    setQty('');
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    if (!supplier || items.length === 0) {
      toast.error('يرجى اختيار المورد وإضافة منتجات');
      return;
    }
    const paidAmount = Number(paid) || 0;
    const status = getPaymentStatus(paidAmount, total);

    const invoice = addInvoice({
      number: getNextNumber('purchase'),
      type: 'purchase',
      date: new Date().toISOString(),
      entityId: supplier.id,
      entityName: supplier.name,
      items,
      total,
      paid: paidAmount,
      remaining: total - paidAmount,
      status,
    });

    // Update supplier balance
    if (total - paidAmount > 0) {
      updateSupplier(supplier.id, { balance: supplier.balance + (total - paidAmount) });
    }

    toast.success('تم إنشاء فاتورة الشراء بنجاح');
    setPreviewInvoice(invoice);
    setSupplierId(''); setItems([]); setPaid('');
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">فاتورة شراء</h1>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <Label>اختر المورد</Label>
            <Select value={supplierId} onValueChange={v => { setSupplierId(v); setItems([]); }}>
              <SelectTrigger><SelectValue placeholder="اختر المورد" /></SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {supplier && (
            <>
              <div className="border-t border-border pt-4">
                <Label className="text-base font-semibold">إضافة منتجات</Label>
                <div className="flex gap-2 mt-2">
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="اختر المنتج" /></SelectTrigger>
                    <SelectContent>
                      {supplier.products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} - {formatCurrency(p.purchasePrice)}</SelectItem>
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
    </div>
  );
}
