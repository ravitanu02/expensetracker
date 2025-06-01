import '@react-native-async-storage/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import 'axios';
import axios from 'axios';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';

export default function AddExpenseScreen({ navigation }: { navigation: NavigationProp<any> }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const handleAdd = async () => {
    if (!title || !amount || !category) {
      Alert.alert('All fields are required');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/expenses',
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
      Alert.alert('Expense added!');
      navigation.goBack(); // go back to list
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message);
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
      <Button title="Add Expense" onPress={handleAdd} />
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
