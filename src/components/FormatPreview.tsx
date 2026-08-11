import { Image, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { RollFormat } from '../data/rolls';
import type { Metrics } from '../metrics';
import { COLORS, shadow } from '../theme';

/**
 * A miniature of the physical end product, so a roll's shape tells you what it prints as.
 *
 * Two variants, matching the prototype's two sets of rules: `.fmt` on the light overview
 * rows and the slightly larger `.ri-fmt` on the dark roll-info sheet.
 */
type Shape = {
  w: number;
  h: number;
  padTop: number;
  padH: number;
  padBottom: number;
  radius: number | [number, number, number, number];
  img: number | 'fill';
  imgRadius: number;
  behind?: { w: number; h: number; top: number; left: number; color: string };
  spine?: number;
  strip?: { img: number; gap: number; count: number };
};

const LIGHT: Record<RollFormat, Shape> = {
  prints: {
    w: 72,
    h: 88,
    padTop: 5,
    padH: 5,
    padBottom: 16,
    radius: 4,
    img: 63,
    imgRadius: 2,
    behind: { w: 70, h: 86, top: 6, left: 8, color: COLORS.paper },
  },
  photobook: {
    w: 96,
    h: 74,
    padTop: 0,
    padH: 0,
    padBottom: 0,
    radius: [3, 5, 5, 3],
    img: 'fill',
    imgRadius: 0,
    spine: 7,
  },
  square: { w: 80, h: 80, padTop: 5, padH: 5, padBottom: 16, radius: 4, img: 54, imgRadius: 2 },
  poster: { w: 64, h: 92, padTop: 4, padH: 4, padBottom: 4, radius: 4, img: 'fill', imgRadius: 1 },
  strip: {
    w: 44,
    h: 100,
    padTop: 4,
    padH: 4,
    padBottom: 4,
    radius: 4,
    img: 22,
    imgRadius: 1,
    strip: { img: 22, gap: 3, count: 3 },
  },
};

const DARK: Record<RollFormat, Shape> = {
  ...LIGHT,
  prints: {
    ...LIGHT.prints,
    w: 74,
    h: 90,
    img: 65,
    behind: { w: 72, h: 88, top: 6, left: 9, color: COLORS.printBehind },
  },
  square: { ...LIGHT.square, w: 82, h: 82, img: 56 },
};

export function FormatPreview({
  m,
  fmt,
  cover,
  variant,
}: {
  m: Metrics;
  fmt: RollFormat;
  cover: string;
  variant: 'light' | 'dark';
}) {
  const raw = variant === 'dark' ? DARK[fmt] : LIGHT[fmt];
  const s = (n: number) => m.s(n);
  const radius = Array.isArray(raw.radius)
    ? {
        borderTopLeftRadius: s(raw.radius[0]),
        borderTopRightRadius: s(raw.radius[1]),
        borderBottomRightRadius: s(raw.radius[2]),
        borderBottomLeftRadius: s(raw.radius[3]),
      }
    : { borderRadius: s(raw.radius) };

  const imgWidth = s(raw.w) - s(raw.padH) * 2;
  const imgHeight =
    raw.img === 'fill' ? s(raw.h) - s(raw.padTop) - s(raw.padBottom) : s(raw.img);

  return (
    <View style={{ width: s(raw.w), height: s(raw.h) }}>
      {raw.behind ? (
        <View
          style={[
            {
              position: 'absolute',
              top: s(raw.behind.top),
              left: s(raw.behind.left),
              width: s(raw.behind.w),
              height: s(raw.behind.h),
              borderRadius: s(4),
              backgroundColor: raw.behind.color,
              transform: [{ rotate: '-6deg' }],
            },
            shadow(3, 8, 0.1),
          ]}
        />
      ) : null}

      <View
        style={[
          {
            width: s(raw.w),
            height: s(raw.h),
            paddingTop: s(raw.padTop),
            paddingHorizontal: s(raw.padH),
            paddingBottom: s(raw.padBottom),
            backgroundColor: COLORS.paper,
            overflow: 'hidden',
          },
          radius,
          variant === 'dark'
            ? shadow(6, 16, 0.4)
            : [shadow(4, 12, 0.14), { borderWidth: 1, borderColor: 'rgba(0,0,0,.05)' }],
        ]}>
        {raw.strip ? (
          Array.from({ length: raw.strip.count }, (_, i) => (
            <Image
              key={i}
              source={{ uri: cover }}
              resizeMode="cover"
              style={{
                width: imgWidth,
                height: s(raw.strip!.img),
                borderRadius: s(raw.imgRadius),
                marginTop: i === 0 ? 0 : s(raw.strip!.gap),
              }}
            />
          ))
        ) : (
          <Image
            source={{ uri: cover }}
            resizeMode="cover"
            style={{
              width: imgWidth,
              height: imgHeight,
              borderRadius: s(raw.imgRadius),
            }}
          />
        )}

        {raw.spine ? (
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: s(raw.spine) }}>
            <Svg width={s(raw.spine)} height={s(raw.h)}>
              <Defs>
                <LinearGradient id="spine" x1="0" y1="0" x2="1" y2="0">
                  <Stop
                    offset="0"
                    stopColor="#000000"
                    stopOpacity={variant === 'dark' ? 0.2 : 0.13}
                  />
                  <Stop offset="1" stopColor="#000000" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width={s(raw.spine)} height={s(raw.h)} fill="url(#spine)" />
            </Svg>
          </View>
        ) : null}
      </View>
    </View>
  );
}
