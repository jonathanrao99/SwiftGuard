import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JobTemplateSelector } from '../../components/post-job/JobTemplateSelector';

interface PostJobTemplateProps {
  navigation: any;
}

const PostJobTemplate: React.FC<PostJobTemplateProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <JobTemplateSelector navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default PostJobTemplate; 