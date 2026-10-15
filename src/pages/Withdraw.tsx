import { useState } from 'react';
import {
  CreditCard,
  Fingerprint,
  UserCheck,
  Banknote,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { useWithdrawal } from '@/application/use-withdrawal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function Withdraw() {
  const withdrawal = useWithdrawal();
  const [amount, setAmount] = useState('');

  const handleWithdraw = async () => {
    try {
      await withdrawal.executeWithdrawal(Number(amount), {});
    } catch (err) {
      // Error is handled in hook
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg">
          <ArrowUpRight className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Retrait d'espèces sécurisé</h2>
          <p className="text-muted-foreground">Workflow de retrait BIOTRANSAC v4.2</p>
        </div>
      </div>

      {withdrawal.error && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Erreur de sécurité</AlertTitle>
          <AlertDescription>{withdrawal.error}</AlertDescription>
        </Alert>
      )}

      {withdrawal.step === 'IDLE' && (
        <Card className="border-2 border-dashed bg-muted/20">
          <CardHeader className="text-center">
            <CardTitle>Prêt pour une nouvelle transaction</CardTitle>
            <CardDescription>Veuillez cliquer sur le bouton ci-dessous pour démarrer le processus sécurisé.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button size="lg" onClick={withdrawal.startWorkflow} className="h-14 px-8 text-lg gap-3">
              Commencer le workflow
              <ArrowRight className="w-5 h-5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {withdrawal.step === 'CARD_INSERTION' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Étape 1: Insertion de la carte
            </CardTitle>
            <CardDescription>Lecture du numéro de compte via le module Securgen.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-10 gap-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center bg-muted ${withdrawal.isLoading ? 'animate-pulse' : ''}`}>
              <CreditCard className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-sm text-center max-w-xs text-muted-foreground">
              Veuillez insérer la carte du client dans le lecteur externe.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full h-12"
              onClick={withdrawal.scanCard}
              disabled={withdrawal.isLoading}
            >
              {withdrawal.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Lire la carte
            </Button>
          </CardFooter>
        </Card>
      )}

      {withdrawal.step === 'BIOMETRIC_AUTH' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5" />
              Étape 2: Authentification biométrique
            </CardTitle>
            <CardDescription>Scan de l'empreinte digitale requis pour valider l'identité.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-10 gap-6">
            <div className={`p-6 rounded-2xl bg-primary/10 text-primary ${withdrawal.isLoading ? 'animate-pulse' : ''}`}>
              <Fingerprint className="w-20 h-20" />
            </div>
            <div className="space-y-1 text-center">
              <p className="font-semibold">
                <span>Compte identifié: </span>
                <span>{withdrawal.account?.accountNumber}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span>Titulaire: </span>
                <span>{withdrawal.account?.ownerName}</span>
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full h-12"
              onClick={withdrawal.authenticate}
              disabled={withdrawal.isLoading}
            >
              {withdrawal.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Scanner l'empreinte
            </Button>
          </CardFooter>
        </Card>
      )}

      {withdrawal.step === 'IDENTITY_VERIFICATION' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Étape 3: Vérification de la pièce d'identité
            </CardTitle>
            <CardDescription>Veuillez confirmer les informations d'identité du client.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">Nom complet</Label>
                <p className="font-medium p-3 bg-muted/50 rounded-md border">{withdrawal.account?.ownerName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">N° de compte</Label>
                <p className="font-medium p-3 bg-muted/50 rounded-md border">{withdrawal.account?.accountNumber}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">N° ID Client</Label>
                <p className="font-medium p-3 bg-muted/50 rounded-md border">{withdrawal.account?.idNumber}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">Score Biométrie</Label>
                <div className="p-3 bg-green-500/10 rounded-md border border-green-500/20">
                  <Badge variant="outline" className="bg-green-500 text-white border-0">
                    {Math.round((withdrawal.authResult?.score || 0) * 100)}% Match
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-12" onClick={withdrawal.verifyIdentity}>
              Confirmer l'identité
            </Button>
          </CardFooter>
        </Card>
      )}

      {withdrawal.step === 'WITHDRAWAL_FORM' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Étape 4: Saisie du retrait
            </CardTitle>
            <CardDescription>Saisissez le montant et vérifiez les coupures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Solde disponible</p>
                <p className="text-2xl font-bold">
                  <span>{withdrawal.account?.balance.toLocaleString()}</span>{" "}
                  <span>FCFA</span>
                </p>
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary">Vérifié</Badge>
            </div>

            <div className="space-y-3">
              <Label htmlFor="amount">Montant à retirer (FCFA)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  className="h-14 text-2xl font-mono pr-16"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">FCFA</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Coupures disponibles (Simulation)</Label>
              <div className="grid grid-cols-3 gap-2">
                {[10000, 5000, 2000, 1000, 500].map(c => (
                  <div key={c} className="p-2 border rounded-md text-center text-xs bg-muted/50">
                    {c.toLocaleString()}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full h-14 text-lg"
              size="lg"
              onClick={handleWithdraw}
              disabled={!amount || Number(amount) <= 0 || Number(amount) > (withdrawal.account?.balance || 0) || withdrawal.isLoading}
            >
              {withdrawal.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Valider le retrait
            </Button>
          </CardFooter>
        </Card>
      )}

      {withdrawal.step === 'SUCCESS' && (
        <Card className="border-green-500 bg-green-50/10">
          <CardContent className="flex flex-col items-center py-12 gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center shadow-xl shadow-green-500/20">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-green-700">Retrait Réussi</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                La transaction a été validée et enregistrée de manière immuable dans le journal.
              </p>
            </div>

            <Separator className="my-2" />

            <div className="w-full grid grid-cols-2 gap-4 text-sm">
              <div className="text-left space-y-1">
                <p className="text-muted-foreground">Montant retiré</p>
                <p className="font-bold text-lg">
                  <span>{Number(amount).toLocaleString()}</span>{" "}
                  <span>FCFA</span>
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-muted-foreground">Nouveau solde</p>
                <p className="font-bold text-lg">
                  <span>{((withdrawal.account?.balance || 0) - Number(amount)).toLocaleString()}</span>{" "}
                  <span>FCFA</span>
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full h-12" onClick={withdrawal.reset}>
              Retour à l'accueil
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
