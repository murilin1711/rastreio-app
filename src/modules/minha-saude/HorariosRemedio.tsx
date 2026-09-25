import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { horariosDoRitmo, ritmoDe, type Ritmo } from '@core/medicacoes/horarios';
import { CampoHorario, Colors, Opcoes, Spacing, Typography } from '@ui/index';

type Escolha = '1' | '2' | '3' | '4' | 'outro';

const OPCOES: { valor: Escolha; rotulo: string; descricao?: string }[] = [
  { valor: '1', rotulo: '1 vez' },
  { valor: '2', rotulo: '2 vezes', descricao: 'De 12 em 12 horas' },
  { valor: '3', rotulo: '3 vezes', descricao: 'De 8 em 8 horas' },
  { valor: '4', rotulo: '4 vezes', descricao: 'De 6 em 6 horas' },
  { valor: 'outro', rotulo: 'Outro', descricao: 'Escolho cada horário' },
];

const PRIMEIRA_PADRAO = '08:00';

/**
 * Horários de um remédio (D-045): quantas vezes por dia, como está na receita, e o horário da primeira
 * dose — o app preenche o resto. Cada horário continua editável na roda, e dá para tirar ou adicionar.
 *
 * Mudar a primeira dose recalcula todos. Mexer num horário só muda aquele; se o conjunto deixa de ser
 * igualmente espaçado, o ritmo passa a "Outro" e o app não mexe mais nos horários sozinho.
 */
export function HorariosRemedio({ horarios, onChange }: { horarios: string[]; onChange: (h: string[]) => void }) {
  const [escolha, setEscolha] = useState<Escolha | null>(() => {
    if (!horarios.length) return null;
    const r = ritmoDe(horarios);
    return r === 'outro' ? 'outro' : (String(r) as Escolha);
  });
  const [primeira, setPrimeira] = useState<string>(() => [...horarios].sort()[0] ?? PRIMEIRA_PADRAO);

  const aplicar = (lista: string[]) => {
    const unicos = [...new Set(lista)].sort();
    onChange(unicos);
    const r = ritmoDe(unicos);
    setEscolha(unicos.length ? (r === 'outro' ? 'outro' : (String(r) as Escolha)) : null);
  };

  const escolher = (e: Escolha) => {
    setEscolha(e);
    if (e !== 'outro') onChange(horariosDoRitmo(primeira, Number(e) as Ritmo));
  };

  const mudarPrimeira = (h: string) => {
    setPrimeira(h);
    if (escolha && escolha !== 'outro') onChange(horariosDoRitmo(h, Number(escolha) as Ritmo));
  };

  return (
    <View style={{ gap: Spacing.md }}>
      <Text style={styles.rotulo}>Quantas vezes por dia?</Text>
      <Opcoes<Escolha> opcoes={OPCOES} valor={escolha} onChange={escolher} />

      {escolha && escolha !== 'outro' ? (
        <CampoHorario rotulo="Primeira dose" valor={primeira} onChange={mudarPrimeira} />
      ) : null}

      {escolha ? (
        <View style={{ gap: Spacing.sm }}>
          <Text style={styles.rotulo}>Horários</Text>
          {horarios.map((h, i) => (
            <View key={`${h}-${i}`} style={styles.linha}>
              <View style={{ flex: 1 }}>
                <CampoHorario valor={h} accessibilityLabel={`Horário ${i + 1}`} onChange={(novo) => aplicar(horarios.map((x, j) => (j === i ? novo : x)))} />
              </View>
              <Pressable onPress={() => aplicar(horarios.filter((_, j) => j !== i))} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Tirar o horário ${h}`}>
                <Ionicons name="close-circle-outline" size={26} color={Colors.textMuted} />
              </Pressable>
            </View>
          ))}
          <CampoHorario valor={null} vazio="Adicionar horário" accessibilityLabel="Adicionar horário" onChange={(novo) => aplicar([...horarios, novo])} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rotulo: { ...Typography.subheading, color: Colors.textPrimary },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
