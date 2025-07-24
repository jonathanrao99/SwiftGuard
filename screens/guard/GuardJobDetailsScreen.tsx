// @ts-nocheck
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export default function GuardJobDetailsScreen({ route, navigation }) {
  const { job } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{job.title}</Text>

        {job.location && (
          <View style={styles.row}>
            <MaterialIcons name="location-on" size={20} color="#2563eb" />
            <Text style={styles.rowText}>{job.location}</Text>
          </View>
        )}

        {job.venueType && (
          <View style={styles.row}>
            <MaterialIcons name="domain" size={20} color="#2563eb" />
            <Text style={styles.rowText}>{job.venueType === 'Other' ? job.customVenueType : job.venueType}</Text>
          </View>
        )}

        {job.date && (
          <View style={styles.row}>
            <MaterialIcons name="today" size={20} color="#2563eb" />
            <Text style={styles.rowText}>{job.date}</Text>
          </View>
        )}

        {job.startTime && job.endTime && (
          <View style={styles.row}>
            <MaterialIcons name="access-time" size={20} color="#2563eb" />
            <Text style={styles.rowText}>{job.startTime} - {job.endTime}{job.duration ? ` (${job.duration} hrs)` : ''}</Text>
          </View>
        )}

        {job.numGuards != null && (
          <View style={styles.row}>
            <MaterialIcons name="people" size={20} color="#2563eb" />
            <Text style={styles.rowText}>{job.numGuards} guard{job.numGuards > 1 ? 's' : ''}</Text>
          </View>
        )}

        {job.hourlyPay != null && (
          <View style={styles.row}>
            <MaterialIcons name="attach-money" size={20} color="#2563eb" />
            <Text style={styles.rowText}>${job.hourlyPay}/hr{job.duration ? ` • Total: $${(parseFloat(job.hourlyPay) * parseFloat(job.duration)).toFixed(2)}` : ''}</Text>
          </View>
        )}

        {job.genderPref && (
          <View style={styles.row}>
            <MaterialIcons name="person" size={20} color="#2563eb" />
            <Text style={styles.rowText}>{job.genderPref}</Text>
          </View>
        )}

        {'recurring' in job && (
          <View style={styles.row}>
            <MaterialIcons name="repeat" size={20} color="#2563eb" />
            <Text style={styles.rowText}>{job.recurring ? 'Recurring' : 'One-time'}</Text>
          </View>
        )}

        {job.requirements && (
          <>
            <Text style={styles.sectionTitle}>Requirements</Text>
            {Object.entries(job.requirements).filter(([_,v]) => v).map(([key]) => (
              <View key={key} style={styles.itemRow}>
                <MaterialIcons name="check" size={18} color="#2563eb" />
                <Text style={styles.itemText}>{{
                  licensed: 'Licensed Security Guard',
                  firstAid: 'First Aid Certified',
                  experience: 'Minimum 2 years experience',
                  background: 'Background check required'
                }[key]}</Text>
              </View>
            ))}
          </>
        )}

        {job.description && (
          <>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionText}>{job.description}</Text>
          </>
        )}

        {job.contact && (
          <>
            <Text style={styles.sectionTitle}>Contact</Text>
            <Text style={styles.sectionText}>{job.contact}</Text>
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.acceptBtn} onPress={() => {/* handle accept */}} activeOpacity={0.8}>
        <Text style={styles.acceptBtnText}>Accept</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { paddingHorizontal: 16, paddingBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rowText: { fontSize: 15, color: '#374151', marginLeft: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 16, marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemText: { fontSize: 14, color: '#374151', marginLeft: 8 },
  sectionText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  acceptBtn: { backgroundColor: '#2563eb', paddingVertical: 14, alignItems: 'center' },
  acceptBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});