import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { ANIM, type Metrics } from '../metrics';
import { COLORS, FONTS, shadow } from '../theme';
import { Star } from './icons';

const DOTS = ['', '.', '..', '...'];

/**
 * The end sequence: a sealed envelope drops in from above onto white, the wax seal pops,
 * then the status line fades up. Mirrors `@keyframes envDrop / sealPop / statusFade`.
 */
export function DevelopScreen({
  m,
  visible,
  stamp,
}: {
  m: Metrics;
  visible: boolean;
  stamp: string;
}) {
  const { d } = m;
  const fade = useSharedValue(0);
  const drop = useSharedValue(0);
  const seal = useSharedValue(0);
  const status = useSharedValue(0);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (!visible) {
      fade.value = withTiming(0, { duration: 450 });
      drop.value = 0;
      seal.value = 0;
      status.value = 0;
      return;
    }

    fade.value = withTiming(1, { duration: 450 });
    // 0 → above the screen, 1 → the 70% overshoot, 2 → settled.
    drop.value = withDelay(
      ANIM.envDropDelay,
      withSequence(
        withTiming(1, {
          duration: ANIM.envDrop * 0.7,
          easing: Easing.bezier(0.34, 1.2, 0.4, 1),
        }),
        withTiming(2, { duration: ANIM.envDrop * 0.3, easing: Easing.out(Easing.ease) }),
      ),
    );
    seal.value = withDelay(ANIM.sealDelay, withTiming(1, { duration: ANIM.sealPop }));
    status.value = withDelay(ANIM.statusDelay, withTiming(1, { duration: ANIM.statusFade }));
  }, [visible, fade, drop, seal, status]);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setDots((n) => (n + 1) % DOTS.length), ANIM.dots);
    return () => clearInterval(id);
  }, [visible]);

  const sheet = useAnimatedStyle(() => ({ opacity: fade.value }));

  const envelope = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          drop.value,
          [0, 1, 2],
          [-1.4 * m.height, d.develop.overshoot, 0],
        ),
      },
      { rotate: `${interpolate(drop.value, [0, 1, 2], [-3, 0.5, 0])}deg` },
    ],
  }));

  const sealStyle = useAnimatedStyle(() => ({
    opacity: seal.value,
    transform: [{ scale: interpolate(seal.value, [0, 1], [0.4, 1]) }],
  }));

  const statusStyle = useAnimatedStyle(() => ({ opacity: status.value }));

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: COLORS.paper,
          alignItems: 'center',
          justifyContent: 'center',
          gap: d.develop.gap,
          zIndex: 28,
        },
        sheet,
      ]}>
      <Animated.View
        style={[{ width: d.develop.envW, height: d.develop.envH }, envelope]}>
        <View
          style={[
            {
              width: '100%',
              height: '100%',
              backgroundColor: COLORS.envBody,
              borderRadius: d.develop.envRadius,
              overflow: 'hidden',
            },
            shadow(26, 50, 0.28),
          ]}>
          {/* The closed flap: a shallow V seam across the top half. */}
          <View style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
            <Svg width={d.develop.envW} height={d.develop.flapH} viewBox="0 0 260 84">
              <Path fill={COLORS.envFlapline} d="M0 0 H260 L130 84 Z" />
            </Svg>
          </View>

          <Animated.View
            style={[
              {
                position: 'absolute',
                top: d.develop.sealTop,
                left: (d.develop.envW - d.develop.seal) / 2,
                width: d.develop.seal,
                height: d.develop.seal,
                borderRadius: d.develop.seal / 2,
                backgroundColor: COLORS.seal,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4,
              },
              shadow(3, 8, 0.3),
              sealStyle,
            ]}>
            <Star size={d.develop.sealFont} color="rgba(255,255,255,.85)" />
          </Animated.View>

          <Text
            style={{
              position: 'absolute',
              bottom: d.develop.stampBottom,
              right: d.develop.stampRight,
              zIndex: 3,
              fontFamily: FONTS.mono,
              fontSize: d.develop.stampFont,
              letterSpacing: d.develop.stampSpacing,
              textTransform: 'uppercase',
              color: COLORS.envStamp,
            }}>
            {stamp}
          </Text>
        </View>
      </Animated.View>

      <Animated.Text
        style={[
          {
            textAlign: 'center',
            fontFamily: FONTS.mono,
            fontSize: d.develop.statusFont,
            letterSpacing: d.develop.statusSpacing,
            textTransform: 'uppercase',
            color: COLORS.dim,
          },
          statusStyle,
        ]}>
        {'Sealed & developing'}
        {DOTS[dots]}
      </Animated.Text>
    </Animated.View>
  );
}
