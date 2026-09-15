import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

const logo = require('../../../assets/images/nero/logo-nero.png');
const simbolo = require('../../../assets/images/nero/simbolo-nero.png');

interface Props {
  /** `completa` = símbolo + palavra "Nero" (só em fundo claro, a palavra é marinho); `simbolo` = só o N. */
  variante?: 'completa' | 'simbolo';
  width?: number;
  style?: StyleProp<ImageStyle>;
}

export function LogoNero({ variante = 'simbolo', width = 120, style }: Props) {
  const fonte = variante === 'completa' ? logo : simbolo;
  const proporcao = variante === 'completa' ? 711 / 754 : 410 / 488;
  return <Image source={fonte} style={[{ width, height: width * proporcao, resizeMode: 'contain' }, style]} accessibilityLabel="NERO" />;
}
