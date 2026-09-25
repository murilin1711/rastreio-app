import React, { useRef } from 'react';
import { Animated, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

interface Props extends TextInputProps {
  icon?: React.ReactNode;
}

/**
 * Campo de texto (D-035). A borda acende quando o campo recebe o foco.
 *
 * A transição existe por um motivo concreto: ao passar de um campo para o outro, **duas** bordas
 * mudavam de cor no mesmo frame — uma apagava, a outra acendia — e o Murilo leu isso como um piscar
 * de tela. Com 160 ms de travessia, o olho segue o foco de um campo ao outro em vez de levar um
 * susto. É a única mudança: a espessura continua fixa em 1,5, então nada se move ao redor.
 *
 * `useNativeDriver: false` é obrigatório aqui — cor não é uma propriedade que a thread nativa
 * interpola sozinha, ao contrário de opacidade e transform.
 */
const MS_FOCO = 160;

export function Input({ icon, style, onFocus, onBlur, ...rest }: Props) {
  const foco = useRef(new Animated.Value(0)).current;

  const acender = (para: number) =>
    Animated.timing(foco, { toValue: para, duration: MS_FOCO, useNativeDriver: false }).start();

  const borderColor = foco.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  return (
    <Animated.View style={[styles.container, style as object, { borderColor }]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <TextInput
        style={styles.input}
        placeholderTextColor={Colors.textMuted}
        onFocus={(e) => { acender(1); onFocus?.(e); }}
        onBlur={(e) => { acender(0); onBlur?.(e); }}
        {...rest}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', minHeight: 50, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.linha, paddingHorizontal: Spacing.lg, backgroundColor: Colors.surface },
  icon:      { marginRight: Spacing.sm },
  input:     { flex: 1, ...Typography.body, color: Colors.textPrimary, paddingVertical: Spacing.md },
});
