import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { Metrics } from '../metrics';
import { COLORS, FONTS } from '../theme';
import { Star } from './icons';

/** "Roll finished" — the last screen of the flow. */
export function DoneScreen({
  m,
  visible,
  total,
  onAgain,
}: {
  m: Metrics;
  visible: boolean;
  total: number;
  onAgain: () => void;
}) {
  const { d } = m;
  const fade = useSharedValue(0);

  useEffect(() => {
    fade.value = withTiming(visible ? 1 : 0, { duration: 500 });
  }, [visible, fade]);

  const style = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: COLORS.paper,
          alignItems: 'center',
          justifyContent: 'center',
          gap: d.done.gap,
          padding: d.done.pad,
          zIndex: 30,
        },
        style,
      ]}>
      <View
        style={{
          width: d.done.seal,
          height: d.done.seal,
          borderRadius: d.done.seal / 2,
          backgroundColor: COLORS.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Star size={d.done.sealFont} color={COLORS.paper} />
      </View>

      <Text
        style={{
          fontFamily: FONTS.mono,
          fontSize: d.done.h2Font,
          letterSpacing: d.done.h2Spacing,
          color: COLORS.ink,
        }}>
        Roll finished
      </Text>

      <Text
        style={{
          textAlign: 'center',
          maxWidth: d.done.pWidth,
          fontFamily: FONTS.sans,
          fontSize: d.done.pFont,
          lineHeight: d.done.pLine,
          color: COLORS.dim,
        }}>
        {total} moments sealed. They&apos;re developing now, your prints are on the way.
      </Text>

      <Pressable
        onPress={onAgain}
        style={({ pressed }) => ({
          marginTop: d.done.againTop,
          paddingVertical: d.done.againPadV,
          paddingHorizontal: d.done.againPadH,
          borderRadius: d.done.againRadius,
          borderWidth: 1,
          borderColor: COLORS.againBorder,
          backgroundColor: pressed ? '#f2f2f2' : 'transparent',
        })}>
        <Text
          style={{
            fontFamily: FONTS.mono,
            fontSize: d.done.againFont,
            letterSpacing: d.done.againSpacing,
            color: COLORS.ink,
          }}>
          Load a new roll
        </Text>
      </Pressable>
    </Animated.View>
  );
}
