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
  reference?: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  previousBalance?: number;
  newBalance?: number;
  denominations?: Record<string, number>;
  timestamp: string;
  userId: string; // The teller who performed the action
}

export interface TransactionReceiptData {
  transactionId: string;
  reference: string;
  accountNumber: string;
  ownerName: string;
  idNumber?: string;
  type: TransactionType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  timestamp: string;
  tellerName: string;
  terminalId: string;
  denominations?: Record<string, number>;
  securityHash: string;
}

export interface FailedOperation {
  id: string;
  timestamp: string;
  type: TransactionType;
  accountNumber: string;
  ownerName?: string;
  amount: number;
  reason: string;
  errorCode: string;
  technicalDetails?: string;
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
