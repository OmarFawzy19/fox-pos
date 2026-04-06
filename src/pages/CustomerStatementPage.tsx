import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCustomers, useInvoices, usePayments } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ArrowRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StatementEntry {
  date: string;
  type: 'invoice' | 'payment';
  invoiceNumber?: number;
  total: number;
  paid: number;
  remaining: number;
}

export default function CustomerStatementPage() {
  const { id } = useParams<{ id: string }>();
  const { customers } = useCustomers();
  const { invoices } = useInvoices();
  const { payments } = usePayments();

  const customer = useMemo(() => customers.find(c => c.id === id), [customers, id]);

  const entries = useMemo(() => {
    if (!id) return [];
    const items: StatementEntry[] = [];

    // Sales invoices only
    invoices
      .filter(inv => inv.type === 'sale' && inv.entityId === id)
      .forEach(inv => {
        items.push({
          date: inv.date,
          type: 'invoice',
          invoiceNumber: inv.number,
          total: inv.total,
          paid: inv.paid,
          remaining: inv.remaining,
        });
      });

    // Customer payments
    payments
      .filter(p => p.entityType === 'customer' && p.entityId === id)
      .forEach(p => {
        items.push({
          date: p.date,
          type: 'payment',
          total: p.amount,
          paid: p.amount,
          remaining: 0,
        });
      });

    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [id, invoices, payments]);

  const summary = useMemo(() => {
    const totalInvoices = entries.filter(e => e.type === 'invoice').reduce((s, e) => s + e.total, 0);
    const totalPaid = entries.filter(e => e.type === 'payment').reduce((s, e) => s + e.paid, 0) +
      entries.filter(e => e.type === 'invoice').reduce((s, e) => s + e.paid, 0);
    return { totalInvoices, totalPaid, remaining: totalInvoices - totalPaid };
  }, [entries]);

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">العميل غير موجود</p>
        <Link to="/customers"><Button variant="outline" className="mt-4">العودة للعملاء</Button></Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/customers">
          <Button variant="ghost" size="icon"><ArrowRight className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">كشف حساب: {customer.name}</h1>
          <p className="text-sm text-muted-foreground">{customer.phone} • {customer.address}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(summary.totalInvoices)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي المدفوع</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(summary.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">الرصيد المتبقي</p>
            <p className={`text-xl font-bold ${summary.remaining > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {formatCurrency(summary.remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statement Table */}
      <Card>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">لا توجد حركات لهذا العميل</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">رقم الفاتورة</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">المدفوع</TableHead>
                  <TableHead className="text-right">الباقي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.type === 'invoice' ? 'default' : 'secondary'}>
                        {entry.type === 'invoice' ? 'فاتورة' : 'دفعة'}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.invoiceNumber ?? '—'}</TableCell>
                    <TableCell>{formatCurrency(entry.total)}</TableCell>
                    <TableCell>{formatCurrency(entry.paid)}</TableCell>
                    <TableCell className={entry.remaining > 0 ? 'text-destructive font-bold' : ''}>
                      {formatCurrency(entry.remaining)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
