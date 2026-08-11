import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

/**
 * The prototype (`prent-capture_4.html`) is authored with absolute pixel values against
 * a fixed canvas, and reflows through the `body.landscape` rules. Both design tables
 * below are transcribed from that CSS verbatim, in design pixels, then scaled by:
 *
 *   portrait  S = width / 366
 *   landscape S = width / 844
 *
 * so the layout is pixel-exact at the design size and proportional everywhere else.
 *
 * Why 366x820 and not 390x844: the mockup's `.phone` is 390x844 *including* a 12px
 * bezel, so the `.screen` the UI is actually laid out in measures 366x820 — verified by
 * measuring the rendered prototype. Scaling by 366 is what reproduces the proportions
 * the design shows (the card fills 90% of the screen width, not 85%).
 *
 * Landscape keeps the 844x390 box the landscape CSS states explicitly for
 * `.screen-inner`. That box is the phone's outer size, so the mockup clips 12px off each
 * edge in landscape; on a real display nothing is clipped.
 */
export const DESIGN = {
  portrait: { width: 366, height: 820 },
  landscape: { width: 844, height: 390 },
} as const;

/** Values that are NOT lengths and therefore never scaled. */
export const RATIO = {
  /** `.card` stack: `scale(1 - back * 0.04)` */
  stackScaleStep: 0.04,
  /** `rotate(dx * 0.03)` while dragging, `dx * 0.05` on the capture fling. */
  dragRotate: 0.03,
  captureRotate: 0.05,
  /** Envelope title opacity per drag phase. */
  titleIdle: 0.92,
  titleNear: 0.6,
  /** `--vf` fallback when a roll has no landscape ratio. */
  vfLandFallback: 16 / 9,
} as const;

/** Drag thresholds and animation timings, straight from the prototype's JS/CSS. */
export const ANIM = {
  /** `const CAPTURE = -52` */
  capture: -52,
  near: -18,
  moveSlop: 5,
  flickVelocity: -0.5, // px/ms
  flickDistance: -22,
  envHeight: 400, // height .4s cubic-bezier(.25,.6,.3,1)
  envBg: 250, // background .25s
  flap: 300, // height .3s cubic-bezier(.2,.9,.25,1)
  flapOpacity: 250,
  flip: 550, // .55s cubic-bezier(.3,.7,.25,1)
  flipFocusDelay: 320,
  reset: 350, // transform .35s cubic-bezier(.2,.9,.25,1)
  fling: 400, // transform .40s cubic-bezier(.4,0,.2,1)
  flapClose: 300,
  captureSettle: 440,
  flash: 320,
  flashStrong: 400,
  blink: 1400,
  envDrop: 1100,
  envDropDelay: 150,
  sealPop: 400,
  sealDelay: 1100,
  statusDelay: 1250,
  statusFade: 500,
  dots: 350, // 1.4s / 4 steps
  doneDelay: 3400,
  overview: 380, // .38s cubic-bezier(.3,.7,.3,1)
  sheet: 400, // .4s cubic-bezier(.25,.7,.3,1)
  scrim: 300,
  rollSwitchDelay: 120,
  press: 150,
} as const;

type Table = { [key: string]: number | Table };

/** The portrait design table — every length in `prent-capture_4.html`'s base CSS. */
const PORTRAIT = {
  env: {
    height: 150,
    dragging: 158,
    near: 170,
    armed: 184,
    radius: 30,
    padTop: 14,
    /** `padding-top:14` + the 26px fake notch the mockup drew inside the bar. */
    notchAllowance: 40,
    titleFont: 14,
    titleSpacing: 0.5,
    titleTop: 16,
    titlePadV: 6,
    titlePadH: 10,
    titleRadius: 20,
    titleGap: 6,
    chevron: 13,
    slotBottom: 12,
    slotFont: 10,
    slotSpacing: 2,
    flapWidth: 220,
    flapHeight: 60,
    flapDragging: 24,
    flapNear: 36,
    flapArmed: 54,
  },
  deck: {
    /** envelope bottom → deck top (`top:210` − `height:150`). */
    gapTop: 60,
    /** deck bottom → controls top (`748` − `210+520`). */
    gapBottom: 18,
    height: 520,
    rightGutter: 0,
    offsetY: 10,
  },
  card: {
    width: 330,
    radius: 24,
    padTop: 18,
    padH: 18,
    padBottom: 15,
    perspective: 1400,
    frameRadius: 14,
    corner: 20,
    cornerBorder: 2,
    cornerInset: 10,
    dot: 34,
    dotBorder: 1,
    dotCore: 3,
    recTop: 11,
    recGap: 5,
    recFont: 9,
    recSpacing: 1,
    recPadV: 3,
    recPadH: 9,
    recRadius: 20,
    recDot: 6,
    metaTop: 13,
    metaH: 4,
    metaBottom: 8,
    row1Gap: 12,
    rollFont: 15,
    rollSpacing: 0.2,
    countFont: 14,
    countSpacing: 1,
    mlineTop: 9,
    mlineGap: 16,
    mlineFont: 11.5,
    mlineIcon: 12,
    mitemGap: 6,
    hintTop: 11,
    hintPadTop: 10,
    hintFont: 11,
    hintSpacing: 0.3,
    hintGap: 6,
    hintIcon: 13,
    backHeadFont: 11,
    backHeadSpacing: 1,
    backHeadBottom: 12,
    qr: 30,
    qrRadius: 4,
    qrFont: 8,
    qrSpacing: 1,
    msgRadius: 14,
    msgPadV: 8,
    msgPadH: 4,
    /** `background-position:0 8px` + the 33px transparent run. */
    msgLineFirst: 41,
    msgLineGap: 34,
    msgMin: 130,
    msgFont: 22,
    msgLine: 34,
    msgSpacing: 0.3,
    footTop: 10,
    footFont: 10,
    footSpacing: 0.5,
  },
  controls: {
    /** `top:748` in an 820-tall screen, with the 52px buttons ending at 800. */
    bottom: 20,
    bottomPad: 12,
    gap: 22,
    size: 52,
    icon: 24,
    right: 20,
    border: 1,
  },
  develop: {
    gap: 34,
    envW: 260,
    envH: 172,
    envRadius: 10,
    flapH: 84,
    seal: 26,
    sealTop: 64,
    sealFont: 11,
    stampBottom: 16,
    stampRight: 18,
    stampFont: 10,
    stampSpacing: 3,
    statusFont: 13,
    statusSpacing: 2,
    drop: 140,
    overshoot: 8,
  },
  done: {
    gap: 20,
    pad: 40,
    seal: 74,
    sealFont: 22,
    h2Font: 19,
    h2Spacing: 0.5,
    pFont: 14,
    pLine: 21,
    pWidth: 230,
    againTop: 6,
    againFont: 13,
    againSpacing: 1,
    againPadV: 11,
    againPadH: 20,
    againRadius: 30,
  },
  sheet: {
    radius: 28,
    padH: 22,
    padBottom: 26,
    grabW: 38,
    grabH: 4,
    grabRadius: 3,
    grabBottom: 12,
    topGap: 16,
    topBottom: 16,
    fmtWrap: 96,
    nameFont: 18,
    nameSpacing: 0.2,
    productTop: 7,
    productFont: 11,
    productSpacing: 0.6,
    productPadV: 3,
    productPadH: 10,
    productRadius: 20,
    countTop: 9,
    countFont: 12,
    descFont: 13,
    descLine: 19.5,
    descBottom: 20,
    labelFont: 10,
    labelSpacing: 2,
    labelBottom: 11,
    slotGap: 8,
    slotRadius: 6,
    slotDot: 5,
    numFont: 8,
    numBottom: 3,
    numRight: 4,
  },
  overview: {
    headPadTop: 26,
    headPadH: 24,
    headPadBottom: 14,
    titleFont: 22,
    titleSpacing: 0.3,
    subFont: 12,
    subTop: 3,
    close: 34,
    closeIcon: 17,
    listPadTop: 8,
    listPadH: 20,
    listPadBottom: 30,
    listGap: 16,
    rowGap: 16,
    rowPad: 16,
    rowRadius: 20,
    nameFont: 16,
    nameSpacing: 0.2,
    productTop: 5,
    productFont: 11,
    productSpacing: 0.6,
    productPadV: 3,
    productPadH: 9,
    productRadius: 20,
    descFont: 12.5,
    descLine: 18.1,
    descTop: 8,
    metaTop: 9,
    metaGap: 12,
    metaFont: 11,
    progH: 4,
    progRadius: 3,
    progMax: 120,
    arrow: 20,
    newMarginTop: 2,
    newMarginH: 20,
    newMarginBottom: 30,
    newPad: 15,
    newRadius: 18,
    newBorder: 1.5,
    newFont: 13,
    newSpacing: 0.5,
    newGap: 8,
    newIcon: 16,
  },
};

/** Only what `body.landscape` overrides; everything else inherits the portrait table. */
const LANDSCAPE_OVERRIDES = {
  env: {
    height: 60,
    dragging: 66,
    near: 82,
    armed: 100,
    radius: 22,
    padTop: 7,
    /** `padding-top:7` + the 20px landscape fake notch. */
    notchAllowance: 27,
    titleTop: 3,
    titleFont: 12,
    slotBottom: 6,
    slotFont: 8,
  },
  deck: {
    /** `top:66` − `height:60` */
    gapTop: 6,
    height: 230,
    rightGutter: 96,
  },
  card: {
    width: 410,
    radius: 16,
    padTop: 11,
    padH: 13,
    padBottom: 9,
    frameRadius: 11,
    metaTop: 8,
    metaH: 4,
    metaBottom: 4,
    rollFont: 13,
    mlineTop: 5,
    mlineFont: 10.5,
    hintTop: 6,
    hintPadTop: 6,
    hintFont: 10,
    msgMin: 80,
    msgFont: 18,
    msgLine: 27,
  },
  controls: {
    gap: 14,
    size: 48,
    icon: 21,
  },
};

function merge<T extends Table>(base: T, overrides: Table): T {
  const out: Table = { ...base };
  for (const key of Object.keys(overrides)) {
    const next = overrides[key];
    const prev = out[key];
    out[key] =
      typeof next === 'number' || typeof prev === 'number'
        ? next
        : merge(prev as Table, next as Table);
  }
  return out as T;
}

function scaleDeep<T extends Table>(table: T, s: number): T {
  const out: Table = {};
  for (const key of Object.keys(table)) {
    const value = table[key];
    out[key] = typeof value === 'number' ? value * s : scaleDeep(value as Table, s);
  }
  return out as T;
}

const LANDSCAPE = merge(PORTRAIT, LANDSCAPE_OVERRIDES as Table);

export type DesignTable = typeof PORTRAIT;

export type Metrics = {
  /** Design-pixel → device-pixel scale. */
  S: number;
  landscape: boolean;
  width: number;
  height: number;
  insets: EdgeInsets;
  /** Scaled design table for the current orientation. */
  d: DesignTable;
  /** Envelope height per drag phase, safe-area corrected. */
  env: { idle: number; dragging: number; near: number; armed: number };
  /** Where envelope content starts (clears the notch / dynamic island). */
  envPadTop: number;
  controls: { bottom: number; top: number };
  deck: { centerY: number; boxHeight: number; left: number; right: number };
  /** Scale a raw design pixel value. */
  s: (n: number) => number;
};

export function useMetrics(): Metrics {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const landscape = width > height;
    const design = landscape ? DESIGN.landscape : DESIGN.portrait;
    const S = width / design.width;
    const d = scaleDeep(landscape ? LANDSCAPE : PORTRAIT, S) as DesignTable;

    // The mockup's fake notch is gone; the real inset takes its place. Anything the
    // inset needs beyond the space the design already reserved grows the black bar.
    const envPadTop = Math.max(insets.top, d.env.notchAllowance);
    const extra = envPadTop - d.env.notchAllowance;
    const env = {
      idle: d.env.height + extra,
      dragging: d.env.dragging + extra,
      near: d.env.near + extra,
      armed: d.env.armed + extra,
    };

    // Controls: `top:748` at the design size, above the home indicator elsewhere.
    const controlsBottom = Math.max(d.controls.bottom, insets.bottom + d.controls.bottomPad);
    const controlsTop = height - controlsBottom - d.controls.size;

    const deckTop = env.idle + d.deck.gapTop;
    const deckCenterY = landscape
      ? deckTop + d.deck.height / 2
      : (deckTop + (controlsTop - d.deck.gapBottom)) / 2;

    return {
      S,
      landscape,
      width,
      height,
      insets,
      d,
      env,
      envPadTop,
      controls: { bottom: controlsBottom, top: controlsTop },
      deck: {
        centerY: deckCenterY,
        // Top-anchored box of exactly twice the centre offset: its flex centre lands
        // on the design centre without needing to measure the card.
        boxHeight: deckCenterY * 2,
        left: insets.left,
        right: d.deck.rightGutter + insets.right,
      },
      s: (n: number) => n * S,
    };
  }, [width, height, insets]);
}
