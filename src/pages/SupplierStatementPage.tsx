import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SuppliersAPI, InvoicesAPI, PaymentsAPI, Supplier, Invoice, Payment } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ArrowRight, Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StatementEntry {
  date: string;
  type: 'invoice' | 'payment';
  invoiceNumber?: number;
  total: number;
  paid: number;
  remaining: number;
}

export default function SupplierStatementPage() {
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'invoices' | 'payments'>('all');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      SuppliersAPI.list(),
      InvoicesAPI.list(),
      PaymentsAPI.list(),
    ]).then(([suppliers, invs, pays]) => {
      setSupplier(suppliers.find(s => s.id === id) ?? null);
      setInvoices(invs);
      setPayments(pays);
      setLoading(false);
    });
  }, [id]);

  const allEntries = useMemo((): StatementEntry[] => {
    if (!id) return [];
    let items: StatementEntry[] = [];

    // Purchase invoices from this supplier
    invoices
      .filter(inv => inv.type === 'purchase' && inv.entityId === id)
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

    // Payments made to this supplier
    payments
      .filter(p => p.entityType === 'supplier' && p.entityId === id)
      .forEach(p => {
        items.push({
          date: p.date,
          type: 'payment',
          total: p.amount,
          paid: p.amount,
          remaining: 0,
        });
      });

    // Sort ascending by date
    items = items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return items;
  }, [id, invoices, payments]);

  // Apply filters and calculate running balance
  const displayEntries = useMemo(() => {
    let runningBalance = 0; // Negative means we owe them, positive means they owe us (if overpaid). But usually statement is Debit/Credit.
    // For a supplier: Invoice increases how much we owe them (Credit). Payment decreases how much we owe them (Debit).
    // Let's treat our Balance to them: Balance = Sum(Invoices) - Sum(Payments)

    return allEntries.map(entry => {
      let debit = 0; // Payment to supplier
      let credit = 0; // Invoice from supplier

      if (entry.type === 'invoice') {
        credit = entry.total;
        debit = entry.paid; // If part of the invoice was paid immediately
      } else {
        debit = entry.total; // Independent payment
      }

      runningBalance += (credit - debit);

      return { ...entry, runningBalance };
    })
      .filter(entry => {
        // Apply filters on the display list but KEEP the running balance correct
        if (dateFrom && entry.date < dateFrom) return false;
        if (dateTo && entry.date > dateTo) return false;
        if (typeFilter === 'invoices' && entry.type !== 'invoice') return false;
        if (typeFilter === 'payments' && entry.type !== 'payment') return false;
        return true;
      });
  }, [allEntries, dateFrom, dateTo, typeFilter]);

  const summary = useMemo(() => {
    const totalInvoices = allEntries.filter(e => e.type === 'invoice').reduce((s, e) => s + e.total, 0);
    const totalPaid =
      allEntries.filter(e => e.type === 'payment').reduce((s, e) => s + e.paid, 0) +
      allEntries.filter(e => e.type === 'invoice').reduce((s, e) => s + e.paid, 0);
    return { totalInvoices, totalPaid, remaining: totalInvoices - totalPaid };
  }, [allEntries]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">المورد غير موجود</p>
        <Link to="/suppliers"><Button variant="outline" className="mt-4">العودة للموردين</Button></Link>
      </div>
    );
  }

  return (
    <div className="print-container">
      {/* Header section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/suppliers" className="no-print">
            <Button variant="ghost" size="icon"><ArrowRight className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">كشف حساب مورد: {supplier.name}</h1>
            <p className="text-sm text-muted-foreground">{supplier.phone} • {supplier.address}</p>
          </div>
        </div>
        <Button onClick={handlePrint} className="no-print gap-2">
          <Printer className="w-4 h-4" />
          طباعة كشف الحساب
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي الفواتير (مشتريات)</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(summary.totalInvoices)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي المدفوعات (صادر)</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(summary.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">الرصيد المتبقي (علينا)</p>
            <p className={`text-xl font-bold ${summary.remaining > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {formatCurrency(summary.remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 no-print">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">من تاريخ</label>
            <input type="date" className="border rounded bg-transparent p-2 text-sm max-w-[150px]"
              value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">إلى تاريخ</label>
            <input type="date" className="border rounded bg-transparent p-2 text-sm max-w-[150px]"
              value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">النوع</label>
            <select className="border rounded bg-transparent p-2 text-sm"
              value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
              <option value="all">الكل</option>
              <option value="invoices">فقط الفواتير</option>
              <option value="payments">فقط المدفوعات</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <Button variant="outline" onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter('all'); }}>
            إلغاء الفلاتر
          </Button>
        </CardContent>
      </Card>

      {/* Statement Table */}
      <Card>
        <CardContent className="p-0">
          {displayEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">لا توجد حركات مطابقة للبحث</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">رقم الفاتورة</TableHead>
                  <TableHead className="text-right">إجمالي الفاتورة</TableHead>
                  <TableHead className="text-right">المدفوع / الدفعة</TableHead>
                  <TableHead className="text-right font-bold text-primary">الرصيد المتحرك</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayEntries.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.type === 'invoice' ? 'default' : 'secondary'}>
                        {entry.type === 'invoice' ? 'فاتورة شراء' : 'دفعة للمورد'}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.invoiceNumber ?? '—'}</TableCell>
                    <TableCell>{entry.type === 'invoice' ? formatCurrency(entry.total) : '—'}</TableCell>
                    <TableCell>{formatCurrency(entry.paid)}</TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(entry.runningBalance)}
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
