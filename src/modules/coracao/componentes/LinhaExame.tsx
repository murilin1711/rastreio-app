import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ExameCardio } from '@core/cardio/mapeamento';
import { fmtNum, resumoResultadoExame } from '@core/cardio/formato';
import { rotuloExame } from '@core/cardio/tiposExames';
import { Colors, Spacing, Typography } from '@ui/theme';
import { dataLongaBr } from './formato';

export { fmtNum, resumoResultadoExame };

/** Linha plana de exame: rótulo, resultado, data e instituição. Laboratório nunca recebe cor (interpretação é do médico). */
export function LinhaExame({ exame, onPress }: { exame: ExameCardio; onPress: () => void }) {
  const r = exame.resultado;
  const foraRef = r.valor != null && ((r.referenciaMin != null && r.valor < r.referenciaMin) || (r.referenciaMax != null && r.valor > r.referenciaMax));
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linha, pressed && { opacity: 0.7 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.titulo}>{rotuloExame(exame.tipo)}</Text>
        <Text style={styles.valor} numberOfLines={1}>{resumoResultadoExame(exame)}{foraRef ? ' · fora da referência do laboratório' : ''}</Text>
        <Text style={styles.meta}>{dataLongaBr(exame.dataRealizacao)}{exame.instituicao ? ` · ${exame.instituicao}` : ''}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  valor: { ...Typography.body, color: Colors.textPrimary },
  meta: { ...Typography.caption, color: Colors.textSecondary },
});
