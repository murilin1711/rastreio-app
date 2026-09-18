import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalizarHorario } from '@core/medicacoes/horarios';
import { avaliarMedidaCasual, validarPlausibilidade } from '@core/regras/cardio/pressao';
import type { AvaliacaoPA, MedidaPA, SintomaPA } from '@core/regras/cardio/tipos';
import { hojeISO, usePressao } from '@core/cardio/usePressao';
import { traduzirErro } from '@core/supabase/erros';
import { horaLocal, paraISO } from '@modules/coracao/componentes/formato';
import { LeituraPA } from '@modules/coracao/componentes/LeituraPA';
import { SintomasAlarmePA } from '@modules/coracao/componentes/SintomasAlarmePA';
import { entendaReferencia, ROTULO_MOTIVO_EXCLUSAO } from '@modules/coracao/conteudo/pressao';
import { Alerta, Button, CampoData, Colors, Input, InternalHeader, Opcoes, Radius, Spacing, StatusBadge, Typography } from '@ui/index';

type Braco = NonNullable<MedidaPA['contexto']['braco']>;
type Posicao = NonNullable<MedidaPA['contexto']['posicao']>;
type Momento = NonNullable<MedidaPA['contexto']['momentoMedicacao']>;

const numero = (t: string) => (t.trim() === '' ? null : Number(t.replace(',', '.')));

/** Registro simples da pressão (§1) com alertas em camadas (§4, C-010). */
export default function RegistrarPressao() {
  const router = useRouter();
  const { parametros, registrar } = usePressao();
  const [data, setData] = useState<string | null>(hojeISO());
  const [hora, setHora] = useState(horaLocal(new Date().toISOString()));
  const [pas, setPas] = useState('');
  const [pad, setPad] = useState('');
  const [fc, setFc] = useState('');
  const [braco, setBraco] = useState<Braco | null>(null);
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [momento, setMomento] = useState<Momento | null>(null);
  const [sintomas, setSintomas] = useState<SintomaPA[]>([]);
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [saida, setSaida] = useState<{ avaliacao: AvaliacaoPA; pas: number; pad: number } | null>(null);
  const [sintomasDepois, setSintomasDepois] = useState<SintomaPA[]>([]);

  const gravar = async (confirmado = false) => {
    const nPas = numero(pas);
    const nPad = numero(pad);
    const h = normalizarHorario(hora);
    if (!parametros) return;
    if (!data || !h) { Alert.alert('Faltou algo', 'Informe a data e a hora da medida (ex.: 08:10).'); return; }
    if (nPas == null || nPad == null || Number.isNaN(nPas) || Number.isNaN(nPad)) { Alert.alert('Faltou algo', 'Informe a pressão sistólica e a diastólica.'); return; }
    const motivo = validarPlausibilidade({ pas: nPas, pad: nPad }, parametros);
    if (motivo && !confirmado) {
      Alert.alert('Confira os valores', `${parametros.implausivel.regra.mensagemPaciente}\n\nMotivo: ${ROTULO_MOTIVO_EXCLUSAO[motivo]}.`, [
        { text: 'Corrigir', style: 'cancel' },
        { text: 'Salvar assim mesmo', onPress: () => gravar(true) },
      ]);
      return;
    }
    setSalvando(true);
    try {
      const avaliacao = await registrar({
        medidoEm: paraISO(data, h),
        pas: nPas,
        pad: nPad,
        fc: numero(fc),
        contexto: { ...(braco ? { braco } : {}), ...(posicao ? { posicao } : {}), ...(momento ? { momentoMedicacao: momento } : {}) },
        observacao: observacao.trim() || undefined,
        sintomas,
      });
      setSaida({ avaliacao, pas: nPas, pad: nPad });
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally {
      setSalvando(false);
    }
  };

  if (saida && parametros) {
    // Reavaliação na tela de resultado: marcar um sintoma depois de um valor muito elevado sobe para vermelho
    const avaliacao = sintomasDepois.length ? avaliarMedidaCasual(saida, [...sintomas, ...sintomasDepois], parametros) : saida.avaliacao;
    const nivel = avaliacao.nivel;
    return (
      <SafeAreaView style={styles.tela} edges={['top']}>
        <ScrollView contentContainerStyle={styles.conteudo}>
          <InternalHeader sectionLabel="Minha Pressão" title="Medida registrada" onBack={() => router.back()} />
          <View style={styles.resultado}>
            <LeituraPA pas={saida.pas} pad={saida.pad} tamanho="grande" />
            {nivel ? <StatusBadge nivel={nivel} label={nivel === 'vermelho' ? 'Procure atendimento agora' : 'Valor muito elevado'} /> : null}
          </View>
          <View style={[styles.mensagem, nivel ? { backgroundColor: Alerta[nivel].bg } : null]}>
            <Text style={[styles.mensagemTexto, nivel ? { color: Alerta[nivel].fg } : null]}>{avaliacao.mensagem}</Text>
          </View>
          {avaliacao.camada === 'muito_elevado' ? (
            <View style={styles.bloco}>
              <SintomasAlarmePA valor={sintomasDepois} onChange={setSintomasDepois} titulo="Sente algum destes sintomas agora?" />
            </View>
          ) : null}
          {avaliacao.camada === 'contexto' && avaliacao.acimaReferenciaDomiciliar ? <Text style={styles.nota}>{entendaReferencia}</Text> : null}
          <Button label="Concluir" onPress={() => router.back()} style={{ marginTop: Spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Pressão" title="Registrar medida" />

        <Text style={styles.rotulo}>Quando</Text>
        <View style={styles.linhaCampos}>
          <View style={{ flex: 2 }}><CampoData valor={data} onChange={setData} /></View>
          <Input value={hora} onChangeText={setHora} placeholder="08:10" keyboardType="numbers-and-punctuation" style={{ flex: 1 }} />
        </View>

        <Text style={styles.rotulo}>Pressão (mmHg)</Text>
        <View style={styles.linhaCampos}>
          <Input value={pas} onChangeText={setPas} placeholder="Sistólica (ex.: 128)" keyboardType="number-pad" style={{ flex: 1 }} />
          <Input value={pad} onChangeText={setPad} placeholder="Diastólica (ex.: 78)" keyboardType="number-pad" style={{ flex: 1 }} />
        </View>
        <Text style={styles.rotulo}>Frequência cardíaca (bpm, opcional)</Text>
        <Input value={fc} onChangeText={setFc} placeholder="ex.: 68" keyboardType="number-pad" />

        <Text style={styles.rotulo}>Braço</Text>
        <Opcoes<Braco> opcoes={[{ valor: 'esquerdo', rotulo: 'Esquerdo' }, { valor: 'direito', rotulo: 'Direito' }]} valor={braco} onChange={setBraco} />
        <Text style={styles.rotulo}>Posição</Text>
        <Opcoes<Posicao> opcoes={[{ valor: 'sentado', rotulo: 'Sentado' }, { valor: 'deitado', rotulo: 'Deitado' }, { valor: 'em_pe', rotulo: 'Em pé' }]} valor={posicao} onChange={setPosicao} />
        <Text style={styles.rotulo}>Remédio de pressão</Text>
        <Opcoes<Momento> opcoes={[{ valor: 'antes', rotulo: 'Medi antes de tomar' }, { valor: 'depois', rotulo: 'Medi depois de tomar' }, { valor: 'nao_uso', rotulo: 'Não uso' }]} valor={momento} onChange={setMomento} />

        <View style={styles.bloco}>
          <SintomasAlarmePA valor={sintomas} onChange={setSintomas} />
        </View>

        <Text style={styles.rotulo}>Observações (opcional)</Text>
        <Input value={observacao} onChangeText={setObservacao} placeholder="ex.: depois de subir escada" multiline />

        <Button label="Salvar medida" onPress={() => gravar()} loading={salvando} style={{ marginTop: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  linhaCampos: { flexDirection: 'row', gap: Spacing.sm },
  bloco: { marginTop: Spacing.xxl },
  resultado: { alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.lg },
  mensagem: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.xl },
  mensagemTexto: { ...Typography.body, color: Colors.textPrimary },
  nota: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.lg },
});
