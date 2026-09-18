import { StyleSheet, Text, View } from 'react-native';
import type { AvaliacaoGlicemia, MedidaGlicemia } from '@core/regras/cardio/tiposGlicemia';
import { rotuloMomento } from '@modules/coracao/conteudo/glicemia';
import { StatusBadge } from '@ui/components/StatusBadge';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';
import { dataHoraBr } from './formato';
import { LeituraGlicemia } from './LeituraGlicemia';

interface Props { medida: MedidaGlicemia; avaliacao: AvaliacaoGlicemia | null }

/** Linha plana: data/hora, momento, valor, chips de contexto. Chip de cor só quando a avaliação tem nível (hipo/hiper). */
export function LinhaGlicemia({ medida, avaliacao }: Props) {
  const c = medida.contexto;
  const chips = [
    c.refeicao && c.refeicao !== 'nao_registrar' ? `refeição ${c.refeicao}` : null,
    c.medicamento?.nome ? `${c.medicamento.nome}${c.medicamento.dose ? ` ${c.medicamento.dose}` : ''}` : null,
    c.atividadeFisica ? 'atividade física' : null,
    avaliacao?.foraDaMeta ? `${avaliacao.foraDaMeta} da meta` : null,
  ].filter(Boolean) as string[];
  return (
    <View style={styles.linha}>
      <View style={{ width: 84 }}>
        <Text style={styles.data}>{dataHoraBr(medida.medidoEm)}</Text>
        <Text style={styles.momento}>{rotuloMomento(medida.momento)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <LeituraGlicemia mgdl={medida.mgdl} tamanho="linha" />
        {chips.length ? <View style={styles.chips}>{chips.map((t) => <Text key={t} style={styles.chip}>{t}</Text>)}</View> : null}
      </View>
      {avaliacao?.nivel ? <StatusBadge nivel={avaliacao.nivel} label={avaliacao.nivel === 'vermelho' ? 'urgente' : medida.mgdl < 70 ? 'baixa' : 'muito alta'} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  data: { ...Typography.caption, color: Colors.textSecondary },
  momento: { ...Typography.caption, fontSize: 11, color: Colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 2 },
  chip: { ...Typography.caption, color: Colors.textSecondary, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.chip, paddingHorizontal: Spacing.sm, paddingVertical: 1 },
});
