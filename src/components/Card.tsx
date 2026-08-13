import type { CameraView, CameraType } from 'expo-camera';
import type { RefObject } from 'react';
import { type LayoutChangeEvent, Text, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  type ComposedGesture,
  GestureDetector,
  type GestureType,
} from 'react-native-gesture-handler';

import type { Roll } from '../data/rolls';
import { todayStr } from '../lib/date';
import { RATIO, type Metrics } from '../metrics';
import { COLORS, FONTS, shadow } from '../theme';
import { Calendar, Pin } from './icons';
import { Viewfinder } from './Viewfinder';

/** Shared values driving the top card's drag / capture fling. */
export type DragValues = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rot: SharedValue<number>;
  opacity: SharedValue<number>;
};

export function Card({
  m,
  roll,
  frameNo,
  total,
  isTop,
  depthIndex,
  drag,
  advance,
  focus,
  gesture,
  cameraRef,
  facing,
  flashOn,
  cameraEnabled,
  previewUri,
  onCameraReady,
  onLayout,
}: {
  m: Metrics;
  roll: Roll;
  frameNo: number;
  total: number;
  isTop: boolean;
  depthIndex: number;
  drag: DragValues;
  /** 0 → resting stack, 1 → every card has risen one place. */
  advance: SharedValue<number>;
  /** 1 → blurred still covers the frame, 0 → the live preview shows through. */
  focus: SharedValue<number>;
  gesture?: ComposedGesture | GestureType;
  cameraRef?: RefObject<CameraView | null>;
  facing?: CameraType;
  flashOn?: boolean;
  cameraEnabled?: boolean;
  previewUri?: string | null;
  onCameraReady?: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const { d } = m;

  const dragStyle = useAnimatedStyle(() => ({
    opacity: drag.opacity.value,
    transform: [
      { translateX: drag.x.value },
      { translateY: drag.y.value },
      { rotate: `${drag.rot.value}deg` },
    ],
  }));

  // A card behind the top one rises into the place ahead of it as the stack advances,
  // instead of the deck re-indexing under the user in a single frame.
  const behindStyle = useAnimatedStyle(() => {
    const place = Math.max(0, depthIndex - advance.value);
    return {
      transform: [
        { translateY: place * d.deck.offsetY },
        { scale: 1 - place * RATIO.stackScaleStep },
      ],
    };
  });

  const face = {
    backgroundColor: COLORS.paper,
    borderRadius: d.card.radius,
    paddingTop: d.card.padTop,
    paddingHorizontal: d.card.padH,
    paddingBottom: d.card.padBottom,
  };

  const body = (
    <Animated.View
      testID={isTop ? 'card' : undefined}
      onLayout={onLayout}
      style={[{ width: d.card.width }, isTop ? dragStyle : behindStyle]}
      pointerEvents={isTop ? 'auto' : 'none'}>
      <View style={[face, shadow(14, 34, 0.18)]}>
        <Viewfinder
          m={m}
          roll={roll}
          live={isTop}
          cameraRef={cameraRef}
          facing={facing}
          flashOn={flashOn}
          cameraEnabled={cameraEnabled}
          previewUri={previewUri}
          focus={focus}
          onCameraReady={onCameraReady}
        />

        <View
          style={{
            paddingTop: d.card.metaTop,
            paddingHorizontal: d.card.metaH,
            paddingBottom: d.card.metaBottom,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: d.card.row1Gap,
            }}>
            <Text
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontFamily: FONTS.mono,
                fontSize: d.card.rollFont,
                letterSpacing: d.card.rollSpacing,
                color: COLORS.ink,
              }}>
              {roll.name}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.mono,
                fontSize: d.card.countFont,
                letterSpacing: d.card.countSpacing,
                color: COLORS.dim,
              }}>
              {frameNo}/{total}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: d.card.mlineGap,
              marginTop: d.card.mlineTop,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: d.card.mitemGap }}>
              <Calendar size={d.card.mlineIcon} color={COLORS.dim} opacity={0.55} />
              <Text
                style={{ fontFamily: FONTS.sans, fontSize: d.card.mlineFont, color: COLORS.dim }}>
                {todayStr()}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: d.card.mitemGap,
                flexShrink: 1,
              }}>
              <Pin size={d.card.mlineIcon} color={COLORS.dim} opacity={0.55} />
              <Text
                numberOfLines={1}
                style={{ fontFamily: FONTS.sans, fontSize: d.card.mlineFont, color: COLORS.dim }}>
                {roll.loc}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return gesture ? <GestureDetector gesture={gesture}>{body}</GestureDetector> : body;
}
