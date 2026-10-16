import React, { useRef } from 'react';
import { 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Banknote, 
  QrCode, 
  ArrowDownLeft, 
  ArrowUpRight 
} from 'lucide-react';
import type { TransactionReceiptData } from '@/domain/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface TransactionReceiptProps {
  receipt: TransactionReceiptData;
  onNewOperation?: () => void;
}

export function TransactionReceipt({ receipt, onNewOperation }: TransactionReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formattedDate = format(new Date(receipt.timestamp), 'dd MMMM yyyy à HH:mm:ss', { locale: fr });
  const isDeposit = receipt.type === 'DEPOSIT';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const textReceipt = `
============================================================
              BIOTRANSAC SÉCURITÉ BANCAIRE
         TERMINAL DE CAISSE CERTIFIÉ v4.2.0
============================================================
RÉFÉRENCE UNIQUE : ${receipt.reference}
ID TRANSACTION   : ${receipt.transactionId}
DATE ET HEURE    : ${formattedDate}
TERMINAL         : ${receipt.terminalId} (AGENCE PRINCIPALE)
GUICHETIER       : ${receipt.tellerName}
------------------------------------------------------------
DÉTAILS DU COMPTE CLIENT
TITULAIRE        : ${receipt.ownerName}
N° DE COMPTE     : ${receipt.accountNumber}
N° PIÈCE ID      : ${receipt.idNumber || 'NON SPÉCIFIÉ'}
------------------------------------------------------------
NATURE DE L'OPÉRATION : ${isDeposit ? 'VERSEMENT D\'ESPÈCES (CRÉDIT)' : 'RETRAIT SÉCURISÉ (DÉBIT)'}
MONTANT OPÉRATION     : ${receipt.amount.toLocaleString('fr-FR')} FCFA
------------------------------------------------------------
ANCIEN SOLDE     : ${receipt.previousBalance.toLocaleString('fr-FR')} FCFA
NOUVEAU SOLDE    : ${receipt.newBalance.toLocaleString('fr-FR')} FCFA
${receipt.denominations && Object.keys(receipt.denominations).length > 0 ? `
RÉPARTITION DES COUPURES :
${Object.entries(receipt.denominations).map(([c, count]) => ` - ${Number(c).toLocaleString('fr-FR')} FCFA x ${count}`).join('\n')}
` : ''}
------------------------------------------------------------
CERTIFICATION & CONTRÔLE D'INTÉGRITÉ
STATUT           : OPÉRATION VALIDÉE ET COMPTABILISÉE
HASH SÉCURITÉ    : ${receipt.securityHash}
============================================================
Ce document certifie l'exécution irrévocable de la transaction.
Conservez ce justificatif pour tout recours ou réclamation.
============================================================
    `.trim();

    const blob = new Blob([textReceipt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Recu-${receipt.type}-${receipt.reference}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Justificatif téléchargé avec succès');
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Printable Receipt Container */}
      <Card 
        ref={receiptRef} 
        id="printable-receipt" 
        className="bg-card text-card-foreground border-2 shadow-2xl relative overflow-hidden transition-all duration-300"
      >
        {/* Top Decorative Header */}
        <div className={`h-2.5 w-full ${isDeposit ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`} />

        <CardContent className="p-6 md:p-8 space-y-6">
          {/* Header & Bank Branding */}
          <div className="flex items-start justify-between border-b pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg text-white ${isDeposit ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                  {isDeposit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-1.5">
                    BIOTRANSAC
                    <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
                  </h3>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Réseau Bancaire Sécurisé
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <Badge variant="outline" className={`font-mono text-xs font-bold uppercase tracking-wider ${isDeposit ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20'}`}>
                {isDeposit ? 'Reçu de Versement' : 'Reçu de Retrait'}
              </Badge>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">
                Ref: {receipt.reference}
              </p>
            </div>
          </div>

          {/* Success Status Banner */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Transaction validée avec succès.</span> Les écritures comptables ont été mises à jour en temps réel.
            </div>
          </div>

          {/* Amount Display */}
          <div className="text-center py-4 bg-muted/30 rounded-2xl border border-border/60">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              {isDeposit ? 'Montant Total Crédité' : 'Montant Total Débité'}
            </p>
            <div className={`text-4xl font-black tracking-tight font-mono ${isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
              {isDeposit ? '+' : '-'}{receipt.amount.toLocaleString('fr-FR')} <span className="text-xl font-bold">FCFA</span>
            </div>
          </div>

          {/* Grid Details */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Titulaire</span>
              <p className="font-semibold text-foreground">{receipt.ownerName}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">N° de Compte</span>
              <p className="font-mono font-bold text-foreground">{receipt.accountNumber}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Ancien Solde</span>
              <p className="font-mono text-muted-foreground">
                {receipt.previousBalance.toLocaleString('fr-FR')} FCFA
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nouveau Solde</span>
              <p className="font-mono font-bold text-foreground">
                {receipt.newBalance.toLocaleString('fr-FR')} FCFA
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date & Heure</span>
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Guichet & Caisse</span>
              <p className="text-xs font-medium text-foreground">{receipt.terminalId} • {receipt.tellerName}</p>
            </div>
          </div>

          {/* Denominations (if available) */}
          {receipt.denominations && Object.keys(receipt.denominations).length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5" />
                Détail des coupures
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(receipt.denominations).map(([c, count]) => (
                  <Badge key={c} variant="secondary" className="font-mono text-xs">
                    {Number(c).toLocaleString('fr-FR')} FCFA : <span className="font-bold ml-1">x{count}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Security Signature & Verification Hash */}
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-1 max-w-[280px]">
              <p className="text-[10px] text-muted-foreground font-mono leading-tight">
                Empreinte de certification :<br />
                <span className="text-[9px] font-bold break-all text-foreground/80">{receipt.securityHash}</span>
              </p>
              <p className="text-[9px] text-muted-foreground">
                Certifié conforme aux règles bancaires de sécurité BIOTRANSAC.
              </p>
            </div>
            <div className="p-2 border rounded-xl bg-background shadow-inner flex flex-col items-center">
              <QrCode className="w-10 h-10 text-muted-foreground" />
              <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">Vérifié</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons for Printing, Downloading and Continuing */}
      <div className="space-y-3 print:hidden">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-12 gap-2 text-sm font-semibold border-border hover:bg-accent" 
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 text-primary" />
            Imprimer le reçu
          </Button>

          <Button 
            variant="outline" 
            className="h-12 gap-2 text-sm font-semibold border-border hover:bg-accent" 
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 text-primary" />
            Télécharger le justificatif
          </Button>
        </div>

        {onNewOperation && (
          <Button 
            className="w-full h-12 text-base font-semibold shadow-md" 
            onClick={onNewOperation}
          >
            Nouvelle opération de caisse
          </Button>
        )}
      </div>
    </div>
  );
}
