import { useState } from 'react';
import {
  ArrowDownLeft,
  Search,
  User,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  FileQuestion
} from 'lucide-react';
import { 
  AccountRepository, 
  TransactionRepository, 
  FailedOperationRepository 
} from '@/infrastructure/repositories';
import type { Account, TransactionReceiptData, FailedOperation } from '@/domain/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TransactionReceipt } from '@/components/transaction/TransactionReceipt';
import { TransactionConfirmDialog } from '@/components/transaction/TransactionConfirmDialog';
import { ErrorRecoveryDialog } from '@/components/transaction/ErrorRecoveryDialog';
import { getCurrentUser } from '@/lib/blink';
import { validateTransaction, calculateDenominations, TRANSACTION_LIMITS } from '@/domain/validation';
import { toast } from 'sonner';

export function Deposit() {
  const [accountNumber, setAccountNumber] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceiptData | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [failedOperation, setFailedOperation] = useState<FailedOperation | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const numAmount = Number(amount) || 0;
  const currentBalance = account?.balance || 0;

  // Real-time validation computation
  const validation = numAmount > 0 && account
    ? validateTransaction('DEPOSIT', numAmount, currentBalance)
    : { isValid: false, errors: [], warnings: [], estimatedNewBalance: currentBalance };

  const searchAccount = async () => {
    if (!accountNumber.trim()) return;
    setLoading(true);
    setError(null);
    setReceipt(null);
    try {
      const acc = await AccountRepository.getByAccountNumber(accountNumber.trim());
      if (!acc) throw new Error(`Compte "${accountNumber}" introuvable dans le répertoire.`);
      setAccount(acc);
      toast.info(`Compte de ${acc.ownerName} chargé.`);
    } catch (err: any) {
      setError(err.message);
      setAccount(null);
      FailedOperationRepository.logFailure({
        type: 'DEPOSIT',
        accountNumber: accountNumber.trim(),
        amount: 0,
        reason: err.message,
        errorCode: 'ERR_ACCOUNT_NOT_FOUND',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirm = () => {
    if (!account || !validation.isValid) return;
    setShowConfirm(true);
  };

  const handleExecuteDeposit = async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Session expirée. Veuillez vous reconnecter.');

      const previousBalance = account.balance;
      const newBalance = previousBalance + numAmount;
      const denominations = calculateDenominations(numAmount);

      // Update balance & persist transaction
      await AccountRepository.updateBalance(account.id, newBalance);
      const createdTx = await TransactionRepository.create({
        accountId: account.id,
        type: 'DEPOSIT',
        amount: numAmount,
        previousBalance,
        newBalance,
        denominations,
        timestamp: new Date().toISOString(),
        userId: user.id,
      });

      // Construct official receipt
      const securityHash = 'SHA256:' + Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('').toUpperCase();

      const receiptData: TransactionReceiptData = {
        transactionId: createdTx.id,
        reference: createdTx.reference || `TXN-${Date.now()}`,
        accountNumber: account.accountNumber,
        ownerName: account.ownerName,
        idNumber: account.idNumber,
        type: 'DEPOSIT',
        amount: numAmount,
        previousBalance,
        newBalance,
        timestamp: createdTx.timestamp,
        tellerName: user.displayName || 'Caissier Principal',
        terminalId: 'CAISSE-01',
        denominations,
        securityHash,
      };

      setReceipt(receiptData);
      setAccount({ ...account, balance: newBalance });
      setShowConfirm(false);
      setFailedOperation(null);
      toast.success('Versement enregistré avec succès ! Reçu émis.');
    } catch (err: any) {
      setShowConfirm(false);
      setError(err.message);
      const failedOp = FailedOperationRepository.logFailure({
        type: 'DEPOSIT',
        accountNumber: account.accountNumber,
        ownerName: account.ownerName,
        amount: numAmount,
        reason: err.message,
        errorCode: 'ERR_DEPOSIT_FAILED',
        technicalDetails: err.stack,
      });
      setFailedOperation(failedOp);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  // If receipt is generated, render full official receipt view
  if (receipt) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <TransactionReceipt
          receipt={receipt}
          onNewOperation={() => {
            setReceipt(null);
            setAccount(null);
            setAccountNumber('');
            setAmount('');
            setError(null);
            setFailedOperation(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Versement d'espèces</h2>
            <p className="text-muted-foreground text-sm">Créditer un compte client avec validation des plafonds & reçu officiel</p>
          </div>
        </div>

        {failedOperation && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive gap-1.5 text-xs border-destructive/30"
            onClick={() => setShowErrorDialog(true)}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            Dernier rejet
          </Button>
        )}
      </div>

      {/* Global Error Banner */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur d'opération</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {failedOperation && (
              <Button
                variant="link"
                size="sm"
                className="text-white underline p-0 h-auto text-xs ml-2"
                onClick={() => setShowErrorDialog(true)}
              >
                Voir détails de l'incident
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Account Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche du compte bénéficiaire</CardTitle>
          <CardDescription>
            Saisissez le numéro de compte ou utilisez l'un des comptes de test prédéfinis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Ex: ACC-123-456-789"
                className="font-mono text-base h-11"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchAccount()}
              />
            </div>
            <Button onClick={searchAccount} disabled={loading || !accountNumber} className="h-11 px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Rechercher
            </Button>
          </div>

          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            <span>Exemples rapides :</span>
            <button
              type="button"
              className="text-primary hover:underline font-mono"
              onClick={() => {
                setAccountNumber('ACC-123-456-789');
              }}
            >
              ACC-123-456-789
            </button>
            <span>•</span>
            <button
              type="button"
              className="text-primary hover:underline font-mono"
              onClick={() => {
                setAccountNumber('ACC-987-654-321');
              }}
            >
              ACC-987-654-321
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Account Details & Amount Input Form */}
      {account && (
        <Card className="animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-emerald-600" />
              Informations du compte & Saisie du versement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/30 border">
              <div className="space-y-0.5">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Titulaire</p>
                <p className="font-semibold text-base">{account.ownerName}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">N° Compte</p>
                <p className="font-mono font-bold">{account.accountNumber}</p>
              </div>
              <div className="space-y-0.5 col-span-2 md:col-span-1">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Solde Actuel</p>
                <p className="font-black text-xl font-mono text-emerald-600 dark:text-emerald-400">
                  {account.balance.toLocaleString('fr-FR')} <span className="text-xs font-bold">FCFA</span>
                </p>
              </div>
            </div>

            <Separator />

            {/* Amount Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount" className="text-sm font-semibold">Montant à verser en caisse</Label>
                <span className="text-xs text-muted-foreground">
                  Plafond / Opération : {TRANSACTION_LIMITS.MAX_DEPOSIT_PER_TX.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="500"
                  min="1000"
                  max={TRANSACTION_LIMITS.MAX_DEPOSIT_PER_TX}
                  className="h-14 text-2xl font-mono pr-20 font-bold"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                  FCFA
                </span>
              </div>
            </div>

            {/* Validation Feedback */}
            {numAmount > 0 && (
              <div className="space-y-2">
                {validation.errors.length > 0 ? (
                  <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Condition de validation non respectée :
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {validation.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs flex items-center justify-between font-semibold">
                    <span>Montant conforme.</span>
                    <span className="font-mono">Nouveau solde estimé : {validation.estimatedNewBalance.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}

                {validation.warnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{validation.warnings[0]}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montants fréquents :</span>
              <div className="flex flex-wrap gap-2">
                {[25000, 50000, 100000, 250000, 500000, 1000000].map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={() => setAmount(v.toString())}
                  >
                    {v.toLocaleString('fr-FR')}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2"
              onClick={handleOpenConfirm}
              disabled={loading || !validation.isValid}
            >
              Vérifier et confirmer le versement
              <ArrowRight className="w-5 h-5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Confirmation Dialog before validation */}
      <TransactionConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        type="DEPOSIT"
        amount={numAmount}
        accountNumber={account?.accountNumber || ''}
        ownerName={account?.ownerName || ''}
        currentBalance={currentBalance}
        newBalance={validation.estimatedNewBalance}
        warnings={validation.warnings}
        isLoading={loading}
        onConfirm={handleExecuteDeposit}
      />

      {/* Error & Incident Recovery Dialog */}
      <ErrorRecoveryDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        failedOperation={failedOperation}
        onRetry={handleOpenConfirm}
      />
    </div>
  );
}
