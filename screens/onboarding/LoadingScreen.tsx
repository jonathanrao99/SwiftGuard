import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

export default function LoadingScreen({ navigation }: { navigation: any }) {
  const hasNavigated = useRef(false);

  const player = useVideoPlayer(require('../../assets/logovideo.mp4'), (player) => {
    // Configure the player when it's ready
    player.loop = false; // Don't loop the video
    player.play(); // Start playing immediately
  });

  useEffect(() => {
    // Navigate after exactly 4.8 seconds
    const timer = setTimeout(() => {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        navigation.replace('Onboarding');
      }
    }, 3700); // 3.7 seconds

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
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  logoVideo: { width: 320, height: 320, marginBottom: 10 },
  tagline: { color: '#2E88FA', fontSize: 16, marginTop: 10, textAlign: 'center' },
  spinner: { marginTop: 10 }
}); 