import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { useThemeColor } from '@/hooks/useThemeColor';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ParallaxScrollView({
  headerBackgroundColor,
  headerImage,
  children,
  style,
}) {
  const { width, height } = useWindowDimensions();
  const scrollY = useSharedValue(0);
  const backgroundColor = useThemeColor(headerBackgroundColor, 'background');

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = {
    backgroundColor,
    width,
    height: height * 0.3,
  };

  return (
    <AnimatedScrollView
      style={[styles.container, style]}
      onScroll={scrollHandler}
      scrollEventThrottle={16}>
      <Animated.View style={[styles.header, headerStyle]}>
        {headerImage}
      </Animated.View>
      <Animated.View style={styles.content}>{children}</Animated.View>
    </AnimatedScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
    paddingTop: 200,
  },
}); 