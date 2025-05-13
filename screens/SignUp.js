import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SignUp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sign Up Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 18, color: '#333' },
}); 