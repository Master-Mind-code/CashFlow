export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL';

export interface Account {
  id: string;
  accountNumber: string;
  ownerName: string;
  balance: number;
  idNumber: string;
  createdAt: string;
  userId: string;
  active?: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  denominations?: Record<string, number>;
  timestamp: string;
  userId: string; // The teller who performed the action
}

export interface CashRegister {
  id: string;
  tellerId: string;
  currentBalance: number;
  denominations: Record<string, number>;
  userId: string;
}

export type WithdrawalStep =
  | 'IDLE'
  | 'CARD_INSERTION'
  | 'BIOMETRIC_AUTH'
  | 'IDENTITY_VERIFICATION'
  | 'WITHDRAWAL_FORM'
  | 'VALIDATION'
  | 'SUCCESS';

export interface BiometricAuthResult {
  success: boolean;
  score: number;
  timestamp: string;
}
