import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

export type NeroVariant = 'base' | 'rastreando' | 'cardio' | 'bem_estar' | 'minha_saude';

// Até existirem as variantes por módulo, todas apontam para a imagem base.
const fontes: Record<NeroVariant, number> = {
  base:        require('../../../assets/images/nero/nero-base.png'),
  rastreando:  require('../../../assets/images/nero/nero-base.png'),
  cardio:      require('../../../assets/images/nero/nero-base.png'),
  bem_estar:   require('../../../assets/images/nero/nero-base.png'),
  minha_saude: require('../../../assets/images/nero/nero-base.png'),
};

interface Props { variant?: NeroVariant; size?: number; style?: StyleProp<ImageStyle>; }

export function NeroImage({ variant = 'base', size = 96, style }: Props) {
  return (
    <Image
      source={fontes[variant]}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
      accessibilityLabel="Nero, mascote do aplicativo"
    />
  );
}
