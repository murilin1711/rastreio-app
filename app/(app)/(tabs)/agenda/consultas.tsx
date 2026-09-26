import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Consulta } from '@core/lembretes/tipos';
import { useConsultas } from '@core/lembretes/useConsultas';
import { ESPECIALIDADES, rotuloEspecialidade } from '@core/relatorios/especialidades';
import type { Especialidade } from '@core/relatorios/tipos';
import { traduzirErro } from '@core/supabase/erros';
import { usePedidoDeAvisos } from '@core/lembretes/usePedidoDeAvisos';
import { dataHoraBr, paraISO } from '@modules/coracao/componentes/formato';
import { CampoHorario, Button, CampoData, Colors, Input, InternalHeader, Radius, Select, Spacing, Typography } from '@ui/index';

const horaValida = (h: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h);

/** Minhas consultas (D-010): lista futuras/passadas, formulário e atalho "Preparar esta consulta". */
export default function Consultas() {
  const router = useRouter();
  const { futuras, passadas, salvar, excluir, carregando } = useConsultas();
  const [aberto, setAberto] = useState(false);
  const avisos = usePedidoDeAvisos();
  const [editando, setEditando] = useState<Consulta | null>(null);
  const [especialidade, setEspecialidade] = useState<Especialidade | null>(null);
  const [data, setData] = useState<string | null>(null);
  const [hora, setHora] = useState('');
  const [local, setLocal] = useState('');
  const [profissional, setProfissional] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const abrir = (c?: Consulta) => {
    setEditando(c ?? null);
    setEspecialidade(c?.especialidade ?? null);
    setData(c ? c.dataHora.slice(0, 10) : null);
    setHora(c ? dataHoraBr(c.dataHora).slice(-5) : '');
    setLocal(c?.local ?? ''); setProfissional(c?.profissional ?? ''); setObservacao(c?.observacao ?? '');
    setAberto(true);
  };

  const gravar = async () => {
    if (!especialidade) { Alert.alert('Faltou algo', 'Escolha a especialidade.'); return; }
    if (!data) { Alert.alert('Faltou algo', 'Informe a data da consulta.'); return; }
    if (!horaValida(hora)) { Alert.alert('Faltou algo', 'Escolha a hora da consulta.'); return; }
    await avisos.pedir(); // D-043: pergunta dos avisos na hora em que o lembrete é ligado, antes de criá-lo.
    setSalvando(true);
    try {
      await salvar({ id: editando?.id, especialidade, dataHora: paraISO(data, hora), local: local.trim() || null, profissional: profissional.trim() || null, observacao: observacao.trim() || null });
      setAberto(false);
    } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); } finally { setSalvando(false); }
  };

  const apagar = (c: Consulta) => {
    Alert.alert('Apagar consulta?', 'Os lembretes dela também serão cancelados.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => { try { await excluir(c.id); } catch (e) { Alert.alert('Não foi possível apagar', traduzirErro(e).mensagemUsuario); } } },
    ]);
  };

  const Linha = ({ c, futura }: { c: Consulta; futura: boolean }) => (
    <View style={styles.linha}>
      <View style={{ flex: 1 }}>
        <Text style={styles.titulo}>{rotuloEspecialidade(c.especialidade)}</Text>
        <Text style={styles.meta}>{dataHoraBr(c.dataHora)}{c.local ? ` · ${c.local}` : ''}{c.profissional ? ` · ${c.profissional}` : ''}</Text>
        {futura ? (
          <View style={styles.acoesLinha}>
            <Pressable onPress={() => router.push({ pathname: '/(app)/(tabs)/minha-saude/consulta', params: { especialidade: c.especialidade, consultaId: c.id } })} hitSlop={6}><Text style={styles.acao}>Preparar esta consulta</Text></Pressable>
            <Pressable onPress={() => abrir(c)} hitSlop={6}><Text style={styles.acao}>Editar</Text></Pressable>
            <Pressable onPress={() => apagar(c)} hitSlop={6}><Text style={[styles.acao, { color: Colors.danger }]}>Apagar</Text></Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Meus lembretes" title="Minhas consultas" />
        {!aberto ? <Button label="Marcar consulta" onPress={() => abrir()} /> : (
          <View style={styles.form}>
            <Text style={styles.rotulo}>Especialidade</Text>
            <Select opcoes={ESPECIALIDADES.map((e) => ({ valor: e.id, rotulo: e.rotulo }))} valor={especialidade} onChange={setEspecialidade} placeholder="Escolha a especialidade" />
            <Text style={styles.rotulo}>Data</Text>
            <CampoData valor={data} onChange={setData} futuro />
            <Text style={styles.rotulo}>Hora</Text>
            <CampoHorario valor={hora || null} vazio="Escolher a hora" accessibilityLabel="Hora da consulta" onChange={setHora} />
            <Text style={styles.rotulo}>Local (opcional)</Text>
            <Input value={local} onChangeText={setLocal} placeholder="Clínica ou hospital" />
            <Text style={styles.rotulo}>Profissional (opcional)</Text>
            <Input value={profissional} onChangeText={setProfissional} placeholder="Nome do médico" />
            <Text style={styles.rotulo}>Observação (opcional)</Text>
            <Input value={observacao} onChangeText={setObservacao} multiline />
            <View style={{ gap: Spacing.sm, marginTop: Spacing.lg }}>
              <Button label={editando ? 'Salvar alterações' : 'Salvar consulta'} onPress={gravar} loading={salvando} />
              <Button label="Cancelar" variant="ghost" onPress={() => setAberto(false)} disabled={salvando} />
            </View>
          </View>
        )}
        <Text style={styles.secao}>Próximas</Text>
        {futuras.length === 0 && !carregando ? <Text style={styles.vazio}>Nenhuma consulta marcada. Ao marcar, o NERO avisa na véspera e no dia, e sugere preparar o relatório.</Text> : null}
        <View style={{ gap: Spacing.sm }}>{futuras.map((c) => <Linha key={c.id} c={c} futura />)}</View>
        {passadas.length ? (<><Text style={styles.secao}>Anteriores</Text><View style={{ gap: Spacing.sm }}>{passadas.map((c) => <Linha key={c.id} c={c} futura={false} />)}</View></>) : null}
      </ScrollView>
      {avisos.modal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  form: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  vazio: { ...Typography.body, color: Colors.textSecondary },
  linha: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.lg },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  meta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  acoesLinha: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm },
  acao: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', color: Colors.accent },
});
