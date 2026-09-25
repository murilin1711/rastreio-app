import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

/**
 * Arte dos slides do onboarding (D-033).
 *
 * A versão anterior empilhava cartões inclinados sobre o gradiente escuro, e o slide 2 era um
 * diagrama de tronco e galhos. O Murilo achou "pouco profissional e difícil de entender": cartões
 * tortos em ângulos irregulares leem como desalinho, e diagrama exige interpretar uma metáfora antes
 * de entender a mensagem — a pior coisa para quem abriu o app pela primeira vez aos setenta anos.
 *
 * Agora cada slide mostra o mascote e, abaixo, **linhas de exemplo**: rótulo pequeno em cima, o dado
 * em destaque embaixo. Sem inclinação, sem diagrama, sem metáfora.
 */

const CLIPES = {
  repouso: require('../../../assets/animacoes/nero/repouso.webp'),
  pensando: require('../../../assets/animacoes/nero/pensando.webp'),
  acenar: require('../../../assets/animacoes/nero/acenar.webp'),
} as const;

/** Calibrado pelo Murilo no painel de 24/09: 124 px, em repouso. */
const ALTURA_NERO = 124;

export function NeroDoSlide({ clipe }: { clipe: keyof typeof CLIPES }) {
  return <Image source={CLIPES[clipe]} style={styles.nero} resizeMode="contain" accessibilityLabel="Nero, mascote do aplicativo" />;
}

interface Linha {
  icone: keyof typeof Ionicons.glyphMap;
  rotulo: string;
  valor: string;
  /** Destaca a linha que mostra o resultado de algo que a pessoa já contou (slide 2). */
  consequencia?: boolean;
}

export function LinhasExemplo({ linhas }: { linhas: Linha[] }) {
  return (
    <View style={styles.linhas}>
      {linhas.map((l) => (
        <View key={l.rotulo} style={[styles.linha, l.consequencia && styles.linhaConsequencia]}>
          <View style={[styles.bolha, l.consequencia && styles.bolhaConsequencia]}>
            <Ionicons name={l.icone} size={16} color={l.consequencia ? Colors.logoCeu : Colors.logoAco} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rotulo}>{l.rotulo}</Text>
            <Text style={styles.valor}>{l.valor}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nero: { height: ALTURA_NERO, alignSelf: 'center' },
  linhas: { gap: Spacing.sm - 1 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.linha, paddingVertical: Spacing.md, paddingHorizontal: Spacing.md },
  /** A consequência ganha o ciano da marca: é o "e por isso" da linha de cima. */
  linhaConsequencia: { backgroundColor: 'rgba(72, 168, 205, 0.10)' },
  bolha: { width: 32, height: 32, borderRadius: Radius.chip + 1, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  bolhaConsequencia: { backgroundColor: 'rgba(72, 168, 205, 0.18)' },
  rotulo: { ...Typography.caption, color: Colors.textSecondary },
  valor: { ...Typography.subheading, color: Colors.textPrimary },
});
