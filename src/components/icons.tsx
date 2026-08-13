import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Every inline SVG from the prototype, kept at its original 24x24 viewBox,
 * stroke widths and path data.
 */
export type IconProps = {
  size: number;
  color: string;
  opacity?: number;
};

const STROKE = {
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function ChevronDown({ size, color, opacity }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
      <Path {...STROKE} stroke={color} strokeWidth={2.2} d="M6 9l6 6 6-6" />
    </Svg>
  );
}

export function ChevronRight({ size, color, opacity }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
      <Path {...STROKE} stroke={color} strokeWidth={2} d="M9 18l6-6-6-6" />
    </Svg>
  );
}

export function Pin({ size, color, opacity }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
      <Path
        {...STROKE}
        stroke={color}
        strokeWidth={1.8}
        d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"
      />
      <Circle {...STROKE} stroke={color} strokeWidth={1.8} cx={12} cy={10} r={2.6} />
    </Svg>
  );
}

export function Calendar({ size, color, opacity }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
      <Rect {...STROKE} stroke={color} strokeWidth={1.8} x={3} y={5} width={18} height={16} rx={2} />
      <Path {...STROKE} stroke={color} strokeWidth={1.8} d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

export function Rolls({ size, color, opacity }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
      <Rect {...STROKE} stroke={color} strokeWidth={1.8} x={3} y={4} width={14} height={17} rx={2} />
      <Path
        {...STROKE}
        stroke={color}
        strokeWidth={1.8}
        d="M17 7h3a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2h-9"
      />
    </Svg>
  );
}

export function FlipCamera({ size, color, opacity }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
      <Path {...STROKE} stroke={color} strokeWidth={1.8} d="M12 5c3.9 0 7 3.1 7 7" />
      <Path {...STROKE} stroke={color} strokeWidth={1.8} d="M12 19c-3.9 0-7-3.1-7-7" />
      <Path {...STROKE} stroke={color} strokeWidth={1.8} d="M19 3v4h-4" />
      <Path {...STROKE} stroke={color} strokeWidth={1.8} d="M5 21v-4h4" />
      <Circle {...STROKE} stroke={color} strokeWidth={1.8} cx={12} cy={12} r={2.4} />
    </Svg>
  );
}

export function Flash({ size, color, opacity }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
      <Path
        {...STROKE}
        stroke={color}
        strokeWidth={1.8}
        d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"
      />
    </Svg>
  );
}

/**
 * The `✦` mark used on the wax seal, the finished-roll badge and the "captured" label.
 * Drawn rather than typed: neither Space Mono nor Roboto carries U+2726, so a text
 * glyph would fall back inconsistently (or render as tofu on Android).
 */
export function Star({ size, color, opacity }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
      <Path
        fill={color}
        d="M12 1.4c.95 5.7 2 7.9 10.6 10.6C14 14.7 12.95 16.9 12 22.6c-.95-5.7-2-7.9-10.6-10.6C10 9.3 11.05 7.1 12 1.4z"
      />
    </Svg>
  );
}

export function Close({ size, color, opacity }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
      <Path {...STROKE} stroke={color} strokeWidth={2} d="M18 6 6 18M6 6l12 12" />
    </Svg>
  );
}

export function Plus({ size, color, opacity }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
      <Path {...STROKE} stroke={color} strokeWidth={2} d="M12 5v14M5 12h14" />
    </Svg>
  );
}
