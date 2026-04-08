import { useEffect, useState } from 'react';
import { CustomersAPI, SuppliersAPI, InventoryAPI, InvoicesAPI, WalletAPI, Customer, Supplier, InventoryItem, Invoice } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Users, Package, FileText, Wallet, Database, Download, AlertTriangle } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SettingsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [wallet, setWallet] = useState(0);
  const [loading, setLoading] = useState(true);

  // Reset System State
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      CustomersAPI.list(),
      SuppliersAPI.list(),
      InventoryAPI.list(),
      InvoicesAPI.list(),
      WalletAPI.get(),
    ]).then(([c, s, inv, invs, w]) => {
      setCustomers(c); setSuppliers(s); setInventory(inv); setInvoices(invs); setWallet(w.balance);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleResetSystem = async () => {
    if (!resetPassword) return toast.error('يرجى إدخال كلمة المرور');
    try {
      const res = await SettingsAPI.resetSystem(resetPassword);
      toast.success(res.message);
      setResetOpen(false);
      setResetPassword('');
      load(); // Reload dashboard stats
    } catch (err: any) {
      toast.error(err.message || 'Error occurred');
    }
  };

  const totalCustomerDebt = customers.reduce((sum, c) => sum + c.balance, 0);
  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + s.balance, 0);
  const totalInventoryItems = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const recentInvoices = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const stats = [
    { title: 'رصيد المحفظة', value: formatCurrency(wallet), icon: Wallet, color: 'text-primary' },
    { title: 'ديون العملاء', value: formatCurrency(totalCustomerDebt), icon: Users, color: 'text-destructive' },
    { title: 'ديون الموردين', value: formatCurrency(totalSupplierDebt), icon: Truck, color: 'text-warning' },
    { title: 'المنتجات في المخزن', value: `${totalInventoryItems} منتج`, icon: Package, color: 'text-accent' },
    { title: 'إجمالي الفواتير', value: `${invoices.length} فاتورة`, icon: FileText, color: 'text-muted-foreground' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => {
            SettingsAPI.backup()
              .then(res => toast.success(res.message))
              .catch(err => toast.error(err.message));
          }}>
            <Database className="w-4 h-4" />
            نسخ احتياطي
          </Button>

          <a href={SettingsAPI.exportCustomersUrl} download>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              تصدير العملاء (CSV)
            </Button>
          </a>

          <a href={SettingsAPI.exportSuppliersUrl} download>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              تصدير الموردين (CSV)
            </Button>
          </a>

          <Dialog open={resetOpen} onOpenChange={v => { setResetOpen(v); if(!v) setResetPassword(''); }}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                إعادة ضبط النظام
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5"/> تحذير: إعادة ضبط النظام بالكامل
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  أنت على وشك حذف جميع البيانات (العملاء، الموردين، الفواتير، المدفوعات، إلخ). لا يمكن التراجع عن هذا الإجراء!
                </p>
                <div>
                  <Label>كلمة المرور للتأكيد</Label>
                  <Input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="أدخل كلمة المرور" className="mt-1" />
                </div>
                <Button variant="destructive" className="w-full" onClick={handleResetSystem}>تأكيد الحذف</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({length: 5}).map((_, i) => (
             <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-10 h-10 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>آخر الفواتير</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
             <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : recentInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">لا توجد بيانات حالياً</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">رقم</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">النوع</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">الطرف</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">الإجمالي</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">الحالة</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map(inv => (
                    <tr key={inv.id} className="border-b border-border/50">
                      <td className="py-3 px-2">{inv.number}</td>
                      <td className="py-3 px-2">{inv.type === 'purchase' ? 'شراء' : 'بيع'}</td>
                      <td className="py-3 px-2">{inv.entityName}</td>
                      <td className="py-3 px-2">{formatCurrency(inv.total)}</td>
                      <td className="py-3 px-2">
                        <Badge className={getStatusColor(inv.status)} variant="secondary">{inv.status}</Badge>
                      </td>
                      <td className="py-3 px-2">{formatDate(inv.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}