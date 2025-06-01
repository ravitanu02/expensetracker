import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AddTransactionScreen from './screens/AddTransactionScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { colors } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.background,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <StatusBar
        barStyle={colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
