import type { CameraView, CameraType } from 'expo-camera';
import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import type { ComposedGesture, GestureType } from 'react-native-gesture-handler';

import type { Roll } from '../data/rolls';
import type { Metrics } from '../metrics';
import { Card, type DragValues } from './Card';

/**
 * The visible stack, three cards deep.
 *
 * The prototype rebuilt the whole deck after every capture. Here the three layers keep
 * stable identities and the data rotates through them, so the top card — and with it the
 * live `CameraView` — is never unmounted and the preview never blinks.
 */
export function CardDeck({
  m,
  roll,
  remaining,
  total,
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
  cardHeight,
  onCardHeight,
}: {
  m: Metrics;
  roll: Roll;
  remaining: number;
  total: number;
  drag: DragValues;
  gesture: ComposedGesture | GestureType;
  flipped: boolean;
  message: string;
  onChangeMessage: (text: string) => void;
  onFlipToFront: () => void;
  cameraRef: RefObject<CameraView | null>;
  facing: CameraType;
  flashOn: boolean;
  cameraEnabled: boolean;
  cardHeight: number;
  onCardHeight: (height: number) => void;
}) {
  const depth = Math.min(3, remaining);
  const keyboard = useAnimatedKeyboard();

  // Lift the deck just enough to keep the note field clear of the keyboard.
  const shift = useAnimatedStyle(() => {
    if (!flipped || cardHeight === 0) return { transform: [{ translateY: 0 }] };
    const bottom = m.deck.centerY + cardHeight / 2 + m.s(12);
    const overlap = bottom - (m.height - keyboard.height.value);
    return { transform: [{ translateY: -Math.max(0, overlap) }] };
  });

  if (depth <= 0) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: m.deck.left,
          right: m.deck.right,
          height: m.deck.boxHeight,
          zIndex: 4,
        },
        shift,
      ]}>
      {Array.from({ length: depth }, (_, i) => depth - 1 - i).map((i) => (
        <View
          key={`layer-${i}`}
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center', zIndex: 10 + (depth - i) },
          ]}>
          <Card
            m={m}
            roll={roll}
            frameNo={remaining - i}
            total={total}
            isTop={i === 0}
            depthIndex={i}
            drag={drag}
            gesture={i === 0 ? gesture : undefined}
            flipped={i === 0 ? flipped : false}
            message={message}
            onChangeMessage={onChangeMessage}
            onFlipToFront={onFlipToFront}
            cameraRef={i === 0 ? cameraRef : undefined}
            facing={facing}
            flashOn={flashOn}
            cameraEnabled={cameraEnabled}
            fallbackIndex={total - remaining}
            onLayout={i === 0 ? (e) => onCardHeight(e.nativeEvent.layout.height) : undefined}
          />
        </View>
      ))}
    </Animated.View>
  );
}
