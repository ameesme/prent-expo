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
  const lastSeed = useRef(0);

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
  /** A real camera frame for the cards behind the top one. */
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  // Drag / fling transform of the top card, plus the envelope height the flash starts at.
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rot = useSharedValue(0);
  const opacity = useSharedValue(1);
  const envHeight = useSharedValue(m.env.idle);
  const busy = useSharedValue(0);
  const lastPhase = useSharedValue(0);
  // Mirrors `flipped` for the gesture worklets, so their config never depends on state.
  const flippedSV = useSharedValue(false);

  useEffect(() => {
    flippedSV.value = flipped;
  }, [flipped, flippedSV]);

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
      // The cards behind the top one show the frame that was just shot.
      setPreviewUri(photo.uri);
      await saveToGallery(photo.uri);
    } catch (error) {
      console.warn('[prent] could not capture or save the photo', error);
    }
  }, [cameraPermission]);

  /**
   * The cards *behind* the top one cannot be live: expo-camera builds one
   * `AVCaptureSession` per `CameraView` and offers no way to share it, and iOS will not run
   * two sessions against the same camera. They show a real frame instead, refreshed as the
   * finger lands — so by the time a drag reveals the card underneath, the frame is only
   * ~150ms old and reads as live. One grab at camera-ready seeds it so it is never empty.
   */
  const seedPreview = useCallback(async () => {
    if (!camera.current || busy.value) return;
    const now = Date.now();
    if (now - lastSeed.current < ANIM.seedThrottle) return;
    lastSeed.current = now;
    try {
      const frame = await camera.current.takePictureAsync({
        quality: 0.2,
        shutterSound: false,
        skipProcessing: true,
      });
      if (frame?.uri) setPreviewUri(frame.uri);
    } catch {
      // Only a nicety — the roll cover stands in when this fails.
    }
  }, [busy]);

  const handleCameraReady = useCallback(() => {
    // Let exposure settle before grabbing, so the still is not a black first frame.
    after(ANIM.seedDelay, () => void seedPreview());
  }, [after, seedPreview]);

  // A still from the old lens would be misleading after flipping the camera.
  useEffect(() => {
    setPreviewUri(null);
  }, [facing]);

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

  // The gesture object must not be rebuilt while a gesture is in flight: handing
  // GestureDetector a new gesture mid-touch is a crash vector on native. So the worklets
  // reach their JS callbacks through a ref that is refreshed every render, and the enabled
  // state lives in a shared value instead of a prop — which keeps the identities below
  // stable and the `useMemo` deps down to the design scale.
  const handlers = useRef({ applyPhase, capture, resetDrag, flipToBack, seedPreview });
  handlers.current = { applyPhase, capture, resetDrag, flipToBack, seedPreview };

  const onPhase = useCallback((next: number) => handlers.current.applyPhase(next), []);
  const onCapture = useCallback((dx: number) => handlers.current.capture(dx), []);
  const onReset = useCallback(() => handlers.current.resetDrag(), []);
  const onFlip = useCallback(() => handlers.current.flipToBack(), []);
  const onTouch = useCallback(() => void handlers.current.seedPreview(), []);

  // Thresholds are design pixels in the prototype, so they scale with the canvas.
  const S = m.S;
  const gesture = useMemo(() => {
    // Failing on touch-down is how a *stable* gesture gets switched off: the touch then
    // passes through to the note field and the flip-back control on the card's back.
    // A live touch also refreshes the still on the cards underneath, so the frame the drag
    // reveals is current. Both raced gestures report the touch; `seedPreview` throttles.
    const guard = (manager: { fail: () => void }) => {
      'worklet';
      if (flippedSV.value || busy.value) {
        manager.fail();
        return;
      }
      runOnJS(onTouch)();
    };

    // `minDistance` is the prototype's 5px slop: below it the drag never starts, which
    // is exactly when a touch should count as a tap instead.
    const pan = Gesture.Pan()
      .minDistance(ANIM.moveSlop * S)
      .onTouchesDown((_event, manager) => {
        'worklet';
        guard(manager);
      })
      .onUpdate((event) => {
        'worklet';
        if (busy.value || flippedSV.value) return;
        const dx = event.translationX;
        const dy = event.translationY;

        x.value = dx;
        y.value = dy;
        rot.value = dx * RATIO.dragRotate;

        const next = dy < ANIM.capture * S ? 3 : dy < ANIM.near * S ? 2 : 1;
        if (next !== lastPhase.value) {
          lastPhase.value = next;
          runOnJS(onPhase)(next);
        }
      })
      .onEnd((event) => {
        'worklet';
        if (busy.value || flippedSV.value) return;
        const flicked =
          event.velocityY < ANIM.flickVelocity * 1000 * S &&
          event.translationY < ANIM.flickDistance * S;
        if (event.translationY < ANIM.capture * S || flicked) {
          runOnJS(onCapture)(event.translationX);
        } else {
          runOnJS(onReset)();
        }
      });

    // A tap flips the card to its back, as in the prototype's "no move" pointerup.
    const tap = Gesture.Tap()
      .maxDistance(ANIM.moveSlop * 2 * S)
      .onTouchesDown((_event, manager) => {
        'worklet';
        guard(manager);
      })
      .onEnd((_event, success) => {
        'worklet';
        if (success && !busy.value && !flippedSV.value) runOnJS(onFlip)();
      });

    return Gesture.Race(pan, tap);
  }, [S, busy, flippedSV, lastPhase, onCapture, onFlip, onPhase, onReset, onTouch, rot, x, y]);

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
        previewUri={previewUri}
        onCameraReady={handleCameraReady}
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
