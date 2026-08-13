import { CameraView, type CameraType } from 'expo-camera';
import { type RefObject, useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Roll } from '../data/rolls';
import { ANIM, RATIO, type Metrics } from '../metrics';
import { COLORS, FONTS } from '../theme';

/** Corner brackets + centre reticle: the prototype's `.vf` overlay. */
function Reticle({ m }: { m: Metrics }) {
  const { d } = m;
  const corner = {
    position: 'absolute' as const,
    width: d.card.corner,
    height: d.card.corner,
    borderColor: COLORS.vfCorner,
  };
  const w = d.card.cornerBorder;
  const r = m.s(4);
  const inset = d.card.cornerInset;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 2 }]}>
      <View
        style={[
          corner,
          {
            top: inset,
            left: inset,
            borderTopWidth: w,
            borderLeftWidth: w,
            borderTopLeftRadius: r,
          },
        ]}
      />
      <View
        style={[
          corner,
          {
            top: inset,
            right: inset,
            borderTopWidth: w,
            borderRightWidth: w,
            borderTopRightRadius: r,
          },
        ]}
      />
      <View
        style={[
          corner,
          {
            bottom: inset,
            left: inset,
            borderBottomWidth: w,
            borderLeftWidth: w,
            borderBottomLeftRadius: r,
          },
        ]}
      />
      <View
        style={[
          corner,
          {
            bottom: inset,
            right: inset,
            borderBottomWidth: w,
            borderRightWidth: w,
            borderBottomRightRadius: r,
          },
        ]}
      />
      <View
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: -d.card.dot / 2,
          marginLeft: -d.card.dot / 2,
          width: d.card.dot,
          height: d.card.dot,
          borderRadius: d.card.dot / 2,
          borderWidth: d.card.dotBorder,
          borderColor: COLORS.vfDot,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: d.card.dotCore,
            height: d.card.dotCore,
            borderRadius: d.card.dotCore / 2,
            backgroundColor: COLORS.vfDotCore,
          }}
        />
      </View>
    </View>
  );
}

/** The `PRINTS · PHOTOBOOK · …` pill with the blinking record dot. */
function RecPill({ m, label }: { m: Metrics; label: string }) {
  const { d } = m;
  const blink = useSharedValue(1);

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: ANIM.blink / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: ANIM.blink / 2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [blink]);

  const dot = useAnimatedStyle(() => ({ opacity: blink.value }));

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: d.card.recTop,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 3,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: d.card.recGap,
          backgroundColor: COLORS.recBg,
          paddingVertical: d.card.recPadV,
          paddingHorizontal: d.card.recPadH,
          borderRadius: d.card.recRadius,
        }}>
        <Animated.View
          style={[
            {
              width: d.card.recDot,
              height: d.card.recDot,
              borderRadius: d.card.recDot / 2,
              backgroundColor: COLORS.live,
            },
            dot,
          ]}
        />
        <Text
          numberOfLines={1}
          style={{
            color: COLORS.recText,
            fontFamily: FONTS.mono,
            fontSize: d.card.recFont,
            letterSpacing: d.card.recSpacing,
          }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

/**
 * The photo frame.
 *
 * Only the top card can be live — expo-camera builds one capture session per `CameraView`
 * and iOS will not run two against the same lens — so the cards behind hold a blurred
 * still of a real camera frame, like a lens that has not pulled focus yet. On the top card
 * that same blurred still sits over the live preview and fades away as the camera comes up,
 * which doubles as cover for the moment the deck re-indexes after a capture.
 *
 * A frame never falls back to stock artwork: with no camera frame yet it stays dark.
 */
export function Viewfinder({
  m,
  roll,
  live,
  cameraRef,
  facing,
  flashOn,
  cameraEnabled,
  previewUri,
  focus,
  onCameraReady,
}: {
  m: Metrics;
  roll: Roll;
  live: boolean;
  cameraRef?: RefObject<CameraView | null>;
  facing?: CameraType;
  flashOn?: boolean;
  cameraEnabled?: boolean;
  previewUri?: string | null;
  focus: SharedValue<number>;
  onCameraReady?: () => void;
}) {
  const { d } = m;

  const focusStyle = useAnimatedStyle(() => ({ opacity: focus.value }));

  return (
    <View
      testID={live ? 'frame' : undefined}
      style={{
        width: '100%',
        aspectRatio: m.landscape ? roll.vfLand : roll.vf,
        borderRadius: d.card.frameRadius,
        overflow: 'hidden',
        backgroundColor: COLORS.frame,
      }}>
      {live && cameraEnabled ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flashOn ? 'on' : 'off'}
          // The prototype mirrors the selfie preview (`video.front{transform:scaleX(-1)}`);
          // expo-camera does not mirror by default.
          mirror={facing === 'front'}
          animateShutter={false}
          onCameraReady={onCameraReady}
          responsiveOrientationWhenOrientationLocked
        />
      ) : null}

      {live ? (
        // Fades out as the preview comes up. Dark when there is no frame to blur yet, so
        // the reveal still reads as the viewfinder focusing rather than an image appearing.
        <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 1 }, focusStyle]}>
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              blurRadius={RATIO.blurRadius}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.frame }]} />
          )}
        </Animated.View>
      ) : previewUri ? (
        <Image
          source={{ uri: previewUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={RATIO.blurRadius}
        />
      ) : null}

      {live ? (
        <>
          <RecPill m={m} label={roll.product.toUpperCase()} />
          <Reticle m={m} />
        </>
      ) : null}
    </View>
  );
}
