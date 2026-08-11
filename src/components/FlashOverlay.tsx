import { forwardRef, useImperativeHandle } from 'react';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ANIM } from '../metrics';
import { COLORS } from '../theme';

export type FlashHandle = { fire: (strong: boolean) => void };

/**
 * The shutter flash. Reproduces both prototype keyframes:
 *   `flash`       .32s → 0 · 12% .9 · 100% 0
 *   `flashStrong` .40s → 0 · 8% 1 · 55% .85 · 100% 0
 *
 * In the prototype `.flash` lives inside `.stage`, so it covers everything below the
 * envelope bar but never the bar itself — hence `envHeight` as the top edge.
 */
export const FlashOverlay = forwardRef<FlashHandle, { envHeight: SharedValue<number> }>(
  function FlashOverlay({ envHeight }, ref) {
    const opacity = useSharedValue(0);

    useImperativeHandle(ref, () => ({
      fire(strong: boolean) {
        const ease = Easing.out(Easing.ease);
        opacity.value = strong
          ? withSequence(
              withTiming(1, { duration: ANIM.flashStrong * 0.08, easing: ease }),
              withTiming(0.85, { duration: ANIM.flashStrong * 0.47, easing: ease }),
              withTiming(0, { duration: ANIM.flashStrong * 0.45, easing: ease }),
            )
          : withSequence(
              withTiming(0.9, { duration: ANIM.flash * 0.12, easing: ease }),
              withTiming(0, { duration: ANIM.flash * 0.88, easing: ease }),
            );
      },
    }));

    const style = useAnimatedStyle(() => ({
      opacity: opacity.value,
      top: envHeight.value,
    }));

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: COLORS.paper,
            zIndex: 20,
          },
          style,
        ]}
      />
    );
  },
);
