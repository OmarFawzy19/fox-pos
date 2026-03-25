import { useState } from 'react';
import { useSuppliers } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Trash2, Edit, Package } from 'lucide-react';
import { SupplierProduct } from '@/types';

export default function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');

  const resetForm = () => {
    setName(''); setPhone(''); setAddress(''); setProducts([]); setProdName(''); setProdPrice('');
    setEditingId(null);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      updateSupplier(editingId, { name, phone, address, products });
    } else {
      addSupplier({ name, phone, address, products });
    }
    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (s: typeof suppliers[0]) => {
    setEditingId(s.id); setName(s.name); setPhone(s.phone); setAddress(s.address);
    setProducts([...s.products]);
    setDialogOpen(true);
  };

  const addProduct = () => {
    if (!prodName.trim() || !prodPrice) return;
    setProducts(prev => [...prev, { id: crypto.randomUUID(), name: prodName, purchasePrice: Number(prodPrice) }]);
    setProdName(''); setProdPrice('');
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">الموردين</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-2" />إضافة مورد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'تعديل مورد' : 'إضافة مورد جديد'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>اسم المورد</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="اسم المورد" />
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الهاتف" />
              </div>
              <div>
                <Label>العنوان</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="العنوان" />
              </div>

              <div className="border-t border-border pt-4">
                <Label className="text-base font-semibold">المنتجات (مواد خام)</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={prodName} onChange={e => setProdName(e.target.value)} placeholder="اسم المنتج" className="flex-1" />
                  <Input value={prodPrice} onChange={e => setProdPrice(e.target.value)} placeholder="السعر" type="number" className="w-28" />
                  <Button type="button" variant="secondary" onClick={addProduct}><Plus className="w-4 h-4" /></Button>
                </div>
                {products.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {products.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                        <span className="text-sm">{p.name} - {formatCurrency(p.purchasePrice)}</span>
                        <button onClick={() => removeProduct(p.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleSave} className="w-full">{editingId ? 'حفظ التعديلات' : 'إضافة المورد'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {suppliers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">لا يوجد موردين بعد</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {suppliers.map(s => (
            <Card key={s.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{s.name}</h3>
                    <p className="text-sm text-muted-foreground">{s.phone} • {s.address}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{s.products.length} منتج</span>
                    </div>
                    <p className="text-sm mt-2">
                      الرصيد (دين): <span className="font-bold text-destructive">{formatCurrency(s.balance)}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteSupplier(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
