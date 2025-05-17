import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function WelcomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logoImage} />
      <Text style={styles.tagline}>Hire Security. Faster, Smarter, Safer</Text>
      <View style={styles.featuresContainer}>
        {/* Quick Booking */}
        <View style={styles.featureItem}>
          <FontAwesome5 name="calendar-check" size={24} color="#2E88FA" style={styles.featureIcon} />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Quick Booking</Text>
            <Text style={styles.featureDescription}>Book services instantly with a few taps.</Text>
          </View>
        </View>
        {/* Verified Personnel */}
        <View style={styles.featureItem}>
          <FontAwesome5 name="user-check" size={24} color="#2E88FA" style={styles.featureIcon} />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Verified Personnel</Text>
            <Text style={styles.featureDescription}>All personnel are background-checked and certified.</Text>
          </View>
        </View>
        {/* Seamless Payments */}
        <View style={styles.featureItem}>
          <FontAwesome5 name="credit-card" size={24} color="#2E88FA" style={styles.featureIcon} />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Seamless Payments</Text>
            <Text style={styles.featureDescription}>Secure payments made easy.</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.secondaryButtonText}>Already a member? Log In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  tagline: {
    color: '#2E88FA',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    marginRight: 15,
    marginTop: 3,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#555',
  },
  primaryButton: {
    backgroundColor: '#2E88FA',
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2E88FA',
    fontSize: 16,
  },
}); 