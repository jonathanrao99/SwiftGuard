import React, { FC } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

// Types for bottom navigation custom component
interface CustomBottomNavProps {
  state: any;
  descriptors: Record<string, any>;
  navigation: any;
}

const CustomBottomNav: FC<CustomBottomNavProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 32, marginHorizontal: 56, paddingVertical: 8, paddingHorizontal: 18, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 10, justifyContent: 'space-between', flex: 1 }}>
        {state.routes.map((route: any, idx: number) => {
          const focused = state.index === idx;
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
          let icon;
          if (route.name === 'Jobs') {
            // @ts-ignore
            icon = <MaterialIcons name="work" size={focused ? 28 : 24} color={focused ? '#2563eb' : '#64748b'} />;
          } else {
            let iconName: any;
            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Search':
                iconName = focused ? 'search' : 'search-outline';
                break;
              case 'Messages':
                iconName = focused ? 'chatbubble' : 'chatbubble-outline';
                break;
              case 'Profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
              default:
                iconName = 'home-outline';
            }
            icon = <Ionicons name={iconName} size={focused ? 28 : 24} color={focused ? '#2563eb' : '#64748b'} />;
          }
          return (
            <TouchableOpacity key={route.key} onPress={() => navigation.navigate(route.name)} style={{ alignItems: 'center', flex: 1 }} activeOpacity={0.7}>
              {icon}
              <Text style={{ fontSize: 12, marginTop: 4, color: focused ? '#2563eb' : '#64748b', fontWeight: focused ? 'bold' : '500' }}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default CustomBottomNav; 