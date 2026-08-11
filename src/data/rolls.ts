/** Roll formats, one per Prent end product. Transcribed from the prototype's `ROLLS`. */
export type RollFormat = 'prints' | 'photobook' | 'square' | 'poster' | 'strip';

export type Roll = {
  id: string;
  name: string;
  product: string;
  fmt: RollFormat;
  /** Viewfinder aspect ratio (width / height) — matches the physical end product. */
  vf: number;
  vfLand: number;
  desc: string;
  total: number;
  shot: number;
  cover: string;
  loc: string;
};

export const ROLLS: Roll[] = [
  {
    id: 'julia',
    name: "Julia's vakantie",
    product: 'Prints',
    fmt: 'prints',
    vf: 3 / 3.4,
    vfLand: 16 / 10,
    desc: 'Classic square-ish matte prints, one per frame, delivered in a wax-sealed envelope.',
    total: 5,
    shot: 0,
    cover: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&q=80',
    loc: 'Lisbon, PT',
  },
  {
    id: 'reunie',
    name: 'Familiereünie',
    product: 'Photobook',
    fmt: 'photobook',
    vf: 4 / 3,
    vfLand: 16 / 9,
    desc: 'A landscape hardcover photobook. Wider frames compose across the spread, printed as a bound keepsake.',
    total: 12,
    shot: 5,
    cover: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&q=80',
    loc: 'Utrecht, NL',
  },
  {
    id: 'studio',
    name: 'Studio sessies',
    product: 'Poster set',
    fmt: 'poster',
    vf: 3 / 4,
    vfLand: 16 / 10,
    desc: 'Tall portrait posters, printed large on heavy stock. Each frame becomes a wall piece.',
    total: 6,
    shot: 2,
    cover: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=300&q=80',
    loc: 'Amsterdam Noord, NL',
  },
  {
    id: 'brunch',
    name: 'Zondag brunch',
    product: 'Mini squares',
    fmt: 'square',
    vf: 1,
    vfLand: 1,
    desc: 'Instant-style square minis with a chunky white border, sized for a fridge or a wallet.',
    total: 9,
    shot: 7,
    cover: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=300&q=80',
    loc: 'De Pijp, Amsterdam',
  },
  {
    id: 'roadtrip',
    name: 'Roadtrip zuiden',
    product: 'Film strip',
    fmt: 'strip',
    vf: 2 / 2.4,
    vfLand: 21 / 9,
    desc: 'A perforated contact strip. Frames print in sequence on one continuous strip, like a real negative.',
    total: 8,
    shot: 3,
    cover: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&q=80',
    loc: 'Ardèche, FR',
  },
];

/** Stand-in viewfinder scenes for when the camera is unavailable or denied. */
export const FALLBACK_SHOTS = [
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80',
  'https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80',
];

/** Sample "captured" frames used to fill a roll's shot slots. */
const FRAME_POOL = [
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=70',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=70',
  'https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=200&q=70',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=70',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&q=70',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200&q=70',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=200&q=70',
  'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=200&q=70',
  'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200&q=70',
  'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=200&q=70',
  'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=200&q=70',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&q=70',
];

/** Deterministic filled frames for a roll, so it always looks the same. */
export function framesFor(roll: Roll): string[] {
  const out: string[] = [];
  for (let i = 0; i < roll.shot; i++) {
    out.push(FRAME_POOL[(roll.id.length + i * 3) % FRAME_POOL.length]);
  }
  return out;
}
