import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Plus,
  AlertCircle,
  Receipt,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { 
  AccountRepository, 
  TransactionRepository, 
  FailedOperationRepository 
} from '@/infrastructure/repositories';
import type { Transaction, Account, TransactionReceiptData } from '@/domain/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransactionReceipt } from '@/components/transaction/TransactionReceipt';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [failuresCount, setFailuresCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionReceiptData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [txs, accs] = await Promise.all([
          TransactionRepository.list(5),
          AccountRepository.list(),
        ]);
        setTransactions(txs);
        setAccounts(accs);
        setFailuresCount(FailedOperationRepository.listFailures().length);
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

  const handleOpenReceipt = (tx: Transaction) => {
    const acc = accounts.find((a) => a.id === tx.accountId);
    const receiptData: TransactionReceiptData = {
      transactionId: tx.id,
      reference: tx.reference || `TXN-${tx.id.substring(0, 8).toUpperCase()}`,
      accountNumber: acc?.accountNumber || 'Compte Inconnu',
      ownerName: acc?.ownerName || 'Client Bancaire',
      idNumber: acc?.idNumber,
      type: tx.type,
      amount: tx.amount,
      previousBalance: tx.previousBalance ?? (tx.type === 'DEPOSIT' ? (acc?.balance || 0) - tx.amount : (acc?.balance || 0) + tx.amount),
      newBalance: tx.newBalance ?? (acc?.balance || 0),
      timestamp: tx.timestamp,
      tellerName: 'Caissier Principal',
      terminalId: 'CAISSE-01',
      denominations: tx.denominations,
      securityHash: 'SHA256:' + (tx.id.replace(/[^a-zA-Z0-9]/g, '') + 'A7BF').toUpperCase().slice(0, 16),
    };
    setSelectedReceipt(receiptData);
  };

  if (loading) return <div className="text-center py-12 text-sm text-muted-foreground">Chargement du tableau de bord...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vue d'ensemble</h2>
          <p className="text-muted-foreground">Suivi des flux de trésorerie et contrôles opérationnels.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/deposit">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4" />
              Nouveau Versement
            </Button>
          </Link>
          <Link to="/withdraw">
            <Button variant="outline" className="gap-2">
              Retrait Sécurisé
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Solde Total Géré" 
          value={`${totalBalance.toLocaleString('fr-FR')} FCFA`}
          icon={<Wallet className="w-4 h-4 text-primary" />}
          description="Somme des soldes de tous les comptes"
        />
        <StatCard 
          title="Volume Récent" 
          value={`${recentVolume.toLocaleString('fr-FR')} FCFA`}
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          description="Flux cumulé des 5 dernières transactions"
        />
        <Link to="/history">
          <StatCard 
            title="Alertes & Rejets" 
            value={failuresCount.toString()}
            icon={failuresCount > 0 ? <ShieldAlert className="w-4 h-4 text-destructive" /> : <ShieldCheck className="w-4 h-4 text-emerald-600" />}
            description={failuresCount > 0 ? "Incidents enregistrés (cliquer pour voir)" : "Toutes opérations conformes"}
          />
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Dernières Transactions</CardTitle>
          <Link to="/history" className="text-xs text-primary hover:underline font-semibold">
            Voir tout le journal →
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Aucune transaction enregistrée.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Réf</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-center">Justificatif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(tx.timestamp), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {tx.reference || tx.id.substring(0, 10)}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {accounts.find(a => a.id === tx.accountId)?.accountNumber || 'Inconnu'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={tx.type === 'DEPOSIT' ? 'outline' : 'default'} 
                        className={tx.type === 'DEPOSIT' ? 'border-emerald-500 text-emerald-600' : 'bg-primary'}
                      >
                        {tx.type === 'DEPOSIT' ? 'Versement' : 'Retrait'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-bold text-xs ${tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-foreground'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toLocaleString('fr-FR')} FCFA
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-primary hover:bg-primary/10"
                        onClick={() => handleOpenReceipt(tx)}
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Reçu
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog for Receipt Re-Print / Download */}
      <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="print:hidden">
            <DialogTitle className="text-lg font-bold">Duplicata officiel de reçu</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <TransactionReceipt 
              receipt={selectedReceipt} 
              onNewOperation={() => setSelectedReceipt(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description: string }) {
  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
