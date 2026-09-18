import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MedidaPA } from '@core/regras/cardio/tipos';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';
import { dataHoraBr } from './formato';
import { LeituraPA } from './LeituraPA';

interface Props { medida: MedidaPA; onPress?: () => void }

const ROTULO_MED = { antes: 'antes do remédio', depois: 'depois do remédio', nao_uso: '' } as const;

/** Linha plana sobre o fundo (03-DESIGN): data à esquerda, leitura ao centro, contexto em chips cinza. Sem cor por valor. */
export function LinhaMedida({ medida, onPress }: Props) {
  const c = medida.contexto;
  const chips = [
    c.braco ? `braço ${c.braco}` : null,
    c.momentoMedicacao ? ROTULO_MED[c.momentoMedicacao] : null,
    c.sintomas?.length ? 'com sintomas' : null,
    c.excluida ? 'excluída do cálculo' : null,
  ].filter(Boolean) as string[];
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.linha, pressed && { opacity: 0.7 }]}>
      <Text style={styles.data}>{dataHoraBr(medida.medidoEm)}</Text>
      <View style={{ flex: 1 }}>
        <LeituraPA pas={medida.pas} pad={medida.pad} tamanho="linha" />
        {chips.length ? (
          <View style={styles.chips}>{chips.map((t) => <Text key={t} style={styles.chip}>{t}</Text>)}</View>
        ) : null}
      </View>
      {medida.fc != null ? <Text style={styles.fc}>{medida.fc} bpm</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  data: { ...Typography.caption, color: Colors.textSecondary, width: 84 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 2 },
  chip: { ...Typography.caption, color: Colors.textSecondary, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.chip, paddingHorizontal: Spacing.sm, paddingVertical: 1 },
  fc: { ...Typography.caption, color: Colors.textMuted },
});
