import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, EmBreveBadge, NeroImage, Radius, Shadows, Spacing, Typography, type NeroVariant } from '@ui/index';

interface Props {
  titulo: string;
  descricao: string;
  variant: NeroVariant;
  /** Cor de identidade do módulo — aparece como faixa lateral fina. */
  cor: string;
  emBreve?: boolean;
  onPress?: () => void;
}

/** Bloco de módulo na Home: raio grande, faixa de cor à esquerda, Nero do módulo à direita. */
export function CardModulo({ titulo, descricao, variant, cor, emBreve, onPress }: Props) {
  return (
    <Pressable
      onPress={emBreve ? undefined : onPress}
      disabled={emBreve}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!emBreve }}
      style={({ pressed }) => [styles.card, pressed && !emBreve && styles.pressionado, emBreve && styles.emBreve]}
    >
      <View style={[styles.faixa, { backgroundColor: cor }]} />
      <View style={styles.texto}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.descricao}>{descricao}</Text>
        {emBreve ? <View style={{ marginTop: Spacing.sm }}><EmBreveBadge /></View> : null}
      </View>
      {emBreve ? (
        <View style={styles.neroApagado}><NeroImage variant={variant} size={64} /></View>
      ) : (
        <>
          <NeroImage variant={variant} size={64} />
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.bloco, paddingVertical: Spacing.lg, paddingRight: Spacing.lg, paddingLeft: 0, overflow: 'hidden', ...Shadows.card },
  pressionado: { opacity: 0.85 },
  emBreve: { backgroundColor: Colors.surfaceAlt, shadowOpacity: 0, elevation: 0 },
  faixa: { width: 5, alignSelf: 'stretch', borderTopRightRadius: 3, borderBottomRightRadius: 3, marginRight: Spacing.sm },
  texto: { flex: 1, gap: 2 },
  titulo: { ...Typography.heading, color: Colors.textPrimary },
  descricao: { ...Typography.caption, color: Colors.textSecondary },
  neroApagado: { opacity: 0.35 },
});
