import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const resetForm = () => { setName(''); setPhone(''); setAddress(''); setEditingId(null); };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      updateCustomer(editingId, { name, phone, address });
    } else {
      addCustomer({ name, phone, address });
    }
    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (c: typeof customers[0]) => {
    setEditingId(c.id); setName(c.name); setPhone(c.phone); setAddress(c.address);
    setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">العملاء</h1>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-2" />إضافة عميل</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'تعديل عميل' : 'إضافة عميل جديد'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>اسم العميل</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="اسم العميل" /></div>
              <div><Label>رقم الهاتف</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الهاتف" /></div>
              <div><Label>العنوان</Label><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="العنوان" /></div>
              <Button onClick={handleSave} className="w-full">{editingId ? 'حفظ التعديلات' : 'إضافة العميل'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {customers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">لا يوجد عملاء بعد</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {customers.map(c => (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{c.name}</h3>
                    <p className="text-sm text-muted-foreground">{c.phone} • {c.address}</p>
                    <p className="text-sm mt-2">
                      الرصيد (دين): <span className="font-bold text-destructive">{formatCurrency(c.balance)}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCustomer(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
