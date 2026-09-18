import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '@ui/theme';

interface Props { pas: number; pad: number; tamanho?: 'grande' | 'medio' | 'linha' }

/**
 * A leitura de pressão como tipografia: sistólica em destaque, diastólica menor, unidade discreta.
 * Nunca recebe cor por valor — a ausência de cor é a mensagem (AMPA é triagem, C-010).
 */
export function LeituraPA({ pas, pad, tamanho = 'medio' }: Props) {
  const e = TAMANHOS[tamanho];
  return (
    <View style={styles.linha} accessibilityLabel={`${pas} por ${pad} milímetros de mercúrio`}>
      <Text style={[styles.pas, { fontSize: e.pas, lineHeight: e.pas * 1.1 }]}>{pas}</Text>
      <Text style={[styles.barra, { fontSize: e.pad, lineHeight: e.pas * 1.1 }]}>/</Text>
      <Text style={[styles.pad, { fontSize: e.pad, lineHeight: e.pas * 1.1 }]}>{pad}</Text>
      {tamanho !== 'linha' ? <Text style={[styles.unidade, { lineHeight: e.pas * 1.1 }]}>mmHg</Text> : null}
    </View>
  );
}

const TAMANHOS = { grande: { pas: 56, pad: 34 }, medio: { pas: 28, pad: 20 }, linha: { pas: 20, pad: 16 } };

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  pas: { fontFamily: 'Poppins-ExtraBold', color: Colors.textPrimary, letterSpacing: -1 },
  barra: { fontFamily: 'Poppins-Regular', color: Colors.textMuted },
  pad: { fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary },
  unidade: { ...Typography.caption, color: Colors.textMuted, marginLeft: 6 },
});
