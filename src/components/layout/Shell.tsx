import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  LogOut,
  ShieldCheck,
  Banknote
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function Shell({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-muted/30">
        <div className="h-16 flex items-center px-6 border-b gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <span className="font-bold text-lg tracking-tight">SecureCash</span>
        </div>
        
        <ScrollArea className="flex-1 px-4 py-6">
          <nav className="space-y-2">
            <NavItem to="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Tableau de bord" />
            <NavItem to="/deposit" icon={<ArrowDownLeft className="w-4 h-4" />} label="Versement" />
            <NavItem to="/withdraw" icon={<ArrowUpRight className="w-4 h-4" />} label="Retrait" />
            <NavItem to="/history" icon={<History className="w-4 h-4" />} label="Journal" />
          </nav>
        </ScrollArea>

        <div className="p-4 border-t space-y-4 bg-muted/50">
          <div className="px-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Caissier</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.displayName || 'Teller'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="h-16 flex items-center justify-between px-8 border-b sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold text-lg">BIOTRANSAC</h1>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Banknote className="w-4 h-4" />
              <span className="text-xs font-mono">Terminal: CAISSE-01</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
               Opérationnel
             </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
