import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import NotificationService from '../../../services/NotificationService';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../theme';

export default function NotificationTestScreen({ navigation }: { navigation: any }) {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testLocalNotification = async () => {
    try {
      await NotificationService.showLocalNotification({
        title: 'Test Notification',
        body: 'This is a test local notification',
        data: { test: true },
        priority: 'medium',
      });
      addTestResult('✅ Local notification sent successfully');
    } catch (error) {
      addTestResult(`❌ Local notification failed: ${error}`);
    }
  };

  const testPushNotification = async () => {
    try {
      // This would normally send to a real user ID
      // For testing, we'll just log the attempt
      addTestResult('📱 Push notification test (would send to user)');
      addTestResult('   Note: Requires real user ID and push token');
    } catch (error) {
      addTestResult(`❌ Push notification test failed: ${error}`);
    }
  };

  const testNotificationService = async () => {
    try {
      addTestResult('🔍 Testing notification service...');
      
      // Test if service is initialized
      const isInitialized = (NotificationService as any).isInitialized;
      addTestResult(`   Service initialized: ${isInitialized ? 'Yes' : 'No'}`);
      
      // Test local notifications
      const notifications = await NotificationService.getLocalNotifications();
      addTestResult(`   Local notifications count: ${notifications.length}`);
      
      addTestResult('✅ Notification service test completed');
    } catch (error) {
      addTestResult(`❌ Notification service test failed: ${error}`);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Test</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoSection}>
          <MaterialIcons name="info-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Test the notification system functionality
          </Text>
        </View>

        <View style={styles.testButtonsContainer}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={testLocalNotification}
          >
            <MaterialIcons name="notifications" size={24} color={COLORS.white} />
            <Text style={styles.testButtonText}>Test Local Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testPushNotification}
          >
            <MaterialIcons name="send" size={24} color={COLORS.white} />
            <Text style={styles.testButtonText}>Test Push Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testNotificationService}
          >
            <MaterialIcons name="build" size={24} color={COLORS.white} />
            <Text style={styles.testButtonText}>Test Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearTestResults}
          >
            <MaterialIcons name="clear" size={24} color={COLORS.white} />
            <Text style={styles.clearButtonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.length === 0 ? (
            <Text style={styles.noResultsText}>No test results yet. Run a test to see results.</Text>
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? 48 : 4,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: SPACING.md,
    borderRadius: 8,
    marginVertical: SPACING.md,
  },
  infoText: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  testButtonsContainer: {
    gap: SPACING.md,
    marginVertical: SPACING.md,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  clearButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
  },
  resultsContainer: {
    marginVertical: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  noResultsText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  resultText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

