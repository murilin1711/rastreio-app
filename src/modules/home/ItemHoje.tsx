import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alerta, Colors, Spacing, Typography } from '@ui/theme';
import type { ItemHoje as Item } from './montarItensHoje';

/** Linha plana sobre a areia: o ponto colorido é o nível de alerta. */
export function ItemHoje({ item, onPress, ultimo }: { item: Item; onPress: () => void; ultimo?: boolean }) {
  const cor = Alerta[item.nivel];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linha, !ultimo && styles.divisor, pressed && { opacity: 0.7 }]} accessibilityRole="button">
      <View style={[styles.ponto, { backgroundColor: cor.fg }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.descricao}>{item.descricao}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  divisor: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  descricao: { ...Typography.caption, color: Colors.textSecondary },
});
