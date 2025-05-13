import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoadingScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="shield-key-outline" size={120} color="#fff" />
      <Text style={styles.tagline}>Hire Security. Faster, Smarter, Safer</Text>
      <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2E88FA', justifyContent: 'center', alignItems: 'center' },
  tagline: { color: '#fff', fontSize: 16, marginTop: 10, textAlign: 'center' },
  spinner: { marginTop: 20 }
}); 