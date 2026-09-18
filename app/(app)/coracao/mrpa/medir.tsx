import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { acimaDe, media, validarPlausibilidade } from '@core/regras/cardio/pressao';
import type { PeriodoMrpa } from '@core/regras/cardio/tipos';
import { useMrpa, type TrioEntrada } from '@core/cardio/useMrpa';
import { traduzirErro } from '@core/supabase/erros';
import { Cronometro } from '@modules/coracao/componentes/Cronometro';
import { LeituraPA } from '@modules/coracao/componentes/LeituraPA';
import { preparoMedida, ROTULO_MOTIVO_EXCLUSAO } from '@modules/coracao/conteudo/pressao';
import { Alerta, Button, Colors, Input, InternalHeader, Radius, Spacing, Typography } from '@ui/index';

type Etapa = 'preparo' | 'medida' | 'espera' | 'resumo';
const numero = (t: string) => (t.trim() === '' ? null : Number(t.replace(',', '.')));

/** Medição guiada da MRPA: preparo → 3 medidas com 1 minuto de intervalo → resumo do período (Medidas 2023, Parte 4 §3 e Fig. 8). */
export default function MedirMrpa() {
  const router = useRouter();
  const { sessao: sessaoId, periodo } = useLocalSearchParams<{ sessao: string; periodo: PeriodoMrpa }>();
  const { parametros, registrarTrio } = useMrpa(sessaoId);
  const [etapa, setEtapa] = useState<Etapa>('preparo');
  const [trio, setTrio] = useState<TrioEntrada[]>([]);
  const [pas, setPas] = useState('');
  const [pad, setPad] = useState('');
  const [fc, setFc] = useState('');
  const [salvando, setSalvando] = useState(false);
  const rotuloPeriodo = periodo === 'manha' ? 'manhã' : 'noite';
  const ordem = trio.length + 1;

  const guardar = async (confirmado = false) => {
    const nPas = numero(pas);
    const nPad = numero(pad);
    if (!parametros) return;
    if (nPas == null || nPad == null || Number.isNaN(nPas) || Number.isNaN(nPad)) { Alert.alert('Faltou algo', 'Informe a sistólica e a diastólica.'); return; }
    const motivo = validarPlausibilidade({ pas: nPas, pad: nPad }, parametros);
    if (motivo && !confirmado) {
      Alert.alert('Confira os valores', `${parametros.implausivel.regra.mensagemPaciente}\n\nMotivo: ${ROTULO_MOTIVO_EXCLUSAO[motivo]}. Se salvar, ela fica registrada mas não entra no cálculo.`, [
        { text: 'Corrigir', style: 'cancel' },
        { text: 'Salvar assim mesmo', onPress: () => guardar(true) },
      ]);
      return;
    }
    const novo = [...trio, { pas: nPas, pad: nPad, fc: numero(fc), medidoEm: new Date().toISOString() }];
    setTrio(novo);
    setPas(''); setPad(''); setFc('');
    if (acimaDe({ pas: nPas, pad: nPad }, parametros.muitoElevado)) {
      Alert.alert('Valor muito elevado', parametros.muitoElevado.regra.mensagemPaciente);
    }
    if (novo.length < 3) { setEtapa('espera'); return; }
    setSalvando(true);
    try {
      await registrarTrio(periodo, novo);
      setEtapa('resumo');
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
      setTrio(trio);
    } finally {
      setSalvando(false);
    }
  };

  const md = media(trio.filter((m) => parametros && validarPlausibilidade(m, parametros) === null));

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="MRPA" title={`Medidas da ${rotuloPeriodo}`} onBack={() => router.back()} />

        {etapa === 'preparo' ? (
          <>
            <Text style={styles.secao}>Prepare-se</Text>
            {preparoMedida.map((t) => <Text key={t} style={styles.item}>• {t}</Text>)}
            <Text style={[styles.item, { marginTop: Spacing.md }]}>Antes da refeição e do remédio de pressão. Se já comeu, espere 2 horas.</Text>
            <Button label="Já descansei 5 minutos — começar" onPress={() => setEtapa('medida')} style={{ marginTop: Spacing.xxl }} />
          </>
        ) : null}

        {etapa === 'medida' ? (
          <>
            <Text style={styles.secao}>Medida {ordem} de 3</Text>
            <View style={styles.linhaCampos}>
              <Input value={pas} onChangeText={setPas} placeholder="Sistólica" keyboardType="number-pad" style={{ flex: 1 }} autoFocus />
              <Input value={pad} onChangeText={setPad} placeholder="Diastólica" keyboardType="number-pad" style={{ flex: 1 }} />
            </View>
            <Input value={fc} onChangeText={setFc} placeholder="Frequência cardíaca (opcional)" keyboardType="number-pad" style={{ marginTop: Spacing.sm }} />
            <Button label={`Salvar medida ${ordem} de 3`} onPress={() => guardar()} loading={salvando} style={{ marginTop: Spacing.xl }} />
            {trio.length ? <View style={styles.feitas}>{trio.map((m, i) => <View key={i} style={styles.feita}><Text style={styles.feitaRotulo}>Medida {i + 1}</Text><LeituraPA pas={m.pas} pad={m.pad} tamanho="linha" /></View>)}</View> : null}
          </>
        ) : null}

        {etapa === 'espera' && parametros ? (
          <>
            <Cronometro segundos={parametros.validade.intervaloMin * 60} rotulo={`Aguarde ${parametros.validade.intervaloMin} minuto para a próxima medida. Continue sentado, sem falar.`} onFim={() => setEtapa('medida')} />
            <Button label="Pular espera" variant="ghost" onPress={() => setEtapa('medida')} />
          </>
        ) : null}

        {etapa === 'resumo' ? (
          <>
            <Text style={styles.secao}>Medidas salvas</Text>
            {md ? (
              <View style={styles.resumo}>
                <Text style={styles.resumoRotulo}>Média da {rotuloPeriodo}</Text>
                <LeituraPA pas={md.pas} pad={md.pad} tamanho="grande" />
              </View>
            ) : null}
            <View style={[styles.mensagem, { backgroundColor: Alerta.cinza.bg }]}>
              <Text style={styles.mensagemTexto}>Nenhuma interpretação é feita antes do fim do protocolo. Siga com as próximas medidas nos horários combinados.</Text>
            </View>
            <Button label="Voltar para o dia" onPress={() => router.back()} style={{ marginTop: Spacing.xxl }} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.md },
  item: { ...Typography.body, color: Colors.textSecondary },
  linhaCampos: { flexDirection: 'row', gap: Spacing.sm },
  feitas: { marginTop: Spacing.xxl, gap: Spacing.sm },
  feita: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  feitaRotulo: { ...Typography.caption, color: Colors.textSecondary },
  resumo: { gap: Spacing.xs, marginBottom: Spacing.lg },
  resumoRotulo: { ...Typography.subheading, color: Colors.textSecondary },
  mensagem: { borderRadius: Radius.bloco, padding: Spacing.xl },
  mensagemTexto: { ...Typography.body, color: Colors.textSecondary },
});
