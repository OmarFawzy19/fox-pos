import { useSuppliers, useCustomers, useInventory, useInvoices, useWallet } from '@/store/useStore';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users, Package, FileText, Wallet } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { suppliers } = useSuppliers();
  const { customers } = useCustomers();
  const { inventory } = useInventory();
  const { invoices } = useInvoices();

  const totalCustomerDebt = customers.reduce((sum, c) => sum + c.balance, 0);
  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + s.balance, 0);
  const totalInventoryItems = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const recentInvoices = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const stats = [
    { title: 'ديون العملاء', value: formatCurrency(totalCustomerDebt), icon: Users, color: 'text-destructive' },
    { title: 'ديون الموردين', value: formatCurrency(totalSupplierDebt), icon: Truck, color: 'text-warning' },
    { title: 'المنتجات في المخزن', value: `${totalInventoryItems} منتج`, icon: Package, color: 'text-primary' },
    { title: 'إجمالي الفواتير', value: `${invoices.length} فاتورة`, icon: FileText, color: 'text-accent' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">لوحة التحكم</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
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
        <CardHeader>
          <CardTitle>آخر الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا توجد فواتير بعد</p>
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
