import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TAMANHO_BOTAO_ANOTAR, distanciaBotaoAnotar } from '@ui/components/espacoAbas';
import { Colors, Shadows, Spacing } from '@ui/theme';

/**
 * Círculo "Anotar" (spec §6.1): logo acima da barra de abas (no iOS a barra flutua sobre o conteúdo; no
 * Android o conteúdo já termina em cima dela — ver `distanciaBotaoAnotar`), no canto direito, só nas telas raiz das
 * quatro abas. A barra é a nativa (`NativeTabs`) e não muda; o círculo é nosso e flutua sobre a rolagem —
 * `useEspacoAbas` já deixa lugar para ele no fim do conteúdo. `origem` é o caminho da aba (formato de
 * `usePathname`), para a folha saber para onde voltar.
 */
export function BotaoAnotar({ origem }: { origem: string }) {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Anotar"
      onPress={() => router.push({ pathname: '/(app)/anotar', params: { origem } } as Href)}
      style={[styles.circulo, { bottom: distanciaBotaoAnotar(bottom) }]}
    >
      <Ionicons name="add" size={34} color={Colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circulo: {
    position: 'absolute',
    right: Spacing.xxl,
    width: TAMANHO_BOTAO_ANOTAR,
    height: TAMANHO_BOTAO_ANOTAR,
    borderRadius: TAMANHO_BOTAO_ANOTAR / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
});
