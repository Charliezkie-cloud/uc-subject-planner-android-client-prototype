import { Platform, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

type AnimatedPressableProps = React.ComponentPropsWithoutRef<typeof Pressable> &
  Partial<Pick<
    React.ComponentPropsWithoutRef<typeof Animated.View>,
    'entering' | 'exiting' | 'layout'
  >>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable) as unknown as React.ComponentType<AnimatedPressableProps>;

type NativeOnlyAnimatedViewProps =
  | (React.ComponentPropsWithoutRef<typeof Animated.View> & { as?: 'View' })
  | (AnimatedPressableProps & { as: 'Pressable' });

function NativeOnlyAnimatedView(
  props: NativeOnlyAnimatedViewProps
) {
  if (Platform.OS === 'web') {
    return <>{props.children as React.ReactNode}</>;
  }

  if (props.as === 'Pressable') {
    const { as: _, ...pressableProps } = props;
    return <AnimatedPressable {...pressableProps} />;
  }

  const { as: _, ...viewProps } = props;
  return <Animated.View {...viewProps} />;
}

export { NativeOnlyAnimatedView };
