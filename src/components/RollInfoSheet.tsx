import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { framesFor, type Roll } from '../data/rolls';
import { ANIM, type Metrics } from '../metrics';
import { COLORS, FONTS, shadow } from '../theme';
import { FormatPreview } from './FormatPreview';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Tapping the roll title drops this sheet down out of the envelope. */
export function RollInfoSheet({
  m,
  roll,
  visible,
  onClose,
}: {
  m: Metrics;
  roll: Roll;
  visible: boolean;
  onClose: () => void;
}) {
  const { d } = m;
  // Start fully off-screen until the real height is measured.
  const [sheetHeight, setSheetHeight] = useState(m.height);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: ANIM.sheet,
      easing: Easing.bezier(0.25, 0.7, 0.3, 1),
    });
  }, [visible, progress]);

  const sheet = useAnimatedStyle(() => ({
    transform: [{ translateY: -sheetHeight * (1 - progress.value) }],
  }));

  const scrim = useAnimatedStyle(() => ({ opacity: progress.value }));

  const filled = framesFor(roll);
  const gap = d.sheet.slotGap;
  const inner = m.width - d.sheet.padH * 2 - m.insets.left - m.insets.right;
  const slot = (inner - gap * 5) / 6;

  return (
    <View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, { zIndex: 30 }]}>
      <AnimatedPressable
        onPress={onClose}
        style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.scrim }, scrim]}
      />

      <Animated.View
        onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            maxHeight: m.height,
            backgroundColor: COLORS.sheet,
            borderBottomLeftRadius: d.sheet.radius,
            borderBottomRightRadius: d.sheet.radius,
          },
          shadow(24, 50, 0.4),
          sheet,
        ]}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={{ flexShrink: 1 }}
          contentContainerStyle={{
            // Clears the notch plus a gap, rather than the whole envelope height.
            paddingTop: m.envPadTop + d.sheet.padTop,
            paddingHorizontal: d.sheet.padH + m.insets.left,
            // The grab handle is absolutely placed inside this padding, not below it.
            paddingBottom: d.sheet.padBottom,
          }}>
          <Pressable onPress={onClose}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: d.sheet.topGap,
                marginBottom: d.sheet.topBottom,
              }}>
              <View
                style={{
                  width: d.sheet.fmtWrap,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <FormatPreview m={m} fmt={roll.fmt} cover={roll.cover} variant="dark" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: d.sheet.nameFont,
                    letterSpacing: d.sheet.nameSpacing,
                    color: COLORS.paper,
                  }}>
                  {roll.name}
                </Text>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: d.sheet.productTop,
                    backgroundColor: COLORS.paper,
                    paddingVertical: d.sheet.productPadV,
                    paddingHorizontal: d.sheet.productPadH,
                    borderRadius: d.sheet.productRadius,
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: d.sheet.productFont,
                      letterSpacing: d.sheet.productSpacing,
                      textTransform: 'uppercase',
                      color: COLORS.sheet,
                    }}>
                    {roll.product}
                  </Text>
                </View>
                <Text
                  style={{
                    marginTop: d.sheet.countTop,
                    fontFamily: FONTS.mono,
                    fontSize: d.sheet.countFont,
                    color: COLORS.sheetCount,
                  }}>
                  {roll.shot} of {roll.total} frames shot · {roll.total - roll.shot} left
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: d.sheet.descFont,
                lineHeight: d.sheet.descLine,
                color: COLORS.sheetDesc,
                marginBottom: d.sheet.descBottom,
              }}>
              {roll.desc}
            </Text>

            <Text
              style={{
                fontFamily: FONTS.mono,
                fontSize: d.sheet.labelFont,
                letterSpacing: d.sheet.labelSpacing,
                textTransform: 'uppercase',
                color: COLORS.sheetLabel,
                marginBottom: d.sheet.labelBottom,
              }}>
              Frames in this roll
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
              {Array.from({ length: roll.total }, (_, i) => {
                const image = i < filled.length ? filled[i] : undefined;
                return (
                  <View
                    key={i}
                    style={{
                      width: slot,
                      height: slot,
                      borderRadius: d.sheet.slotRadius,
                      overflow: 'hidden',
                      backgroundColor: COLORS.slotFill,
                      borderWidth: 1,
                      borderColor: COLORS.slotBorder,
                      borderStyle: image ? 'solid' : 'dashed',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        resizeMode="cover"
                        style={StyleSheet.absoluteFill}
                      />
                    ) : (
                      <View
                        style={{
                          width: d.sheet.slotDot,
                          height: d.sheet.slotDot,
                          borderRadius: d.sheet.slotDot / 2,
                          backgroundColor: COLORS.slotDot,
                        }}
                      />
                    )}
                    <Text
                      style={{
                        position: 'absolute',
                        bottom: d.sheet.numBottom,
                        right: d.sheet.numRight,
                        fontFamily: FONTS.mono,
                        fontSize: d.sheet.numFont,
                        color: COLORS.slotNum,
                      }}>
                      {i + 1}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Pressable>
        </ScrollView>

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: d.sheet.grabBottom,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}>
          <View
            style={{
              width: d.sheet.grabW,
              height: d.sheet.grabH,
              borderRadius: d.sheet.grabRadius,
              backgroundColor: COLORS.grab,
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
}
