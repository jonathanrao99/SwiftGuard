import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, StatusBar, TouchableOpacity, Modal, Dimensions, Platform } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Foundation } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { supabase } from '../../../supabaseClient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// Fallback to any for RouteProp if not found
// import type { RouteProp } from '@react-navigation/native';
type RouteProp<T, P> = any;

interface Review {
  id: string;
  rating: number;
  created_at: string;
  review_text: string;
  client: {
    avatar_url: string;
    full_name: string;
  };
}

interface GuardCardScreenProps {
  route: RouteProp<any, any>;
  navigation: NativeStackNavigationProp<any>;
}

export default function GuardCardScreen({ route, navigation }: GuardCardScreenProps) {
  const passedGuard = route.params?.guard;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      if (passedGuard?.id) {
        const { data, error } = await supabase
          .from('reviews')
          .select('*, client:client_id(*)')
          .eq('guard_id', passedGuard.id);

        if (error) {
          console.error('Error fetching reviews:', error);
        } else if (data) {
          setReviews(data as Review[]);
          if (data.length > 0) {
            const totalRating = data.reduce((acc: number, review: Review) => acc + review.rating, 0);
            setAverageRating(totalRating / data.length);
            setReviewsCount(data.length);
          }
        }
      }
    };

    fetchReviews();
  }, [passedGuard?.id]);

  const guard = {
    photo: passedGuard?.photo || 'https://randomuser.me/api/portraits/men/20.jpg',
    name: passedGuard?.name || 'John Doe',
    rating: averageRating,
    reviewsCount: reviewsCount,
    bio: passedGuard?.description || 'Professional security guard with 5+ years of experience in nightclub and event security. Specialized in VIP protection and emergency response.',
  };
  const stockPhotos = useMemo(() => Array.from({ length: 4 }, () => {
    const gender = Math.random() < 0.5 ? 'men' : 'women';
    const id = Math.floor(Math.random() * 99);
    return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
  }), []);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const qualifications = [
    { icon: 'shield-check-outline' as const, title: 'Licensed Security Professional', subtitle: 'State of California #12345678' },
    { icon: 'first-aid-kit' as const, title: 'First Aid & CPR Certified', subtitle: 'American Red Cross' },
    { icon: 'check-decagram' as const, title: 'Background Checked', subtitle: 'Verified by SwiftGuard' },
  ];

  const experiences = [
    { company: 'Elite Nightclub', period: '2019 - Present', role: 'Head of Security, managing a team of 10 guards for a high-end nightclub with 1000+ capacity.' },
    { company: 'City Events Co.', period: '2017 - 2019', role: 'Handled major music festivals and corporate events with precision and professionalism.' },
  ];

  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/notification.mp3')
      );
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guard Profile</Text>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => {}}>
          <MaterialIcons name="more-horiz" size={24} color="#222" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[styles.contentContainer, { paddingBottom: 32 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Image source={{ uri: guard.photo }} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{guard.name}</Text>
              <View style={styles.ratingRow}>
                <MaterialIcons name="star" size={16} color="#fbbf24" />
                <Text style={styles.ratingText}>{guard.rating} ({guard.reviewsCount} reviews)</Text>
              </View>
              <View style={styles.badgesRow}>
                <View style={styles.badge}><Text style={styles.badgeText}>Verified</Text></View>
                <View style={[styles.badge, { backgroundColor: '#e0f2fe' }]}><Text style={[styles.badgeText, { color: '#0284c7' }]}>Available</Text></View>
              </View>
            </View>
          </View>
          <View style={styles.ctaRow}>
            <LinearGradient colors={[ '#2563eb', '#6366f1' ]} style={styles.hireBtn}>
              <Text style={styles.hireBtnText}>Hire Now</Text>
            </LinearGradient>
            <TouchableOpacity style={styles.chatBtn}>
              <MaterialIcons name="chat-bubble-outline" size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        <Section title="About Me" content={guard.bio} />

        <Section title="Qualifications">
          {qualifications.map((q, index) => (
            <View key={index} style={styles.qualItem}>
              {q.icon === 'first-aid-kit' ? (
                <Foundation name="first-aid" size={20} color="#2563eb" style={{ marginRight: 8 }} />
              ) : (
                <MaterialCommunityIcons name={q.icon} size={20} color="#2563eb" style={{ marginRight: 8 }} />
              )}
              <View>
                <Text style={styles.qualTitle}>{q.title}</Text>
                <Text style={styles.qualSubtitle}>{q.subtitle}</Text>
              </View>
            </View>
          ))}
        </Section>

        <Section title="Experience">
          {experiences.map((exp, index) => (
            <View key={index} style={styles.expCard}>
              <Text style={styles.expCompany}>{exp.company}</Text>
              <Text style={styles.expPeriod}>{exp.period}</Text>
              <Text style={styles.expRole}>{exp.role}</Text>
            </View>
          ))}
        </Section>

        <Section title="Guard on Duty">
          <View style={styles.photosGrid}>
            {stockPhotos.map((uri, idx) => (
              <TouchableOpacity key={idx} onPress={() => { setSelectedPhoto(uri); setPhotoModalVisible(true); }}>
                <Image source={{ uri }} style={styles.photoThumbnail} />
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <View style={styles.sectionHeaderWithButton}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllReviews', { guard, reviews })}>
            <Text style={styles.viewAllReviews}>View All</Text>
          </TouchableOpacity>
        </View>
        {reviews.slice(0, 2).map((rev) => (
          <View key={rev.id} style={styles.reviewCard}>
            <Image source={{ uri: rev.client.avatar_url }} style={styles.reviewAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewName}>{rev.client.full_name}</Text>
              <View style={styles.reviewRating}>
                <MaterialIcons name="star" size={14} color="#fbbf24" />
                <Text style={styles.reviewTime}> {rev.rating} · {new Date(rev.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.reviewText}>{rev.review_text}</Text>
            </View>
          </View>
        ))}
        {selectedPhoto && (
          <Modal visible={photoModalVisible} transparent animationType="fade">
            <TouchableOpacity style={styles.photoModalOverlay} activeOpacity={1} onPress={() => setPhotoModalVisible(false)}>
              <Image source={{ uri: selectedPhoto }} style={styles.photoModalImage} />
            </TouchableOpacity>
          </Modal>
        )}
      </ScrollView>
    </View>
  );
}

interface SectionProps {
  title: string;
  content?: any;
  children?: React.ReactNode;
}

const Section = ({ title, content, children }: SectionProps) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>{title}</Text>
    {content && <Text style={{ color: '#64748b', marginBottom: 8 }}>{content}</Text>}
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'android' ? 32 : 48, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  headerIconButton: { padding: 8 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  profileCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'flex-start', marginBottom: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginRight: 12 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingText: { marginLeft: 4, fontSize: 14, color: '#444' },
  badgesRow: { flexDirection: 'row', marginBottom: 12 },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  badgeText: { fontSize: 12, fontWeight: '500', color: '#16a34a' },
  ctaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, width: '100%' },
  hireBtn: { flex: 9, borderRadius: 8, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  hireBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  chatBtn: { flex: 1, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 8 },
  sectionText: { fontSize: 14, color: '#444', lineHeight: 20 },
  qualItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  qualTitle: { fontSize: 14, fontWeight: '600', color: '#222' },
  qualSubtitle: { fontSize: 12, color: '#64748b' },
  expCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
  expCompany: { fontSize: 14, fontWeight: '600', color: '#222' },
  expPeriod: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  expRole: { fontSize: 13, color: '#444', lineHeight: 18 },
  reviewCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewName: { fontSize: 14, fontWeight: '600', color: '#222' },
  reviewRating: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reviewTime: { fontSize: 12, color: '#64748b' },
  reviewText: { fontSize: 13, color: '#444', lineHeight: 18 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  profileInfo: { flex: 1 },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  photoThumbnail: { width: (Dimensions.get('window').width - 48) / 2, height: (Dimensions.get('window').width - 48) / 2, borderRadius: 8, marginBottom: 16 },
  photoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  photoModalImage: { width: '90%', height: '70%', resizeMode: 'contain' },
  sectionHeaderWithButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -4, marginBottom: -4 },
  viewAllReviews: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
});
