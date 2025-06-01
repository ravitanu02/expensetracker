import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Dimensions, ScrollView, StyleSheet, Text } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { scheduleDailyReminder } from '../services/notificationService';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const [expenses, setExpenses] = useState<any[]>([]);

  const fetchExpenses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('http://YOUR_BACKEND_IP:5000/api/expenses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data);
    } catch (err: any) {
      Alert.alert('Failed to fetch data', err.message);
    }
  };

  useEffect(() => {
    fetchExpenses();
    scheduleDailyReminder(20, 0);
  }, []);

  const categoryMap: { [key: string]: number } = {};
  const dailyMap: { [key: string]: number } = {};

  for (const exp of expenses) {
    categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;

    const dateKey = new Date(exp.date).toLocaleDateString();
    dailyMap[dateKey] = (dailyMap[dateKey] || 0) + exp.amount;
  }

  const pieData = Object.entries(categoryMap).map(([key, val], idx) => ({
    name: key,
    amount: val,
    color: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'][idx % 5],
    legendFontColor: '#333',
    legendFontSize: 14,
  }));

  const lineData = {
    labels: Object.keys(dailyMap),
    datasets: [
      {
        data: Object.values(dailyMap),
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Expense Category Breakdown</Text>
      {pieData.length > 0 ? (
        <PieChart
          data={pieData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="16"
        />
      ) : (
        <Text>No data</Text>
      )}

      <Text style={styles.heading}>Daily Spending</Text>
      {lineData.labels.length > 0 ? (
        <LineChart
          data={lineData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{ borderRadius: 8 }}
        />
      ) : (
        <Text>No data</Text>
      )}
      <Button
        title="Enable Daily Reminder"
        onPress={() => scheduleDailyReminder(20, 0)} // at 8:00 PM
        />
    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(50, 100, 200, ${opacity})`,
  labelColor: () => '#000',
  decimalPlaces: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 18, fontWeight: 'bold', marginVertical: 12 },
});
