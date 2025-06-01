import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    fetchUser();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.info}>👤 Name: {user.name}</Text>
          <Text style={styles.info}>📧 Email: {user.email}</Text>
          <View style={styles.button}>
            <Button title="Logout" color="red" onPress={logout} />
          </View>
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  info: { fontSize: 18, marginBottom: 10 },
  button: { marginTop: 30 },
});
