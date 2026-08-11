import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ROLLS, type Roll } from '../data/rolls';
import { ANIM, type Metrics } from '../metrics';
import { COLORS, FONTS } from '../theme';
import { FormatPreview } from './FormatPreview';
import { ChevronRight, Close, Plus } from './icons';

function RollRow({ m, roll, onPress }: { m: Metrics; roll: Roll; onPress: () => void }) {
  const { d } = m;
  const left = roll.total - roll.shot;
  const pct = Math.round((roll.shot / roll.total) * 100);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: d.overview.rowGap,
        padding: d.overview.rowPad,
        borderRadius: d.overview.rowRadius,
        backgroundColor: COLORS.rollBg,
        borderWidth: 1,
        borderColor: COLORS.rollBorder,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <FormatPreview m={m} fmt={roll.fmt} cover={roll.cover} variant="light" />

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: FONTS.mono,
            fontSize: d.overview.nameFont,
            letterSpacing: d.overview.nameSpacing,
            color: COLORS.ink,
          }}>
          {roll.name}
        </Text>
        <View
          style={{
            alignSelf: 'flex-start',
            marginTop: d.overview.productTop,
            backgroundColor: COLORS.ink,
            paddingVertical: d.overview.productPadV,
            paddingHorizontal: d.overview.productPadH,
            borderRadius: d.overview.productRadius,
          }}>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: d.overview.productFont,
              letterSpacing: d.overview.productSpacing,
              textTransform: 'uppercase',
              color: COLORS.paper,
            }}>
            {roll.product}
          </Text>
        </View>
        <Text
          style={{
            marginTop: d.overview.descTop,
            fontFamily: FONTS.sans,
            fontSize: d.overview.descFont,
            lineHeight: d.overview.descLine,
            color: COLORS.dim,
          }}>
          {roll.desc}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: d.overview.metaGap,
            marginTop: d.overview.metaTop,
          }}>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: d.overview.metaFont,
              color: COLORS.rollMeta,
            }}>
            {left} left
          </Text>
          <View
            style={{
              flex: 1,
              maxWidth: d.overview.progMax,
              height: d.overview.progH,
              borderRadius: d.overview.progRadius,
              backgroundColor: COLORS.progTrack,
              overflow: 'hidden',
            }}>
            <View
              style={{
                width: `${pct}%`,
                height: '100%',
                borderRadius: d.overview.progRadius,
                backgroundColor: COLORS.ink,
              }}
            />
          </View>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: d.overview.metaFont,
              color: COLORS.rollMeta,
            }}>
            {roll.shot}/{roll.total}
          </Text>
        </View>
      </View>

      <ChevronRight size={d.overview.arrow} color={COLORS.rollArrow} />
    </Pressable>
  );
}

/** The full-screen roll library, sliding in from the left. */
export function RollsOverview({
  m,
  visible,
  onClose,
  onOpenRoll,
  onNewRoll,
}: {
  m: Metrics;
  visible: boolean;
  onClose: () => void;
  onOpenRoll: (roll: Roll) => void;
  onNewRoll: () => void;
}) {
  const { d } = m;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: ANIM.overview,
      easing: Easing.bezier(0.3, 0.7, 0.3, 1),
    });
  }, [visible, progress]);

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateX: -m.width * (1 - progress.value) }],
  }));

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: COLORS.paper, zIndex: 40 },
        slide,
      ]}>
      <View
        style={{
          paddingTop: d.overview.headPadTop + m.insets.top,
          paddingHorizontal: d.overview.headPadH + m.insets.left,
          paddingBottom: d.overview.headPadBottom,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          backgroundColor: COLORS.paper,
        }}>
        <View>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: d.overview.titleFont,
              letterSpacing: d.overview.titleSpacing,
              color: COLORS.ink,
            }}>
            Your rolls
          </Text>
          <Text
            style={{
              marginTop: d.overview.subTop,
              fontFamily: FONTS.sans,
              fontSize: d.overview.subFont,
              color: COLORS.dim,
            }}>
            Active rolls across your circles
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={m.s(10)}
          style={({ pressed }) => ({
            width: d.overview.close,
            height: d.overview.close,
            borderRadius: d.overview.close / 2,
            borderWidth: 1,
            borderColor: COLORS.closeBorder,
            backgroundColor: pressed ? COLORS.rollBg : COLORS.paper,
            alignItems: 'center',
            justifyContent: 'center',
          })}>
          <Close size={d.overview.closeIcon} color="#333333" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            paddingTop: d.overview.listPadTop,
            paddingHorizontal: d.overview.listPadH + m.insets.left,
            paddingBottom: d.overview.listPadBottom,
            gap: d.overview.listGap,
          }}>
          {ROLLS.map((roll) => (
            <RollRow key={roll.id} m={m} roll={roll} onPress={() => onOpenRoll(roll)} />
          ))}
        </View>

        <Pressable
          onPress={onNewRoll}
          style={({ pressed }) => ({
            marginTop: d.overview.newMarginTop,
            marginHorizontal: d.overview.newMarginH + m.insets.left,
            marginBottom: d.overview.newMarginBottom + m.insets.bottom,
            padding: d.overview.newPad,
            borderRadius: d.overview.newRadius,
            borderWidth: d.overview.newBorder,
            borderStyle: 'dashed',
            borderColor: COLORS.newDash,
            backgroundColor: pressed ? COLORS.rollBg : COLORS.paper,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: d.overview.newGap,
          })}>
          <Plus size={d.overview.newIcon} color={COLORS.newText} />
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: d.overview.newFont,
              letterSpacing: d.overview.newSpacing,
              color: COLORS.newText,
            }}>
            Start a new roll
          </Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}
