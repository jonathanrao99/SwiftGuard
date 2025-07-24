// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar, Platform, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    AsyncStorage.getItem('DARK_MODE').then(val => {
      if (val === 'true') setDarkMode(true);
    });
  }, []);

  const toggleDarkMode = async () => {
    setDarkMode(prev => {
      AsyncStorage.setItem('DARK_MODE', (!prev).toString());
      return !prev;
    });
  };

  return (
    <>
      <StatusBar translucent backgroundColor={darkMode ? '#18181b' : '#fff'} barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <View style={{ flex: 0, backgroundColor: '#ffffff' }} />
      <LinearGradient
        colors={darkMode ? ['#18181b', '#27272a'] : ['#ffffff', '#e0f2ff']}
        style={{ flex: 1 }}
      >
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: darkMode ? '#fff' : '#222', marginRight: 8 }}>Dark Mode</Text>
              <Switch value={darkMode} onValueChange={toggleDarkMode} />
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {user ? (
            <View style={styles.infoCard}>
              <Image source={{ uri: user.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?img=8' }} style={styles.avatar} />
              <Text style={styles.name}>{user.user_metadata?.full_name || user.email}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Business</Text>
                <Text style={styles.value}>{user.user_metadata?.business_name || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.value}>{user.user_metadata?.location || 'N/A'}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.loading}><Text>Loading profile...</Text></View>
          )}
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.sectionItem} activeOpacity={0.7} onPress={() => navigation.navigate('PreferredPayment')}>
            <Text style={styles.sectionText}>Payment Methods</Text>
            <MaterialIcons name="chevron-right" size={24} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sectionItem} activeOpacity={0.7} onPress={() => navigation.navigate('UserTypeSelection')}>
            <Text style={styles.sectionText}>Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sectionItem} activeOpacity={0.7} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.sectionText}>Change Password</Text>
            <MaterialIcons name="chevron-right" size={24} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={async () => { await supabase.auth.signOut(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 32 : 48,
    paddingBottom: 24,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 24 },
  infoCard: { backgroundColor: '#ffffff', borderRadius: 16, alignItems: 'center', padding: 24, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  email: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  detailRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14, color: '#64748b' },
  value: { fontSize: 14, fontWeight: '600', color: '#111827' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  sectionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  sectionText: { fontSize: 16, color: '#111827' },
  logoutBtn: { backgroundColor: '#ef4444', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  loading: { alignItems: 'center', marginTop: 50 },
}); 