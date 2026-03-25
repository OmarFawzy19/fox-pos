import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Truck, Package, FileText, CreditCard, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/suppliers', label: 'الموردين', icon: Truck },
  { path: '/customers', label: 'العملاء', icon: Users },
  { path: '/inventory', label: 'المخزن', icon: Package },
  { path: '/purchase-invoice', label: 'فاتورة شراء', icon: FileText },
  { path: '/sales-invoice', label: 'فاتورة بيع', icon: FileText },
  { path: '/payments', label: 'التحصيل والسداد', icon: CreditCard },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 h-full w-64 bg-sidebar text-sidebar-foreground z-50 transition-transform duration-300 lg:translate-x-0 lg:relative",
        mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold text-sidebar-foreground">فوكس</h1>
          <p className="text-sm text-sidebar-foreground/70 mt-1">نظام إدارة الأعمال</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-foreground">فوكس</h1>
        </header>
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
