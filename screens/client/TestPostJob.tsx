import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JobTemplateSelector } from '../../components/post-job/JobTemplateSelector';

const TestPostJob = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Test PostJob</Text>
      <JobTemplateSelector navigation={{}} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
  },
});

export default TestPostJob; 