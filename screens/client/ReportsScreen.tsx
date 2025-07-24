import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../theme';

export default function ReportsScreen({ navigation }: { navigation: any }) {
  const [filter, setFilter] = useState('All');

  const summary = [
    {
      id: 'people',
      icon: <MaterialIcons name="people" size={32} color="#2563eb" />,
      value: '1,245',
      label: 'People Entered',
      color: '#2563eb',
    },
    {
      id: 'ids',
      icon: <MaterialCommunityIcons name="shield-check" size={32} color="#fbbf24" />,
      value: '8',
      label: 'False IDs',
      color: '#fbbf24',
    },
    {
      id: 'issues',
      icon: <MaterialCommunityIcons name="alert-octagon" size={32} color="#ef4444" />,
      value: '3',
      label: 'Issues',
      color: '#ef4444',
    },
  ];

  const incidents = [
    {
      id: '1',
      title: 'Incident: Guest Ejection',
      date: 'May 20, 2025',
      time: '11:30 PM',
      description: 'Guest was escorted out due to aggressive behavior. No injuries reported.',
      author: 'John Carter',
      status: 'Resolved',
    },
    {
      id: '2',
      title: 'Incident: Medical Emergency',
      date: 'May 18, 2025',
      time: '1:10 AM',
      description: 'Patron fainted on dance floor. First aid administered, EMS called.',
      author: 'Maria Lopez',
      status: 'Resolved',
    },
    {
      id: '3',
      title: 'Incident: Lost Property',
      date: 'May 15, 2025',
      time: '10:45 PM',
      description: 'Wallet reported missing. Searched area, item not found.',
      author: 'Alex Kim',
      status: 'Open',
    },
  ];

  const filtered = incidents.filter(item => filter === 'All' || item.status === filter);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.container}>
        <View style={styles.summaryRow}>
          {summary.map(item => (
            <View style={styles.summaryCard} key={item.id}>
              {item.icon}
              <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.filtersRow}>
          {['All', 'Open', 'Resolved'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.filterBtn, filter === type && styles.filterBtnActive]}
              onPress={() => setFilter(type)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filtered.map(item => (
            <View style={styles.card} key={item.id}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="alert-octagon" size={20} color="#ef4444" />
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              <View style={styles.row}>  
                <MaterialIcons name="event" size={16} color="#2563eb" />
                <Text style={styles.cardDate}>{item.date}</Text>
                <MaterialIcons name="access-time" size={16} color="#2563eb" style={{ marginLeft: 12 }} />
                <Text style={styles.cardDate}>{item.time}</Text>
              </View>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardAuthor}>By {item.author}</Text>
                <View style={[styles.statusPill, item.status === 'Resolved' ? styles.statusResolved : styles.statusOpen]}>  
                  <Text style={[styles.statusText, item.status === 'Resolved' ? styles.statusTextResolved : styles.statusTextOpen]}>  
                    {item.status}
                  </Text>
                </View>  
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.sm : SPACING.xl * 1.2,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textDark },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 16 },
  summaryCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, alignItems: 'center', paddingVertical: 24, marginHorizontal: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  summaryValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  summaryLabel: { fontSize: 14, color: '#64748b', marginTop: 4 },
  filtersRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  filterBtn: { backgroundColor: '#e5e7eb', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 16, marginHorizontal: 8 },
  filterBtnActive: { backgroundColor: '#2563eb' },
  filterText: { fontSize: 14, color: '#111827' },
  filterTextActive: { color: '#ffffff', fontWeight: '500' },
  listContent: { paddingBottom: 100, paddingHorizontal: 16, paddingTop: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#ef4444', marginLeft: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardDate: { fontSize: 14, color: '#2563eb', marginLeft: 6 },
  cardDesc: { fontSize: 14, color: '#111827', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAuthor: { fontSize: 14, color: '#64748b' },
  statusPill: { borderRadius: 16, paddingVertical: 4, paddingHorizontal: 12 },
  statusResolved: { backgroundColor: '#dcfce7' },
  statusOpen: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusTextResolved: { color: '#22c55e' },
  statusTextOpen: { color: '#ef4444' },
}); 