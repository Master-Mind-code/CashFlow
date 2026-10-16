import { useState } from 'react';
import {
  ArrowDownLeft,
  Search,
  User,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { AccountRepository, TransactionRepository } from '@/infrastructure/repositories';
import type { Account } from '@/domain/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCurrentUser } from '@/lib/blink';
import { toast } from 'sonner';

export function Deposit() {
  const [accountNumber, setAccountNumber] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      const acc = await AccountRepository.getByAccountNumber(accountNumber);
      if (!acc) throw new Error('Compte non trouvé');
      setAccount(acc);
    } catch (err: any) {
      setError(err.message);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Session expirée');

      const val = Number(amount);
      const newBalance = account.balance + val;

      await AccountRepository.updateBalance(account.id, newBalance);
      await TransactionRepository.create({
        accountId: account.id,
        type: 'DEPOSIT',
        amount: val,
        timestamp: new Date().toISOString(),
        userId: user.id,
      });

      setSuccess(true);
      toast.success('Versement effectué avec succès');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex flex-col items-center py-12 gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center shadow-xl shadow-green-500/20">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold">Versement Confirmé</h3>
          <p className="text-muted-foreground">Le compte a été crédité avec succès.</p>
          <Button className="w-full" variant="outline" onClick={() => { setSuccess(false); setAccount(null); setAccountNumber(''); setAmount(''); }}>
            Nouvelle opération
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg">
          <ArrowDownLeft className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Versement d'espèces</h2>
          <p className="text-muted-foreground">Créditer un compte client instantanément</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recherche de compte</CardTitle>
          <CardDescription>Saisissez le numéro de compte du destinataire.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Ex: ACC-123-..."
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchAccount()}
            />
          </div>
          <Button onClick={searchAccount} disabled={loading || !accountNumber}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
            Chercher
          </Button>
        </CardContent>
      </Card>

      {account && (
        <Card className="animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Titulaire</p>
                <p className="font-semibold">{account.ownerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">N° Compte</p>
                <p className="font-semibold font-mono">{account.accountNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Solde Actuel</p>
                <p className="font-bold text-lg">
                  <span>{account.balance.toLocaleString()}</span>{" "}
                  <span>FCFA</span>
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant à verser</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    className="h-14 text-2xl font-mono pr-16"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">FCFA</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full h-14 text-lg"
              onClick={handleDeposit}
              disabled={loading || !amount || Number(amount) <= 0}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Valider le versement
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
