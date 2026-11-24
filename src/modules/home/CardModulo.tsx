import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, EmBreveBadge, Radius, Shadows, Spacing, Typography } from '@ui/index';

interface Props {
  titulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  /** Duas cores do gradiente do bloco. */
  capa: [string, string];
  emBreve?: boolean;
  /** Uma linha abaixo do título dizendo o que tem dentro (cartões de "Meus cuidados"). */
  descricao?: string;
  /** Ocupa a linha inteira, com altura que cresce junto com a letra do sistema. */
  largo?: boolean;
  onPress?: () => void;
}

/**
 * Bloco de módulo: o card *é* a cor (D-022). Gradiente ocupando tudo, símbolo discreto no
 * canto e o nome embaixo — sem número, sem status. O módulo é o mapa da home, não o painel;
 * quem diz o que fazer são as ações e o "Para fazer hoje" acima. Em "Meus cuidados" (D-065) o
 * cartão é largo e ganha uma linha de descrição, para quem não reconhece o módulo pelo nome.
 */
export function CardModulo({ titulo, icone, capa, emBreve, descricao, largo, onPress }: Props) {
  return (
    <Pressable
      onPress={emBreve ? undefined : onPress}
      disabled={emBreve}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={descricao}
      accessibilityState={{ disabled: !!emBreve }}
      style={({ pressed }) => [styles.card, largo ? styles.largo : styles.normal, pressed && !emBreve && styles.pressionado]}
    >
      <LinearGradient
        colors={capa}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[largo ? styles.blocoLargo : styles.bloco, emBreve && { opacity: 0.45 }]}
      >
        {/* Brilho no canto: dá volume ao bloco sem acrescentar informação. */}
        <View style={styles.brilho} />
        <Ionicons name={icone} size={25} color="rgba(255,255,255,0.92)" />
        <View>
          <Text style={[styles.titulo, largo && styles.tituloLargo]} numberOfLines={largo ? undefined : 2}>{titulo}</Text>
          {descricao ? <Text style={styles.descricao}>{descricao}</Text> : null}
        </View>
      </LinearGradient>
      {emBreve ? <View style={styles.etiqueta}><EmBreveBadge /></View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.bloco, overflow: 'hidden', ...Shadows.card },
  normal: { flex: 1 },
  largo: { width: '100%' },
  pressionado: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  bloco: { height: 114, padding: Spacing.lg - 2, justifyContent: 'space-between' },
  blocoLargo: { minHeight: 96, padding: Spacing.lg - 2, justifyContent: 'space-between', gap: Spacing.sm },
  brilho: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70, top: -58, right: -46,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  titulo: { ...Typography.subheading, color: Colors.white },
  tituloLargo: { fontSize: 17, lineHeight: 23 },
  descricao: { ...Typography.body, color: Colors.white, opacity: 0.9, marginTop: 2 },
  etiqueta: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
});
