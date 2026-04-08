import { useState, useEffect } from 'react';
import { CustomersAPI, SuppliersAPI, PaymentsAPI, WalletAPI, Customer, Supplier, Payment } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Payment forms
  const [entityType, setEntityType] = useState<'customer' | 'supplier'>('customer');
  const [entityId, setEntityId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // Filtering list
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier'>('all');
  const [filterEntityId, setFilterEntityId] = useState('');

  const load = async () => {
    setLoading(true);
    const filterObj: any = { sort: sortOrder };
    if (filterType === 'customer' && filterEntityId) filterObj.clientId = filterEntityId;
    if (filterType === 'supplier' && filterEntityId) filterObj.supplierId = filterEntityId;

    const [c, s, p] = await Promise.all([
      CustomersAPI.list(), 
      SuppliersAPI.list(), 
      PaymentsAPI.list(filterObj)
    ]);
    setCustomers(c); setSuppliers(s); setPayments(p);
    setLoading(false);
  };
  useEffect(() => { load(); }, [sortOrder, filterType, filterEntityId]);

  const entities = entityType === 'customer' ? customers.filter(c => c.balance > 0) : suppliers.filter(s => s.balance > 0);
  const selectedEntity = entityType === 'customer' ? customers.find(c => c.id === entityId) : suppliers.find(s => s.id === entityId);

  const handlePayment = async () => {
    const amt = Number(amount);
    if (!entityId || !amt || amt <= 0) { toast.error('يرجى إدخال بيانات صحيحة'); return; }
    if (!selectedEntity || amt > selectedEntity.balance) { toast.error('المبلغ أكبر من الرصيد المستحق'); return; }

    if (entityType === 'customer') {
      await CustomersAPI.update(entityId, { balance: selectedEntity.balance - amt });
      await WalletAPI.add(amt);
      await PaymentsAPI.add({ date: new Date().toISOString(), entityType: 'customer', entityId, entityName: selectedEntity.name, amount: amt, note });
      toast.success(`تم تسجيل تحصيل ${formatCurrency(amt)} من ${selectedEntity.name}`);
    } else {
      await SuppliersAPI.update(entityId, { balance: selectedEntity.balance - amt });
      await PaymentsAPI.add({ date: new Date().toISOString(), entityType: 'supplier', entityId, entityName: selectedEntity.name, amount: amt, note });
      toast.success(`تم تسجيل سداد ${formatCurrency(amt)} إلى ${selectedEntity.name}`);
    }

    setEntityId(''); setAmount(''); setNote('');
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">التحصيل والسداد</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>تسجيل دفعة</CardTitle></CardHeader>
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
                  {entities.map(e => <SelectItem key={e.id} value={e.id}>{e.name} - رصيد: {formatCurrency(e.balance)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedEntity && <p className="text-sm text-muted-foreground">الرصيد المستحق: <span className="font-bold text-destructive">{formatCurrency(selectedEntity.balance)}</span></p>}
            <div><Label>المبلغ (ج.م)</Label><Input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0" /></div>
            <div><Label>ملاحظات</Label><Input value={note} onChange={e => setNote(e.target.value)} placeholder="ملاحظات (اختياري)" /></div>
            <Button onClick={handlePayment} className="w-full">تسجيل الدفعة</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>سجل المدفوعات</CardTitle></CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1">
                <Select value={sortOrder} onValueChange={(v: 'desc'|'asc') => setSortOrder(v)}>
                  <SelectTrigger><SelectValue placeholder="ترتيب" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">الأحدث للأقدم</SelectItem>
                    <SelectItem value="asc">الأقدم للأحدث</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={filterType} onValueChange={(v: 'all'|'customer'|'supplier') => { setFilterType(v); setFilterEntityId(''); }}>
                  <SelectTrigger><SelectValue placeholder="فلتر بالنوع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المعاملات</SelectItem>
                    <SelectItem value="customer">عميل محدد</SelectItem>
                    <SelectItem value="supplier">مورد محدد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filterType !== 'all' && (
                <div className="flex-1 hidden sm:block">
                  <Select value={filterEntityId} onValueChange={setFilterEntityId}>
                    <SelectTrigger><SelectValue placeholder="اختر الاسم..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_entities">الكل</SelectItem>
                      {filterType === 'customer' 
                        ? customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                        : suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                <p>لا توجد بيانات مطابقة للبحث</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {payments.map(p => (
                  <div key={p.id} className="bg-muted rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-foreground">{p.entityName}</p>
                        <p className="text-xs text-muted-foreground">{p.entityType === 'customer' ? 'تحصيل من عميل' : 'سداد لمورد'}</p>
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