import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus,
  AlertCircle,
  Pencil
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { AccountRepository } from '@/infrastructure/repositories';
import type { Transaction, Account } from '@/domain/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [txs, accs] = await Promise.all([
          blink.db.table<Transaction>('transactions').list({ limit: 5, orderBy: { timestamp: 'desc' } }),
          AccountRepository.list()
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

  const openCreateAccount = () => {
    setEditingAccount(null);
    setOwnerName('');
    setIdNumber('');
    setDialogOpen(true);
  };

  const openEditAccount = (account: Account) => {
    setEditingAccount(account);
    setOwnerName(account.ownerName);
    setIdNumber(account.idNumber);
    setDialogOpen(true);
  };

  const saveAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAccount(true);
    try {
      if (editingAccount) {
        await AccountRepository.update(editingAccount.id, {
          ownerName: ownerName.trim(),
          idNumber: idNumber.trim(),
        });
      } else {
        const user = await blink.auth.me();
        if (!user) throw new Error('Session expirée');
        await AccountRepository.create({
          accountNumber: `ACC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          ownerName: ownerName.trim(),
          balance: 0,
          idNumber: idNumber.trim(),
          createdAt: new Date().toISOString(),
          userId: user.id,
          active: true,
        });
      }
      setAccounts(await AccountRepository.list());
      setDialogOpen(false);
      toast.success(editingAccount ? 'Compte modifié' : 'Compte créé');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible d’enregistrer le compte');
    } finally {
      setSavingAccount(false);
    }
  };

  const toggleAccount = async (account: Account) => {
    const active = account.active === false;
    try {
      await AccountRepository.update(account.id, { active });
      setAccounts(current => current.map(item => item.id === account.id ? { ...item, active } : item));
      toast.success(active ? 'Compte réactivé' : 'Compte désactivé');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de modifier le compte');
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vue d'ensemble</h2>
          <p className="text-muted-foreground">Suivi des flux de trésorerie en temps réel.</p>
        </div>
        <Button className="gap-2" onClick={openCreateAccount}>
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

      <Card>
        <CardHeader>
          <CardTitle>Comptes clients</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucun compte enregistré.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compte</TableHead>
                  <TableHead>Titulaire</TableHead>
                  <TableHead>Solde</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map(account => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono text-xs">{account.accountNumber}</TableCell>
                    <TableCell>{account.ownerName}</TableCell>
                    <TableCell>{account.balance.toLocaleString()} FCFA</TableCell>
                    <TableCell>
                      <Badge variant={account.active === false ? 'destructive' : 'outline'}>
                        {account.active === false ? 'Désactivé' : 'Actif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditAccount(account)} aria-label={`Modifier ${account.accountNumber}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void toggleAccount(account)}>
                        {account.active === false ? 'Réactiver' : 'Désactiver'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={saveAccount} className="space-y-5">
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Modifier le compte' : 'Créer un compte'}</DialogTitle>
              <DialogDescription>
                {editingAccount ? editingAccount.accountNumber : 'Un numéro de compte sera généré automatiquement.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="owner-name">Nom du titulaire</Label>
              <Input id="owner-name" value={ownerName} onChange={event => setOwnerName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id-number">Numéro de pièce d’identité</Label>
              <Input id="id-number" value={idNumber} onChange={event => setIdNumber(event.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={savingAccount}>
                {savingAccount ? 'Enregistrement...' : editingAccount ? 'Enregistrer' : 'Créer le compte'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
