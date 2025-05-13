import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import ClientDashboard from './screens/ClientDashboard';
import SecurityDashboard from './screens/SecurityDashboard';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ClientDashboard" component={ClientDashboard} options={{ title: 'Client Dashboard' }} />
        <Stack.Screen name="SecurityDashboard" component={SecurityDashboard} options={{ title: 'Security Dashboard' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
