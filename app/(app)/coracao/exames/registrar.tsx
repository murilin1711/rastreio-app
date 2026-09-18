import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categoriaDe, TIPOS_CARDIO, TIPOS_LAB, unidadePadrao, type TipoExameCardio } from '@core/cardio/tiposExames';
import { useExamesCardio } from '@core/cardio/useExamesCardio';
import { traduzirErro } from '@core/supabase/erros';
import { Button, CampoData, Colors, Input, InternalHeader, Opcoes, Select, Spacing, Typography } from '@ui/index';

type Categoria = 'laboratorial' | 'cardiologico';
const numero = (t: string) => (t.trim() === '' ? null : Number(t.replace(',', '.')));

/** Registrar exame (§10–§11): valor estruturado para laboratório; conclusão (e Agatston) para cardiológicos. */
export default function RegistrarExame() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tipo?: string }>();
  const { inserir } = useExamesCardio();
  const tipoInicial = (params.tipo ?? null) as TipoExameCardio | null;
  const [categoria, setCategoria] = useState<Categoria | null>(tipoInicial ? categoriaDe(tipoInicial) : null);
  const [tipo, setTipo] = useState<TipoExameCardio | null>(tipoInicial);
  const [valor, setValor] = useState('');
  const [unidade, setUnidade] = useState(tipoInicial ? unidadePadrao(tipoInicial) : '');
  const [refMin, setRefMin] = useState('');
  const [refMax, setRefMax] = useState('');
  const [conclusao, setConclusao] = useState('');
  const [agatston, setAgatston] = useState('');
  const [percentil, setPercentil] = useState('');
  const [data, setData] = useState<string | null>(null);
  const [instituicao, setInstituicao] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [salvos, setSalvos] = useState(0);

  const escolherTipo = (t: TipoExameCardio) => { setTipo(t); setUnidade(unidadePadrao(t)); };
  const ehCac = tipo === 'cac';

  const gravar = async (maisUm: boolean) => {
    if (!categoria || !tipo) { Alert.alert('Faltou algo', 'Escolha o tipo do exame.'); return; }
    if (!data) { Alert.alert('Faltou algo', 'Informe a data do exame.'); return; }
    let resultado: Parameters<typeof inserir>[0]['resultado'] = {};
    if (categoria === 'laboratorial') {
      const v = numero(valor);
      if (v == null || Number.isNaN(v)) { Alert.alert('Faltou algo', 'Informe o valor do exame.'); return; }
      resultado = { valor: v, unidade: unidade.trim() || undefined, referenciaMin: numero(refMin) ?? undefined, referenciaMax: numero(refMax) ?? undefined };
    } else {
      if (!conclusao.trim() && !ehCac) { Alert.alert('Faltou algo', 'Informe o resultado ou a conclusão do laudo.'); return; }
      const ag = numero(agatston);
      if (ehCac && (ag == null || Number.isNaN(ag))) { Alert.alert('Faltou algo', 'Informe o escore de cálcio em Agatston.'); return; }
      resultado = { conclusao: conclusao.trim() || undefined, agatston: ag ?? undefined, percentil: numero(percentil) ?? undefined };
    }
    setSalvando(true);
    try {
      await inserir({ categoria, tipo, dataRealizacao: data, resultado, instituicao: instituicao.trim() || undefined, solicitante: solicitante.trim() || undefined, observacoes: observacoes.trim() || undefined });
      if (maisUm) {
        setSalvos((n) => n + 1);
        setTipo(null); setValor(''); setUnidade(''); setRefMin(''); setRefMax(''); setConclusao(''); setAgatston(''); setPercentil(''); setObservacoes('');
      } else {
        router.back();
      }
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Meus Exames" title="Adicionar exame" />
        {salvos ? <Text style={styles.ajuda}>{salvos} {salvos === 1 ? 'exame salvo' : 'exames salvos'} desta mesma data.</Text> : null}
        <Text style={styles.rotulo}>Categoria</Text>
        <Opcoes<Categoria> opcoes={[{ valor: 'laboratorial', rotulo: 'Laboratorial' }, { valor: 'cardiologico', rotulo: 'Cardiológico' }]} valor={categoria} onChange={(c) => { setCategoria(c); setTipo(null); }} />
        {categoria ? (
          <>
            <Text style={styles.rotulo}>Exame</Text>
            {categoria === 'laboratorial'
              ? <Select opcoes={TIPOS_LAB.map((t) => ({ valor: t.tipo, rotulo: t.rotulo }))} valor={tipo as never} onChange={(t) => escolherTipo(t as TipoExameCardio)} placeholder="Escolha o exame" />
              : <Select opcoes={TIPOS_CARDIO.map((t) => ({ valor: t.tipo, rotulo: t.rotulo }))} valor={tipo as never} onChange={(t) => escolherTipo(t as TipoExameCardio)} placeholder="Escolha o exame" />}
          </>
        ) : null}
        {tipo && categoria === 'laboratorial' ? (
          <>
            <Text style={styles.rotulo}>Resultado</Text>
            <View style={styles.linhaCampos}>
              <Input value={valor} onChangeText={setValor} placeholder="Valor" keyboardType="decimal-pad" style={{ flex: 2 }} />
              <Input value={unidade} onChangeText={setUnidade} placeholder="Unidade" style={{ flex: 1 }} />
            </View>
            <Text style={styles.rotulo}>Referência do laboratório (opcional)</Text>
            <View style={styles.linhaCampos}>
              <Input value={refMin} onChangeText={setRefMin} placeholder="Mínimo" keyboardType="decimal-pad" style={{ flex: 1 }} />
              <Input value={refMax} onChangeText={setRefMax} placeholder="Máximo" keyboardType="decimal-pad" style={{ flex: 1 }} />
            </View>
          </>
        ) : null}
        {tipo && categoria === 'cardiologico' ? (
          <>
            {ehCac ? (
              <>
                <Text style={styles.rotulo}>Escore de cálcio</Text>
                <View style={styles.linhaCampos}>
                  <Input value={agatston} onChangeText={setAgatston} placeholder="Agatston" keyboardType="number-pad" style={{ flex: 1 }} />
                  <Input value={percentil} onChangeText={setPercentil} placeholder="Percentil (opcional)" keyboardType="number-pad" style={{ flex: 1 }} />
                </View>
              </>
            ) : null}
            <Text style={styles.rotulo}>Resultado / conclusão do laudo{ehCac ? ' (opcional)' : ''}</Text>
            <Input value={conclusao} onChangeText={setConclusao} placeholder="Copie a conclusão do laudo" multiline />
          </>
        ) : null}
        <Text style={styles.rotulo}>Data do exame</Text>
        <CampoData valor={data} onChange={setData} />
        <Text style={styles.rotulo}>Onde foi feito (opcional)</Text>
        <Input value={instituicao} onChangeText={setInstituicao} placeholder="Laboratório ou clínica" />
        <Text style={styles.rotulo}>Quem pediu (opcional)</Text>
        <Input value={solicitante} onChangeText={setSolicitante} placeholder="Médico solicitante" />
        <Text style={styles.rotulo}>Observações (opcional)</Text>
        <Input value={observacoes} onChangeText={setObservacoes} multiline />
        <View style={{ gap: Spacing.sm, marginTop: Spacing.xxl }}>
          <Button label="Salvar exame" onPress={() => gravar(false)} loading={salvando} />
          {categoria === 'laboratorial' ? <Button label="Salvar e adicionar outro da mesma data" variant="outline" onPress={() => gravar(true)} disabled={salvando} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  ajuda: { ...Typography.caption, color: Colors.textSecondary },
  linhaCampos: { flexDirection: 'row', gap: Spacing.sm },
});
