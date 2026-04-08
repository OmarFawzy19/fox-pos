import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/formatters';
import { Printer, Download } from 'lucide-react';
import { useRef } from 'react';

interface InvoicePreviewProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
}

export default function InvoicePreview({ invoice, open, onClose }: InvoicePreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>فاتورة رقم ${invoice.number}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Tajawal', sans-serif; direction: rtl; padding: 40px; color: #1a1a2e; }
          .invoice-container { max-width: 780px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #0f3460; }
          .company-name { font-size: 32px; font-weight: 800; color: #0f3460; }
          .invoice-type { font-size: 18px; color: #666; margin-top: 4px; }
          .invoice-meta { text-align: left; font-size: 14px; color: #555; }
          .invoice-meta strong { color: #0f3460; font-size: 16px; }
          .entity-section { background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
          .entity-section strong { color: #0f3460; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          thead th { background: #0f3460; color: white; padding: 10px 12px; text-align: right; font-weight: 500; }
          tbody td { padding: 10px 12px; border-bottom: 1px solid #e0e0e0; }
          tbody tr:nth-child(even) { background: #f8f9fa; }
          .totals { margin-right: auto; width: 280px; }
          .totals .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 15px; }
          .totals .row.total { font-size: 18px; font-weight: 700; color: #0f3460; border-bottom: 2px solid #0f3460; }
          .status-badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-weight: 700; font-size: 14px; margin-top: 12px; }
          .status-paid { background: #d4edda; color: #155724; }
          .status-partial { background: #fff3cd; color: #856404; }
          .status-credit { background: #f8d7da; color: #721c24; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    // Use print-to-PDF via the same print dialog
    handlePrint();
  };

  const statusClass = invoice.status === 'مدفوع' ? 'status-paid' : invoice.status === 'جزئي' ? 'status-partial' : 'status-credit';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Action buttons */}
        <div className="sticky top-0 z-10 flex gap-2 p-4 bg-background border-b border-border">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> طباعة
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> تحميل PDF
          </Button>
          <Button onClick={onClose} variant="ghost" className="mr-auto">إغلاق</Button>
        </div>

        {/* Invoice content */}
        <div ref={printRef} className="p-8">
          <div className="invoice-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 20, borderBottom: '3px solid hsl(220, 60%, 22%)' }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'hsl(220, 60%, 22%)' }}>fox</div>
                <div style={{ fontSize: 16, color: '#888', marginTop: 4 }}>
                  {invoice.type === 'purchase' ? 'فاتورة شراء' : 'فاتورة بيع'}
                </div>
              </div>
              <div style={{ textAlign: 'left', fontSize: 14, color: '#555' }}>
                <div><strong style={{ color: 'hsl(220, 60%, 22%)', fontSize: 16 }}>فاتورة رقم: {invoice.number}</strong></div>
                <div style={{ marginTop: 4 }}>{formatDate(invoice.date)}</div>
              </div>
            </div>

            {/* Entity info */}
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <strong style={{ color: 'hsl(220, 60%, 22%)' }}>
                {invoice.type === 'purchase' ? 'المورد: ' : 'العميل: '}
              </strong>
              {invoice.entityName}
            </div>

            {/* Items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr>
                  <th style={{ background: 'hsl(220, 60%, 22%)', color: 'white', padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>المنتج</th>
                  <th style={{ background: 'hsl(220, 60%, 22%)', color: 'white', padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>الكمية</th>
                  <th style={{ background: 'hsl(220, 60%, 22%)', color: 'white', padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>السعر</th>
                  <th style={{ background: 'hsl(220, 60%, 22%)', color: 'white', padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 1 ? '#f8f9fa' : 'white' }}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{item.productName}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{item.quantity}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ marginRight: 'auto', width: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: 15 }}>
                <span>الإجمالي</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: 15 }}>
                <span>المدفوع</span>
                <span>{formatCurrency(invoice.paid)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid hsl(220, 60%, 22%)', fontSize: 18, fontWeight: 700, color: 'hsl(220, 60%, 22%)' }}>
                <span>الباقي</span>
                <span>{formatCurrency(invoice.remaining)}</span>
              </div>
            </div>

            {/* Status */}
            <div style={{ marginTop: 16 }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 16px',
                borderRadius: 20,
                fontWeight: 700,
                fontSize: 14,
                ...(invoice.status === 'مدفوع' ? { background: '#d4edda', color: '#155724' } :
                  invoice.status === 'جزئي' ? { background: '#fff3cd', color: '#856404' } :
                    { background: '#f8d7da', color: '#721c24' })
              }}>
                حالة الدفع: {invoice.status}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
