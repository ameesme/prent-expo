import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

import { CardDeck } from '../components/CardDeck';
import { Controls } from '../components/Controls';
import { DevelopScreen } from '../components/DevelopScreen';
import { DoneScreen } from '../components/DoneScreen';
import { Envelope } from '../components/Envelope';
import { FlashOverlay, type FlashHandle } from '../components/FlashOverlay';
import { RollInfoSheet } from '../components/RollInfoSheet';
import { RollsOverview } from '../components/RollsOverview';
import { ROLLS, type Roll } from '../data/rolls';
import { saveToGallery } from '../lib/gallery';
import { ANIM, RATIO, useMetrics } from '../metrics';
import { COLORS } from '../theme';

const SLOT_IDLE = 'pull a card up';
const SLOT_NEAR = 'flick up to capture';
const SLOT_ARMED = 'release to capture';
const SLOT_DONE = 'captured';
/**
 * The sealed envelope's stamp. The prototype's markup stamps the brand here, while its
 * `openRoll()` overwrites it with the roll's product name — the brand reads as the
 * intended postmark, and it is what the prototype shows on load.
 */
const ENVELOPE_STAMP = 'Prent';

export function CaptureScreen() {
  const m = useMetrics();
  const camera = useRef<CameraView | null>(null);
  const flash = useRef<FlashHandle | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [roll, setRoll] = useState<Roll>(ROLLS[0]);
  const [remaining, setRemaining] = useState(ROLLS[0].total - ROLLS[0].shot);
  const [phase, setPhase] = useState(0);
  const [slot, setSlot] = useState<{ text: string; star: boolean }>({
    text: SLOT_IDLE,
    star: false,
  });
  const [flipped, setFlipped] = useState(false);
  const [message, setMessage] = useState('');
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashOn, setFlashOn] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [developing, setDeveloping] = useState(false);
  const [done, setDone] = useState(false);
  const [cardHeight, setCardHeight] = useState(0);

  // Drag / fling transform of the top card, plus the envelope height the flash starts at.
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rot = useSharedValue(0);
  const opacity = useSharedValue(1);
  const envHeight = useSharedValue(m.env.idle);
  const busy = useSharedValue(0);
  const lastPhase = useSharedValue(0);

  const drag = useMemo(() => ({ x, y, rot, opacity }), [x, y, rot, opacity]);
  const total = roll.total;

  const after = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  // Ask for the camera up front; gallery access is requested at the first capture.
  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      void requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  const applyPhase = useCallback((next: number) => {
    setPhase(next);
    setSlot({
      text: next >= 3 ? SLOT_ARMED : next === 2 ? SLOT_NEAR : SLOT_IDLE,
      star: false,
    });
  }, []);

  const restCard = useCallback(
    (animated: boolean) => {
      if (animated) {
        const config = {
          duration: ANIM.reset,
          easing: Easing.bezier(0.2, 0.9, 0.25, 1),
        };
        x.value = withTiming(0, config);
        y.value = withTiming(0, config);
        rot.value = withTiming(0, config);
        opacity.value = withTiming(1, config);
      } else {
        x.value = 0;
        y.value = 0;
        rot.value = 0;
        opacity.value = 1;
      }
    },
    [x, y, rot, opacity],
  );

  const resetDrag = useCallback(() => {
    lastPhase.value = 0;
    applyPhase(0);
    restCard(true);
  }, [applyPhase, restCard, lastPhase]);

  const flipToBack = useCallback(() => {
    lastPhase.value = 0;
    applyPhase(0);
    restCard(true);
    setFlipped(true);
  }, [applyPhase, restCard, lastPhase]);

  /** Take the real photo and hand it to the gallery, without blocking the animation. */
  const savePhoto = useCallback(async () => {
    if (!camera.current || !cameraPermission?.granted) return;
    try {
      const photo = await camera.current.takePictureAsync({
        quality: 0.9,
        shutterSound: false,
      });
      if (!photo?.uri) return;
      await saveToGallery(photo.uri);
    } catch (error) {
      console.warn('[prent] could not capture or save the photo', error);
    }
  }, [cameraPermission]);

  const finishRoll = useCallback(() => {
    setDeveloping(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    after(ANIM.doneDelay, () => setDone(true));
  }, [after]);

  const capture = useCallback(
    (dx: number) => {
      busy.value = 1;
      setSlot({ text: SLOT_DONE, star: true });

      // Fling the card up through the open mouth (`translate(dx, -150%) scale(.8)`).
      const config = { duration: ANIM.fling, easing: Easing.bezier(0.4, 0, 0.2, 1) };
      x.value = withTiming(dx, config);
      y.value = withTiming(-(cardHeight || m.deck.centerY), config);
      rot.value = withTiming(dx * RATIO.captureRotate, config);
      opacity.value = withTiming(0, config);

      flash.current?.fire(flashOn);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      void savePhoto();

      // Let the card get eaten, then the flap closes shut.
      after(ANIM.flapClose, () => {
        lastPhase.value = 0;
        applyPhase(0);
      });

      after(ANIM.captureSettle, () => {
        setRemaining((left) => {
          const next = left - 1;
          if (next <= 0) {
            finishRoll();
            busy.value = 0;
            return 0;
          }
          restCard(false);
          setMessage('');
          setSlot({ text: SLOT_IDLE, star: false });
          busy.value = 0;
          return next;
        });
      });
    },
    [
      after,
      applyPhase,
      busy,
      cardHeight,
      finishRoll,
      flashOn,
      lastPhase,
      m.deck.centerY,
      opacity,
      restCard,
      rot,
      savePhoto,
      x,
      y,
    ],
  );

  // Thresholds are design pixels in the prototype, so they scale with the canvas.
  const S = m.S;
  const gesture = useMemo(() => {
    // `minDistance` is the prototype's 5px slop: below it the drag never starts, which
    // is exactly when a touch should count as a tap instead.
    const pan = Gesture.Pan()
      .enabled(!flipped)
      .minDistance(ANIM.moveSlop * S)
      .onUpdate((event) => {
        'worklet';
        if (busy.value) return;
        const dx = event.translationX;
        const dy = event.translationY;

        x.value = dx;
        y.value = dy;
        rot.value = dx * RATIO.dragRotate;

        const next = dy < ANIM.capture * S ? 3 : dy < ANIM.near * S ? 2 : 1;
        if (next !== lastPhase.value) {
          lastPhase.value = next;
          runOnJS(applyPhase)(next);
        }
      })
      .onEnd((event) => {
        'worklet';
        if (busy.value) return;
        const flicked =
          event.velocityY < ANIM.flickVelocity * 1000 * S &&
          event.translationY < ANIM.flickDistance * S;
        if (event.translationY < ANIM.capture * S || flicked) {
          runOnJS(capture)(event.translationX);
        } else {
          runOnJS(resetDrag)();
        }
      });

    // A tap flips the card to its back, as in the prototype's "no move" pointerup.
    const tap = Gesture.Tap()
      .enabled(!flipped)
      .maxDistance(ANIM.moveSlop * 2 * S)
      .onEnd((_event, success) => {
        'worklet';
        if (success && !busy.value) runOnJS(flipToBack)();
      });

    return Gesture.Race(pan, tap);
  }, [S, applyPhase, busy, capture, flipToBack, flipped, lastPhase, resetDrag, rot, x, y]);

  const openRoll = useCallback(
    (next: Roll) => {
      setRoll(next);
      setRemaining(next.total - next.shot);
      setDeveloping(false);
      setDone(false);
      setFlipped(false);
      setInfoOpen(false);
      setMessage('');
      lastPhase.value = 0;
      applyPhase(0);
      restCard(false);
      busy.value = 0;
    },
    [applyPhase, busy, lastPhase, restCard],
  );

  const loadNewRoll = useCallback(() => {
    setRemaining(total);
    setDeveloping(false);
    setDone(false);
    setFlipped(false);
    setMessage('');
    lastPhase.value = 0;
    applyPhase(0);
    restCard(false);
    busy.value = 0;
  }, [applyPhase, busy, lastPhase, restCard, total]);

  const cameraEnabled = cameraPermission?.granted === true && !developing && !done;
  const controlsVisible = !developing && !done;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.paper }}>
      <StatusBar style={overviewOpen || developing || done ? 'dark' : 'light'} />

      <CardDeck
        m={m}
        roll={roll}
        remaining={remaining}
        total={total}
        drag={drag}
        gesture={gesture}
        flipped={flipped}
        message={message}
        onChangeMessage={setMessage}
        onFlipToFront={() => setFlipped(false)}
        cameraRef={camera}
        facing={facing}
        flashOn={flashOn}
        cameraEnabled={cameraEnabled}
        cardHeight={cardHeight}
        onCardHeight={setCardHeight}
      />

      <Envelope
        m={m}
        phase={phase}
        height={envHeight}
        slotText={slot.text}
        slotStar={slot.star}
        title={roll.name}
        open={infoOpen}
        onPressTitle={() => setInfoOpen((open) => !open)}
      />

      <Controls
        m={m}
        visible={controlsVisible}
        facing={facing}
        flashOn={flashOn}
        onRolls={() => setOverviewOpen(true)}
        onFlipCamera={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
        onToggleFlash={() => setFlashOn((on) => !on)}
      />

      <FlashOverlay ref={flash} envHeight={envHeight} />

      <RollInfoSheet m={m} roll={roll} visible={infoOpen} onClose={() => setInfoOpen(false)} />

      <DevelopScreen m={m} visible={developing} stamp={ENVELOPE_STAMP} />

      <DoneScreen m={m} visible={done} total={total} onAgain={loadNewRoll} />

      <RollsOverview
        m={m}
        visible={overviewOpen}
        onClose={() => setOverviewOpen(false)}
        onOpenRoll={(next) => {
          setOverviewOpen(false);
          after(ANIM.rollSwitchDelay, () => openRoll(next));
        }}
        onNewRoll={() => {
          setOverviewOpen(false);
          after(ANIM.rollSwitchDelay, () => openRoll(ROLLS[0]));
        }}
      />
    </View>
  );
}
