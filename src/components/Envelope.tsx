import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ANIM, RATIO, type Metrics } from '../metrics';
import { COLORS, FONTS } from '../theme';
import { Flap } from './Flap';
import { ChevronDown, Star } from './icons';

/**
 * The black top bar: the mouth of the envelope you swipe photos into.
 * `phase` is 0 idle · 1 dragging · 2 near · 3 armed, mirroring the prototype's
 * `.envelope.dragging / .near / .armed` classes.
 */
export function Envelope({
  m,
  phase,
  height,
  slotText,
  slotStar,
  title,
  open,
  onPressTitle,
}: {
  m: Metrics;
  phase: number;
  /** Shared with the flash overlay, which starts where the bar ends. */
  height: SharedValue<number>;
  slotText: string;
  slotStar?: boolean;
  title: string;
  open: boolean;
  onPressTitle: () => void;
}) {
  const { d, env } = m;

  const armed = useSharedValue(0);
  const titleOpacity = useSharedValue<number>(RATIO.titleIdle);
  const chevron = useSharedValue(0);

  const heightTarget =
    phase >= 3 ? env.armed : phase === 2 ? env.near : phase === 1 ? env.dragging : env.idle;

  useEffect(() => {
    height.value = withTiming(heightTarget, {
      duration: ANIM.envHeight,
      easing: Easing.bezier(0.25, 0.6, 0.3, 1),
    });
    armed.value = withTiming(phase >= 3 ? 1 : 0, { duration: ANIM.envBg });
    titleOpacity.value = withTiming(
      phase >= 3 ? 0 : phase === 2 ? RATIO.titleNear : RATIO.titleIdle,
      { duration: ANIM.envBg },
    );
  }, [heightTarget, phase, height, armed, titleOpacity]);

  useEffect(() => {
    chevron.value = withTiming(open ? 1 : 0, { duration: 300 });
  }, [open, chevron]);

  const bar = useAnimatedStyle(() => ({
    height: height.value,
    backgroundColor: interpolateColor(armed.value, [0, 1], [COLORS.env, COLORS.envArmed]),
  }));

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value * 180}deg` }],
  }));

  const slotStyle = useAnimatedStyle(() => ({
    color: interpolateColor(armed.value, [0, 1], [COLORS.slot, COLORS.slotArmed]),
  }));

  return (
    <Animated.View
      testID="envelope"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          borderBottomLeftRadius: d.env.radius,
          borderBottomRightRadius: d.env.radius,
          alignItems: 'center',
          paddingTop: m.envPadTop,
          zIndex: 5,
        },
        bar,
      ]}>
      <Flap m={m} phase={phase} />

      <Animated.View style={[{ marginTop: d.env.titleTop, zIndex: 6 }, titleStyle]}>
        <Pressable
          testID="rollTitle"
          onPress={onPressTitle}
          hitSlop={m.s(8)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: d.env.titleGap,
            paddingVertical: d.env.titlePadV,
            paddingHorizontal: d.env.titlePadH,
            borderRadius: d.env.titleRadius,
            backgroundColor: pressed ? COLORS.titlePress : 'transparent',
          })}>
          <Text
            style={{
              color: COLORS.paper,
              fontFamily: FONTS.mono,
              fontSize: d.env.titleFont,
              letterSpacing: d.env.titleSpacing,
            }}>
            {title}
          </Text>
          <Animated.View style={chevronStyle}>
            <ChevronDown size={d.env.chevron} color={COLORS.paper} opacity={0.65} />
          </Animated.View>
        </Pressable>
      </Animated.View>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: d.env.slotBottom,
          left: 0,
          right: 0,
          zIndex: 3,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: m.s(4),
        }}>
        <Animated.Text
          style={[
            {
              textAlign: 'center',
              fontFamily: FONTS.mono,
              fontSize: d.env.slotFont,
              letterSpacing: d.env.slotSpacing,
              textTransform: 'uppercase',
            },
            slotStyle,
          ]}>
          {slotText}
        </Animated.Text>
        {slotStar ? <Star size={d.env.slotFont} color={COLORS.slotArmed} /> : null}
      </View>
    </Animated.View>
  );
}
