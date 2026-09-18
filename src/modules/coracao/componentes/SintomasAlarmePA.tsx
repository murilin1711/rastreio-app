import { StyleSheet, Text, View } from 'react-native';
import type { SintomaPA } from '@core/regras/cardio/tipos';
import { SINTOMAS_PA } from '@modules/coracao/conteudo/pressao';
import { Opcoes } from '@ui/components/Opcoes';
import { Colors, Spacing, Typography } from '@ui/theme';

interface Props { valor: SintomaPA[]; onChange: (v: SintomaPA[]) => void; titulo?: string }

/** Sintomas de alarme do §4, seleção múltipla. Usado no registro e na reavaliação do valor muito elevado. */
export function SintomasAlarmePA({ valor, onChange, titulo = 'Você está sentindo algum destes sintomas agora?' }: Props) {
  const alternar = (s: SintomaPA) => onChange(valor.includes(s) ? valor.filter((x) => x !== s) : [...valor, s]);
  return (
    <View style={styles.bloco}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Opcoes opcoes={SINTOMAS_PA} valor={valor} onChange={alternar} multiplo />
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: Spacing.md },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
});
