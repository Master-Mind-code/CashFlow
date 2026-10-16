import type { TransactionType } from './types';

export const TRANSACTION_LIMITS = {
  MIN_AMOUNT: 1000,
  MAX_WITHDRAWAL_PER_TX: 3000000,
  MAX_DEPOSIT_PER_TX: 10000000,
  DAILY_WITHDRAWAL_LIMIT: 5000000,
  MULTIPLE_OF: 500,
  AVAILABLE_DENOMINATIONS: [10000, 5000, 2000, 1000, 500],
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedNewBalance: number;
}

export function validateTransaction(
  type: TransactionType,
  amount: number | string,
  currentBalance: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const numAmount = Number(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    errors.push('Le montant doit être un nombre strictement supérieur à 0 FCFA.');
    return {
      isValid: false,
      errors,
      warnings,
      estimatedNewBalance: currentBalance,
    };
  }

  // Minimum amount check
  if (numAmount < TRANSACTION_LIMITS.MIN_AMOUNT) {
    errors.push(
      `Le montant minimum autorisé pour un ${type === 'DEPOSIT' ? 'versement' : 'retrait'} est de ${TRANSACTION_LIMITS.MIN_AMOUNT.toLocaleString('fr-FR')} FCFA.`
    );
  }

  // Denominations multiple check
  if (numAmount % TRANSACTION_LIMITS.MULTIPLE_OF !== 0) {
    errors.push(
      `Le montant doit être un multiple de ${TRANSACTION_LIMITS.MULTIPLE_OF.toLocaleString('fr-FR')} FCFA (valeur minimale des coupures d'espèces acceptées).`
    );
  }

  // Limits and balance checks
  if (type === 'WITHDRAWAL') {
    if (numAmount > currentBalance) {
      errors.push(
        `Solde insuffisant : Le solde disponible (${currentBalance.toLocaleString('fr-FR')} FCFA) est inférieur au montant demandé (${numAmount.toLocaleString('fr-FR')} FCFA).`
      );
    }

    if (numAmount > TRANSACTION_LIMITS.MAX_WITHDRAWAL_PER_TX) {
      errors.push(
        `Plafond dépassé : Le montant dépasse la limite maximale autorisée par retrait sans accord hiérarchique (${TRANSACTION_LIMITS.MAX_WITHDRAWAL_PER_TX.toLocaleString('fr-FR')} FCFA).`
      );
    } else if (numAmount >= 2000000) {
      warnings.push(
        'Avertissement : Retrait supérieur à 2 000 000 FCFA. Une double vérification de la pièce d’identité est requise.'
      );
    }

    if (currentBalance - numAmount < 5000 && currentBalance - numAmount >= 0) {
      warnings.push(
        'Attention : Cette opération laissera un solde résiduel très faible (< 5 000 FCFA).'
      );
    }
  } else if (type === 'DEPOSIT') {
    if (numAmount > TRANSACTION_LIMITS.MAX_DEPOSIT_PER_TX) {
      errors.push(
        `Plafond dépassé : Le versement d’espèces dépasse le seuil maximal réglementaire par opération (${TRANSACTION_LIMITS.MAX_DEPOSIT_PER_TX.toLocaleString('fr-FR')} FCFA).`
      );
    } else if (numAmount >= 5000000) {
      warnings.push(
        'Déclaration de conformité : Montant élevé nécessitant la confirmation de l’origine des fonds.'
      );
    }
  }

  const estimatedNewBalance =
    type === 'DEPOSIT' ? currentBalance + numAmount : currentBalance - numAmount;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    estimatedNewBalance,
  };
}

/**
 * Calcul automatique optimal des coupures pour un montant donné
 */
export function calculateDenominations(amount: number): Record<string, number> {
  const result: Record<string, number> = {};
  let remaining = amount;

  for (const denom of TRANSACTION_LIMITS.AVAILABLE_DENOMINATIONS) {
    if (remaining >= denom) {
      const count = Math.floor(remaining / denom);
      result[denom.toString()] = count;
      remaining %= denom;
    }
  }

  return result;
}
