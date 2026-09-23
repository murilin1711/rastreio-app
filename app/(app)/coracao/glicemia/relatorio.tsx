import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMedicacoes } from '@core/medicacoes/useMedicacoes';
import { formatarHorarios } from '@core/medicacoes/horarios';
import { resumoGlicemia } from '@core/regras/cardio/glicemia';
import { useGlicemia } from '@core/cardio/useGlicemia';
import { diasAtrasISO } from '@core/cardio/usePressao';
import { dataCurtaBr, horaLocal } from '@modules/coracao/componentes/formato';
import { GraficoPontos } from '@modules/coracao/componentes/GraficoPontos';
import { LeituraGlicemia } from '@modules/coracao/componentes/LeituraGlicemia';
import { ressalvaRelatorioGlicemia, rotuloMomento } from '@modules/coracao/conteudo/glicemia';
import { Button, Card, Colors, InternalHeader, Opcoes, Spacing, Typography } from '@ui/index';

type Periodo = '7' | '14' | '30' | '90';

/** Relatório de glicemia (§8): resumo, tabela, gráfico, medicações. */
export default function RelatorioGlicemia() {
  const router = useRouter();
  const { medidas, metas } = useGlicemia();
  const { ativas } = useMedicacoes();
  const [periodo, setPeriodo] = useState<Periodo>('7');
  const desde = diasAtrasISO(Number(periodo));
  const selecionadas = useMemo(() => medidas.filter((m) => m.medidoEm >= desde).sort((a, b) => a.medidoEm.localeCompare(b.medidoEm)), [medidas, desde]);
  const r = resumoGlicemia(selecionadas, metas);
  const dias = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const g of selecionadas) { const k = g.medidoEm.slice(0, 10); m.set(k, [...(m.get(k) ?? []), g.mgdl]); }
    return [...m.entries()].map(([d, vs]) => ({ rotulo: dataCurtaBr(d), valores: vs }));
  }, [selecionadas]);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Minha Glicemia" title="Relatório" onBack={() => router.back()} />
        <Opcoes<Periodo> opcoes={[{ valor: '7', rotulo: 'Últimos 7 dias' }, { valor: '14', rotulo: '14 dias' }, { valor: '30', rotulo: '30 dias' }, { valor: '90', rotulo: '90 dias' }]} valor={periodo} onChange={setPeriodo} />

        {r.n ? (
          <>
            <Card style={styles.card}>
              <Text style={styles.rotulo}>Resumo · {r.n} {r.n === 1 ? 'registro' : 'registros'}</Text>
              <View style={styles.grade}>
                <View style={styles.celula}><Text style={styles.rotulo}>Média geral</Text><LeituraGlicemia mgdl={r.media!} /></View>
                <View style={styles.celula}><Text style={styles.rotulo}>Jejum</Text>{r.mediaJejum != null ? <LeituraGlicemia mgdl={r.mediaJejum} /> : <Text style={styles.texto}>—</Text>}</View>
                <View style={styles.celula}><Text style={styles.rotulo}>Pré-prandial</Text>{r.mediaPre != null ? <LeituraGlicemia mgdl={r.mediaPre} /> : <Text style={styles.texto}>—</Text>}</View>
                <View style={styles.celula}><Text style={styles.rotulo}>2 h pós</Text>{r.mediaPos2h != null ? <LeituraGlicemia mgdl={r.mediaPos2h} /> : <Text style={styles.texto}>—</Text>}</View>
              </View>
              <Text style={styles.texto}>Menor {r.menor!.mgdl} ({rotuloMomento(r.menor!.momento).toLowerCase()}) · maior {r.maior!.mgdl} ({rotuloMomento(r.maior!.momento).toLowerCase()})</Text>
              {metas ? <Text style={styles.texto}>{r.abaixoDaMeta} abaixo e {r.acimaDaMeta} acima da meta</Text> : null}
              {r.episodiosBaixos || r.episodiosAltos ? <Text style={styles.texto}>{r.episodiosBaixos} abaixo de 70 · {r.episodiosAltos} acima de 250</Text> : null}
            </Card>

            <View style={styles.bloco}>
              <Text style={styles.secao}>Ao longo dos dias</Text>
              <GraficoPontos dias={dias} faixa={metas ? { min: metas.jejumMin, max: metas.jejumMax } : null} />
            </View>

            <View style={styles.bloco}>
              <Text style={styles.secao}>Registros</Text>
              {selecionadas.map((g) => (
                <View key={g.id} style={styles.linha}>
                  <Text style={styles.colData}>{dataCurtaBr(g.medidoEm)} {horaLocal(g.medidoEm)}</Text>
                  <Text style={styles.colMomento}>{rotuloMomento(g.momento)}</Text>
                  <Text style={styles.colValor}>{g.mgdl}</Text>
                  <Text style={styles.colObs} numberOfLines={1}>{[g.contexto.medicamento?.nome, g.contexto.refeicao && g.contexto.refeicao !== 'nao_registrar' ? `refeição ${g.contexto.refeicao}` : null].filter(Boolean).join(' · ') || '—'}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={[styles.texto, { marginTop: Spacing.xl }]}>Nenhum registro no período.</Text>
        )}

        <View style={styles.bloco}>
          <Text style={styles.secao}>Medicamentos em uso</Text>
          {ativas.length ? ativas.map((m) => <Text key={m.id} style={styles.texto}>• {m.nome}{m.dose ? ` ${m.dose}` : ''}{m.horarios.length ? ` — ${formatarHorarios(m.horarios)}` : ''}</Text>) : <Text style={styles.texto}>Nenhum cadastrado.</Text>}
        </View>

        <Text style={styles.ressalva}>{ressalvaRelatorioGlicemia}</Text>
        <View style={styles.compartilhar}><Button label="Compartilhar em PDF" variant="outline" onPress={() => router.push({ pathname: '/(app)/(tabs)/minha-saude/relatorios/previa', params: { tipo: 'cardio', dias: '90', apenas: 'glicemia,hba1c' } })} /></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  card: { padding: Spacing.xl, marginTop: Spacing.lg, gap: Spacing.sm },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  celula: { width: '45%' },
  rotulo: { ...Typography.caption, color: Colors.textSecondary },
  texto: { ...Typography.body, color: Colors.textPrimary },
  bloco: { marginTop: Spacing.xxl },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.md },
  linha: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  colData: { ...Typography.caption, color: Colors.textSecondary, width: 82 },
  colMomento: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  colValor: { ...Typography.caption, color: Colors.textPrimary, width: 36, textAlign: 'right' },
  colObs: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
  ressalva: { ...Typography.caption, color: Colors.textSecondary, fontStyle: 'italic', marginTop: Spacing.xxl },
  compartilhar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
});
