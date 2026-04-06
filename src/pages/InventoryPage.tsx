import { useState, useEffect } from 'react';
import { InventoryAPI, InventoryItem } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');

  const load = async () => setInventory(await InventoryAPI.list());
  useEffect(() => { load(); }, []);

  const resetForm = () => { setName(''); setQuantity(''); setPurchasePrice(''); setSalePrice(''); setEditingId(null); };

  const handleSave = async () => {
    if (!name.trim() || !quantity || !salePrice) return;
    if (editingId) {
      await InventoryAPI.update(editingId, { name, quantity: Number(quantity), purchasePrice: Number(purchasePrice), salePrice: Number(salePrice) });
    } else {
      await InventoryAPI.add({ name, quantity: Number(quantity), purchasePrice: Number(purchasePrice), salePrice: Number(salePrice) });
    }
    await load();
    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id); setName(item.name); setQuantity(String(item.quantity));
    setPurchasePrice(String(item.purchasePrice)); setSalePrice(String(item.salePrice));
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await InventoryAPI.delete(id);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">المخزن</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-2" />إضافة منتج</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'تعديل منتج' : 'إضافة منتج جديد'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>اسم المنتج</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="اسم المنتج" /></div>
              <div><Label>الكمية</Label><Input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" placeholder="الكمية" /></div>
              <div><Label>سعر الشراء (ج.م)</Label><Input value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} type="number" placeholder="سعر الشراء" /></div>
              <div><Label>سعر البيع (ج.م)</Label><Input value={salePrice} onChange={e => setSalePrice(e.target.value)} type="number" placeholder="سعر البيع" /></div>
              <Button onClick={handleSave} className="w-full">{editingId ? 'حفظ التعديلات' : 'إضافة المنتج'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {inventory.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">المخزن فارغ - أضف منتجات تامة الصنع</CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-card rounded-lg border border-border">
            <thead>
              <tr className="border-b border-border">
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">المنتج</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">الكمية</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">سعر الشراء</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">سعر البيع</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 px-4 font-medium text-foreground">{item.name}</td>
                  <td className="py-3 px-4">{item.quantity}</td>
                  <td className="py-3 px-4">{formatCurrency(item.purchasePrice)}</td>
                  <td className="py-3 px-4">{formatCurrency(item.salePrice)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}