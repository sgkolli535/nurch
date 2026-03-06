import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { semantic } from '../../theme/colors';

type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

interface StatusDotProps {
  status: HealthStatus;
  size?: number;
  pulse?: boolean;
  style?: ViewStyle;
}

const statusColors: Record<HealthStatus, string> = {
  healthy: semantic.healthy,
  warning: semantic.warning,
  critical: semantic.critical,
  unknown: '#9BB5C9', // sky blue — "new" plant
};

export function StatusDot({ status, size = 8, pulse = false, style }: StatusDotProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (pulse && (status === 'warning' || status === 'critical')) {
      opacity.value = withRepeat(
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      opacity.value = 1;
    }
  }, [pulse, status, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: statusColors[status],
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {},
});
