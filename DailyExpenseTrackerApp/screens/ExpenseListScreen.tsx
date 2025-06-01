import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';

interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

export default function ExpenseListScreen({ navigation }: any) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const isFocused = useIsFocused();

  const fetchExpenses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('http://YOUR_BACKEND_IP:5000/api/expenses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setExpenses(res.data);
    } catch (err: any) {
      Alert.alert('Error fetching expenses', err.message);
    }
  };

  useEffect(() => {
    if (isFocused) fetchExpenses();
  }, [isFocused]);

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title} — ₹{item.amount}</Text>
      <Text style={styles.category}>{item.category}</Text>
      <Text>{new Date(item.date).toLocaleDateString()}</Text>
      <View style={styles.actions}>
        <Button title="Edit" onPress={() => navigation.navigate('EditExpense', { expense: item })} />
        <Button title="Delete" onPress={() => handleDelete(item._id)} color="red" />
        <Button title="My Profile" onPress={() => navigation.navigate('Profile')} />

      </View>
    </View>
  );

  const handleDelete = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`http://YOUR_BACKEND_IP:5000/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Deleted');
      fetchExpenses();
    } catch (err: any) {
      Alert.alert('Failed to delete', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Add Expense" onPress={() => navigation.navigate('AddExpense')} />
      <FlatList
        data={expenses}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginVertical: 8,
    borderRadius: 6,
  },
  title: { fontSize: 16, fontWeight: 'bold' },
  category: { fontStyle: 'italic', color: '#555' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});
