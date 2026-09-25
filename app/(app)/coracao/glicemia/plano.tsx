import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agendarLembretesGlicemia } from '@core/cardio/lembretesCardio';
import { useGlicemia } from '@core/cardio/useGlicemia';
import { normalizarHorario } from '@core/medicacoes/horarios';
import type { MetasGlicemia, PerfilMetaGlicemica, PlanoGlicemia, TipoDiabetes, UsoInsulina } from '@core/perfil/tipos';
import { usePerfil } from '@core/perfil/usePerfil';
import { modelosPlano } from '@core/regras/cardio/glicemia';
import type { MomentoGlicemia } from '@core/regras/cardio/tiposGlicemia';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { usePedidoDeAvisos } from '@core/lembretes/usePedidoDeAvisos';
import { MOMENTOS, rotuloMomento, ROTULO_PERFIL_META } from '@modules/coracao/conteudo/glicemia';
import { CampoHorario, Button, Colors, Input, InternalHeader, Opcoes, Spacing, Typography } from '@ui/index';

type Quem = 'medico' | 'outro_profissional' | 'diretriz';
type QuemPlano = 'medico' | 'outro_profissional' | 'nenhum';
const MOMENTOS_PLANO = MOMENTOS.filter((m) => ['jejum', 'antes_cafe', 'pos_cafe_2h', 'antes_almoco', 'pos_almoco_2h', 'antes_jantar', 'pos_jantar_2h', 'antes_dormir', 'madrugada'].includes(m.valor));
const HORA_PADRAO: Partial<Record<MomentoGlicemia, string>> = { jejum: '07:00', antes_cafe: '07:00', pos_cafe_2h: '09:30', antes_almoco: '12:00', pos_almoco_2h: '14:30', antes_jantar: '19:00', pos_jantar_2h: '21:30', antes_dormir: '22:30', madrugada: '03:00' };

/** Meu plano de glicemia (§7, C-012): metas (médico ou diretriz) e horários de medida (médico ou modelos da SBD). */
export default function PlanoGlicemia() {
  const router = useRouter();
  const { sessao } = useSessao();
  const { perfil, salvar } = usePerfil();
  const { parametros } = useGlicemia();
  const avisos = usePedidoDeAvisos();
  const [tipo, setTipo] = useState<TipoDiabetes | null>(null);
  const [insulina, setInsulina] = useState<UsoInsulina | null>(null);
  const [quemMetas, setQuemMetas] = useState<Quem | null>(null);
  const [perfilMeta, setPerfilMeta] = useState<PerfilMetaGlicemica>('adulto');
  const [m, setM] = useState({ jejumMin: '', jejumMax: '', posMax: '', deitarMin: '', deitarMax: '' });
  const [quemPlano, setQuemPlano] = useState<QuemPlano | null>(null);
  const [horarios, setHorarios] = useState<{ momento: MomentoGlicemia; hora: string }[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    setTipo(perfil.tipoDiabetes);
    setInsulina(perfil.usaInsulina);
    setPerfilMeta(perfil.perfilMetaGlicemica);
    const mg = perfil.metasGlicemia;
    setQuemMetas(mg?.definidasPor ?? null);
    if (mg && mg.definidasPor !== 'diretriz') setM({ jejumMin: String(mg.jejumMin), jejumMax: String(mg.jejumMax), posMax: mg.posMax == null ? '' : String(mg.posMax), deitarMin: String(mg.deitarMin), deitarMax: String(mg.deitarMax) });
    setQuemPlano(perfil.planoGlicemia?.definidoPor ?? null);
    setHorarios(perfil.planoGlicemia?.horarios ?? []);
  }, [perfil]);

  const alternarMomento = (mom: MomentoGlicemia) =>
    setHorarios(horarios.some((h) => h.momento === mom) ? horarios.filter((h) => h.momento !== mom) : [...horarios, { momento: mom, hora: HORA_PADRAO[mom] ?? '08:00' }]);
  const setHora = (mom: MomentoGlicemia, hora: string) => setHorarios(horarios.map((h) => (h.momento === mom ? { ...h, hora } : h)));
  const aplicarModelo = (momentos: MomentoGlicemia[], modelo: PlanoGlicemia['modelo']) => { setHorarios(momentos.map((mom) => ({ momento: mom, hora: HORA_PADRAO[mom] ?? '08:00' }))); setModelo(modelo); };
  const [modelo, setModelo] = useState<PlanoGlicemia['modelo']>(null);

  const gravar = async () => {
    if (!perfil?.temDiabetes) { Alert.alert('Metas e plano', 'Metas e plano de medidas valem para quem tem diabetes no perfil. Se você tem diabetes, atualize seu perfil de saúde.'); return; }
    let metas: MetasGlicemia | null = null;
    if (quemMetas === 'medico' || quemMetas === 'outro_profissional') {
      const v = { jejumMin: Number(m.jejumMin), jejumMax: Number(m.jejumMax), posMax: m.posMax.trim() ? Number(m.posMax) : null, deitarMin: Number(m.deitarMin), deitarMax: Number(m.deitarMax) };
      if (!v.jejumMin || !v.jejumMax || !v.deitarMin || !v.deitarMax || v.jejumMin >= v.jejumMax || v.deitarMin >= v.deitarMax) { Alert.alert('Confira as metas', 'Informe jejum e ao deitar com mínimo menor que máximo.'); return; }
      metas = { definidasPor: quemMetas, ...v };
    } else if (quemMetas === 'diretriz') {
      metas = { definidasPor: 'diretriz', jejumMin: 0, jejumMax: 0, posMax: null, deitarMin: 0, deitarMax: 0 };
    }
    const hs = horarios.map((h) => ({ momento: h.momento, hora: normalizarHorario(h.hora) ?? '' }));
    if (hs.some((h) => !h.hora)) { Alert.alert('Horário inválido', 'Use o formato 07:00.'); return; }
    if (hs.length) await avisos.pedir(); // D-043: pergunta dos avisos na hora em que o lembrete é ligado, antes de criá-lo.
    setSalvando(true);
    try {
      await salvar({ tipoDiabetes: tipo, usaInsulina: insulina, perfilMetaGlicemica: perfilMeta, metasGlicemia: metas, planoGlicemia: { definidoPor: quemPlano ?? 'nenhum', modelo, horarios: hs } });
      if (sessao?.user.id) await agendarLembretesGlicemia(sessao.user.id, hs).catch(() => {});
      router.back();
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally {
      setSalvando(false);
    }
  };

  const tabelaAdulto = parametros?.metas[perfilMeta];

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Glicemia" title="Meu plano de glicemia" />

        <Text style={styles.secao}>Seu diabetes</Text>
        <Opcoes<TipoDiabetes> opcoes={[{ valor: 'dm1', rotulo: 'Tipo 1' }, { valor: 'dm2', rotulo: 'Tipo 2' }, { valor: 'gestacional', rotulo: 'Gestacional' }, { valor: 'outro', rotulo: 'Outro' }]} valor={tipo} onChange={setTipo} />
        <Text style={styles.rotulo}>Insulina</Text>
        <Opcoes<UsoInsulina> opcoes={[{ valor: 'nao', rotulo: 'Não uso' }, { valor: 'basal', rotulo: 'Uma dose por dia (basal)' }, { valor: 'intensiva', rotulo: 'Várias doses por dia ou bomba' }]} valor={insulina} onChange={setInsulina} />

        <Text style={styles.secao}>Quem definiu suas metas?</Text>
        <Opcoes<Quem> opcoes={[{ valor: 'medico', rotulo: 'Meu médico' }, { valor: 'outro_profissional', rotulo: 'Outro profissional de saúde' }, { valor: 'diretriz', rotulo: 'Ainda não tenho metas', descricao: 'O app usa as metas da diretriz da SBD 2026 até você combinar com seu médico.' }]} valor={quemMetas} onChange={setQuemMetas} />
        {quemMetas === 'medico' || quemMetas === 'outro_profissional' ? (
          <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
            <Text style={styles.rotulo}>Jejum e antes das refeições (mg/dL)</Text>
            <View style={styles.linhaCampos}><Input value={m.jejumMin} onChangeText={(v) => setM({ ...m, jejumMin: v })} placeholder="mín. 80" keyboardType="number-pad" style={{ flex: 1 }} /><Input value={m.jejumMax} onChangeText={(v) => setM({ ...m, jejumMax: v })} placeholder="máx. 130" keyboardType="number-pad" style={{ flex: 1 }} /></View>
            <Text style={styles.rotulo}>2 horas após as refeições — máximo (deixe vazio se não houver)</Text>
            <Input value={m.posMax} onChangeText={(v) => setM({ ...m, posMax: v })} placeholder="180" keyboardType="number-pad" />
            <Text style={styles.rotulo}>Ao deitar (mg/dL)</Text>
            <View style={styles.linhaCampos}><Input value={m.deitarMin} onChangeText={(v) => setM({ ...m, deitarMin: v })} placeholder="mín. 90" keyboardType="number-pad" style={{ flex: 1 }} /><Input value={m.deitarMax} onChangeText={(v) => setM({ ...m, deitarMax: v })} placeholder="máx. 150" keyboardType="number-pad" style={{ flex: 1 }} /></View>
          </View>
        ) : quemMetas === 'diretriz' ? (
          <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
            <Text style={styles.rotulo}>Seu médico enquadrou suas metas como…</Text>
            <Opcoes<PerfilMetaGlicemica> opcoes={[{ valor: 'adulto', rotulo: 'Adulto ou idoso saudável', descricao: 'Padrão' }, { valor: 'idoso_comprometido', rotulo: 'Idoso com saúde comprometida', descricao: 'Só se seu médico indicou' }, { valor: 'idoso_muito_comprometido', rotulo: 'Idoso muito comprometido', descricao: 'Só se seu médico indicou' }]} valor={perfilMeta} onChange={setPerfilMeta} />
            {tabelaAdulto ? <Text style={styles.ajuda}>Meta da diretriz SBD 2026 ({ROTULO_PERFIL_META[perfilMeta]}): jejum {tabelaAdulto.jejum[0]}–{tabelaAdulto.jejum[1]} · 2 h após {tabelaAdulto.pos != null ? `< ${tabelaAdulto.pos}` : 'sem meta'} · ao deitar {tabelaAdulto.deitar[0]}–{tabelaAdulto.deitar[1]}. Confirme com seu médico.</Text> : null}
          </View>
        ) : null}

        <Text style={styles.secao}>Quem definiu seu plano de medidas?</Text>
        <Opcoes<QuemPlano> opcoes={[{ valor: 'medico', rotulo: 'Meu médico' }, { valor: 'outro_profissional', rotulo: 'Outro profissional de saúde' }, { valor: 'nenhum', rotulo: 'Ainda não tenho plano' }]} valor={quemPlano} onChange={setQuemPlano} />
        {quemPlano === 'nenhum' ? (
          <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
            <Text style={styles.ajuda}>Modelos da diretriz da SBD 2026 — sugestões para você confirmar com seu médico:</Text>
            {modelosPlano(tipo, insulina).map((mod) => (
              <Opcoes key={mod.id} opcoes={[{ valor: mod.id, rotulo: mod.rotulo, descricao: `${mod.descricao} (${mod.fonte})` }]} valor={modelo} onChange={() => aplicarModelo(mod.momentos, mod.id)} />
            ))}
          </View>
        ) : null}
        {quemPlano ? (
          <View style={{ marginTop: Spacing.lg }}>
            <Text style={styles.rotulo}>Horários das medidas (o app lembra você)</Text>
            {MOMENTOS_PLANO.map((mom) => {
              const h = horarios.find((x) => x.momento === mom.valor);
              return (
                <View key={mom.valor} style={styles.momentoLinha}>
                  <View style={{ flex: 1 }}><Opcoes opcoes={[{ valor: mom.valor, rotulo: mom.rotulo }]} valor={h ? [mom.valor] : []} onChange={() => alternarMomento(mom.valor)} multiplo /></View>
                  {h ? <View style={{ width: 130 }}><CampoHorario valor={h.hora} accessibilityLabel={`Horário: ${mom.rotulo}`} onChange={(v) => setHora(mom.valor, v)} /></View> : null}
                </View>
              );
            })}
            {horarios.length ? <Text style={styles.ajuda}>{horarios.length} {horarios.length === 1 ? 'horário' : 'horários'}: {horarios.map((h) => `${rotuloMomento(h.momento)} ${h.hora}`).join(' · ')}</Text> : null}
          </View>
        ) : null}

        <Button label="Salvar plano" onPress={gravar} loading={salvando} style={{ marginTop: Spacing.xxl }} />
      </ScrollView>
      {avisos.modal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  ajuda: { ...Typography.caption, color: Colors.textSecondary },
  linhaCampos: { flexDirection: 'row', gap: Spacing.sm },
  momentoLinha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
});
