import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoltar } from '@core/navegacao/useVoltar';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

interface Props {
  /** Contexto curto acima do título, em caixa normal (ex.: "Minha Saúde"). */
  sectionLabel?: string;
  title: string;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  /** `raiz` = tela inicial de uma aba: não tem para onde voltar, então não mostra o botão. */
  variante?: 'interna' | 'raiz';
}

export function InternalHeader({ sectionLabel, title, onBack, rightIcon, onRightPress, variante = 'interna' }: Props) {
  const voltarPadrao = useVoltar();
  const voltar = onBack ?? voltarPadrao;
  if (variante === 'raiz') {
    return (
      <View style={styles.container}>
        {rightIcon && onRightPress ? (
          <View style={[styles.topRow, { justifyContent: 'flex-end' }]}>
            <TouchableOpacity onPress={onRightPress} style={styles.btn} activeOpacity={0.7} accessibilityRole="button">
              <Ionicons name={rightIcon} size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={voltar} style={styles.btn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        </TouchableOpacity>
        {rightIcon && onRightPress ? (
          <TouchableOpacity onPress={onRightPress} style={styles.btn} activeOpacity={0.7} accessibilityRole="button">
            <Ionicons name={rightIcon} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {sectionLabel ? <Text style={styles.section}>{sectionLabel}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  topRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  btn:       { width: 36, height: 36, backgroundColor: Colors.surface, borderRadius: Radius.linha, alignItems: 'center', justifyContent: 'center' },
  section:   { ...Typography.caption, color: Colors.textSecondary },
  title:     { ...Typography.title, color: Colors.textPrimary },
});
