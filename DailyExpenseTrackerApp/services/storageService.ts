import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  paymentMethod: string;
  date: string;
  icon: string;
  description?: string;
}

const STORAGE_KEYS = {
  TRANSACTIONS: '@expense_tracker_transactions',
  CATEGORIES: '@expense_tracker_categories',
};

const DEFAULT_CATEGORIES = {
  expense: [
    'Food',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Bills',
    'Healthcare',
    'Education',
    'Other'
  ],
  income: [
    'Salary',
    'Business',
    'Investments',
    'Gifts',
    'Refunds',
    'Other'
  ]
};

export const storageService = {
  // Transaction methods
  async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      console.log('Starting to save transaction:', JSON.stringify(transaction));
      
      // Validate transaction
      if (!transaction.id || !transaction.type || !transaction.amount || !transaction.category || !transaction.paymentMethod || !transaction.date) {
        throw new Error('Invalid transaction data');
      }

      // Get existing transactions
      let existingTransactions: Transaction[] = [];
      try {
        const existingData = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        console.log('Existing data from storage:', existingData);
        
        if (existingData) {
          existingTransactions = JSON.parse(existingData);
          if (!Array.isArray(existingTransactions)) {
            console.log('Invalid transactions format, initializing new array');
            existingTransactions = [];
          }
        }
      } catch (error) {
        console.error('Error reading existing transactions:', error);
        existingTransactions = [];
      }

      // Add new transaction
      const updatedTransactions = [...existingTransactions, transaction];
      console.log('Updated transactions array:', JSON.stringify(updatedTransactions));

      // Save to storage
      const jsonValue = JSON.stringify(updatedTransactions);
      console.log('Saving to storage:', jsonValue);
      
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, jsonValue);
      
      // Verify the save
      const verifyData = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      console.log('Verification data:', verifyData);
      
      if (!verifyData) {
        throw new Error('Failed to verify transaction save');
      }

      const savedTransactions = JSON.parse(verifyData);
      if (!savedTransactions.some((t: Transaction) => t.id === transaction.id)) {
        throw new Error('Transaction was not saved properly');
      }

      console.log('Transaction saved successfully');
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      console.log('Getting transactions...');
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      console.log('Raw data from storage:', data);
      
      if (!data) {
        console.log('No transactions found, returning empty array');
        return [];
      }

      const transactions = JSON.parse(data);
      console.log('Parsed transactions:', transactions);
      
      if (!Array.isArray(transactions)) {
        console.error('Invalid transactions format');
        return [];
      }

      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },

  async getTransactionsByType(type: 'income' | 'expense'): Promise<Transaction[]> {
    try {
      const transactions = await this.getTransactions();
      return transactions.filter(t => t.type === type);
    } catch (error) {
      console.error('Error getting transactions by type:', error);
      return [];
    }
  },

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    try {
      const transactions = await this.getTransactions();
      return transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    } catch (error) {
      console.error('Error getting transactions by date range:', error);
      return [];
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const updatedTransactions = transactions.filter(t => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  // Category methods
  async saveCategories(categories: { expense: string[], income: string[] }): Promise<void> {
    try {
      if (!categories.expense?.length || !categories.income?.length) {
        throw new Error('Invalid categories object');
      }
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
      throw error;
    }
  },

  async getCategories(): Promise<{ expense: string[], income: string[] }> {
    try {
      const categories = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!categories) {
        // If no categories exist, initialize with defaults
        await this.saveCategories(DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
      }
      const parsedCategories = JSON.parse(categories);
      if (!parsedCategories.expense?.length || !parsedCategories.income?.length) {
        // If categories are invalid, reset to defaults
        await this.saveCategories(DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
      }
      return parsedCategories;
    } catch (error) {
      console.error('Error getting categories:', error);
      // On error, return default categories
      return DEFAULT_CATEGORIES;
    }
  },

  async getCategoriesByType(type: 'income' | 'expense'): Promise<string[]> {
    try {
      const categories = await this.getCategories();
      return categories[type];
    } catch (error) {
      console.error('Error getting categories by type:', error);
      return DEFAULT_CATEGORIES[type];
    }
  },

  async initializeCategories(): Promise<void> {
    try {
      const categories = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!categories) {
        await this.saveCategories(DEFAULT_CATEGORIES);
      }
    } catch (error) {
      console.error('Error initializing categories:', error);
      // Ensure categories are set even if there's an error
      await this.saveCategories(DEFAULT_CATEGORIES);
    }
  },

  // Clear all data (for testing/debugging)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.TRANSACTIONS, STORAGE_KEYS.CATEGORIES]);
      // Reinitialize categories after clearing
      await this.initializeCategories();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}; 