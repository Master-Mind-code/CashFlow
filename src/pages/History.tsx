import { useEffect, useState } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Download,
  Calendar
} from 'lucide-react';
import { blink } from '@/lib/blink';
import type { Transaction, Account } from '@/domain/types';
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

  const filtered = transactions.filter(tx => 
    tx.account?.accountNumber.toLowerCase().includes(search.toLowerCase()) ||
    tx.account?.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    tx.type.toLowerCase().includes(search.toLowerCase())
  );

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
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par compte, nom ou type..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" className="gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Filtrer par date
            </Button>
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
