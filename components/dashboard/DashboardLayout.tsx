import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../design-system';
import { DashboardStats, User } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

interface DashboardLayoutProps {
  user: User | null;
  title: string;
  subtitle: string;
  stats: DashboardStats;
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
  headerColor?: string;
  showStats?: boolean;
}

export function DashboardLayout({
  user,
  title,
  subtitle,
  stats,
  refreshing,
  onRefresh,
  children,
  headerColor = COLORS.primary,
  showStats = true,
}: DashboardLayoutProps) {
  const getStatusColor = () => {
    if (!user) return COLORS.textSecondary;
    
    switch (user.status) {
      case 'active':
        return COLORS.primary;
      case 'pending':
        return COLORS.error;
      case 'suspended':
      case 'inactive':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={COLORS.background}
        translucent={false}
      />
      
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <LinearGradient
          colors={[headerColor, `${headerColor}CC`]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>
                  {user?.first_name || 'User'} {user?.last_name || ''}
                </Text>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor() },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {user?.status 
                      ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
                      : 'Unknown'}
                  </Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <MaterialIcons name="notifications" size={24} color="white" />
              </View>
            </View>
            
            <View style={styles.titleSection}>
              <Text style={styles.dashboardTitle}>{title}</Text>
              <Text style={styles.dashboardSubtitle}>{subtitle}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        {showStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialIcons
                  name="work"
                  size={24}
                  color={COLORS.primary}
                />
                <Text style={styles.statNumber}>{formatNumber(stats.totalJobs)}</Text>
                <Text style={styles.statLabel}>Total Jobs</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons
                  name="schedule"
                  size={24}
                  color={COLORS.primary}
                />
                <Text style={styles.statNumber}>{formatNumber(stats.activeJobs)}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons
                  name="check-circle"
                  size={24}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.statNumber}>{formatNumber(stats.completedJobs)}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              
              {user?.role === 'guard' && (
                <View style={styles.statCard}>
                  <MaterialIcons
                    name="attach-money"
                    size={24}
                    color={COLORS.primary}
                  />
                  <Text style={styles.statNumber}>
                    {formatCurrency(stats.weeklyEarnings)}
                  </Text>
                  <Text style={styles.statLabel}>This Week</Text>
                </View>
              )}
              
              <View style={styles.statCard}>
                <MaterialIcons
                  name="star"
                  size={24}
                  color={COLORS.error}
                />
                <Text style={styles.statNumber}>{stats.averageRating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons
                  name="access-time"
                  size={24}
                  color={COLORS.primary}
                />
                <Text style={styles.statNumber}>{formatNumber(stats.totalHours)}</Text>
                <Text style={styles.statLabel}>Hours</Text>
              </View>
            </View>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[8],
    paddingHorizontal: theme.spacing[4],
  },
  headerContent: {
    gap: theme.spacing[4],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: theme.typography.fontFamily.regular,
  },
  userName: {
    fontSize: theme.typography.fontSize.xl,
    color: 'white',
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: theme.spacing[1],
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing[2],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing[2],
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  headerActions: {
    padding: theme.spacing[2],
  },
  titleSection: {
    marginTop: theme.spacing[2],
  },
  dashboardTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    color: 'white',
    fontFamily: theme.typography.fontFamily.bold,
  },
  dashboardSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: theme.spacing[1],
  },
  statsContainer: {
    marginTop: -theme.spacing[6],
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  statCard: {
    ...theme.components.card.base,
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    padding: theme.spacing[3],
  },
  statNumber: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: COLORS.textDark,
    marginTop: theme.spacing[2],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: COLORS.textSecondary,
    marginTop: theme.spacing[1],
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
}); 