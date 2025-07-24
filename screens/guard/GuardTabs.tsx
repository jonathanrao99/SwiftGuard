// @ts-nocheck
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import GuardDashboard from './GuardDashboard';
import GuardJobsScreen from './GuardJobsScreen';
import GuardProfileScreen from './GuardProfileScreen';
import CustomBottomNav from '../../components/CustomBottomNav';
import { TabBarVisibilityProvider } from '../../components/TabBarVisibilityContext';

const Tab = createBottomTabNavigator();

export default function GuardTabs() {
  return (
    <TabBarVisibilityProvider>
      <Tab.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }} tabBar={props => <CustomBottomNav {...props} />}>
        <Tab.Screen 
          name="Home" 
          component={GuardDashboard} 
          options={{ 
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size, focused }) => <MaterialIcons name="dashboard" size={size} color={color} />
          }} 
        />
        <Tab.Screen 
          name="Jobs" 
          component={GuardJobsScreen} 
          options={{ tabBarLabel: 'Jobs', tabBarIcon: ({ color, size, focused }) => <MaterialIcons name="work" size={size} color={color} /> }} 
        />
        <Tab.Screen 
          name="Profile" 
          component={GuardProfileScreen} 
          options={{ 
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size, focused }) => <FontAwesome name="user" size={size} color={color} />
          }} 
        />
      </Tab.Navigator>
    </TabBarVisibilityProvider>
  );
} 