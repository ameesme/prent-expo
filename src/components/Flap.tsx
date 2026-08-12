import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { ANIM, type Metrics } from '../metrics';
import { COLORS } from '../theme';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

/**
 * The triangular envelope mouth that peels open as the card is dragged up.
 *
 * In the prototype the SVG uses `preserveAspectRatio="none"` inside a container whose
 * height animates 0 → 24 → 36 → 54, so the artwork is squashed rather than clipped. Here
 * the SVG's own `height` is animated to reproduce that: scaling the view instead would
 * stretch an already-rasterised layer, which shows up as soft, stepped edges.
 *
 * The container's bottom edge is pinned, so growing height opens the mouth upwards from
 * the envelope's lower edge — matching `bottom:-1px` in the CSS.
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

  const wrapper = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // Animating the prop, not a transform, so the shape is re-drawn at every height.
  // Clamped because the closing easing undershoots, and a negative SVG height is invalid.
  const svgProps = useAnimatedProps(() => ({ height: Math.max(0, height.value) }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          bottom: -m.S,
          left: (m.width - d.env.flapWidth) / 2,
          width: d.env.flapWidth,
          zIndex: 2,
        },
        wrapper,
      ]}>
      <AnimatedSvg
        width={d.env.flapWidth}
        animatedProps={svgProps}
        viewBox="0 0 220 60"
        preserveAspectRatio="none">
        <Path fill={COLORS.flapInside} d="M0 0 H220 V14 L110 60 L0 14 Z" />
        <Path fill={COLORS.flapLip} d="M0 0 L110 44 L220 0 L220 8 L110 52 L0 8 Z" />
      </AnimatedSvg>
    </Animated.View>
  );
}
