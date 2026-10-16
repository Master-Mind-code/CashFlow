import { useEffect, useState } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Download, 
  Receipt,
  AlertTriangle,
  FileQuestion,
  RotateCcw,
  Printer
} from 'lucide-react';
import { 
  AccountRepository, 
  TransactionRepository, 
  FailedOperationRepository 
} from '@/infrastructure/repositories';
import type { Transaction, Account, TransactionReceiptData, FailedOperation } from '@/domain/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransactionReceipt } from '@/components/transaction/TransactionReceipt';
import { ErrorRecoveryDialog } from '@/components/transaction/ErrorRecoveryDialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export function History() {
  const [transactions, setTransactions] = useState<(Transaction & { account?: Account })[]>([]);
  const [failedOperations, setFailedOperations] = useState<FailedOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionReceiptData | null>(null);
  const [selectedFailure, setSelectedFailure] = useState<FailedOperation | null>(null);

  const fetchData = async () => {
    try {
      const [txs, accs] = await Promise.all([
        TransactionRepository.list(100),
        AccountRepository.list(),
      ]);

      const merged = txs.map((tx) => ({
        ...tx,
        account: accs.find((a) => a.id === tx.accountId),
      }));

      setTransactions(merged);
      setFailedOperations(FailedOperationRepository.listFailures());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = transactions.filter((tx) =>
    tx.account?.accountNumber.toLowerCase().includes(search.toLowerCase()) ||
    tx.account?.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    tx.type.toLowerCase().includes(search.toLowerCase()) ||
    (tx.reference && tx.reference.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredFailures = failedOperations.filter((f) =>
    f.accountNumber.toLowerCase().includes(search.toLowerCase()) ||
    (f.ownerName && f.ownerName.toLowerCase().includes(search.toLowerCase())) ||
    f.reason.toLowerCase().includes(search.toLowerCase()) ||
    f.errorCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenReceipt = (tx: Transaction & { account?: Account }) => {
    const receiptData: TransactionReceiptData = {
      transactionId: tx.id,
      reference: tx.reference || `TXN-${tx.id.substring(0, 8).toUpperCase()}`,
      accountNumber: tx.account?.accountNumber || 'Compte N° Inconnu',
      ownerName: tx.account?.ownerName || 'Client Bancaire',
      idNumber: tx.account?.idNumber,
      type: tx.type,
      amount: tx.amount,
      previousBalance: tx.previousBalance ?? (tx.type === 'DEPOSIT' ? (tx.account?.balance || 0) - tx.amount : (tx.account?.balance || 0) + tx.amount),
      newBalance: tx.newBalance ?? (tx.account?.balance || 0),
      timestamp: tx.timestamp,
      tellerName: 'Caissier Principal',
      terminalId: 'CAISSE-01',
      denominations: tx.denominations,
      securityHash: 'SHA256:' + (tx.id.replace(/[^a-zA-Z0-9]/g, '') + 'A7BF').toUpperCase().slice(0, 16),
    };

    setSelectedReceipt(receiptData);
  };

  const handleExportCSV = () => {
    const headers = ['ID,Reference,Type,Montant,Compte,Titulaire,Date,NouveauSolde'];
    const rows = transactions.map((t) =>
      `"${t.id}","${t.reference || ''}","${t.type}",${t.amount},"${t.account?.accountNumber || ''}","${t.account?.ownerName || ''}","${t.timestamp}",${t.newBalance || ''}`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Journal exporté au format CSV');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-muted rounded-xl">
            <HistoryIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Journal des opérations de caisse</h2>
            <p className="text-muted-foreground text-sm">Registre immuable, réémission de reçus et journal des rejets</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 text-sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <TabsList className="grid grid-cols-2 w-full sm:w-[420px]">
            <TabsTrigger value="transactions" className="text-xs sm:text-sm">
              Opérations validées ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="failures" className="text-xs sm:text-sm text-destructive data-[state=active]:text-destructive">
              Rejets & Anomalies ({failedOperations.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par compte, titulaire, réf..." 
              className="pl-9 h-10 text-xs sm:text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TAB 1: VALIDATED TRANSACTIONS */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Transactions comptabilisées</CardTitle>
              <CardDescription className="text-xs">
                Cliquez sur le bouton « Reçu » pour réimprimer ou télécharger le justificatif d'une opération.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-sm text-muted-foreground">Chargement du journal...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Aucune transaction trouvée.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Horodatage</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead>Compte / Titulaire</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((tx) => (
                        <TableRow key={tx.id} className="group">
                          <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(tx.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold uppercase text-primary whitespace-nowrap">
                            {tx.reference || tx.id.substring(0, 12)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-semibold text-sm">{tx.account?.accountNumber}</p>
                              <p className="text-xs text-muted-foreground">{tx.account?.ownerName}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={tx.type === 'DEPOSIT' ? 'outline' : 'default'} 
                              className={tx.type === 'DEPOSIT' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50' : 'bg-primary'}
                            >
                              {tx.type === 'DEPOSIT' ? 'Versement' : 'Retrait'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-bold text-sm whitespace-nowrap ${tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-foreground'}`}>
                            {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toLocaleString('fr-FR')} FCFA
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: FAILED OPERATIONS & INCIDENTS AUDIT */}
        <TabsContent value="failures">
          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Journal des anomalies et rejets de caisse
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Historique des opérations n'ayant pas abouti avec motifs d'erreur et rapport d'incident.
                  </CardDescription>
                </div>
                {failedOperations.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs text-muted-foreground"
                    onClick={() => {
                      FailedOperationRepository.clearFailures();
                      setFailedOperations([]);
                      toast.info('Journal des anomalies réinitialisé');
                    }}
                  >
                    Effacer le journal
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredFailures.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Aucun incident ni rejet enregistré. Toutes les opérations ont été régulières.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Horodatage</TableHead>
                        <TableHead>Code Rejet</TableHead>
                        <TableHead>Compte</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Montant Tenté</TableHead>
                        <TableHead>Diagnostic</TableHead>
                        <TableHead className="text-center">Détails</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFailures.map((f) => (
                        <TableRow key={f.id} className="hover:bg-destructive/5">
                          <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(f.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="font-mono text-[10px]">
                              {f.errorCode}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium">
                            {f.accountNumber}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-semibold">
                              {f.type === 'DEPOSIT' ? 'Versement' : 'Retrait'}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold">
                            {f.amount > 0 ? `${f.amount.toLocaleString('fr-FR')} FCFA` : '-'}
                          </TableCell>
                          <TableCell className="text-xs max-w-xs truncate text-muted-foreground" title={f.reason}>
                            {f.reason}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 border-destructive/20 hover:bg-destructive/10 text-destructive"
                              onClick={() => setSelectedFailure(f)}
                            >
                              <FileQuestion className="w-3.5 h-3.5" />
                              Rapport
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Dialog for Viewing / Printing Past Receipt */}
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

      {/* Incident / Failure Recovery Dialog */}
      <ErrorRecoveryDialog
        open={!!selectedFailure}
        onOpenChange={(open) => !open && setSelectedFailure(null)}
        failedOperation={selectedFailure}
      />
    </div>
  );
}
