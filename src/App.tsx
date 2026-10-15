import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Shell } from '@/components/layout/Shell';
import { Dashboard } from '@/pages/Dashboard';
import { Withdraw } from '@/pages/Withdraw';
import { Deposit } from '@/pages/Deposit';
import { History } from '@/pages/History';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, LogIn } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';
import { blink } from '@/lib/blink';
import type { Account } from '@/domain/types';

export default function App() {
  const { isAuthenticated, loading, login } = useAuth();

  useEffect(() => {
    // Seed initial data if needed
    async function seedData() {
      if (!isAuthenticated) return;
      const currentUser = await blink.auth.me();
      if (!currentUser) return;
      
      try {
        const accounts = await blink.db.table<Account>('accounts').list();
        if (accounts.length === 0) {
          await blink.db.table<Account>('accounts').createMany([
            {
              accountNumber: 'ACC-123-456-789',
              ownerName: 'Mamadou Diallo',
              balance: 5000000,
              idNumber: 'ID-882299',
              createdAt: new Date().toISOString(),
              userId: currentUser.id
            },
            {
              accountNumber: 'ACC-987-654-321',
              ownerName: 'Fatou Sow',
              balance: 1250000,
              idNumber: 'ID-110044',
              createdAt: new Date().toISOString(),
              userId: currentUser.id
            }
          ]);
        }
      } catch (err) {
        console.error('Seeding error:', err);
      }
    }
    seedData();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Initialisation du terminal sécurisé...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-2xl">
               <ShieldCheck className="w-12 h-12" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">SecureCashFlow</h1>
              <p className="text-muted-foreground mt-2">Accès restreint au personnel autorisé</p>
            </div>
          </div>
          
          <div className="bg-background p-8 rounded-2xl shadow-xl border border-border/50 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Authentification requise</h2>
              <p className="text-sm text-muted-foreground">Veuillez vous connecter avec vos identifiants bancaires pour accéder au terminal de caisse.</p>
            </div>
            <Button className="w-full h-12 text-lg gap-2" onClick={login}>
              <LogIn className="w-5 h-5" />
              Se connecter
            </Button>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Système certifié BIOTRANSAC • v4.2.0
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
      <Toaster position="top-right" closeButton richColors />
    </Router>
  );
}
