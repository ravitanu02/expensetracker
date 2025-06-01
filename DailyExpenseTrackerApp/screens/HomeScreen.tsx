import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';
import { scheduleDailyReminder } from '../services/notificationService';
import { storageService, Transaction } from '../services/storageService';

type Period = 'all' | 'daily' | 'weekly' | 'monthly';

const HomeScreen = ({ navigation }: any) => {
  const { colors, toggleTheme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [selectedPeriod, transactions]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const loadedTransactions = await storageService.getTransactions();
      setTransactions(loadedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    const now = new Date();
    let filtered: Transaction[] = [];

    switch (selectedPeriod) {
      case 'daily':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = transactions.filter(t => new Date(t.date) >= startOfDay);
        break;
      case 'weekly':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        filtered = transactions.filter(t => new Date(t.date) >= startOfWeek);
        break;
      case 'monthly':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = transactions.filter(t => new Date(t.date) >= startOfMonth);
        break;
      default:
        filtered = transactions;
    }

    setFilteredTransactions(filtered);
    calculateTotals(filtered);
  };

  const calculateTotals = (transactions: Transaction[]) => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setTotalIncome(income);
    setTotalExpense(expense);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const chartData = [
    {
      name: 'Income',
      amount: totalIncome,
      color: colors.success,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Expense',
      amount: totalExpense,
      color: colors.error,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
  ];

  const testNotification = async () => {
    try {
      const now = new Date();
      const minute = (now.getMinutes() + 1) % 60;
      const hour = now.getHours() + (minute === 0 ? 1 : 0);
      
      await scheduleDailyReminder(hour, minute);
      Alert.alert('Success', `Notification scheduled for ${hour}:${minute}`);
    } catch (error) {
      console.error('Error testing notification:', error);
      Alert.alert('Error', 'Failed to schedule notification');
    }
  };

  const clearStorage = async () => {
    try {
      await storageService.clearAllData();
      Alert.alert('Success', 'Storage cleared successfully');
      loadTransactions(); // Reload transactions
    } catch (error) {
      console.error('Error clearing storage:', error);
      Alert.alert('Error', 'Failed to clear storage');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hello,</Text>
            <Text style={[styles.name, { color: colors.text }]}>User</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={testNotification} style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={clearStorage} style={styles.iconButton}>
              <Ionicons name="trash-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
              <Ionicons 
                name={colors.background === '#000000' ? 'sunny' : 'moon'} 
                size={24} 
                color={colors.text} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['all', 'daily', 'weekly', 'monthly'] as Period[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                { borderColor: colors.border },
                selectedPeriod === period && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: colors.textSecondary },
                  selectedPeriod === period && { color: colors.white },
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Statistics */}
        <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Income</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              ${totalIncome.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expense</Text>
            <Text style={[styles.statValue, { color: colors.error }]}>
              ${totalExpense.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Balance</Text>
            <Text style={[
              styles.statValue,
              { color: totalIncome - totalExpense >= 0 ? colors.success : colors.error }
            ]}>
              ${(totalIncome - totalExpense).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Chart */}
        {filteredTransactions.length > 0 && (
          <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Overview</Text>
            <PieChart
              data={chartData}
              width={300}
              height={200}
              chartConfig={{
                color: (opacity = 1) => colors.text,
                labelColor: (opacity = 1) => colors.text,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <Ionicons name="add" size={24} color={colors.white} />
              <Text style={[styles.addButtonText, { color: colors.white }]}>Add New</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No transactions found
              </Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.primary, marginTop: 20 }]}
                onPress={() => navigation.navigate('AddTransaction')}
              >
                <Ionicons name="add" size={24} color={colors.white} />
                <Text style={[styles.addButtonText, { color: colors.white }]}>Add Your First Transaction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={[styles.transactionItem, { backgroundColor: colors.card }]}
              >
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: colors.background }]}>
                    <Text style={styles.transactionIconText}>{transaction.icon}</Text>
                  </View>
                  <View>
                    <Text style={[styles.transactionCategory, { color: colors.text }]}>
                      {transaction.category}
                    </Text>
                    <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'income' ? colors.success : colors.error },
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={[styles.floatingAddButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Ionicons name="add" size={30} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
  greeting: {
    fontSize: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 10,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  periodText: {
    fontSize: 14,
  },
  statsContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statLabel: {
    marginRight: 10,
  },
  statValue: {
    fontWeight: '600',
  },
  statDivider: {
    height: 1,
    flex: 1,
  },
  chartContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  transactionsContainer: {
    padding: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    gap: 5,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionCategory: {
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontWeight: '600',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default HomeScreen;
