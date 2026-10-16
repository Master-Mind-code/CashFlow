import { useState, useCallback } from 'react';
import type { WithdrawalStep, Account, BiometricAuthResult } from '@/domain/types';
import { mockSecurgen } from '@/infrastructure/securgen';
import { AccountRepository, TransactionRepository } from '@/infrastructure/repositories';
import { getCurrentUser } from '@/lib/blink';

export function useWithdrawal() {
  const [step, setStep] = useState<WithdrawalStep>('IDLE');
  const [account, setAccount] = useState<Account | null>(null);
  const [authResult, setAuthResult] = useState<BiometricAuthResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startWorkflow = useCallback(() => {
    setStep('CARD_INSERTION');
    setAccount(null);
    setAuthResult(null);
    setError(null);
  }, []);

  const scanCard = async () => {
    setIsLoading(true);
    try {
      const accountNumber = await mockSecurgen.scanCard();
      const acc = await AccountRepository.getByAccountNumber(accountNumber);
      if (!acc) throw new Error('Compte non trouvé');
      setAccount(acc);
      setStep('BIOMETRIC_AUTH');
    } catch (err: any) {
      setError(err.message);
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
      setStep('IDLE');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyIdentity = () => {
    setStep('WITHDRAWAL_FORM');
  };

  const executeWithdrawal = async (amount: number, denominations: Record<string, number>) => {
    if (!account) return;
    if (amount > account.balance) throw new Error('Solde insuffisant');

    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Session expirée');

      const newBalance = account.balance - amount;

      // Atomic operations simulated here
      await AccountRepository.updateBalance(account.id, newBalance);
      await TransactionRepository.create({
        accountId: account.id,
        type: 'WITHDRAWAL',
        amount,
        denominations,
        timestamp: new Date().toISOString(),
        userId: user.id,
      });

      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message);
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
    startWorkflow,
    scanCard,
    authenticate,
    verifyIdentity,
    executeWithdrawal,
    reset: () => setStep('IDLE'),
  };
}
