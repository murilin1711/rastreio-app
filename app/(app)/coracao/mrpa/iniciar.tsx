import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalizarHorario } from '@core/medicacoes/horarios';
import { useMrpa } from '@core/cardio/useMrpa';
import { hojeISO } from '@core/cardio/usePressao';
import { traduzirErro } from '@core/supabase/erros';
import { aberturaMrpa, preparoMedida, regrasProtocoloMrpa } from '@modules/coracao/conteudo/pressao';
import { Button, CampoData, Colors, Input, InternalHeader, Opcoes, Spacing, Typography } from '@ui/index';

type Dias = '4' | '5' | '6';
const amanhaISO = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

/** Iniciar MRPA (§2, C-011): orientações, duração 4–6 dias (padrão 6), horários, PA do consultório opcional. */
export default function IniciarMrpa() {
  const router = useRouter();
  const { sessao, parametros, carregando, iniciar } = useMrpa();
  const [dias, setDias] = useState<Dias | null>(null);
  const [manha, setManha] = useState('08:00');
  const [noite, setNoite] = useState('20:00');
  const [pasC, setPasC] = useState('');
  const [padC, setPadC] = useState('');
  const [dataC, setDataC] = useState<string | null>(null);
  const [inicio, setInicio] = useState<string | null>(hojeISO());
  const [salvando, setSalvando] = useState(false);

  if (!carregando && sessao && sessao.status === 'em_andamento') return <Redirect href={{ pathname: '/(app)/coracao/mrpa/[sessao]', params: { sessao: sessao.id } }} />;

  const diasEscolhidos = dias ?? (String(parametros?.validade.diasPadrao ?? 6) as Dias);

  const comecar = async () => {
    const hM = normalizarHorario(manha);
    const hN = normalizarHorario(noite);
    if (!hM || !hN) { Alert.alert('Horário inválido', 'Use o formato 08:00 e 20:00.'); return; }
    if (!inicio || (inicio !== hojeISO() && inicio !== amanhaISO())) { Alert.alert('Data de início', 'A MRPA começa hoje ou amanhã.'); return; }
    const temConsultorio = pasC.trim() || padC.trim();
    if (temConsultorio && (!Number(pasC) || !Number(padC) || !dataC)) { Alert.alert('PA do consultório', 'Informe sistólica, diastólica e a data, ou deixe os três em branco.'); return; }
    setSalvando(true);
    try {
      const s = await iniciar({
        inicio,
        diasPrevistos: Number(diasEscolhidos) as 4 | 5 | 6,
        horarios: { manha: hM, noite: hN },
        paConsultorio: temConsultorio ? { pas: Number(pasC), pad: Number(padC), medidoEm: dataC! } : null,
      });
      router.replace({ pathname: '/(app)/coracao/mrpa/[sessao]', params: { sessao: s.id } });
    } catch (e) {
      Alert.alert('Não foi possível iniciar', traduzirErro(e).mensagemUsuario);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Pressão" title="Iniciar MRPA" />
        <Text style={styles.abertura}>{aberturaMrpa}</Text>

        <Text style={styles.secao}>Como será</Text>
        {regrasProtocoloMrpa.map((t) => <Text key={t} style={styles.item}>• {t}</Text>)}

        <Text style={styles.secao}>Antes de cada medida</Text>
        {preparoMedida.map((t) => <Text key={t} style={styles.item}>• {t}</Text>)}

        <Text style={styles.secao}>Quantos dias?</Text>
        <Text style={styles.ajuda}>A diretriz recomenda de 4 a 6 dias; o ideal são 6. Se seu médico pediu outra duração, use a mais próxima dentro dessa faixa.</Text>
        <Opcoes<Dias>
          opcoes={[{ valor: '6', rotulo: '6 dias', descricao: 'Recomendado' }, { valor: '5', rotulo: '5 dias' }, { valor: '4', rotulo: '4 dias', descricao: 'Mínimo da diretriz' }]}
          valor={diasEscolhidos}
          onChange={setDias}
        />

        <Text style={styles.secao}>Horários dos lembretes</Text>
        <View style={styles.linhaCampos}>
          <View style={{ flex: 1 }}><Text style={styles.rotulo}>Manhã</Text><Input value={manha} onChangeText={setManha} placeholder="08:00" keyboardType="numbers-and-punctuation" /></View>
          <View style={{ flex: 1 }}><Text style={styles.rotulo}>Noite</Text><Input value={noite} onChangeText={setNoite} placeholder="20:00" keyboardType="numbers-and-punctuation" /></View>
        </View>

        <Text style={styles.secao}>Começar</Text>
        <CampoData valor={inicio} onChange={setInicio} futuro />
        <Text style={styles.ajuda}>Hoje ou amanhã.</Text>

        <Text style={styles.secao}>Pressão medida no consultório (opcional)</Text>
        <Text style={styles.ajuda}>Se seu médico mediu sua pressão recentemente, o relatório mostra a diferença entre o consultório e a sua casa.</Text>
        <View style={styles.linhaCampos}>
          <Input value={pasC} onChangeText={setPasC} placeholder="Sistólica" keyboardType="number-pad" style={{ flex: 1 }} />
          <Input value={padC} onChangeText={setPadC} placeholder="Diastólica" keyboardType="number-pad" style={{ flex: 1 }} />
        </View>
        <View style={{ marginTop: Spacing.sm }}><CampoData valor={dataC} onChange={setDataC} rotulo="Data da medida no consultório" /></View>

        <Button label="Começar a MRPA" onPress={comecar} loading={salvando} disabled={carregando} style={{ marginTop: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  abertura: { ...Typography.body, color: Colors.textPrimary },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  item: { ...Typography.body, color: Colors.textSecondary },
  ajuda: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  rotulo: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xs },
  linhaCampos: { flexDirection: 'row', gap: Spacing.sm },
});
