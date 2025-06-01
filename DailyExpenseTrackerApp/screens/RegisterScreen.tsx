import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      await axios.post('http://YOUR_BACKEND_IP:5000/api/auth/register', {
        name,
        email,
        password,
      });
      Alert.alert('Registration Successful');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Registration Failed', error?.response?.data?.message || error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#888',
    marginBottom: 12,
    padding: 8,
    borderRadius: 4,
  },
});
