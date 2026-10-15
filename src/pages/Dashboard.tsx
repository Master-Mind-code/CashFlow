import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus,
  AlertCircle
} from 'lucide-react';
import { blink } from '@/lib/blink';
import type { Transaction, Account } from '@/domain/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [txs, accs] = await Promise.all([
          blink.db.table<Transaction>('transactions').list({ limit: 5, orderBy: { timestamp: 'desc' } }),
          blink.db.table<Account>('accounts').list()
        ]);
        setTransactions(txs);
        setAccounts(accs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const recentVolume = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vue d'ensemble</h2>
          <p className="text-muted-foreground">Suivi des flux de trésorerie en temps réel.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Compte
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Solde Total Géré" 
          value={`${totalBalance.toLocaleString()} FCFA`}
          icon={<Wallet className="w-4 h-4" />}
          description="Somme des soldes de tous les comptes"
        />
        <StatCard 
          title="Volume Récent" 
          value={`${recentVolume.toLocaleString()} FCFA`}
          icon={<TrendingUp className="w-4 h-4 text-green-500" />}
          description="Transactions des dernières 24h"
        />
        <StatCard 
          title="Alertes Sécurité" 
          value="0"
          icon={<AlertCircle className="w-4 h-4 text-blue-500" />}
          description="Aucune anomalie détectée"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Aucune transaction enregistrée.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(tx.timestamp), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {accounts.find(a => a.id === tx.accountId)?.accountNumber || 'Inconnu'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.type === 'DEPOSIT' ? 'outline' : 'default'} className={tx.type === 'DEPOSIT' ? 'border-green-500 text-green-600' : ''}>
                        {tx.type === 'DEPOSIT' ? 'Versement' : 'Retrait'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-foreground'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toLocaleString()} FCFA
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

function StatCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
