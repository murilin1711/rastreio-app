import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { type NeroClipe, NeroAnimado } from '@ui/components/NeroAnimado';
import { Colors } from '@ui/theme';

/** Céu em degradê claro para o fundo do app (D-063): só formas e cores do app, sem ilustração. */
export function CeuOnboarding() {
  return <LinearGradient colors={['#E4EFFA', Colors.background]} locations={[0, 0.7]} style={StyleSheet.absoluteFill} pointerEvents="none" />;
}

/**
 * O Nero sobre um "chão" discreto. Grande nas telas de conversa; pequeno, no canto, nas de demonstração,
 * para a animação do app ocupar o centro.
 */
export function CenaNero({ clipe, tamanho }: { clipe: NeroClipe; tamanho: 'grande' | 'pequeno' }) {
  const altura = tamanho === 'grande' ? 230 : 120;
  return (
    <View style={[styles.cena, tamanho === 'pequeno' && styles.canto]} pointerEvents="none">
      <View style={[styles.chao, { width: altura * 0.62, height: altura * 0.07, borderRadius: altura }]} />
      <NeroAnimado clipe={clipe} size={altura} />
    </View>
  );
}

const styles = StyleSheet.create({
  cena: { alignItems: 'center', justifyContent: 'flex-end' },
  canto: { alignSelf: 'flex-end' },
  chao: { position: 'absolute', bottom: 4, backgroundColor: 'rgba(15,45,99,0.06)' },
});
