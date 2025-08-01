import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

export default function NavigationBarTest() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Test navigation bar configuration
    console.log('Setting navigation bar color...');
    
    if (Platform.OS === 'android') {
      const isDark = colorScheme === 'dark';
      const backgroundColor = isDark ? '#27272a' : '#e0f2ff';
      const buttonStyle = isDark ? 'light' : 'dark';
      
      console.log(`Setting background color to: ${backgroundColor}`);
      console.log(`Setting button style to: ${buttonStyle}`);
      
      NavigationBar.setBackgroundColorAsync(backgroundColor);
      NavigationBar.setButtonStyleAsync(buttonStyle);
      
      // Test with red color to verify it's working
      // NavigationBar.setBackgroundColorAsync('#ff0000');
    }
  }, [colorScheme]);

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#27272a' : '#e0f2ff' }]}>
      <Text style={styles.text}>Navigation Bar Test</Text>
      <Text style={styles.subtext}>
        If you see a colored navigation bar (not white), the configuration is working!
      </Text>
      <Text style={styles.subtext}>
        Current theme: {colorScheme}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.8,
  },
}); 