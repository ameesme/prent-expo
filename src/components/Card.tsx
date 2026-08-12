import type { CameraView, CameraType } from 'expo-camera';
import { type RefObject, useEffect } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  type ComposedGesture,
  GestureDetector,
  type GestureType,
} from 'react-native-gesture-handler';

import type { Roll } from '../data/rolls';
import { todayStr } from '../lib/date';
import { ANIM, RATIO, type Metrics } from '../metrics';
import { COLORS, FONTS, shadow } from '../theme';
import { CardBack } from './CardBack';
import { Calendar, FlipHint, Pin } from './icons';
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
  gesture,
  flipped,
  message,
  onChangeMessage,
  onFlipToFront,
  cameraRef,
  facing,
  flashOn,
  cameraEnabled,
  previewUri,
  onCameraReady,
  fallbackIndex,
  onLayout,
}: {
  m: Metrics;
  roll: Roll;
  frameNo: number;
  total: number;
  isTop: boolean;
  depthIndex: number;
  drag: DragValues;
  gesture?: ComposedGesture | GestureType;
  flipped?: boolean;
  message?: string;
  onChangeMessage?: (text: string) => void;
  onFlipToFront?: () => void;
  cameraRef?: RefObject<CameraView | null>;
  facing?: CameraType;
  flashOn?: boolean;
  cameraEnabled?: boolean;
  previewUri?: string | null;
  onCameraReady?: () => void;
  fallbackIndex?: number;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const { d } = m;
  const flip = useSharedValue(0);

  useEffect(() => {
    flip.value = withTiming(flipped ? 1 : 0, {
      duration: ANIM.flip,
      easing: Easing.bezier(0.3, 0.7, 0.25, 1),
    });
  }, [flipped, flip]);

  const dragStyle = useAnimatedStyle(() => ({
    opacity: drag.opacity.value,
    transform: [
      { translateX: drag.x.value },
      { translateY: drag.y.value },
      { rotate: `${drag.rot.value}deg` },
    ],
  }));

  // React Native has no `transform-style: preserve-3d`, so each face carries its own
  // rotation: the front sweeps 0→180° while the back, pre-rotated, sweeps 180→360°.
  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: d.card.perspective }, { rotateY: `${flip.value * 180}deg` }],
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: d.card.perspective },
      { rotateY: `${180 + flip.value * 180}deg` },
    ],
  }));

  const faceBase = {
    backgroundColor: COLORS.paper,
    borderRadius: d.card.radius,
    paddingTop: d.card.padTop,
    paddingHorizontal: d.card.padH,
    paddingBottom: d.card.padBottom,
    backfaceVisibility: 'hidden' as const,
  };

  const behind = {
    transform: [
      { translateY: depthIndex * d.deck.offsetY },
      { scale: 1 - depthIndex * RATIO.stackScaleStep },
    ],
  };

  const front = (
    <Animated.View style={[faceBase, shadow(14, 34, 0.18), frontStyle]}>
      <Viewfinder
        m={m}
        roll={roll}
        live={isTop}
        cameraRef={cameraRef}
        facing={facing}
        flashOn={flashOn}
        cameraEnabled={cameraEnabled}
        previewUri={previewUri}
        onCameraReady={onCameraReady}
        fallbackIndex={fallbackIndex}
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

        {isTop ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: d.card.hintGap,
              marginTop: d.card.hintTop,
              paddingTop: d.card.hintPadTop,
              borderTopWidth: 1,
              borderTopColor: COLORS.hairline,
            }}>
            <FlipHint size={d.card.hintIcon} color={COLORS.hint} opacity={0.7} />
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: d.card.hintFont,
                letterSpacing: d.card.hintSpacing,
                color: COLORS.hint,
              }}>
              Tap to write on the back
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );

  const body = (
    <Animated.View
      testID={isTop ? 'card' : undefined}
      onLayout={onLayout}
      style={[{ width: d.card.width }, isTop ? dragStyle : behind]}
      pointerEvents={isTop ? 'auto' : 'none'}>
      {front}
      {isTop ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            faceBase,
            shadow(14, 34, 0.18),
            { flexDirection: 'column' },
            backStyle,
          ]}>
          <CardBack
            m={m}
            roll={roll}
            flipped={!!flipped}
            message={message ?? ''}
            onChangeMessage={onChangeMessage ?? (() => {})}
            onFlipToFront={onFlipToFront ?? (() => {})}
          />
        </Animated.View>
      ) : null}
    </Animated.View>
  );

  return gesture ? <GestureDetector gesture={gesture}>{body}</GestureDetector> : body;
}
