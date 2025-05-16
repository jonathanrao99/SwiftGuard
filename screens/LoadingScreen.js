import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';

export default function LoadingScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logoImage} />
      <Text style={styles.tagline}>Hire Security. Faster, Smarter, Safer</Text>
      <ActivityIndicator size="large" color="#000" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  logoImage: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 10 },
  tagline: { color: '#2E88FA', fontSize: 16, marginTop: 10, textAlign: 'center' },
  spinner: { marginTop: 10 }
}); 