import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Truck, Package, FileText, CreditCard, Menu, X, Wallet, ClipboardList, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/suppliers', label: 'الموردين', icon: Truck },
  { path: '/customers', label: 'العملاء', icon: Users },
  { path: '/inventory', label: 'المخزن', icon: Package },
  { path: '/purchase-invoice', label: 'فاتورة شراء', icon: FileText },
  { path: '/sales-invoice', label: 'فاتورة بيع', icon: FileText },
  { path: '/payments', label: 'التحصيل والسداد', icon: CreditCard },
  { path: '/wallet', label: 'المحفظة', icon: Wallet },
  { path: '/invoices', label: 'سجل الفواتير', icon: ClipboardList },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar Desktop & Mobile */}
      <aside className={cn(
        "fixed top-0 right-0 h-screen bg-sidebar text-sidebar-foreground z-50 transition-all duration-300 flex flex-col shadow-lg lg:shadow-none",
        mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        collapsed ? "w-20" : "w-64"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border min-h-[72px]">
          <div className={cn("transition-all overflow-hidden", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
            <h1 className="text-2xl font-bold whitespace-nowrap">فوكس</h1>
            <p className="text-xs text-sidebar-foreground/70 mt-0.5 whitespace-nowrap">نظام إدارة الأعمال</p>
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="hidden lg:flex p-1 hover:bg-sidebar-accent rounded-md"
          >
            {collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setMobileOpen(false)} 
            className="lg:hidden p-1 hover:bg-sidebar-accent rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
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
              <item.icon className="w-5 h-5 shrink-0" />
              <span className={cn("transition-all whitespace-nowrap", collapsed ? "hidden" : "block")}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Container - Pushed intelligently based on sidebar state */}
      <main className={cn(
        "flex-1 min-h-screen flex flex-col transition-all duration-300",
        "lg:mr-64", 
        collapsed && "lg:mr-20"
      )}>
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
