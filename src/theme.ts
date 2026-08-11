import { Platform, type ViewStyle } from 'react-native';

/**
 * Colours lifted 1:1 from the prototype (`prent-capture_4.html`).
 * The first block mirrors the CSS custom properties in `:root`.
 */
export const COLORS = {
  ink: '#0a0a0a',
  paper: '#ffffff',
  dim: '#8a8a8a',
  hint: '#b4b0a8',
  env: '#0a0a0a',
  stage: '#c9c6bf',

  // envelope
  envArmed: '#000000',
  flapLip: '#000000',
  flapInside: '#151515',
  titlePress: 'rgba(255,255,255,.08)',
  slot: 'rgba(255,255,255,.35)',
  slotArmed: 'rgba(255,255,255,.9)',

  // card
  frame: '#111111',
  vfCorner: 'rgba(255,255,255,.75)',
  vfDot: 'rgba(255,255,255,.5)',
  vfDotCore: 'rgba(255,255,255,.8)',
  recBg: 'rgba(0,0,0,.32)',
  recText: 'rgba(255,255,255,.9)',
  live: '#e0533b',
  hairline: '#f0efec',
  qrDash: '#d8d5cd',
  qrText: '#c3bfb6',
  msgLine: '#efece5',
  msgText: '#2a2a2a',
  msgPlaceholder: '#c7c3ba',

  // controls
  control: '#1a1a1a',
  controlBorder: '#ececec',
  ghostBg: '#f6f6f4',
  ghostText: '#555555',

  // develop + done
  envBody: '#111111',
  envFlapline: '#191919',
  seal: '#d8663f',
  envStamp: 'rgba(255,255,255,.5)',
  againBorder: '#dddddd',

  // roll info (dark sheet)
  sheet: '#111111',
  scrim: 'rgba(0,0,0,.35)',
  grab: 'rgba(255,255,255,.25)',
  sheetCount: 'rgba(255,255,255,.55)',
  sheetDesc: 'rgba(255,255,255,.72)',
  sheetLabel: 'rgba(255,255,255,.4)',
  slotFill: 'rgba(255,255,255,.06)',
  slotBorder: 'rgba(255,255,255,.1)',
  slotDot: 'rgba(255,255,255,.2)',
  slotNum: 'rgba(255,255,255,.6)',

  // overview
  rollBg: '#faf9f7',
  rollBorder: '#f0efec',
  rollMeta: '#9a978f',
  progTrack: '#eae8e3',
  rollArrow: '#c3c0b8',
  closeBorder: '#eeeeee',
  newDash: '#d8d5cd',
  newText: '#8a877f',
  spine: 'rgba(0,0,0,.13)',
  printBehind: '#f2f0ec',
} as const;

/**
 * The prototype's three families. It links more weights than it uses — only the
 * regular cuts are ever applied — so only those are bundled here.
 */
export const FONTS = {
  mono: 'SpaceMono_400Regular',
  sans: 'Inter_400Regular',
  hand: 'Caveat_400Regular',
} as const;

/**
 * `box-shadow: 0 {offsetY}px {blur}px rgba(0,0,0,{opacity})` → RN shadow props.
 * CSS blur radius is roughly twice the platform shadow radius, hence `blur / 2`.
 * React Native cannot stack multiple shadows on one view, so where the prototype
 * layers two, callers pass the dominant one with a slightly higher opacity.
 */
export function shadow(offsetY: number, blur: number, opacity: number): ViewStyle {
  return Platform.select<ViewStyle>({
    android: { elevation: Math.round(blur / 2), shadowColor: '#000000' },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: offsetY },
      shadowRadius: blur / 2,
      shadowOpacity: opacity,
    },
  }) as ViewStyle;
}
