import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { type NeroClipe, NeroAnimado } from '@ui/components/NeroAnimado';
import { Colors } from '@ui/theme';

/** Céu em degradê claro para o fundo do app (D-063): só formas e cores do app, sem ilustração. */
export function CeuOnboarding() {
  return <LinearGradient colors={['#E4EFFA', Colors.background]} locations={[0, 0.7]} style={StyleSheet.absoluteFill} pointerEvents="none" />;
}

interface Props {
  clipe: NeroClipe;
  /** Clipe tocado uma vez antes de `clipe` (final: comemora e volta ao repouso, de olhos abertos). */
  entrada?: NeroClipe;
  /** Pausa entre ciclos do clipe (tela 2: pensa, para 3 s, pensa de novo). */
  pausaMs?: number;
  /** Altura do Nero em pontos. */
  tamanho: number;
}

/** O Nero centralizado na horizontal, sobre um chão discreto. O tamanho vem do padrão da tela. */
export function CenaNero({ clipe, entrada, pausaMs, tamanho }: Props) {
  return (
    <View style={styles.cena} pointerEvents="none">
      <View style={[styles.chao, { width: tamanho * 0.62, height: tamanho * 0.07, borderRadius: tamanho }]} />
      <NeroAnimado clipe={clipe} entrada={entrada} pausaMs={pausaMs} size={tamanho} />
    </View>
  );
}

const styles = StyleSheet.create({
  cena: { alignItems: 'center', justifyContent: 'flex-end' },
  chao: { position: 'absolute', bottom: 4, backgroundColor: 'rgba(15,45,99,0.06)' },
});
