import React, { useRef } from 'react';
import LottieView from 'lottie-react-native';

interface CrabLottieProps {
  size?: number;
  opacity?: number;
  style?: object;
}

export function CrabLottie({ size = 56, opacity = 0.4, style }: CrabLottieProps) {
  const ref = useRef<LottieView>(null);
  return (
    <LottieView
      ref={ref}
      source={require('@/assets/lottie/crab-float.json')}
      autoPlay
      loop
      style={[{ width: size, height: size, opacity }, style]}
      resizeMode="contain"
    />
  );
}
