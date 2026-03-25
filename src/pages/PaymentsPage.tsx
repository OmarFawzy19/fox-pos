import { useState } from 'react';
import { useSuppliers, useCustomers, usePayments } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PaymentsPage() {
  const { suppliers, updateSupplier } = useSuppliers();
  const { customers, updateCustomer } = useCustomers();
  const { payments, addPayment } = usePayments();

  const [entityType, setEntityType] = useState<'customer' | 'supplier'>('customer');
  const [entityId, setEntityId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handlePayment = () => {
    const amt = Number(amount);
    if (!entityId || !amt || amt <= 0) {
      toast.error('يرجى إدخال بيانات صحيحة');
      return;
    }

    if (entityType === 'customer') {
      const customer = customers.find(c => c.id === entityId);
      if (!customer) return;
      if (amt > customer.balance) {
        toast.error('المبلغ أكبر من الرصيد المستحق');
        return;
      }
      updateCustomer(entityId, { balance: customer.balance - amt });
      addPayment({
        date: new Date().toISOString(),
        entityType: 'customer',
        entityId,
        entityName: customer.name,
        amount: amt,
        note,
      });
      toast.success(`تم تسجيل سداد ${formatCurrency(amt)} من ${customer.name}`);
    } else {
      const supplier = suppliers.find(s => s.id === entityId);
      if (!supplier) return;
      if (amt > supplier.balance) {
        toast.error('المبلغ أكبر من الرصيد المستحق');
        return;
      }
      updateSupplier(entityId, { balance: supplier.balance - amt });
      addPayment({
        date: new Date().toISOString(),
        entityType: 'supplier',
        entityId,
        entityName: supplier.name,
        amount: amt,
        note,
      });
      toast.success(`تم تسجيل سداد ${formatCurrency(amt)} إلى ${supplier.name}`);
    }

    setEntityId(''); setAmount(''); setNote('');
  };

  const entities = entityType === 'customer'
    ? customers.filter(c => c.balance > 0)
    : suppliers.filter(s => s.balance > 0);

  const selectedEntity = entityType === 'customer'
    ? customers.find(c => c.id === entityId)
    : suppliers.find(s => s.id === entityId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">التحصيل والسداد</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تسجيل دفعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={entityType} onValueChange={v => { setEntityType(v as 'customer' | 'supplier'); setEntityId(''); }}>
              <TabsList className="w-full">
                <TabsTrigger value="customer" className="flex-1">تحصيل من عميل</TabsTrigger>
                <TabsTrigger value="supplier" className="flex-1">سداد لمورد</TabsTrigger>
              </TabsList>
            </Tabs>

            <div>
              <Label>{entityType === 'customer' ? 'اختر العميل' : 'اختر المورد'}</Label>
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                <SelectContent>
                  {entities.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} - رصيد: {formatCurrency(e.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEntity && (
              <p className="text-sm text-muted-foreground">
                الرصيد المستحق: <span className="font-bold text-destructive">{formatCurrency(selectedEntity.balance)}</span>
              </p>
            )}

            <div>
              <Label>المبلغ (ج.م)</Label>
              <Input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0" />
            </div>

            <div>
              <Label>ملاحظات</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="ملاحظات (اختياري)" />
            </div>

            <Button onClick={handlePayment} className="w-full">تسجيل الدفعة</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سجل المدفوعات</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد مدفوعات بعد</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {[...payments].reverse().map(p => (
                  <div key={p.id} className="bg-muted rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-foreground">{p.entityName}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.entityType === 'customer' ? 'تحصيل من عميل' : 'سداد لمورد'}
                        </p>
                        {p.note && <p className="text-xs text-muted-foreground mt-1">{p.note}</p>}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-success">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
