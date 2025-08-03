import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import ErrorBoundary from '../components/ErrorBoundary';
import { NavigationProps } from '../types';

interface UserTypeSelectionProps {
  navigation: NavigationProps;
}

export default function UserTypeSelection({ navigation }: UserTypeSelectionProps) {
  return (
    <ErrorBoundary>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
    <View style={styles.container}>
      <Text style={styles.header}>Welcome to SwiftGuard</Text>
      <Text style={styles.subheader}>Secure. Reliable. Fast.</Text>
      <Text style={styles.description}>Select your account type below to get started and tailor your experience:</Text>
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SignUpClient')}>
          <FontAwesome5 name="user-tie" size={36} color="#2E88FA" />
          <Text style={styles.cardTitle}>Client</Text>
          <Text style={styles.cardDescription}>Hire vetted security personnel in just a few taps.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SignUpGuard')}>
          <FontAwesome5 name="user-shield" size={36} color="#2E88FA" />
          <Text style={styles.cardTitle}>Security</Text>
          <Text style={styles.cardDescription}>Offer your expertise and earn seamlessly.</Text>
        </TouchableOpacity>
      </View>
    </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E88FA',
    textAlign: 'center',
    marginBottom: 5,
  },
  subheader: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 30,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
}); 