import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShieldCheck, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import type { TransactionType } from '@/domain/types';

interface TransactionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TransactionType;
  amount: number;
  accountNumber: string;
  ownerName: string;
  currentBalance: number;
  newBalance: number;
  warnings?: string[];
  isLoading?: boolean;
  onConfirm: () => void;
}

export function TransactionConfirmDialog({
  open,
  onOpenChange,
  type,
  amount,
  accountNumber,
  ownerName,
  currentBalance,
  newBalance,
  warnings = [],
  isLoading = false,
  onConfirm,
}: TransactionConfirmDialogProps) {
  const isDeposit = type === 'DEPOSIT';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white ${isDeposit ? 'bg-emerald-600' : 'bg-blue-600'}`}>
              {isDeposit ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-bold">
                Confirmation de l'opération
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Veuillez vérifier les informations ci-dessous avant d'enregistrer l'opération au grand livre.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 my-2">
          {/* Main Amount Card */}
          <div className="p-4 rounded-xl bg-muted/40 border space-y-1 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isDeposit ? 'Montant à créditer' : 'Montant à débiter'}
            </span>
            <div className={`text-3xl font-black font-mono ${isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {isDeposit ? '+' : '-'}{amount.toLocaleString('fr-FR')} <span className="text-lg font-bold">FCFA</span>
            </div>
          </div>

          {/* Account Summary */}
          <div className="p-3.5 rounded-xl border bg-card space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs uppercase font-bold">Client / Titulaire</span>
              <span className="font-semibold">{ownerName}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs uppercase font-bold">N° de Compte</span>
              <span className="font-mono font-medium">{accountNumber}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs uppercase font-bold">Solde Actuel</span>
              <span className="font-mono">{currentBalance.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs uppercase font-bold">Nouveau Solde Estimé</span>
              <span className="font-mono font-bold text-foreground">
                {newBalance.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Warnings Banner if any */}
          {warnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Vérifications complémentaires requises :
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Cette opération émettra un reçu numéroté certifié BIOTRANSAC v4.2.</span>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isLoading} className="h-11">
            Modifier / Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={`h-11 font-semibold ${isDeposit ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirmer et valider l'opération
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
