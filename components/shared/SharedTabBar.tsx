// @ts-nocheck
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import CustomBottomNav from '../CustomBottomNav';
import { TabBarVisibilityProvider } from '../TabBarVisibilityContext';

const Tab = createBottomTabNavigator();

interface TabRoute {
  name: string;
  component: React.ComponentType<any>;
  label: string;
  icon?: string;
  iconType?: 'MaterialIcons' | 'FontAwesome';
}

interface SharedTabBarProps {
  routes: TabRoute[];
  initialRouteName?: string;
}

export default function SharedTabBar({ routes, initialRouteName = 'Home' }: SharedTabBarProps) {
  const renderIcon = (route: TabRoute, color: string, size: number) => {
    if (!route.icon) return null;
    
    if (route.iconType === 'FontAwesome') {
      return <FontAwesome name={route.icon as any} size={size} color={color} />;
    }
    
    // Default to MaterialIcons
    return <MaterialIcons name={route.icon as any} size={size} color={color} />;
  };

  return (
    <TabBarVisibilityProvider>
      <Tab.Navigator 
        initialRouteName={initialRouteName} 
        screenOptions={{ headerShown: false }} 
        tabBar={(props: any) => <CustomBottomNav {...props} />}
      >
        {routes.map((route) => (
          <Tab.Screen
            key={route.name}
            name={route.name}
            component={route.component}
            options={{
              tabBarLabel: route.label,
              ...(route.icon && {
                tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => 
                  renderIcon(route, color, size)
              })
            }}
          />
        ))}
      </Tab.Navigator>
    </TabBarVisibilityProvider>
  );
} 