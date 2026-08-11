# Prent — swipe to capture

An Expo app port of `prent-capture_4.html`: a camera where you **swipe the photo card up into
an envelope** to capture it. Runs in **Expo Go**, uses the real device camera, and saves every
captured frame to the photo library.

The HTML prototype is kept in the repo as the design reference. The port is pixel-exact against
it — see [Fidelity](#fidelity).

## Run it

```bash
npm install
npx expo start          # scan the QR code with Expo Go
```

Expo SDK 57 (React Native 0.86). Every native dependency is pinned to the version Expo Go 57
ships, so no development build is needed.

> If `npx expo install` is ever used to add packages, note that it resolves versions through
> `api.expo.dev`. Where that host is unreachable, take versions from
> `node_modules/expo/bundledNativeModules.json` instead and install them with plain `npm install`.

## iOS preview build

`eas.json` is committed, so an installable iOS build is one command. **EAS Build does not need a
Mac** — Expo runs the macOS workers, so these work from any OS.

| Route | Apple Developer account | Mac | Result |
| --- | --- | --- | --- |
| Expo Go | no | no | runs now, real camera + gallery |
| `preview:simulator` | **no** | yes, for the Simulator | `.tar.gz` app to drop on an iOS Simulator |
| `preview` | yes, paid | no | ad-hoc install link/QR for registered iPhones |
| `production` + `eas submit` | yes, paid | no | TestFlight, for wider testers |

```bash
# fastest — no build, no account, real camera and gallery
npx expo start                                       # scan the QR with Expo Go

# a real native build with no Apple account (opens in the iOS Simulator)
npx eas-cli login
npx eas-cli init                                     # once: writes extra.eas.projectId to app.json
npx eas-cli build -p ios --profile preview:simulator

# installable on real iPhones (needs a paid Apple Developer account)
npx eas-cli device:create                            # once: register the test devices
npx eas-cli build -p ios --profile preview
```

Run `eas-cli init` (or one interactive build) before anything else: it creates the EAS project and
writes `extra.eas.projectId` into `app.json`, which needs committing. Signing credentials for the
device profiles are also created by the first interactive run and then reused.

Nothing else needs configuring — `app.json` already carries `ios.bundleIdentifier`
(`me.amees.prent`) and the camera / photo-library permission strings that a native build needs
(Expo Go supplies its own).

### Building from CI

`.github/workflows/ios-preview.yml` queues the same build from GitHub Actions — run it from the
Actions tab and pick a profile (defaults to `preview:simulator`, the one that needs no Apple
account). It requires an **`EXPO_TOKEN`** repository secret, from
<https://expo.dev/settings/access-tokens>. The workflow checks both that secret and the project id
before it starts, so a missing one fails immediately with an explanation instead of hanging on a
prompt. It is manual-dispatch only, since every run spends an EAS build credit.

> These commands were authored but could not be executed end to end from the sandbox this project
> was built in: `api.expo.dev` is unreachable there, and iOS builds need macOS regardless.
> `eas.json` itself is schema-validated against `@expo/eas-json`, and the workflow's profile names
> are cross-checked against it.

## What it does

| Screen | How to get there |
| --- | --- |
| Capture — card deck with a live viewfinder | default |
| Card back — a handwritten note that prints with the photo | tap the top card |
| Roll info — drops out of the envelope | tap the roll title |
| Rolls overview — slides in from the left | left control button |
| Sealed & developing — the envelope drops in | capture the last frame |
| Roll finished | ~3.4s later |

Swipe the top card up: past 52px (or a quick flick past 22px) the envelope opens its flap, the
label turns to *release to capture*, and letting go flings the card through the mouth — flash,
haptic tap, and the photo lands in your gallery. Each roll's viewfinder takes the aspect ratio of
the product it prints as (prints, photobook, poster set, mini squares, film strip), so switching
rolls in the overview reshapes the frame.

## Fidelity

The prototype is authored with absolute pixel values against a fixed canvas, so the port keeps
that canvas and scales it:

```
portrait   S = width / 366        landscape  S = width / 844
```

Every CSS length is written as `n * S` in `src/metrics.ts`, which holds both design tables
(portrait, plus what the `body.landscape` rules override) transcribed from the CSS verbatim.

**Why 366×820 and not 390×844.** The mockup's `.phone` is 390×844 *including* a 12px bezel, so
the `.screen` the UI actually lives in measures 366×820 — measured, not assumed. Scaling by 366
is what preserves the proportions the design shows: the card fills 90% of the screen width, not
85%. Landscape keeps the 844×390 box the landscape CSS states explicitly for `.screen-inner`
(that box is the phone's outer size, so the mockup clips 12px off each edge in landscape; on a
real display nothing is clipped).

Vertical anchoring is exact at the design canvas and correct on real hardware:

- the envelope bar absorbs whatever the top inset needs beyond the 40px the design already
  reserved for the mockup's fake notch, which is gone — the real notch sits in the same black bar;
- the controls are bottom-anchored at `max(20*S, insets.bottom + 12*S)`, which is `top: 748` at
  the design size and above the home indicator everywhere else;
- the card is centred in the band between the bar and the controls, reproducing the prototype's
  `top: 210 / height: 520` deck exactly at the design size.

### How it was verified

Both the prototype and the app were rendered in Chromium at 366×820 and measured element by
element (the prototype's webfonts served locally, since text metrics move layout):

```
element    field   expected     actual      delta
envelope   h       150.0      150.0 +0.0
card       y       235.9      235.9 +0.0
card       h       468.2      468.2 +0.0
frame      h       333.2      333.2 +0.0
controls   y       748.0      748.0 +0.0
cbtn       x        83.0       83.0 +0.0
```

**0.0px on every measured element**, and the roll-info sheet lands at exactly 414px tall like the
prototype's. Each screen was also driven and screenshotted in both, then diffed side by side.
Beyond that: `npx tsc --noEmit` is clean and `npx expo export` bundles for iOS and Android.

## Layout of the code

```
App.tsx                     fonts, orientation unlock, providers
src/theme.ts                colours from the CSS `:root`, fonts, shadow helper
src/metrics.ts              design tables + useMetrics(): scale, insets, anchors
src/data/rolls.ts           the five rolls, frame pool, fallback scenes
src/lib/gallery.ts          save a capture to the photo library
src/screens/CaptureScreen.tsx   state machine, gesture, capture pipeline
src/components/             Envelope, Flap, CardDeck, Card, Viewfinder, CardBack,
                            Controls, FlashOverlay, DevelopScreen, DoneScreen,
                            RollsOverview, RollInfoSheet, FormatPreview, icons
```

Notable implementation choices:

- **The deck keeps three stable layers** and rotates the data through them, where the prototype
  rebuilt its DOM after every capture. The top card — and with it the live `CameraView` — is
  never unmounted, so the preview never blinks mid-roll.
- **The drag runs on the UI thread** (Reanimated shared values); only threshold crossings cross
  to JS, to swap the envelope's label. A `Tap` gesture is raced against the `Pan` so a touch that
  never travels 5px flips the card instead of dragging it.
- **The 3D flip** gives each face its own rotation (front 0→180°, back 180→360°, both
  `backfaceVisibility: 'hidden'`), because React Native has no `transform-style: preserve-3d`.
- **The `✦` mark is drawn as SVG.** Neither Space Mono nor Roboto carries U+2726, so a text glyph
  would fall back inconsistently — or render as a tofu box on Android.
- **Fonts are deep-imported** (`@expo-google-fonts/inter/400Regular`); the package roots
  re-export every weight and italic, which drags ~5MB of unused TTFs into the bundle.

## Deviations from the prototype

1. The phone mockup chrome is gone — device frame, fake notch, side buttons — replaced by
   safe-area insets.
2. The "Landscape" button is gone; real device rotation drives the landscape reflow
   (`orientation: "default"` plus `ScreenOrientation.unlockAsync()`).
3. **Photos are really taken and saved** to the gallery. The camera permission is requested at
   launch; add-only photo access is requested at the first capture, so the app never asks to
   *read* your library. Flash and the front/back toggle drive the real camera.
4. When the camera is unavailable or denied, the frame shows the prototype's stock scenes — the
   array it declares but never wires up, leaving the frame black.
5. While the card is flipped, the deck lifts to keep the note field above the keyboard.
6. The finished-roll copy uses the roll's own frame count; the prototype hardcodes "5 moments".
7. The sealed envelope is stamped `PRENT`. The prototype's markup stamps the brand there, while
   its `openRoll()` overwrites it with the product name — the brand reads as the intended
   postmark, and it is what the prototype shows on load.
8. Remote Unsplash covers are kept as-is, so the roll art needs a network connection, exactly
   like the prototype.

Two of the prototype's own quirks were kept deliberately, having confirmed they render the same
way in the original: the frame counter **counts down** (`5/5`, `4/5`, … — a film counter showing
frames left), and in landscape the card tucks under the envelope bar while the roll title
overlaps the *pull a card up* label.

## Platform notes

- `react-dom` / `react-native-web` are dev dependencies only, for the browser-based visual
  verification above. The app targets iOS and Android.
- `expo-media-library` is imported lazily and only on native: its SDK 57 API is backed by a
  native module with no web implementation, which throws on import and takes the web bundle down.
