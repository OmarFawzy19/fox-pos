import { useState, useMemo, useEffect } from 'react';
import { InvoicesAPI, Invoice } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/formatters';
import { Search, FileText } from 'lucide-react';
import InvoicePreview from '@/components/InvoicePreview';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  useEffect(() => { InvoicesAPI.list().then(setInvoices); }, []);

  const filtered = useMemo(() => {
    let result = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (typeFilter !== 'all') result = result.filter(i => i.type === typeFilter);
    if (search.trim()) {
      const q = search.trim();
      result = result.filter(i => i.number.toString().includes(q) || i.entityName.includes(q));
    }
    return result;
  }, [invoices, typeFilter, search]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">سجل الفواتير</h1>
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>بحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="رقم الفاتورة أو اسم العميل/المورد" className="pr-10" />
              </div>
            </div>
            <div className="w-48">
              <Label>نوع الفاتورة</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="sale">بيع</SelectItem>
                  <SelectItem value="purchase">شراء</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">لا توجد فواتير</p>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">رقم</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">النوع</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">العميل / المورد</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">التاريخ</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">الإجمالي</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">المدفوع</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">الباقي</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">الحالة</th>
              </tr></thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} onClick={() => setPreviewInvoice(inv)} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors">
                    <td className="py-3 px-4 font-medium">{inv.number}</td>
                    <td className="py-3 px-4"><Badge variant={inv.type === 'sale' ? 'default' : 'secondary'}>{inv.type === 'sale' ? 'بيع' : 'شراء'}</Badge></td>
                    <td className="py-3 px-4">{inv.entityName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(inv.date)}</td>
                    <td className="py-3 px-4">{formatCurrency(inv.total)}</td>
                    <td className="py-3 px-4">{formatCurrency(inv.paid)}</td>
                    <td className="py-3 px-4 font-medium text-destructive">{formatCurrency(inv.remaining)}</td>
                    <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(inv.status)}`}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}
      <InvoicePreview invoice={previewInvoice} open={!!previewInvoice} onClose={() => setPreviewInvoice(null)} />
    </div>
  );
}