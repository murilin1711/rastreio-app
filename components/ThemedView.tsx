import { View, type ViewProps } from 'react-native';
import { Colors } from '@/constants/Theme';

export type ThemedViewProps = ViewProps & {
  variant?: 'background' | 'surface';
};

export function ThemedView({ style, variant = 'background', ...rest }: ThemedViewProps) {
  return (
    <View
      style={[
        { backgroundColor: variant === 'surface' ? Colors.surface : Colors.background },
        style,
      ]}
      {...rest}
    />
  );
}
