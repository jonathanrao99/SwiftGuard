import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface LoadingScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

export default function LoadingScreen({ navigation }: LoadingScreenProps) {
  const hasNavigated = useRef(false);

  const player = useVideoPlayer(require('../../assets/logovideo.mp4'), (player) => {
    // Configure the player when it's ready
    player.loop = false; // Don't loop the video
    player.play(); // Start playing immediately
  });

  useEffect(() => {
    // Navigate after exactly 3.7 seconds
    const timer = setTimeout(() => {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        navigation.replace('Onboarding');
      }
    }, 3700);

    return () => {
      clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container} pointerEvents="none">
        <VideoView
          player={player}
          style={styles.logoVideo}
          contentFit="contain"
          fullscreenOptions={{
            allowsFullscreen: false,
            allowsPictureInPicture: false,
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  logoVideo: { 
    width: 320, 
    height: 320, 
    marginBottom: 10 
  },
}); 