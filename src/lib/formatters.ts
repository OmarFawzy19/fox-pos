export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} ج.م`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getPaymentStatus(paid: number, total: number): 'مدفوع' | 'جزئي' | 'آجل' {
  if (paid >= total) return 'مدفوع';
  if (paid > 0) return 'جزئي';
  return 'آجل';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'مدفوع': return 'bg-success text-success-foreground';
    case 'جزئي': return 'bg-warning text-warning-foreground';
    case 'آجل': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
}
