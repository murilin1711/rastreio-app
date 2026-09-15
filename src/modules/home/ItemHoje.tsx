import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alerta, Colors, Radius, Spacing, Typography } from '@ui/theme';
import type { ItemHoje as Item } from './montarItensHoje';

/** Linha de pendência: anel colorido (nível), título como tarefa, descrição curta. */
export function ItemHoje({ item, onPress }: { item: Item; onPress: () => void }) {
  const cor = Alerta[item.nivel];
  const concluido = item.nivel === 'verde';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linha, pressed && { opacity: 0.7 }]} accessibilityRole="button">
      <View style={[styles.anel, { borderColor: cor.fg }, concluido && { backgroundColor: cor.fg }]}>
        {concluido ? <Ionicons name="checkmark" size={14} color={Colors.white} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.descricao}>{item.descricao}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.md, paddingRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  anel: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  descricao: { ...Typography.caption, color: Colors.textSecondary },
});
