import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@ui/theme';
import { ListItem } from './ListItem';

export interface AcaoModulo {
  chave: string;
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  subtitulo?: string;
  rota: string;
}

interface Props {
  acoes: AcaoModulo[];
  onAbrir: (rota: string) => void;
}

/** Molde único do topo dos módulos: "O que você quer fazer?" e uma linha por ação. */
export function ListaAcoes({ acoes, onAbrir }: Props) {
  return (
    <View style={styles.bloco}>
      <Text style={styles.titulo}>O que você quer fazer?</Text>
      <View style={styles.lista}>
        {acoes.map((a) => (
          <ListItem key={a.chave} icon={a.icone} title={a.titulo} subtitle={a.subtitulo} onPress={() => onAbrir(a.rota)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloco:  { gap: Spacing.md },
  titulo: { ...Typography.heading, color: Colors.textPrimary },
  lista:  { gap: Spacing.sm },
});
