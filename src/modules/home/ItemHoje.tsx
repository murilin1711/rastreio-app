import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alerta, Colors, Radius, Spacing, Typography } from '@ui/theme';
import type { ItemHoje as Item } from './montarItensHoje';

interface Props {
  item: Item;
  onPress: () => void;
  /** Chamado quando o usuário toca na declaração negativa ("Não uso medicamentos"). */
  onAcaoSecundaria?: (item: Item) => void;
}

/** Linha de pendência: anel colorido (nível), título como tarefa, descrição e, se houver, uma saída rápida. */
export function ItemHoje({ item, onPress, onAcaoSecundaria }: Props) {
  const cor = Alerta[item.nivel];
  const concluido = item.nivel === 'verde';
  // A bolinha mostra o estado, não recebe toque (D-028): ela e a linha "Não uso medicamentos"
  // faziam exatamente a mesma coisa, e duas portas para a mesma ação confundem mais do que ajudam.
  return (
    <View style={styles.caixa}>
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
      {item.acaoSecundaria && onAcaoSecundaria ? (
        <Pressable onPress={() => onAcaoSecundaria(item)} style={({ pressed }) => [styles.secundaria, pressed && { opacity: 0.6 }]} accessibilityRole="button" hitSlop={6}>
          <Text style={styles.secundariaTexto}>{item.acaoSecundaria.rotulo}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { backgroundColor: Colors.surface, borderRadius: Radius.linha, borderWidth: 1, borderColor: Colors.border },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, paddingRight: Spacing.sm },
  anel: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  descricao: { ...Typography.caption, color: Colors.textSecondary },
  secundaria: { borderTopWidth: 1, borderTopColor: Colors.border, paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md, marginLeft: 22 + Spacing.md },
  secundariaTexto: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', color: Colors.accent },
});
