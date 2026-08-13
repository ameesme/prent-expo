import type { CameraView, CameraType } from 'expo-camera';
import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
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
  advance,
  focus,
  gesture,
  cameraRef,
  facing,
  flashOn,
  cameraEnabled,
  previewUri,
  onCameraReady,
  onCardHeight,
}: {
  m: Metrics;
  roll: Roll;
  remaining: number;
  total: number;
  drag: DragValues;
  advance: SharedValue<number>;
  focus: SharedValue<number>;
  gesture: ComposedGesture | GestureType;
  cameraRef: RefObject<CameraView | null>;
  facing: CameraType;
  flashOn: boolean;
  cameraEnabled: boolean;
  previewUri: string | null;
  onCameraReady: () => void;
  onCardHeight: (height: number) => void;
}) {
  const depth = Math.min(3, remaining);

  if (depth <= 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: m.deck.left,
        right: m.deck.right,
        height: m.deck.boxHeight,
        zIndex: 4,
      }}>
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
            advance={advance}
            focus={focus}
            gesture={i === 0 ? gesture : undefined}
            cameraRef={i === 0 ? cameraRef : undefined}
            facing={facing}
            flashOn={flashOn}
            cameraEnabled={cameraEnabled}
            previewUri={previewUri}
            onCameraReady={i === 0 ? onCameraReady : undefined}
            onLayout={i === 0 ? (e) => onCardHeight(e.nativeEvent.layout.height) : undefined}
          />
        </View>
      ))}
    </View>
  );
}
