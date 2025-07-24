// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar, Alert, Linking, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';

export default function GuardProfileScreen({ navigation }) {
  const [user, setUser] = useState({
    avatar: 'https://randomuser.me/api/portraits/men/25.jpg',
    name: 'John Carter',
    email: 'john.carter@email.com',
    badge: 'Elite Guard',
    business: 'SwiftGuard',
    location: 'New York, NY',
  });
  const [achievements, setAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchGuardData = async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('full_name, avatar_url, email, role')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setUser(prev => ({
            ...prev,
            name: profile.full_name || prev.name,
            email: profile.email || prev.email,
            avatar: profile.avatar_url || prev.avatar,
          }));
        }
      }

      setLoadingAchievements(true);
      if (authUser) {
        const { data, error } = await supabase
          .from('guard_achievements')
          .select('*, achievement:achievement_id(*)')
          .eq('guard_id', authUser.id);

        if (error) {
          console.error('Error fetching achievements:', error.message);
        } else {
          setAchievements(data.map(item => item.achievement));
        }
      }
      setLoadingAchievements(false);
    };

    fetchGuardData();
  }, []);

  const handleConnectStripe = async () => {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      Alert.alert('Error', 'You must be logged in to connect Stripe.');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-account', {
        body: { userId: authUser.id },
      });

      if (error) throw error;

      if (data && data.url) {
        Linking.openURL(data.url);
      } else {
        Alert.alert('Error', 'Failed to get Stripe onboarding URL.');
      }
    } catch (error: any) {
      console.error('Error connecting Stripe:', error);
      Alert.alert('Error', error.message || 'Failed to connect Stripe account. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent={false} backgroundColor="#ffffff" barStyle="dark-content" />
      <Text style={styles.header}>Profile</Text>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Badge</Text>
            <Text style={styles.value}>{user.badge}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Business</Text>
            <Text style={styles.value}>{user.business}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{user.location}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Achievements</Text>
        {loadingAchievements ? (
          <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 10 }} />
        ) : achievements.length === 0 ? (
          <Text style={styles.noAchievementsText}>No achievements earned yet.</Text>
        ) : (
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <Image source={{ uri: achievement.badge_icon_url }} style={styles.achievementIcon} />
                <Text style={styles.achievementName}>{achievement.name}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.sectionItem} activeOpacity={0.7}>
          <Text style={styles.sectionText}>Notification Preferences</Text>
          <MaterialIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sectionItem} activeOpacity={0.7}>
          <Text style={styles.sectionText}>Edit Profile</Text>
          <MaterialIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sectionItem} activeOpacity={0.7}>
          <Text style={styles.sectionText}>Change Password</Text>
          <MaterialIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sectionItem} activeOpacity={0.7} onPress={handleConnectStripe}>
          <Text style={styles.sectionText}>Connect Stripe Account</Text>
          <MaterialIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#111827', alignSelf: 'center', marginTop: 16 },
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
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  achievementCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    width: '45%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  achievementIcon: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  noAchievementsText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    color: '#64748b',
  },
});  