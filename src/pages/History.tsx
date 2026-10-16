import { useEffect, useState } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Download,
  Calendar
} from 'lucide-react';
import { blink } from '@/lib/blink';
import type { Transaction, TransactionType, Account } from '@/domain/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function History() {
  const [transactions, setTransactions] = useState<(Transaction & { account?: Account })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [cashierFilter, setCashierFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [txs, accs] = await Promise.all([
          blink.db.table<Transaction>('transactions').list({ orderBy: { timestamp: 'desc' } }),
          blink.db.table<Account>('accounts').list()
        ]);
        
        const merged = txs.map(tx => ({
          ...tx,
          account: accs.find(a => a.id === tx.accountId)
        }));

        setTransactions(merged);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = transactions.filter(tx => {
    const query = search.toLowerCase();
    const matchesSearch =
      tx.account?.accountNumber.toLowerCase().includes(query) ||
      tx.account?.ownerName.toLowerCase().includes(query) ||
      tx.type.toLowerCase().includes(query) ||
      tx.userId.toLowerCase().includes(query);
    const transactionDate = tx.timestamp.slice(0, 10);

    return Boolean(matchesSearch) &&
      (typeFilter === 'ALL' || tx.type === typeFilter) &&
      (accountFilter === 'ALL' || tx.accountId === accountFilter) &&
      (cashierFilter === 'ALL' || tx.userId === cashierFilter) &&
      (!startDate || transactionDate >= startDate) &&
      (!endDate || transactionDate <= endDate);
  });

  const accounts = Array.from(new Map(
    transactions.filter(tx => tx.account).map(tx => [tx.accountId, tx.account!])
  ).values());
  const cashiers = Array.from(new Set(transactions.map(tx => tx.userId))).sort();

  const exportCsv = () => {
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      ['Date', 'Identifiant', 'Compte', 'Titulaire', 'Type', 'Montant (FCFA)', 'Caissier'],
      ...filtered.map(tx => [
        format(new Date(tx.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        tx.id,
        tx.account?.accountNumber || '',
        tx.account?.ownerName || '',
        tx.type === 'DEPOSIT' ? 'Versement' : 'Retrait',
        tx.amount,
        tx.userId,
      ]),
    ];
    const csv = `\uFEFF${rows.map(row => row.map(escapeCsv).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-muted rounded-xl">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Journal des transactions</h2>
            <p className="text-muted-foreground">Registre immuable des opérations de caisse</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher compte, titulaire ou caissier..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select aria-label="Filtrer par type" className="h-10 rounded-md border bg-background px-3 text-sm" value={typeFilter} onChange={event => setTypeFilter(event.target.value as 'ALL' | TransactionType)}>
              <option value="ALL">Tous les types</option>
              <option value="DEPOSIT">Versements</option>
              <option value="WITHDRAWAL">Retraits</option>
            </select>
            <select aria-label="Filtrer par compte" className="h-10 rounded-md border bg-background px-3 text-sm" value={accountFilter} onChange={event => setAccountFilter(event.target.value)}>
              <option value="ALL">Tous les comptes</option>
              {accounts.map(account => <option key={account.id} value={account.id}>{account.accountNumber}</option>)}
            </select>
            <select aria-label="Filtrer par caissier" className="h-10 rounded-md border bg-background px-3 text-sm" value={cashierFilter} onChange={event => setCashierFilter(event.target.value)}>
              <option value="ALL">Tous les caissiers</option>
              {cashiers.map(cashier => <option key={cashier} value={cashier}>{cashier}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="sr-only">Date de début</span>
              <Input type="date" aria-label="Date de début" value={startDate} onChange={event => setStartDate(event.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="sr-only">Date de fin</span>
              <Input type="date" aria-label="Date de fin" value={endDate} onChange={event => setEndDate(event.target.value)} />
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Chargement du journal...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Aucune transaction trouvée.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horodatage</TableHead>
                  <TableHead>ID Transaction</TableHead>
                  <TableHead>Compte / Titulaire</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.id} className="group">
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                       {format(new Date(tx.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-mono text-[10px] uppercase">
                       {tx.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                       <div className="space-y-0.5">
                          <p className="font-semibold text-sm">{tx.account?.accountNumber}</p>
                          <p className="text-xs text-muted-foreground">{tx.account?.ownerName}</p>
                       </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.type === 'DEPOSIT' ? 'outline' : 'default'} className={tx.type === 'DEPOSIT' ? 'border-green-500/50 text-green-600' : 'bg-primary/90'}>
                        {tx.type === 'DEPOSIT' ? 'Versement' : 'Retrait'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-foreground'}`}>
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
