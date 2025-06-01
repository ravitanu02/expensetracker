import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function EditExpenseScreen({ route, navigation }: any) {
  const { expense } = route.params;

  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState(expense.category);

  const handleUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `http://YOUR_BACKEND_IP:5000/api/expenses/${expense._id}`,
        {
          title,
          amount: parseFloat(amount),
          category,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Alert.alert('Updated!');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Update failed', err.response?.data?.message || err.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Title"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        placeholder="Amount"
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Category"
        style={styles.input}
        value={category}
        onChangeText={setCategory}
      />
      <Button title="Update Expense" onPress={handleUpdate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    marginBottom: 12,
    padding: 10,
    borderRadius: 6,
  },
});
