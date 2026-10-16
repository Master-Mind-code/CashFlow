import { blink } from '@/lib/blink';
import type { Account, Transaction, CashRegister } from '@/domain/types';

const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    accountNumber: 'ACC-123-456-789',
    ownerName: 'Mamadou Diallo',
    balance: 5000000,
    idNumber: 'ID-882299',
    createdAt: new Date().toISOString(),
    userId: 'usr_caissier_01'
  },
  {
    id: 'acc-2',
    accountNumber: 'ACC-987-654-321',
    ownerName: 'Fatou Sow',
    balance: 1250000,
    idNumber: 'ID-110044',
    createdAt: new Date().toISOString(),
    userId: 'usr_caissier_01'
  }
];

function getLocalAccounts(): Account[] {
  const data = localStorage.getItem('cf_accounts');
  if (!data) {
    localStorage.setItem('cf_accounts', JSON.stringify(INITIAL_ACCOUNTS));
    return INITIAL_ACCOUNTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_ACCOUNTS;
  }
}

function saveLocalAccounts(accounts: Account[]) {
  localStorage.setItem('cf_accounts', JSON.stringify(accounts));
}

function getLocalTransactions(): Transaction[] {
  const data = localStorage.getItem('cf_transactions');
  if (!data) {
    const initialTxs: Transaction[] = [
      {
        id: 'tx-1',
        accountId: 'acc-1',
        type: 'DEPOSIT',
        amount: 500000,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userId: 'usr_caissier_01'
      },
      {
        id: 'tx-2',
        accountId: 'acc-2',
        type: 'WITHDRAWAL',
        amount: 250000,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        userId: 'usr_caissier_01'
      }
    ];
    localStorage.setItem('cf_transactions', JSON.stringify(initialTxs));
    return initialTxs;
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveLocalTransactions(txs: Transaction[]) {
  localStorage.setItem('cf_transactions', JSON.stringify(txs));
}

export const AccountRepository = {
  getByAccountNumber: async (accountNumber: string): Promise<Account | null> => {
    try {
      const accounts = await blink.db.table<Account>('accounts').list({
        where: { accountNumber },
      });
      if (accounts && accounts.length > 0) return accounts[0];
    } catch {
      // Fallback to local storage
    }
    const locals = getLocalAccounts();
    return locals.find(a => a.accountNumber === accountNumber) || null;
  },

  list: async (): Promise<Account[]> => {
    try {
      const accounts = await blink.db.table<Account>('accounts').list();
      if (accounts && accounts.length > 0) return accounts;
    } catch {
      // Fallback
    }
    return getLocalAccounts();
  },

  updateBalance: async (accountId: string, newBalance: number): Promise<void> => {
    try {
      await blink.db.table<Account>('accounts').update(accountId, {
        balance: newBalance,
      });
    } catch {
      // Fallback
    }
    const accounts = getLocalAccounts();
    const idx = accounts.findIndex(a => a.id === accountId);
    if (idx !== -1) {
      accounts[idx].balance = newBalance;
      saveLocalAccounts(accounts);
    }
  },
};

export const TransactionRepository = {
  create: async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    try {
      return await blink.db.table<Transaction>('transactions').create(transaction);
    } catch {
      // Fallback
    }
    const newTx: Transaction = {
      ...transaction,
      id: 'tx-' + Date.now(),
    };
    const txs = getLocalTransactions();
    txs.unshift(newTx);
    saveLocalTransactions(txs);
    return newTx;
  },

  list: async (limit = 20): Promise<Transaction[]> => {
    try {
      const txs = await blink.db.table<Transaction>('transactions').list({
        limit,
        orderBy: { timestamp: 'desc' },
      });
      if (txs && txs.length > 0) return txs;
    } catch {
      // Fallback
    }
    return getLocalTransactions().slice(0, limit);
  },

  listByAccount: async (accountId: string): Promise<Transaction[]> => {
    try {
      return await blink.db.table<Transaction>('transactions').list({
        where: { accountId },
        orderBy: { timestamp: 'desc' },
      });
    } catch {
      // Fallback
    }
    return getLocalTransactions().filter(t => t.accountId === accountId);
  },
};

export const CashRegisterRepository = {
  get: async (tellerId: string): Promise<CashRegister | null> => {
    try {
      const registers = await blink.db.table<CashRegister>('cash_registers').list({
        where: { tellerId },
      });
      if (registers && registers[0]) return registers[0];
    } catch {
      // Fallback
    }
    return {
      id: 'reg-01',
      tellerId,
      openingBalance: 10000000,
      currentBalance: 10250000,
      closedAt: null,
    };
  },

  update: async (registerId: string, data: Partial<CashRegister>): Promise<void> => {
    try {
      await blink.db.table<CashRegister>('cash_registers').update(registerId, data);
    } catch {
      // Fallback
    }
  },
};
