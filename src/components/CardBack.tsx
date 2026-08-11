import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Roll } from '../data/rolls';
import { todayStr } from '../lib/date';
import { ANIM, type Metrics } from '../metrics';
import { COLORS, FONTS } from '../theme';
import { FlipHint } from './icons';

/** The ruled note paper (`repeating-linear-gradient` in the prototype). */
function Rules({ m }: { m: Metrics }) {
  const { d } = m;
  const count = Math.ceil((d.card.msgMin + m.s(220)) / d.card.msgLineGap);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: d.card.msgLineFirst + i * d.card.msgLineGap,
            height: StyleSheet.hairlineWidth > 1 ? StyleSheet.hairlineWidth : 1,
            backgroundColor: COLORS.msgLine,
          }}
        />
      ))}
    </View>
  );
}

/** The back of the print: a handwritten message that gets printed with the photo. */
export function CardBack({
  m,
  roll,
  flipped,
  message,
  onChangeMessage,
  onFlipToFront,
}: {
  m: Metrics;
  roll: Roll;
  flipped: boolean;
  message: string;
  onChangeMessage: (text: string) => void;
  onFlipToFront: () => void;
}) {
  const { d } = m;
  const input = useRef<TextInput>(null);

  // The prototype focuses the note field shortly after the flip starts.
  useEffect(() => {
    if (!flipped) return;
    const t = setTimeout(() => input.current?.focus(), ANIM.flipFocusDelay);
    return () => clearTimeout(t);
  }, [flipped]);

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: d.card.backHeadBottom,
        }}>
        <Text
          style={{
            fontFamily: FONTS.mono,
            fontSize: d.card.backHeadFont,
            letterSpacing: d.card.backHeadSpacing,
            textTransform: 'uppercase',
            color: COLORS.hint,
          }}>
          Message on the back
        </Text>
        <View
          style={{
            width: d.card.qr,
            height: d.card.qr,
            borderRadius: d.card.qrRadius,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: COLORS.qrDash,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            style={{
              fontSize: d.card.qrFont,
              letterSpacing: d.card.qrSpacing,
              color: COLORS.qrText,
              fontFamily: FONTS.sans,
            }}>
            QR
          </Text>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          borderRadius: d.card.msgRadius,
          paddingVertical: d.card.msgPadV,
          paddingHorizontal: d.card.msgPadH,
          overflow: 'hidden',
        }}>
        <Rules m={m} />
        <TextInput
          ref={input}
          value={message}
          onChangeText={onChangeMessage}
          multiline
          maxLength={180}
          scrollEnabled={false}
          placeholder="Write a note that prints on the back of this photo…"
          placeholderTextColor={COLORS.msgPlaceholder}
          underlineColorAndroid="transparent"
          textAlignVertical="top"
          style={{
            flex: 1,
            minHeight: d.card.msgMin,
            padding: 0,
            // No-op on native; suppresses the browser focus ring in the web build.
            outlineWidth: 0,
            fontFamily: FONTS.hand,
            fontSize: d.card.msgFont,
            lineHeight: d.card.msgLine,
            letterSpacing: d.card.msgSpacing,
            color: COLORS.msgText,
          }}
        />
      </View>

      <Text
        style={{
          marginTop: d.card.footTop,
          fontFamily: FONTS.mono,
          fontSize: d.card.footFont,
          letterSpacing: d.card.footSpacing,
          color: COLORS.hint,
        }}>
        {roll.name} · {todayStr()}
      </Text>

      <Pressable
        onPress={onFlipToFront}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: d.card.hintGap,
          marginTop: d.card.hintTop,
          paddingTop: d.card.hintPadTop,
          borderTopWidth: 1,
          borderTopColor: COLORS.hairline,
          opacity: pressed ? 0.75 : 1,
        })}>
        <FlipHint size={d.card.hintIcon} color={COLORS.hint} opacity={0.7} />
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: d.card.hintFont,
            letterSpacing: d.card.hintSpacing,
            color: COLORS.hint,
          }}>
          Tap to flip to the photo
        </Text>
      </Pressable>
    </>
  );
}
