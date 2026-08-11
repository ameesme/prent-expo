import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { ANIM, type Metrics } from '../metrics';
import { COLORS } from '../theme';

/**
 * The triangular envelope mouth that peels open as the card is dragged up.
 *
 * In the prototype the SVG uses `preserveAspectRatio="none"` inside a container whose
 * height animates 0 → 24 → 36 → 54, so the artwork is squashed rather than clipped.
 * `scaleY` from the top edge reproduces that exactly, and animating a transform keeps
 * the whole thing on the UI thread.
 */
export function Flap({ m, phase }: { m: Metrics; phase: number }) {
  const { d } = m;
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  const target =
    phase >= 3
      ? d.env.flapArmed
      : phase === 2
        ? d.env.flapNear
        : phase === 1
          ? d.env.flapDragging
          : 0;

  useEffect(() => {
    height.value = withTiming(target, {
      duration: ANIM.flap,
      easing: Easing.bezier(0.2, 0.9, 0.25, 1),
    });
    opacity.value = withTiming(phase >= 1 ? 1 : 0, { duration: ANIM.flapOpacity });
  }, [target, phase, height, opacity]);

  const outer = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  const inner = useAnimatedStyle(() => ({
    transform: [{ scaleY: height.value / d.env.flapHeight }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          bottom: -m.S,
          left: (m.width - d.env.flapWidth) / 2,
          width: d.env.flapWidth,
          overflow: 'hidden',
          zIndex: 2,
        },
        outer,
      ]}>
      <Animated.View
        style={[
          {
            width: d.env.flapWidth,
            height: d.env.flapHeight,
            transformOrigin: ['50%', 0, 0],
          },
          inner,
        ]}>
        <View>
          <Svg
            width={d.env.flapWidth}
            height={d.env.flapHeight}
            viewBox="0 0 220 60"
            preserveAspectRatio="none">
            <Path fill={COLORS.flapInside} d="M0 0 H220 V14 L110 60 L0 14 Z" />
            <Path fill={COLORS.flapLip} d="M0 0 L110 44 L220 0 L220 8 L110 52 L0 8 Z" />
          </Svg>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
