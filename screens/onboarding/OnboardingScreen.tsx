// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  interpolateColor,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Onboarding from 'react-native-onboarding-swiper';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');
const bgColors = ['#ffffff', '#e0e7ff', '#2563eb'];
const barStyles = ['dark-content', 'dark-content', 'light-content'];

const Title = ({ children, color }) => (
  <Text style={[styles.title, color && { color }]}>{children}</Text>
);
const Subtitle = ({ children, color }) => (
  <Text style={[styles.subtitle, color && { color }]}>{children}</Text>
);

export default function OnboardingScreen({ navigation }) {
  const [page, setPage] = useState(0);
  const progress = useSharedValue(0);

  // Animate background as page changes
  useEffect(() => {
    progress.value = withTiming(page, { duration: 300 });
  }, [page]);

  const animatedBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1, 2],
      bgColors
    ),
  }));

  // Dot picks gray on slide 3, blue otherwise
  const Dot = ({ selected }) => {
    let backgroundColor = '#d1d5db';
    if (selected) {
      backgroundColor = page === 2 ? '#9ca3af' : '#2563eb';
    }
    return <View style={[styles.dot, { backgroundColor }]} />;
  };

  const pages = [
    {
      image: (
        <LottieView
          source={require('../../assets/EventSecurity.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      ),
      title: <Title>Security Is Stressful</Title>,
      subtitle: (
        <Subtitle>
          Finding reliable, vetted security takes time—and last-minute cancellations happen far too often.
        </Subtitle>
      ),
    },
    {
      image: (
        <LottieView
          source={require('../../assets/SecurePayment.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      ),
      title: <Title>SwiftGuard Solves It</Title>,
      subtitle: (
        <Subtitle>
          Instantly connect with certified, background-checked guards. Book, manage, and pay—all in one app.
        </Subtitle>
      ),
    },
    {
      image: (
        <LottieView
          source={require('../../assets/SecureBuilding.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      ),
      title: <Title color="#fff">Built for Your Safety</Title>,
      subtitle: (
        <Subtitle color="#fff">
          From VIP events to everyday patrols, SwiftGuard adapts to protect what matters most—your peace of mind.
        </Subtitle>
      ),
    },
  ];

  return (
    <Animated.View style={[styles.container, animatedBgStyle]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={barStyles[page]}
      />

      <Onboarding
        pages={pages}
        DotComponent={Dot}
        controlStatusBar={false}
        bottomBarHighlight={false}
        bottomBarColor="transparent"
        pageIndexCallback={setPage}
        onSkip={() => navigation.replace('Welcome')}
        onDone={() => navigation.replace('Welcome')}

        SkipButtonComponent={(props) => (
          <TouchableOpacity {...props} style={styles.navBtn}>
            <Text style={styles.navBtnText}>Skip</Text>
          </TouchableOpacity>
        )}
        NextButtonComponent={(props) => (
          <TouchableOpacity {...props} style={styles.navBtn}>
            <Text style={styles.navBtnText}>Next</Text>
          </TouchableOpacity>
        )}
        DoneButtonComponent={(props) => (
          <TouchableOpacity {...props} style={styles.navBtn}>
            <Text style={[styles.navBtnText, page === 2 && { color: '#fff' }]}>
              Done
            </Text>
          </TouchableOpacity>
        )}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
  },
  lottie: {
    width: 350,
    height: 350,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginHorizontal: 14,
    lineHeight: 22,
  },
  navBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  navBtnText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});
