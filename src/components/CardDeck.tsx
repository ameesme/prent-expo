import type { CameraView, CameraType } from 'expo-camera';
import { type RefObject, useEffect } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
  previewUri,
  onCameraReady,
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
  previewUri: string | null;
  onCameraReady: () => void;
  cardHeight: number;
  onCardHeight: (height: number) => void;
}) {
  const depth = Math.min(3, remaining);

  // Keyboard height, from React Native's own events. Reanimated's `useAnimatedKeyboard` is
  // deprecated as of 4.5.1 and was the other native subscription firing at the moment the
  // note field takes focus — the moment the app was reported crashing.
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    const duration = Platform.OS === 'ios' ? 250 : 0;
    const config = { duration, easing: Easing.out(Easing.ease) };
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        keyboardHeight.value = withTiming(event.endCoordinates?.height ?? 0, config);
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardHeight.value = withTiming(0, config);
      },
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [keyboardHeight]);

  // Lift the deck just enough to keep the note field clear of the keyboard.
  const shift = useAnimatedStyle(() => {
    if (!flipped || cardHeight === 0) return { transform: [{ translateY: 0 }] };
    const bottom = m.deck.centerY + cardHeight / 2 + m.s(12);
    const overlap = bottom - (m.height - keyboardHeight.value);
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
            previewUri={previewUri}
            onCameraReady={i === 0 ? onCameraReady : undefined}
            fallbackIndex={total - remaining}
            onLayout={i === 0 ? (e) => onCardHeight(e.nativeEvent.layout.height) : undefined}
          />
        </View>
      ))}
    </Animated.View>
  );
}
