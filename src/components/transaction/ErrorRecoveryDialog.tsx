import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  XCircle, 
  RotateCcw, 
  Download, 
  FileText, 
  AlertTriangle,
  History 
} from 'lucide-react';
import type { FailedOperation } from '@/domain/types';
import { toast } from 'sonner';

interface ErrorRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  failedOperation: FailedOperation | null;
  onRetry?: () => void;
}

export function ErrorRecoveryDialog({
  open,
  onOpenChange,
  failedOperation,
  onRetry,
}: ErrorRecoveryDialogProps) {
  if (!failedOperation) return null;

  const handleDownloadReport = () => {
    const report = `
============================================================
              RAPPORT D'INCIDENT TRANSACTIONNEL
               BIOTRANSAC SÉCURITÉ BANCAIRE
============================================================
ID INCIDENT       : ${failedOperation.id}
CODE ERREUR       : ${failedOperation.errorCode}
DATE & HEURE      : ${new Date(failedOperation.timestamp).toLocaleString('fr-FR')}
TYPE D'OPÉRATION  : ${failedOperation.type === 'DEPOSIT' ? 'VERSEMENT' : 'RETRAIT'}
------------------------------------------------------------
PARAMÈTRES SOUMIS
COMPTE CLIENT     : ${failedOperation.accountNumber}
TITULAIRE         : ${failedOperation.ownerName || 'NON DÉTERMINÉ'}
MONTANT TENTÉ     : ${failedOperation.amount.toLocaleString('fr-FR')} FCFA
------------------------------------------------------------
DIAGNOSTIC DU REJET :
${failedOperation.reason}
${failedOperation.technicalDetails ? `\nDÉTAILS TECHNIQUES :\n${failedOperation.technicalDetails}` : ''}
------------------------------------------------------------
RECOMMANDATION :
Vérifiez la conformité du solde, la validité des plafonds ou l'état
du réseau de transmission avant de tenter une nouvelle soumission.
============================================================
    `.trim();

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Incident-${failedOperation.errorCode}-${failedOperation.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Rapport d\'incident exporté avec succès');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-destructive">
                Échec de l'opération de caisse
              </DialogTitle>
              <DialogDescription className="text-xs">
                La transaction n'a pas pu être validée. Aucune écriture comptable n'a été prélevée.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Reason Alert */}
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Motif du rejet</span>
              <Badge variant="destructive" className="font-mono text-[10px]">
                {failedOperation.errorCode}
              </Badge>
            </div>
            <p className="text-sm font-semibold">{failedOperation.reason}</p>
          </div>

          {/* Details */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Incident</span>
              <span className="font-mono">{failedOperation.id}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Compte concerné</span>
              <span className="font-mono font-medium">{failedOperation.accountNumber}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant demandé</span>
              <span className="font-bold">{failedOperation.amount.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horodatage</span>
              <span>{new Date(failedOperation.timestamp).toLocaleTimeString('fr-FR')}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 text-[11px] text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Cet incident a été consigné dans le journal des anomalies de caisse.</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="gap-2 text-xs h-11"
            onClick={handleDownloadReport}
          >
            <Download className="w-4 h-4" />
            Exporter le rapport
          </Button>

          {onRetry && (
            <Button
              className="gap-2 font-semibold h-11"
              onClick={() => {
                onOpenChange(false);
                onRetry();
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Réessayer l'opération
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
