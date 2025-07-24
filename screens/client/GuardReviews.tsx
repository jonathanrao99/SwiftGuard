import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function AllReviewsScreen({ route, navigation }) {
  const { guard, reviews } = route.params;
  const [filterRating, setFilterRating] = useState('All');
  const filtered = reviews.filter(r => filterRating === 'All' || r.rating >= parseFloat(filterRating));

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{guard.name} Reviews</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.filterRow}>
          {['All', '4.5', '4', '3.5'].map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.filterBtn, filterRating === r && styles.filterBtnActive]}
              onPress={() => setFilterRating(r)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filterRating === r && styles.filterTextActive]}>{r === 'All' ? 'All' : `${r}+`}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filtered.map(r => (
            <View key={r.id} style={styles.reviewCard}>
              <Image source={{ uri: r.client.avatar_url }} style={styles.reviewAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewName}>{r.client.full_name}</Text>
                <View style={styles.reviewRating}>
                  <MaterialIcons name="star" size={14} color="#fbbf24" />
                  <Text style={styles.reviewTime}> {r.rating} · {new Date(r.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.reviewText}>{r.review_text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'android' ? 32 : 48, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  filterRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 12, flexWrap: 'wrap' },
  filterBtn: { backgroundColor: '#e5e7eb', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, marginHorizontal: 4, marginBottom: 8 },
  filterBtnActive: { backgroundColor: '#2563eb' },
  filterText: { fontSize: 14, color: '#111827' },
  filterTextActive: { color: '#ffffff', fontWeight: '500' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  reviewCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewName: { fontSize: 14, fontWeight: '600', color: '#222' },
  reviewRating: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  reviewTime: { fontSize: 12, color: '#64748b' },
  reviewText: { fontSize: 14, color: '#444', lineHeight: 20 },
}); 