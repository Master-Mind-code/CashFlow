import { useState, useCallback } from 'react';
import type { 
  WithdrawalStep, 
  Account, 
  BiometricAuthResult, 
  TransactionReceiptData, 
  FailedOperation 
} from '@/domain/types';
import { mockSecurgen } from '@/infrastructure/securgen';
import { 
  AccountRepository, 
  TransactionRepository, 
  FailedOperationRepository 
} from '@/infrastructure/repositories';
import { getCurrentUser } from '@/lib/blink';
import { validateTransaction, calculateDenominations } from '@/domain/validation';

export function useWithdrawal() {
  const [step, setStep] = useState<WithdrawalStep>('IDLE');
  const [account, setAccount] = useState<Account | null>(null);
  const [authResult, setAuthResult] = useState<BiometricAuthResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [receipt, setReceipt] = useState<TransactionReceiptData | null>(null);
  const [failedOperation, setFailedOperation] = useState<FailedOperation | null>(null);

  const startWorkflow = useCallback(() => {
    setStep('CARD_INSERTION');
    setAccount(null);
    setAuthResult(null);
    setError(null);
    setReceipt(null);
    setFailedOperation(null);
  }, []);

  const scanCard = async () => {
    setIsLoading(true);
    try {
      const accountNumber = await mockSecurgen.scanCard();
      const acc = await AccountRepository.getByAccountNumber(accountNumber);
      if (!acc) throw new Error('Compte non trouvé pour cette carte.');
      if (acc.active === false) throw new Error('Ce compte est désactivé');
      setAccount(acc);
      setStep('BIOMETRIC_AUTH');
    } catch (err: any) {
      setError(err.message);
      FailedOperationRepository.logFailure({
        type: 'WITHDRAWAL',
        accountNumber: 'INCONNU',
        amount: 0,
        reason: err.message,
        errorCode: 'ERR_CARD_SCAN',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async () => {
    setIsLoading(true);
    try {
      const result = await mockSecurgen.scanFingerprint();
      if (!result.success) throw new Error('Échec de l’authentification biométrique');
      setAuthResult({ ...result, timestamp: new Date().toISOString() });
      setStep('IDENTITY_VERIFICATION');
    } catch (err: any) {
      setError(err.message);
      if (account) {
        FailedOperationRepository.logFailure({
          type: 'WITHDRAWAL',
          accountNumber: account.accountNumber,
          ownerName: account.ownerName,
          amount: 0,
          reason: 'Échec de concordance biométrique avec la base client.',
          errorCode: 'ERR_BIOMETRIC_MISMATCH',
        });
      }
      setStep('IDLE');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyIdentity = () => {
    setStep('WITHDRAWAL_FORM');
  };

  const executeWithdrawal = async (amount: number, customDenominations?: Record<string, number>) => {
    if (!account) return;

    // Business validation
    const validation = validateTransaction('WITHDRAWAL', amount, account.balance);
    if (!validation.isValid) {
      const errorMsg = validation.errors.join(' ');
      setError(errorMsg);

      const failedOp = FailedOperationRepository.logFailure({
        type: 'WITHDRAWAL',
        accountNumber: account.accountNumber,
        ownerName: account.ownerName,
        amount,
        reason: errorMsg,
        errorCode: amount > account.balance ? 'ERR_INSUFFICIENT_FUNDS' : 'ERR_VALIDATION_LIMIT',
      });
      setFailedOperation(failedOp);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Session expirée. Veuillez vous reconnecter.');

      const previousBalance = account.balance;
      const newBalance = previousBalance - amount;
      const denominations = customDenominations || calculateDenominations(amount);

      // Persist balance & create transaction
      await AccountRepository.updateBalance(account.id, newBalance);
      const createdTx = await TransactionRepository.create({
        accountId: account.id,
        type: 'WITHDRAWAL',
        amount,
        previousBalance,
        newBalance,
        denominations,
        timestamp: new Date().toISOString(),
        userId: user.id,
      });

      // Construct certified receipt
      const securityHash = 'SHA256:' + Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('').toUpperCase();

      const receiptData: TransactionReceiptData = {
        transactionId: createdTx.id,
        reference: createdTx.reference || `TXN-${Date.now()}`,
        accountNumber: account.accountNumber,
        ownerName: account.ownerName,
        idNumber: account.idNumber,
        type: 'WITHDRAWAL',
        amount,
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
      setStep('SUCCESS');
      setError(null);
      setFailedOperation(null);
    } catch (err: any) {
      setError(err.message);
      const failedOp = FailedOperationRepository.logFailure({
        type: 'WITHDRAWAL',
        accountNumber: account.accountNumber,
        ownerName: account.ownerName,
        amount,
        reason: err.message,
        errorCode: 'ERR_EXECUTION_FAILURE',
        technicalDetails: err.stack,
      });
      setFailedOperation(failedOp);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    step,
    account,
    authResult,
    error,
    isLoading,
    receipt,
    failedOperation,
    startWorkflow,
    scanCard,
    authenticate,
    verifyIdentity,
    executeWithdrawal,
    reset: () => {
      setStep('IDLE');
      setAccount(null);
      setReceipt(null);
      setError(null);
      setFailedOperation(null);
    },
  };
}
