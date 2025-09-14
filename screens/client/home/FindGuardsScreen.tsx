import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../../theme';
import { NavigationProps } from '../../../types';
import { supabase } from '../../../supabaseClient';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorBoundary from '../../../components/ErrorBoundary';

interface Guard {
  id: string;
  name: string;
  image: string;
  rating: number;
  level: 'Elite' | 'Certified' | 'Entry';
  description: string;
  online: boolean;
  certifications: string[];
}

interface Filters {
  experience: string;
  rating: string;
  requirements: Record<string, boolean>;
}

interface Requirement {
  key: string;
  label: string;
}

interface GuardCardProps {
  guard: Guard;
  onPress: () => void;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

interface FindGuardsScreenProps {
  navigation: NavigationProps;
}

export default function FindGuardsScreen({ navigation }: FindGuardsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Rating');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [filters, setFilters] = useState<Filters>({
    experience: 'All',
    rating: 'All',
    requirements: {},
  });

  // Load guards from Supabase
  useEffect(() => {
    loadGuards();
  }, []);

  const loadGuards = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch guards from Supabase with their profiles and ratings
      const { data: guardsData, error: guardsError } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          profile_image_url,
          experience_level,
          bio,
          status,
          created_at,
          guard_ratings (
            rating,
            review_count
          )
        `)
        .eq('role', 'guard')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (guardsError) {
        console.error('Error fetching guards:', guardsError);
        setError('Failed to load guards. Please try again.');
        return;
      }

      // Transform data to match Guard interface
      const transformedGuards: Guard[] = (guardsData || []).map(guard => {
        const averageRating = guard.guard_ratings?.length > 0 
          ? guard.guard_ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / guard.guard_ratings.length
          : 4.0; // Default rating for new guards

        const totalReviews = guard.guard_ratings?.reduce((sum: number, r: any) => sum + r.review_count, 0) || 0;

        // Map experience level to our level system
        const levelMap: Record<string, 'Elite' | 'Certified' | 'Entry'> = {
          'expert': 'Elite',
          'intermediate': 'Certified',
          'beginner': 'Entry'
        };

        // Generate certifications based on experience level and years since registration
        const yearsSinceRegistration = new Date().getFullYear() - new Date(guard.created_at).getFullYear();
        const certifications = generateCertifications(guard.experience_level, yearsSinceRegistration);

        return {
          id: guard.id,
          name: `${guard.first_name} ${guard.last_name}`,
          image: guard.profile_image_url || `https://ui-avatars.com/api/?name=${guard.first_name}+${guard.last_name}&background=2563eb&color=fff`,
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          level: levelMap[guard.experience_level] || 'Entry',
          description: guard.bio || 'Professional security guard with reliable service.',
          online: guard.status === 'available',
          certifications,
        };
      });

      setGuards(transformedGuards);
    } catch (error) {
      console.error('Error in loadGuards:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate certifications based on experience
  const generateCertifications = (experienceLevel: string, yearsSinceRegistration: number): string[] => {
    const baseCertifications = ['Licensed Security Guard'];
    
    if (yearsSinceRegistration >= 1) {
      baseCertifications.push('First Aid Certified');
    }
    
    if (experienceLevel === 'expert' || yearsSinceRegistration >= 3) {
      baseCertifications.push('Security Training Completed');
    }
    
    if (experienceLevel === 'expert' && yearsSinceRegistration >= 5) {
      baseCertifications.push('Firearms License Required');
    }
    
    if (yearsSinceRegistration >= 2) {
      baseCertifications.push('CPR Certified');
    }
    
    return baseCertifications;
  };

  const requirementsList: Requirement[] = [
    { key: 'licensed', label: 'Licensed Security Guard' },
    { key: 'firstAid', label: 'First Aid Certified' },
    { key: 'firearms', label: 'Firearms License Required' },
    { key: 'training', label: 'Security Training Completed' },
  ];

  // Filter and sort guards
  const filteredGuards = guards.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filters.experience === 'All' || g.level === filters.experience) &&
      (filters.rating === 'All' || 
        (filters.rating === '4.5+' && g.rating >= 4.5) ||
        (filters.rating === '4.0+' && g.rating >= 4.0) ||
        (filters.rating === '3.5+' && g.rating >= 3.5)) &&
      // Filter by requirements
      Object.keys(filters.requirements).every(reqKey => {
        if (!filters.requirements[reqKey]) return true;
        const reqLabel = requirementsList.find(r => r.key === reqKey)?.label;
        return reqLabel && g.certifications.includes(reqLabel);
      })
  ).sort((a, b) => {
    switch (selectedSort) {
      case 'Rating':
        return b.rating - a.rating;
      case 'Experience':
        const levelOrder: Record<string, number> = { 'Elite': 3, 'Certified': 2, 'Entry': 1 };
        return levelOrder[b.level] - levelOrder[a.level];
      case 'Availability':
        return b.online ? 1 : -1;
      default:
        return 0;
    }
  });

  const GuardCard: React.FC<GuardCardProps> = ({ guard, onPress }) => {
    const showBadge = guard.level === 'Elite' || guard.level === 'Certified';

    return (
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <Image source={{ uri: guard.image }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{guard.name}</Text>
            {showBadge && (
              <TouchableOpacity onPress={() => Alert.alert("Guard Level", `${guard.level} guards are ${guard.level === 'Elite' ? 'top-rated with >100 successful events' : 'professionally certified with extensive training'}.`)}>
                <View style={[
                  styles.chip,
                  { backgroundColor: guard.level === 'Elite' ? '#E0E7FF' : '#FEF3C7' }
                ]}>
                  <Text style={styles.chipText}>{guard.level}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star-circle" size={16} color="#FACC15" />
            <Text style={styles.ratingText}>{guard.rating}</Text>
          </View>

          <Text style={styles.desc}>{guard.description}</Text>
          
          {/* Display certifications */}
          {guard.certifications.length > 0 && (
            <View style={styles.certificationsContainer}>
              {guard.certifications.slice(0, 2).map((cert, index) => (
                <View key={index} style={styles.certificationChip}>
                  <Text style={styles.certificationText}>{cert}</Text>
                </View>
              ))}
              {guard.certifications.length > 2 && (
                <Text style={styles.moreCertsText}>+{guard.certifications.length - 2} more</Text>
              )}
            </View>
          )}
        </View>
        <Feather name="chevron-right" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, filters, setFilters }) => {
    const toggleRequirement = (key: string) => {
      setFilters(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          [key]: !prev.requirements[key]
        }
      }));
    };

    return (
      <Modal visible={visible} transparent animationType="fade">
        <StatusBar barStyle="dark-content" backgroundColor="rgba(0,0,0,0.3)" />
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Filter by Experience</Text>
            <View style={styles.filterRow}>
              {['All', 'Elite', 'Certified'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    { backgroundColor: filters.experience === type ? '#2563eb' : '#F3F4F6' }
                  ]}
                  onPress={() => setFilters((f) => ({ ...f, experience: type }))}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: filters.experience === type ? '#fff' : '#374151' }
                  ]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalTitle}>Filter by Rating</Text>
            {['All', '4.5+', '4.0+', '3.5+'].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setFilters((f) => ({ ...f, rating: r }))}
              >
                <Text style={[styles.ratingOption, filters.rating === r && { fontWeight: 'bold', color: '#2563eb' }]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.modalTitle}>Requirements</Text>
            <View style={styles.requirementsGrid}>
              {requirementsList.map((requirement) => (
                <TouchableOpacity
                  key={requirement.key}
                  style={[
                    styles.requirementChip,
                    { backgroundColor: filters.requirements[requirement.key] ? '#2563eb' : '#F3F4F6' }
                  ]}
                  onPress={() => toggleRequirement(requirement.key)}
                >
                  <Text style={[
                    styles.requirementChipText,
                    { color: filters.requirements[requirement.key] ? '#fff' : '#374151' }
                  ]}>{requirement.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.subInfo}>Showing results based on availability and highest rating.</Text>

            <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Handle refresh
  const handleRefresh = () => {
    loadGuards();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <LoadingSpinner text="Finding guards..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Unable to Load Guards</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Guards</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.container}>
          <View style={styles.searchWrapper}>
            <MaterialIcons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search guards by name..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
              <MaterialIcons name="filter-list" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Sorting options */}
          <View style={styles.sortContainer}>
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              {['Rating', 'Experience', 'Availability'].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setSelectedSort(tag)}
                  style={[
                    styles.sortTag,
                    selectedSort === tag && styles.sortTagActive,
                  ]}
                >
                  <Text style={[styles.sortText, selectedSort === tag && styles.sortTextActive]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <FlatList
            data={filteredGuards}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <GuardCard 
                guard={item} 
                onPress={() => navigation.navigate('GuardProfile', { guard: item })}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="person-search" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Guards Found</Text>
                <Text style={styles.emptyMessage}>
                  {searchQuery ? 'Try adjusting your search or filters' : 'No guards are currently available'}
                </Text>
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            }
          />

          <FilterModal 
            visible={filterModalVisible} 
            onClose={() => setFilterModalVisible(false)}
            filters={filters}
            setFilters={setFilters}
          />
        </View>
    </SafeAreaView>
    </ErrorBoundary>
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
    paddingTop: Platform.OS === 'android' ? SPACING.sm * 1.2 : SPACING.xl * 1.2,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textDark },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 16,
  },
  searchInput: { flex: 1, marginLeft: 2, fontSize: 16, color: '#111827'},

  // Sorting options
  sortContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sortLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 12,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
  },
  sortTagActive: {
    backgroundColor: '#2563eb',
  },
  sortText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#fff',
  },

  listContent: { paddingBottom: 100, paddingHorizontal: 16 },
  
  // Enhanced Guard Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontWeight: '600',
    fontSize: 16,
    color: '#111827',
  },
  chip: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4338CA',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    color: '#4B5563',
    fontSize: 14,
  },
  desc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  certificationChip: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  certificationText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '500',
  },
  moreCertsText: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },

  // Enhanced Filter Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    position: 'relative',
    maxHeight: '80%',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111827',
  },
  subInfo: {
    fontSize: 13,
    color: '#6B7280',
    marginVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
  },
  filterChipText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  ratingOption: {
    paddingVertical: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  requirementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  requirementChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  requirementChipText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  applyBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  
  // Error and Empty States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
