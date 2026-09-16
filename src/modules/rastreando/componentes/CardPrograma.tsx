import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { PendenciaAberta } from '@core/rastreando/contexto';
import type { Programa, ResultadoElegibilidade } from '@core/regras/tipos';
import { CONTEUDO } from '@modules/rastreando/conteudo';
import { Colors, Radius, Shadows, Spacing, StatusBadge, Typography } from '@ui/index';
import { dataBr, NIVEL_PENDENCIA, STATUS_UI } from './statusUI';

interface Props {
  programa: Programa;
  avaliacao: ResultadoElegibilidade;
  pendencia?: PendenciaAberta;
  sintomas: number;
  onPress: () => void;
}

/** Card de programa (galeria): capa com gradiente + ícone, título, status §28 e a próxima informação útil. */
export function CardPrograma({ programa, avaliacao, pendencia, sintomas, onPress }: Props) {
  const c = CONTEUDO[programa];
  const status = STATUS_UI[avaliacao.status];
  // Hierarquia de segurança na leitura: sintoma > pendência > status calculado.
  const badge = sintomas > 0
    ? { rotulo: 'Sinal de alerta', nivel: 'vermelho' as const }
    : pendencia
      ? { rotulo: 'Pendência', nivel: NIVEL_PENDENCIA[pendencia.nivelAlerta] ?? 'laranja' }
      : status;
  const linha = sintomas > 0
    ? 'Procure avaliação médica'
    : pendencia
      ? pendencia.descricao
      : avaliacao.proximaData
        ? `Próximo: ${dataBr(avaliacao.proximaData)}`
        : c.subtitulo;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <LinearGradient colors={c.capa} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.capa}>
        <Ionicons name={c.icone as keyof typeof Ionicons.glyphMap} size={30} color="rgba(255,255,255,0.92)" />
      </LinearGradient>
      <View style={styles.corpo}>
        <Text style={styles.titulo} numberOfLines={1}>{c.titulo.replace('Câncer ', '').replace(/^d[oa] /, '')}</Text>
        <StatusBadge nivel={badge.nivel} label={badge.rotulo} />
        <Text style={styles.linha} numberOfLines={2}>{linha}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.bloco, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadows.card },
  capa: { height: 72, alignItems: 'center', justifyContent: 'center' },
  corpo: { padding: Spacing.md, gap: 6, minHeight: 96 },
  titulo: { ...Typography.subheading, color: Colors.textPrimary, textTransform: 'capitalize' },
  linha: { ...Typography.caption, color: Colors.textSecondary },
});
