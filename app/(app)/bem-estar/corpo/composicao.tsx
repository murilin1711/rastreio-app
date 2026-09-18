import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCorpo } from '@core/bemestar/useCorpo';
import { traduzirErro } from '@core/supabase/erros';
import { LinhaMedidaCorporal } from '@modules/bem-estar/componentes/LinhaMedidaCorporal';
import { ROTULO_METODO, TEXTO_CORPO } from '@modules/bem-estar/conteudo/corpo';
import { Button, CampoData, Colors, Input, InternalHeader, Radius, Select, Spacing, Typography } from '@ui/index';

const numero = (t: string) => { const n = Number(t.replace(',', '.')); return t.trim() === '' || Number.isNaN(n) ? undefined : n; };
type Metodo = 'bioimpedancia' | 'dexa' | 'profissional' | 'outro';

/** Composição corporal avançada (§83): só armazena e mostra a evolução; aviso literal sobre métodos. */
export default function Composicao() {
  const router = useRouter();
  const { medidas, salvarComposicao } = useCorpo();
  const [metodo, setMetodo] = useState<Metodo | null>(null);
  const [c, setC] = useState({ kg: '', gordura: '', massaGordura: '', massaMagra: '', musculo: '', agua: '', visceral: '', tmb: '' });
  const [data, setData] = useState<string | null>(new Date().toISOString().slice(0, 10));
  const [salvando, setSalvando] = useState(false);
  const set = (k: keyof typeof c) => (v: string) => setC((s) => ({ ...s, [k]: v }));
  const historico = medidas.filter((m) => m.tipo === 'composicao');

  const gravar = async () => {
    if (!metodo) { Alert.alert('Faltou algo', 'Informe o método (bioimpedância, DEXA…).'); return; }
    if (!data) { Alert.alert('Faltou algo', 'Informe a data.'); return; }
    const valores = { metodo, kg: numero(c.kg), gordura_pct: numero(c.gordura), massa_gordura_kg: numero(c.massaGordura), massa_magra_kg: numero(c.massaMagra), massa_muscular_kg: numero(c.musculo), agua_pct: numero(c.agua), gordura_visceral: numero(c.visceral), tmb_kcal: numero(c.tmb) };
    if (Object.values(valores).filter((v) => v != null).length <= 1) { Alert.alert('Faltou algo', 'Informe pelo menos um resultado da avaliação.'); return; }
    setSalvando(true);
    try { await salvarComposicao(`${data}T${new Date().toTimeString().slice(0, 8)}`, valores); router.back(); } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); } finally { setSalvando(false); }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Meu Corpo" title="Composição corporal" onBack={() => router.back()} />
        <View style={styles.aviso}><Text style={styles.avisoTexto}>{TEXTO_CORPO.composicaoAviso}</Text></View>
        <Text style={styles.rotulo}>Método</Text>
        <Select opcoes={(['bioimpedancia', 'dexa', 'profissional', 'outro'] as Metodo[]).map((m) => ({ valor: m, rotulo: ROTULO_METODO[m] }))} valor={metodo} onChange={setMetodo} placeholder="Escolha o método" />
        <Text style={styles.rotulo}>Resultados (preencha o que o exame informou)</Text>
        <View style={styles.linha}><Input value={c.kg} onChangeText={set('kg')} placeholder="Peso (kg)" keyboardType="decimal-pad" style={{ flex: 1 }} /><Input value={c.gordura} onChangeText={set('gordura')} placeholder="Gordura (%)" keyboardType="decimal-pad" style={{ flex: 1 }} /></View>
        <View style={styles.linha}><Input value={c.massaGordura} onChangeText={set('massaGordura')} placeholder="Massa de gordura (kg)" keyboardType="decimal-pad" style={{ flex: 1 }} /><Input value={c.massaMagra} onChangeText={set('massaMagra')} placeholder="Massa magra (kg)" keyboardType="decimal-pad" style={{ flex: 1 }} /></View>
        <View style={styles.linha}><Input value={c.musculo} onChangeText={set('musculo')} placeholder="Massa muscular (kg)" keyboardType="decimal-pad" style={{ flex: 1 }} /><Input value={c.agua} onChangeText={set('agua')} placeholder="Água corporal (%)" keyboardType="decimal-pad" style={{ flex: 1 }} /></View>
        <View style={styles.linha}><Input value={c.visceral} onChangeText={set('visceral')} placeholder="Gordura visceral" keyboardType="decimal-pad" style={{ flex: 1 }} /><Input value={c.tmb} onChangeText={set('tmb')} placeholder="TMB (kcal)" keyboardType="number-pad" style={{ flex: 1 }} /></View>
        <Text style={styles.rotulo}>Data da avaliação</Text>
        <CampoData valor={data} onChange={setData} />
        <Button label="Salvar avaliação" onPress={gravar} loading={salvando} style={{ marginTop: Spacing.xxl }} />
        {historico.length ? (<><Text style={styles.secao}>Histórico</Text>{historico.map((m) => <LinhaMedidaCorporal key={m.id} medida={m} />)}</>) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  aviso: { borderRadius: Radius.bloco, padding: Spacing.lg, backgroundColor: Colors.surfaceAlt },
  avisoTexto: { ...Typography.caption, color: Colors.textSecondary },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  linha: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
});
