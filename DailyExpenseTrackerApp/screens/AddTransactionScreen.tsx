import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { storageService, Transaction } from '../services/storageService';

const PAYMENT_METHODS = ['Cash', 'Credit/Debit Card', 'Check', 'Bank Transfer'];

const AddTransactionScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [transactionType]);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      setCategoryError(null);
      console.log('Loading categories for type:', transactionType);
      
      // Initialize categories if needed
      await storageService.initializeCategories();
      
      const loadedCategories = await storageService.getCategoriesByType(transactionType);
      console.log('Loaded categories:', loadedCategories);
      
      if (!Array.isArray(loadedCategories) || loadedCategories.length === 0) {
        throw new Error('No categories available');
      }
      
      setCategories(loadedCategories);
      setCategory(loadedCategories[0]);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategoryError('Failed to load categories');
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleTransactionTypeChange = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setCategory('');
  };

  const handleAmountChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleanedText = text.replace(/[^0-9.]/g, '');
    
    // Check for multiple decimal points
    if (cleanedText.split('.').length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    const parts = cleanedText.split('.');
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setAmount(cleanedText);
    setAmountError(null);
  };

  const validateAmount = (): boolean => {
    if (!amount) {
      setAmountError('Amount is required');
      return false;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      setAmountError('Please enter a valid number');
      return false;
    }

    if (numericAmount <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }

    if (numericAmount > 1000000) {
      setAmountError('Amount cannot exceed 1,000,000');
      return false;
    }

    return true;
  };

  const handleAddTransaction = async () => {
    if (isSubmitting) {
      console.log('Already submitting, ignoring request');
      return;
    }

    console.log('Starting transaction save process...');
    console.log('Current state:', {
      amount,
      category,
      paymentType,
      transactionType,
      description
    });

    // Validate required fields
    if (!validateAmount()) {
      console.log('Amount validation failed');
      return;
    }

    if (!category) {
      console.log('Category is required');
      setCategoryError('Please select a category');
      return;
    }

    if (!paymentType) {
      console.log('Payment type is required');
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Creating transaction object...');
      
      const numericAmount = parseFloat(amount);
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: transactionType,
        amount: numericAmount,
        category,
        paymentMethod: paymentType,
        date: new Date().toISOString(),
        icon: getCategoryIcon(category),
        description: description.trim() || undefined,
      };

      console.log('Transaction object created:', JSON.stringify(newTransaction));

      // Save transaction
      await storageService.saveTransaction(newTransaction);
      console.log('Transaction saved successfully');

      // Verify the save
      const savedTransactions = await storageService.getTransactions();
      console.log('Retrieved saved transactions:', savedTransactions);

      const savedTransaction = savedTransactions.find(t => t.id === newTransaction.id);
      if (!savedTransaction) {
        throw new Error('Transaction was not found after saving');
      }

      // Show success message
      Alert.alert(
        'Success',
        'Transaction saved successfully',
        [
          {
            text: 'Add Another',
            onPress: () => {
              // Reset form fields
              setAmount('');
              setDescription('');
              setPaymentType('Cash');
              // Keep the same transaction type and category
            }
          },
          {
            text: 'Go Back',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert(
        'Error',
        'Failed to save transaction. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'Food': '🍽️',
      'Transportation': '🚗',
      'Entertainment': '🎮',
      'Shopping': '🛍️',
      'Bills': '📝',
      'Healthcare': '💊',
      'Education': '📚',
      'Other': '📌'
    };
    return icons[category] || '📌';
  };

  const handleCategorySelect = (selectedCategory: string) => {
    console.log('Selected category:', selectedCategory);
    setCategory(selectedCategory);
    setShowCategoryModal(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Add {transactionType === 'income' ? 'Income' : 'Expense'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Transaction Type Selector */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Transaction Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                { borderColor: colors.border },
                transactionType === 'expense' && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleTransactionTypeChange('expense')}
            >
              <Text style={[
                styles.typeText,
                { color: colors.textSecondary },
                transactionType === 'expense' && { color: colors.white },
              ]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                { borderColor: colors.border },
                transactionType === 'income' && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleTransactionTypeChange('income')}
            >
              <Text style={[
                styles.typeText,
                { color: colors.textSecondary },
                transactionType === 'income' && { color: colors.white },
              ]}>Income</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
          <TextInput
            style={[
              styles.amountInput,
              { 
                color: colors.text,
                borderBottomColor: amountError ? colors.error : colors.border,
              }
            ]}
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
          />
          {amountError && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {amountError}
            </Text>
          )}
        </View>

        {/* Category Selector */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
          <TouchableOpacity
            style={[
              styles.categorySelector,
              { backgroundColor: colors.card },
              categoryError && { borderColor: colors.error }
            ]}
            onPress={() => !isLoadingCategories && setShowCategoryModal(true)}
            disabled={isLoadingCategories}
          >
            <View style={styles.categoryLeft}>
              <View style={[styles.categoryIcon, { backgroundColor: colors.background }]}>
                {isLoadingCategories ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.categoryIconText}>{getCategoryIcon(category)}</Text>
                )}
              </View>
              <Text style={[styles.categoryText, { color: colors.text }]}>
                {isLoadingCategories ? 'Loading...' : category || 'Select Category'}
              </Text>
            </View>
            <Ionicons 
              name="chevron-down" 
              size={24} 
              color={isLoadingCategories ? colors.textSecondary + '80' : colors.textSecondary} 
            />
          </TouchableOpacity>
          {categoryError && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {categoryError}
            </Text>
          )}
        </View>

        {/* Payment Type */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Payment Type</Text>
          <View style={styles.paymentOptions}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentOption,
                  { borderColor: colors.border },
                  paymentType === method && { backgroundColor: colors.primary },
                ]}
                onPress={() => setPaymentType(method)}
              >
                <Text
                  style={[
                    styles.paymentText,
                    { color: colors.textSecondary },
                    paymentType === method && { color: colors.white },
                  ]}
                >
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Description (Optional)</Text>
          <TextInput
            style={[styles.descriptionInput, { 
              backgroundColor: colors.card,
              color: colors.text,
            }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note"
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </View>
      </ScrollView>

      {/* Save Transaction Button */}
      <View style={[styles.saveButtonContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { 
              backgroundColor: colors.primary,
              opacity: (amount && category && paymentType && !isSubmitting) ? 1 : 0.5
            }
          ]}
          onPress={handleAddTransaction}
          disabled={!amount || !category || !paymentType || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.white }]}>
              Save Transaction
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryItem,
                    { 
                      borderBottomColor: colors.border,
                      backgroundColor: cat === category ? colors.primary + '20' : 'transparent'
                    }
                  ]}
                  onPress={() => handleCategorySelect(cat)}
                >
                  <View style={styles.categoryItemContent}>
                    <Text style={styles.categoryItemIcon}>{getCategoryIcon(cat)}</Text>
                    <Text style={[styles.categoryItemText, { color: colors.text }]}>{cat}</Text>
                  </View>
                  {cat === category && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 16,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '600',
    padding: 10,
    borderBottomWidth: 1,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  paymentOptions: {
    gap: 10,
  },
  paymentOption: {
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 16,
  },
  descriptionInput: {
    padding: 15,
    borderRadius: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  scrollView: {
    flex: 1,
  },
  saveButtonContainer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  saveButton: {
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  categoryItemText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryItemIcon: {
    fontSize: 20,
  },
});

export default AddTransactionScreen; 