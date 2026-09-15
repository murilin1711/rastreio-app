import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Colors, Spacing, Typography } from '@ui/index';

/** Título em caixa normal + bloco branco com os campos. */
export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { marginBottom: Spacing.xxl },
  titulo: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.sm },
  card: { gap: Spacing.md },
});
