import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ANIM, type Metrics } from '../metrics';
import { COLORS, shadow } from '../theme';
import { Flash, FlipCamera, Rolls, type IconProps } from './icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** One circular camera control. `on` is the prototype's `.cbtn.on` inverted state. */
function CircleButton({
  m,
  icon: Icon,
  on,
  ghost,
  onPress,
}: {
  m: Metrics;
  icon: (props: IconProps) => React.ReactElement;
  on?: boolean;
  ghost?: boolean;
  onPress: () => void;
}) {
  const { d } = m;
  const press = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.1 }],
  }));

  return (
    <AnimatedPressable
      testID="cbtn"
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(1, { duration: ANIM.press });
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: ANIM.press });
      }}
      style={[
        {
          width: d.controls.size,
          height: d.controls.size,
          borderRadius: d.controls.size / 2,
          borderWidth: d.controls.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: on ? COLORS.control : ghost ? COLORS.ghostBg : COLORS.paper,
          borderColor: on ? COLORS.control : COLORS.controlBorder,
        },
        shadow(6, 16, 0.1),
        style,
      ]}>
      <Icon
        size={d.controls.icon}
        color={on ? COLORS.paper : ghost ? COLORS.ghostText : COLORS.control}
      />
    </AnimatedPressable>
  );
}

export function Controls({
  m,
  visible,
  facing,
  flashOn,
  onRolls,
  onFlipCamera,
  onToggleFlash,
}: {
  m: Metrics;
  visible: boolean;
  facing: 'back' | 'front';
  flashOn: boolean;
  onRolls: () => void;
  onFlipCamera: () => void;
  onToggleFlash: () => void;
}) {
  const { d } = m;
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 400 });
  }, [visible, opacity]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // Portrait: a centred row above the home indicator. Landscape: a column on the right edge.
  const columnHeight = d.controls.size * 3 + d.controls.gap * 2;
  const position = m.landscape
    ? {
        position: 'absolute' as const,
        top: (m.height - columnHeight) / 2,
        right: d.controls.right + m.insets.right,
        flexDirection: 'column' as const,
      }
    : {
        position: 'absolute' as const,
        top: m.controls.top,
        left: 0,
        right: 0,
        flexDirection: 'row' as const,
        justifyContent: 'center' as const,
      };

  return (
    <Animated.View
      testID="controls"
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[position, { alignItems: 'center', gap: d.controls.gap, zIndex: 6 }, fade]}>
      <CircleButton m={m} icon={Rolls} ghost onPress={onRolls} />
      <CircleButton m={m} icon={FlipCamera} on={facing === 'front'} onPress={onFlipCamera} />
      <CircleButton m={m} icon={Flash} on={flashOn} onPress={onToggleFlash} />
    </Animated.View>
  );
}
