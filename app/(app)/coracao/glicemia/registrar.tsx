import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalizarHorario } from '@core/medicacoes/horarios';
import type { AvaliacaoGlicemia, MedidaGlicemia, MomentoGlicemia, SintomaGlicemia } from '@core/regras/cardio/tiposGlicemia';
import { useGlicemia } from '@core/cardio/useGlicemia';
import { hojeISO } from '@core/cardio/usePressao';
import { traduzirErro } from '@core/supabase/erros';
import { horaLocal, paraISO } from '@modules/coracao/componentes/formato';
import { LeituraGlicemia } from '@modules/coracao/componentes/LeituraGlicemia';
import { MOMENTOS, rotuloMomento, SINTOMAS_GLICEMIA } from '@modules/coracao/conteudo/glicemia';
import { Alerta, Button, CampoData, Colors, Input, InternalHeader, Opcoes, Radius, Select, Spacing, StatusBadge, Typography } from '@ui/index';

type Refeicao = NonNullable<MedidaGlicemia['contexto']['refeicao']>;
const numero = (t: string) => (t.trim() === '' ? null : Number(t.replace(',', '.')));

/** Registro de glicemia (§5–§6) com camadas de C-012. */
export default function RegistrarGlicemia() {
  const router = useRouter();
  const { registrar, carregando } = useGlicemia();
  const [momento, setMomento] = useState<MomentoGlicemia | null>(null);
  const [valor, setValor] = useState('');
  const [data, setData] = useState<string | null>(hojeISO());
  const [hora, setHora] = useState(horaLocal(new Date().toISOString()));
  const [refeicao, setRefeicao] = useState<Refeicao | null>(null);
  const [medNome, setMedNome] = useState('');
  const [medDose, setMedDose] = useState('');
  const [atividade, setAtividade] = useState<'sim' | 'nao' | null>(null);
  const [sintomas, setSintomas] = useState<SintomaGlicemia[]>([]);
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [saida, setSaida] = useState<{ avaliacao: AvaliacaoGlicemia; mgdl: number } | null>(null);

  const gravar = async () => {
    const mgdl = numero(valor);
    const h = normalizarHorario(hora);
    if (!momento) { Alert.alert('Faltou algo', 'Escolha o momento da medida.'); return; }
    if (mgdl == null || Number.isNaN(mgdl) || mgdl < 10 || mgdl > 900) { Alert.alert('Confira o valor', 'Informe a glicemia em mg/dL (entre 10 e 900).'); return; }
    if (!data || !h) { Alert.alert('Faltou algo', 'Informe a data e a hora (ex.: 07:12).'); return; }
    setSalvando(true);
    try {
      const avaliacao = await registrar({
        medidoEm: paraISO(data, h),
        mgdl,
        momento,
        contexto: {
          ...(refeicao ? { refeicao } : {}),
          ...(medNome.trim() ? { medicamento: { nome: medNome.trim(), ...(medDose.trim() ? { dose: medDose.trim() } : {}) } } : {}),
          ...(atividade ? { atividadeFisica: atividade === 'sim' } : {}),
          ...(sintomas.length ? { sintomas } : {}),
        },
        observacao: observacao.trim() || undefined,
      });
      setSaida({ avaliacao, mgdl });
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally {
      setSalvando(false);
    }
  };

  if (saida) {
    const { avaliacao, mgdl } = saida;
    const nivel = avaliacao.nivel;
    const chip = nivel === 'vermelho' ? 'Procure atendimento agora' : nivel === 'laranja' ? (mgdl < 70 ? 'Glicemia muito baixa' : 'Glicemia muito alta') : nivel === 'amarelo' ? 'Glicemia baixa' : null;
    return (
      <SafeAreaView style={styles.tela} edges={['top']}>
        <ScrollView contentContainerStyle={styles.conteudo}>
          <InternalHeader sectionLabel="Minha Glicemia" title="Glicemia registrada" onBack={() => router.back()} />
          <View style={styles.resultado}>
            <LeituraGlicemia mgdl={mgdl} tamanho="grande" />
            <Text style={styles.momentoTexto}>{momento ? rotuloMomento(momento) : ''}</Text>
            {nivel && chip ? <StatusBadge nivel={nivel} label={chip} /> : null}
          </View>
          {avaliacao.mensagem ? (
            <View style={[styles.mensagem, nivel ? { backgroundColor: Alerta[nivel].bg } : null]}>
              <Text style={[styles.mensagemTexto, nivel ? { color: Alerta[nivel].fg } : null]}>{avaliacao.mensagem}</Text>
            </View>
          ) : null}
          <Button label="Concluir" onPress={() => router.back()} style={{ marginTop: Spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Glicemia" title="Registrar glicemia" />
        <Text style={styles.rotulo}>Qual o momento da medida?</Text>
        <Select<MomentoGlicemia> opcoes={MOMENTOS} valor={momento} onChange={setMomento} placeholder="Escolha o momento" />
        <Text style={styles.rotulo}>Glicemia (mg/dL)</Text>
        <Input value={valor} onChangeText={setValor} placeholder="ex.: 104" keyboardType="number-pad" />
        <Text style={styles.rotulo}>Quando</Text>
        <View style={styles.linhaCampos}>
          <View style={{ flex: 2 }}><CampoData valor={data} onChange={setData} /></View>
          <Input value={hora} onChangeText={setHora} placeholder="07:12" keyboardType="numbers-and-punctuation" style={{ flex: 1 }} />
        </View>

        <Text style={styles.secao}>Opcional</Text>
        <Text style={styles.rotulo}>Refeição</Text>
        <Opcoes<Refeicao> opcoes={[{ valor: 'pequena', rotulo: 'Pequena' }, { valor: 'habitual', rotulo: 'Habitual' }, { valor: 'maior', rotulo: 'Maior que o habitual' }, { valor: 'nao_registrar', rotulo: 'Não registrar' }]} valor={refeicao} onChange={setRefeicao} />
        <Text style={styles.rotulo}>Medicamento ou insulina</Text>
        <View style={styles.linhaCampos}>
          <Input value={medNome} onChangeText={setMedNome} placeholder="Nome (opcional)" style={{ flex: 2 }} />
          <Input value={medDose} onChangeText={setMedDose} placeholder="Dose" style={{ flex: 1 }} />
        </View>
        <Text style={styles.rotulo}>Atividade física</Text>
        <Opcoes<'sim' | 'nao'> opcoes={[{ valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não' }]} valor={atividade} onChange={setAtividade} />
        <Text style={styles.rotulo}>Sintomas agora</Text>
        <Opcoes<SintomaGlicemia> opcoes={SINTOMAS_GLICEMIA} valor={sintomas} onChange={(s) => setSintomas(sintomas.includes(s) ? sintomas.filter((x) => x !== s) : [...sintomas, s])} multiplo />
        <Text style={styles.rotulo}>Observações</Text>
        <Input value={observacao} onChangeText={setObservacao} placeholder="ex.: almoço habitual" multiline />

        <Button label="Salvar glicemia" onPress={gravar} loading={salvando} disabled={carregando} style={{ marginTop: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl },
  linhaCampos: { flexDirection: 'row', gap: Spacing.sm },
  resultado: { alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.lg },
  momentoTexto: { ...Typography.body, color: Colors.textSecondary },
  mensagem: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.xl },
  mensagemTexto: { ...Typography.body, color: Colors.textPrimary },
});
