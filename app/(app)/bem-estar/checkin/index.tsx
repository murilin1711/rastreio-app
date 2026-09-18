import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCheckin } from '@core/bemestar/useCheckin';
import type { Checkin } from '@core/regras/bemestar/tipos';
import { traduzirErro } from '@core/supabase/erros';
import { Escala010 } from '@modules/bem-estar/componentes/Escala010';
import { PERGUNTAS_CHECKIN, TEXTO_CHECKIN } from '@modules/bem-estar/conteudo/checkin';
import { dataCurtaBr } from '@modules/coracao/componentes/formato';
import { Button, Card, Colors, Input, InternalHeader, Spacing, Typography } from '@ui/index';

type Chave = (typeof PERGUNTAS_CHECKIN)[number]['chave'];
type Respostas = Pick<Checkin, Chave>;
const vazio: Respostas = { disposicao: null, alimentacao: null, atividade: null, sono: null, estresse: null, energia: null, bemEstar: null };
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmt = (n: number | null) => (n == null ? '—' : String(n).replace('.', ','));
const somarDias = (iso: string, n: number) => { const [a, m, d] = iso.split('-').map(Number); const x = new Date(a, m - 1, d + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };

/** Check-in semanal (§86–§87): 7 escalas 0–10 + texto livre; histórico mensal de energia, estresse e bem-estar. */
export default function CheckinSemanal() {
  const router = useRouter();
  const { semanaAlvo, atual, meses, salvar } = useCheckin();
  const [r, setR] = useState<Respostas>(vazio);
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { if (atual) { setR({ disposicao: atual.disposicao, alimentacao: atual.alimentacao, atividade: atual.atividade, sono: atual.sono, estresse: atual.estresse, energia: atual.energia, bemEstar: atual.bemEstar }); setObservacao(atual.observacao ?? ''); } }, [atual]);

  const gravar = async () => {
    if (Object.values(r).every((v) => v == null)) { Alert.alert('Faltou algo', 'Responda pelo menos uma pergunta.'); return; }
    setSalvando(true);
    try { await salvar({ ...r, observacao: observacao.trim() || null }); Alert.alert('Obrigado', TEXTO_CHECKIN.salvo, [{ text: 'OK', onPress: () => router.back() }]); } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); } finally { setSalvando(false); }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Saúde & Bem-estar" title={TEXTO_CHECKIN.titulo} onBack={() => router.back()} />
        <Text style={styles.sub}>{TEXTO_CHECKIN.subtitulo}</Text>
        <Text style={styles.semana}>Semana de {dataCurtaBr(semanaAlvo)} a {dataCurtaBr(somarDias(semanaAlvo, 6))}{atual ? ' · já respondida, pode ajustar' : ''}</Text>
        <View style={{ gap: Spacing.xl, marginTop: Spacing.lg }}>
          {PERGUNTAS_CHECKIN.map((q) => <Escala010 key={q.chave} rotulo={q.pergunta} valor={r[q.chave]} onChange={(v) => setR((s) => ({ ...s, [q.chave]: v }))} extremos={q.chave === 'estresse' ? ['nenhum', 'muito'] : ['muito ruim', 'muito bom']} />)}
        </View>
        <Text style={styles.rotulo}>{TEXTO_CHECKIN.observacao}</Text>
        <Input value={observacao} onChangeText={setObservacao} multiline placeholder="Opcional" />
        <Button label="Salvar check-in" onPress={gravar} loading={salvando} style={{ marginTop: Spacing.xxl }} />

        {meses.length ? (
          <>
            <Text style={styles.secao}>Seus meses</Text>
            <Card style={styles.card}>
              <View style={styles.linha}><Text style={[styles.cel, styles.cab]}>Mês</Text><Text style={[styles.cel, styles.cab]}>Energia</Text><Text style={[styles.cel, styles.cab]}>Estresse</Text><Text style={[styles.cel, styles.cab]}>Bem-estar</Text></View>
              {meses.map((m) => (
                <View key={m.mes} style={styles.linha}>
                  <Text style={styles.cel}>{MESES[Number(m.mes.slice(5, 7)) - 1]}/{m.mes.slice(2, 4)} ({m.n})</Text>
                  <Text style={styles.cel}>{fmt(m.energia)}</Text><Text style={styles.cel}>{fmt(m.estresse)}</Text><Text style={styles.cel}>{fmt(m.bemEstar)}</Text>
                </View>
              ))}
              <Text style={styles.nota}>Médias das respostas do mês (0 a 10). O objetivo é só acompanhar.</Text>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  sub: { ...Typography.body, color: Colors.textSecondary },
  semana: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.sm },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  card: { padding: Spacing.lg, gap: Spacing.xs },
  linha: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cel: { flex: 1, ...Typography.caption, color: Colors.textPrimary },
  cab: { fontFamily: 'Poppins-SemiBold', color: Colors.textSecondary },
  nota: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.sm },
});
