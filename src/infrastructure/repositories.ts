import { blink } from '@/lib/blink';
import type { Account, Transaction, CashRegister } from '@/domain/types';

export const AccountRepository = {
  list: async (): Promise<Account[]> => {
    return await blink.db.table<Account>('accounts').list();
  },

  create: async (account: Omit<Account, 'id'>): Promise<Account> => {
    return await blink.db.table<Account>('accounts').create(account);
  },

  update: async (accountId: string, data: Partial<Account>): Promise<void> => {
    await blink.db.table<Account>('accounts').update(accountId, data);
  },

  getByAccountNumber: async (accountNumber: string): Promise<Account | null> => {
    const accounts = await blink.db.table<Account>('accounts').list({
      where: { accountNumber },
    });
    return accounts[0] || null;
  },

  updateBalance: async (accountId: string, newBalance: number): Promise<void> => {
    await blink.db.table<Account>('accounts').update(accountId, {
      balance: newBalance,
    });
  },
};

export const TransactionRepository = {
  create: async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    return await blink.db.table<Transaction>('transactions').create(transaction);
  },

  listByAccount: async (accountId: string): Promise<Transaction[]> => {
    return await blink.db.table<Transaction>('transactions').list({
      where: { accountId },
      orderBy: { timestamp: 'desc' },
    });
  },
};

export const CashRegisterRepository = {
  get: async (tellerId: string): Promise<CashRegister | null> => {
    const registers = await blink.db.table<CashRegister>('cash_registers').list({
      where: { tellerId },
    });
    return registers[0] || null;
  },

  update: async (registerId: string, data: Partial<CashRegister>): Promise<void> => {
    await blink.db.table<CashRegister>('cash_registers').update(registerId, data);
  },
};
