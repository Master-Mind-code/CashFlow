import { useState } from 'react';
import {
  CreditCard,
  Fingerprint,
  UserCheck,
  Banknote,
  ArrowRight,
  ShieldAlert,
  Loader2,
  ArrowUpRight,
  AlertTriangle,
  RotateCcw,
  FileQuestion
} from 'lucide-react';
import { useWithdrawal } from '@/application/use-withdrawal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TransactionReceipt } from '@/components/transaction/TransactionReceipt';
import { TransactionConfirmDialog } from '@/components/transaction/TransactionConfirmDialog';
import { ErrorRecoveryDialog } from '@/components/transaction/ErrorRecoveryDialog';
import { validateTransaction, TRANSACTION_LIMITS } from '@/domain/validation';

export function Withdraw() {
  const withdrawal = useWithdrawal();
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const numAmount = Number(amount) || 0;
  const currentBalance = withdrawal.account?.balance || 0;

  // Real-time validation computation
  const validation = numAmount > 0
    ? validateTransaction('WITHDRAWAL', numAmount, currentBalance)
    : { isValid: false, errors: [], warnings: [], estimatedNewBalance: currentBalance };

  const handleRequestConfirmation = () => {
    if (!validation.isValid) return;
    setShowConfirm(true);
  };

  const handleConfirmWithdrawal = async () => {
    try {
      await withdrawal.executeWithdrawal(numAmount);
      setShowConfirm(false);
    } catch {
      setShowConfirm(false);
      setShowErrorDialog(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Retrait d'espèces sécurisé</h2>
            <p className="text-muted-foreground text-sm">Contrôle biométrique, validation des plafonds & reçus officiels</p>
          </div>
        </div>

        {withdrawal.failedOperation && (
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
      {withdrawal.error && (
        <Alert variant="destructive" className="print:hidden">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Erreur d'opération</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{withdrawal.error}</span>
            <Button
              variant="link"
              size="sm"
              className="text-white underline p-0 h-auto text-xs ml-2"
              onClick={() => setShowErrorDialog(true)}
            >
              Voir le rapport d'incident
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* STEP 0: IDLE */}
      {withdrawal.step === 'IDLE' && (
        <Card className="border-2 border-dashed bg-muted/20 print:hidden">
          <CardHeader className="text-center">
            <CardTitle>Prêt pour une nouvelle transaction de retrait</CardTitle>
            <CardDescription>
              Veuillez démarrer le parcours sécurisé avec contrôle de carte et empreinte biométrique.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button size="lg" onClick={withdrawal.startWorkflow} className="h-14 px-8 text-lg gap-3 shadow-md">
              Démarrer le retrait
              <ArrowRight className="w-5 h-5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 1: CARD INSERTION */}
      {withdrawal.step === 'CARD_INSERTION' && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Étape 1 : Insertion de la carte client
            </CardTitle>
            <CardDescription>Lecture du numéro de compte via le lecteur sécurisé Securgen.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-10 gap-6">
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center bg-muted/60 border ${withdrawal.isLoading ? 'animate-pulse' : ''}`}>
              <CreditCard className="w-12 h-12 text-primary" />
            </div>
            <p className="text-sm text-center max-w-xs text-muted-foreground">
              Veuillez insérer la carte bancaire dans le lecteur du terminal.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={withdrawal.scanCard}
              disabled={withdrawal.isLoading}
            >
              {withdrawal.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Lire la carte client
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: BIOMETRIC AUTH */}
      {withdrawal.step === 'BIOMETRIC_AUTH' && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-primary" />
              Étape 2 : Authentification biométrique
            </CardTitle>
            <CardDescription>Vérification d'empreinte digitale pour sécuriser l'autorisation.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-10 gap-6">
            <div className={`p-6 rounded-2xl bg-primary/10 text-primary ${withdrawal.isLoading ? 'animate-pulse' : ''}`}>
              <Fingerprint className="w-20 h-20" />
            </div>
            <div className="space-y-1 text-center">
              <p className="font-semibold text-base">
                Compte : <span className="font-mono">{withdrawal.account?.accountNumber}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Titulaire : <span className="font-medium text-foreground">{withdrawal.account?.ownerName}</span>
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={withdrawal.authenticate}
              disabled={withdrawal.isLoading}
            >
              {withdrawal.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Scanner l'empreinte digitale
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: IDENTITY VERIFICATION */}
      {withdrawal.step === 'IDENTITY_VERIFICATION' && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Étape 3 : Contrôle de conformité de l'identité
            </CardTitle>
            <CardDescription>Vérifiez la concordance des documents présentés par le client.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase font-bold">Nom complet</Label>
                <p className="font-semibold p-3 bg-muted/40 rounded-lg border">{withdrawal.account?.ownerName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase font-bold">N° de compte</Label>
                <p className="font-mono font-medium p-3 bg-muted/40 rounded-lg border">{withdrawal.account?.accountNumber}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase font-bold">N° Pièce d'identité</Label>
                <p className="font-mono font-medium p-3 bg-muted/40 rounded-lg border">{withdrawal.account?.idNumber}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase font-bold">Score Biométrique</Label>
                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center justify-between">
                  <Badge variant="outline" className="bg-emerald-500 text-white border-0 font-bold">
                    {Math.round((withdrawal.authResult?.score || 0) * 100)}% Match
                  </Badge>
                  <span className="text-xs text-emerald-700 font-semibold">Identité Certifiée</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-12 text-base font-semibold" onClick={withdrawal.verifyIdentity}>
              Confirmer l'identité et passer à la saisie
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 4: WITHDRAWAL FORM WITH BUSINESS VALIDATION */}
      {withdrawal.step === 'WITHDRAWAL_FORM' && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-primary" />
              Étape 4 : Saisie du montant & Vérification des limites
            </CardTitle>
            <CardDescription>
              Vérification automatique du solde, des plafonds réglementaires et des coupures.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Balance Card */}
            <div className="p-4 bg-muted/30 rounded-xl flex items-center justify-between border">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Solde Actuel Disponible</p>
                <p className="text-2xl font-black font-mono mt-0.5">
                  {currentBalance.toLocaleString('fr-FR')} <span className="text-base font-bold">FCFA</span>
                </p>
              </div>
              <div className="text-right space-y-1">
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                  Plafond / Opération : {TRANSACTION_LIMITS.MAX_WITHDRAWAL_PER_TX.toLocaleString('fr-FR')} FCFA
                </Badge>
                <p className="text-[11px] text-muted-foreground">Multiple de 500 FCFA</p>
              </div>
            </div>

            {/* Input Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-semibold">Montant à retirer (FCFA)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="500"
                  min="1000"
                  max={TRANSACTION_LIMITS.MAX_WITHDRAWAL_PER_TX}
                  className="h-14 text-2xl font-mono pr-20 font-bold"
                  placeholder="Ex: 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                  FCFA
                </span>
              </div>
            </div>

            {/* Validation Feedback & Rules Checklist */}
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
                    <span>Montant conforme aux règles de caisse.</span>
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

            {/* Quick Amount Badges */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montants fréquents :</span>
              <div className="flex flex-wrap gap-2">
                {[10000, 25000, 50000, 100000, 250000, 500000].map((v) => (
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
              className="w-full h-14 text-lg font-bold shadow-md"
              size="lg"
              onClick={handleRequestConfirmation}
              disabled={!validation.isValid || withdrawal.isLoading}
            >
              Vérifier et confirmer le retrait
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 5: SUCCESS WITH PRINTABLE / DOWNLOADABLE RECEIPT */}
      {withdrawal.step === 'SUCCESS' && withdrawal.receipt && (
        <TransactionReceipt
          receipt={withdrawal.receipt}
          onNewOperation={() => {
            setAmount('');
            withdrawal.reset();
          }}
        />
      )}

      {/* Confirmation Dialog before Committing */}
      <TransactionConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        type="WITHDRAWAL"
        amount={numAmount}
        accountNumber={withdrawal.account?.accountNumber || ''}
        ownerName={withdrawal.account?.ownerName || ''}
        currentBalance={currentBalance}
        newBalance={validation.estimatedNewBalance}
        warnings={validation.warnings}
        isLoading={withdrawal.isLoading}
        onConfirm={handleConfirmWithdrawal}
      />

      {/* Error & Incident Recovery Dialog */}
      <ErrorRecoveryDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        failedOperation={withdrawal.failedOperation}
        onRetry={handleRequestConfirmation}
      />
    </div>
  );
}
