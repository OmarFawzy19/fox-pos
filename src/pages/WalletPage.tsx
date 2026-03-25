import { useState } from 'react';
import { useWallet, useExpenses, usePayments } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { Wallet, TrendingUp, TrendingDown, Receipt } from 'lucide-react';

const EXPENSE_CATEGORIES = ['نقل', 'إيجار', 'عمالة', 'صيانة', 'كهرباء ومياه', 'مواد تعبئة', 'أخرى'];

export default function WalletPage() {
  const { wallet, deductFromWallet } = useWallet();
  const { expenses, addExpense } = useExpenses();
  const { payments } = usePayments();

  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleAddExpense = () => {
    const amt = Number(amount);
    if (!category || !amt || amt <= 0) {
      toast.error('يرجى إدخال بيانات صحيحة');
      return;
    }
    if (amt > wallet) {
      toast.error('المبلغ أكبر من رصيد المحفظة');
      return;
    }

    deductFromWallet(amt);
    addExpense({
      date: new Date().toISOString(),
      category,
      amount: amt,
      note: note || undefined,
    });
    toast.success(`تم تسجيل مصروف ${formatCurrency(amt)} - ${category}`);
    setCategory(''); setAmount(''); setNote('');
  };

  const customerPayments = payments.filter(p => p.entityType === 'customer');
  const totalCollected = customerPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Combined history sorted by date
  const history = [
    ...customerPayments.map(p => ({ type: 'income' as const, date: p.date, amount: p.amount, label: `تحصيل من ${p.entityName}`, note: p.note })),
    ...expenses.map(e => ({ type: 'expense' as const, date: e.date, amount: e.amount, label: e.category, note: e.note })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">المحفظة</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">رصيد المحفظة</p>
              <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(wallet)}</p>
            </div>
            <Wallet className="w-10 h-10 text-primary opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي التحصيلات</p>
              <p className="text-2xl font-bold text-accent mt-1">{formatCurrency(totalCollected)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-accent opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
              <p className="text-2xl font-bold text-destructive mt-1">{formatCurrency(totalExpenses)}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-destructive opacity-80" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add Expense */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              تسجيل مصروف
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>التصنيف</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="اختر التصنيف..." /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>المبلغ (ج.م)</Label>
              <Input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0" />
            </div>

            <div>
              <Label>ملاحظات</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="ملاحظات (اختياري)" />
            </div>

            <Button onClick={handleAddExpense} className="w-full" variant="destructive">تسجيل المصروف</Button>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>سجل المحفظة</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد حركات بعد</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((item, i) => (
                  <div key={i} className="bg-muted rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        {item.note && <p className="text-xs text-muted-foreground mt-1">{item.note}</p>}
                      </div>
                      <div className="text-left">
                        <p className={`font-bold ${item.type === 'income' ? 'text-accent' : 'text-destructive'}`}>
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
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
