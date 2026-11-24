import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DoseClassificada } from '@core/medicacoes/adesao';
import { formatarHorarios, horaCurta, mesclarQuantidades, rotaTomar } from '@core/medicacoes/horarios';
import type { Medicacao, UnidadeDose } from '@core/medicacoes/tipos';
import { UNIDADES } from '@core/medicacoes/unidades';
import { useDosesHoje } from '@core/medicacoes/useDosesHoje';
import { useMedicacoes } from '@core/medicacoes/useMedicacoes';
import { useAbrir } from '@core/navegacao/useVoltar';
import { usePerfil } from '@core/perfil/usePerfil';
import { useSessao } from '@core/sessao/SessaoProvider';
import { useConquistas } from '@core/bemestar/useConquistas';
import { CONQUISTA_PERFIL } from '@core/regras/bemestar/conquistas';
import { TEXTO_CONQUISTA } from '@modules/bem-estar/conteudo/conquistas';
import { traduzirErro } from '@core/supabase/erros';
import { usePedidoDeAvisos } from '@core/lembretes/usePedidoDeAvisos';
import { Secao } from '@modules/minha-saude/Secao';
import { HorariosRemedio } from '@modules/minha-saude/HorariosRemedio';
import { DosesPorHorario } from '@modules/minha-saude/DosesPorHorario';
import { deveExplicarMarcacao, FRASE_MARCAR, rotuloEstadoDose } from '@modules/remedios/rotulos';
import { Button, CampoData, Card, Colors, Input, InternalHeader, ModalComemoracao, Opcoes, Radius, Spacing, Typography } from '@ui/index';

type Form = Partial<Medicacao>;

const OPCOES_UNIDADE = (Object.keys(UNIDADES) as UnidadeDose[]).map((u) => ({ valor: u, rotulo: UNIDADES[u].rotulo }));

const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export default function Medicamentos() {
  const { online } = useSessao();
  const { medicacoes, salvar, alternarAtiva } = useMedicacoes();
  const { perfil, salvar: salvarPerfil } = usePerfil();
  const [editando, setEditando] = useState<Form | null>(null);
  const [salvando, setSalvando] = useState(false);
  // "Perfil completo" sai aqui, na hora em que o último pedaço é salvo (não depois, em outra tela).
  const conquistas = useConquistas({ auto: false, chaves: CONQUISTA_PERFIL });
  const avisos = usePedidoDeAvisos();
  const abrirRota = useAbrir();
  // Doses de hoje de cada remédio, no cartão. A primeira carga é a montagem (o hook carrega sozinho);
  // depois, a cada volta para a tela (ex.: vindo de "Tomou?") e ao salvar.
  const doses = useDosesHoje();
  const recarregarDoses = doses.recarregar;
  const jaFocou = useRef(false);
  useFocusEffect(useCallback(() => {
    if (jaFocou.current) recarregarDoses();
    jaFocou.current = true;
  }, [recarregarDoses]));

  const abrir = (m?: Medicacao) =>
    setEditando(m ? { ...m } : { ativa: true, horarios: [], unidade: 'comprimido', doseVariavel: false, sePrecisar: false });

  const gravar = async () => {
    const nome = editando?.nome?.trim();
    if (!nome) {
      Alert.alert('Faltou algo', 'Informe o nome do medicamento.');
      return;
    }
    // Horários vêm da roda (D-045): não há formato a validar. Sem horário, é "se precisar".
    const sePrecisar = !!editando?.sePrecisar || !(editando?.horarios ?? []).length;
    const horarios = sePrecisar ? [] : editando?.horarios ?? [];
    // Decide antes de salvar: depois, a lista já traz o remédio novo.
    const explicar = deveExplicarMarcacao(medicacoes, !sePrecisar);
    setSalvando(true);
    try {
      await salvar({
        id: editando?.id,
        nome,
        dose: editando?.dose?.trim() || null,
        horarios,
        unidade: editando?.unidade ?? 'comprimido',
        doseVariavel: editando?.doseVariavel ?? false,
        sePrecisar,
        desde: editando?.desde ?? null,
        ate: editando?.ate ?? null,
        prescritor: editando?.prescritor?.trim() || null,
        ativa: editando?.ativa ?? true,
        lembrar: !sePrecisar && (editando?.lembrar ?? false),
        observacao: editando?.observacao?.trim() || null,
      });
      if (perfil?.semMedicacoes) await salvarPerfil({ semMedicacoes: false });
      setEditando(null);
      recarregarDoses();
      conquistas.avaliar();
      if (explicar) Alert.alert('Marque cada dose', FRASE_MARCAR);
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally {
      setSalvando(false);
    }
  };

  const alternar = (m: Medicacao) =>
    alternarAtiva(m.id, !m.ativa)
      .then(() => recarregarDoses())
      .catch((e) => Alert.alert('Não foi possível atualizar', traduzirErro(e).mensagemUsuario));

  const cartao = (m: Medicacao) => (
    <CardMed
      key={m.id}
      m={m}
      doses={m.ativa ? doses.doses.filter((d) => d.medicacaoId === m.id) : []}
      onEditar={() => abrir(m)}
      onAlternar={() => alternar(m)}
      onDose={(d) => abrirRota(rotaTomar(m.id, d.hora, d.data))}
    />
  );

  const ativas = medicacoes.filter((m) => m.ativa);
  const interrompidas = medicacoes.filter((m) => !m.ativa);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Saúde" title="Meus remédios" />
        <Text style={styles.frase}>{FRASE_MARCAR}</Text>
        <Text style={styles.ajuda}>
          Seus relatórios podem informar ao médico o que você usa e desde quando. O NERO nunca sugere alterar doses.
        </Text>

        {medicacoes.length === 0 && !editando ? (
          perfil?.semMedicacoes ? (
            <View style={styles.aviso}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
              <Text style={styles.avisoTexto}>Você informou que não usa medicamentos. Se começar a usar algum, adicione aqui.</Text>
            </View>
          ) : (
            <Text style={styles.vazio}>Nenhum medicamento registrado. Se não usa nenhum, pode marcar isso na tela inicial.</Text>
          )
        ) : null}

        {doses.erro && ativas.some((m) => !m.sePrecisar) ? (
          <View style={styles.erroDoses}>
            <Text style={styles.erroTexto}>Não foi possível carregar as doses de hoje. {doses.erro}</Text>
            <Button label="Tentar de novo" variant="ghost" onPress={() => recarregarDoses()} />
          </View>
        ) : null}

        <View style={{ gap: Spacing.sm }}>
          {ativas.map(cartao)}
        </View>

        {interrompidas.length ? (
          <>
            <Text style={styles.subtitulo}>Histórico</Text>
            <View style={{ gap: Spacing.sm }}>
              {interrompidas.map(cartao)}
            </View>
          </>
        ) : null}

        <View style={{ marginTop: Spacing.xxl }}>
          {editando ? (
            <Secao titulo={editando.id ? 'Editar medicamento' : 'Novo medicamento'}>
              <Input placeholder="Nome, por exemplo Losartana" value={editando.nome ?? ''} onChangeText={(v) => setEditando({ ...editando, nome: v })} />
              <Input placeholder="Dose, por exemplo 50 mg" value={editando.dose ?? ''} onChangeText={(v) => setEditando({ ...editando, dose: v })} />
              <Chave
                titulo="Tomo só quando preciso"
                sub="Sem horário fixo e sem lembrete."
                valor={editando.sePrecisar ?? false}
                onChange={(v) => setEditando({ ...editando, sePrecisar: v })}
              />
              {!editando.sePrecisar ? (
                <>
                  <HorariosRemedio horarios={(editando.horarios ?? []).map((h) => h.hora)} onChange={(hs) => setEditando({ ...editando, horarios: mesclarQuantidades(hs, editando.horarios ?? []) })} />
                  <Text style={styles.rotulo}>Como você toma?</Text>
                  {/* Trocar a unidade não mexe nas quantidades já escolhidas. */}
                  <Opcoes<UnidadeDose> opcoes={OPCOES_UNIDADE} valor={editando.unidade ?? 'comprimido'} onChange={(u) => setEditando({ ...editando, unidade: u })} />
                  <DosesPorHorario horarios={editando.horarios ?? []} unidade={editando.unidade ?? 'comprimido'} onChange={(hs) => setEditando({ ...editando, horarios: hs })} />
                  <Chave
                    titulo="A dose muda conforme o dia"
                    sub="Ex.: insulina de correção. Você anota a quantidade ao tomar."
                    valor={editando.doseVariavel ?? false}
                    onChange={(v) => setEditando({ ...editando, doseVariavel: v })}
                  />
                  <Chave
                    titulo="Lembrar nos horários"
                    sub="Notificação no celular em cada horário informado."
                    valor={editando.lembrar ?? false}
                    onChange={(v) => { setEditando({ ...editando, lembrar: v }); if (v) avisos.pedir(); /* D-043 */ }}
                  />
                </>
              ) : null}
              <CampoData rotulo="Desde quando?" valor={editando.desde ?? null} onChange={(v) => setEditando({ ...editando, desde: v })} />
              <Input placeholder="Quem prescreveu (opcional)" value={editando.prescritor ?? ''} onChangeText={(v) => setEditando({ ...editando, prescritor: v })} />
              <Input placeholder="Observação (opcional)" value={editando.observacao ?? ''} onChangeText={(v) => setEditando({ ...editando, observacao: v })} />
              {!online ? <Text style={styles.offline}>Sem conexão com a internet. Você poderá salvar quando a rede voltar.</Text> : null}
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Button label="Cancelar" variant="ghost" onPress={() => setEditando(null)} style={{ flex: 1 }} />
                <Button label="Salvar" onPress={gravar} loading={salvando} disabled={!online} style={{ flex: 1 }} />
              </View>
            </Secao>
          ) : (
            <Button label="Adicionar medicamento" variant="outline" onPress={() => abrir()} />
          )}
        </View>
      </ScrollView>
      {avisos.modal}
      <ModalComemoracao conteudo={conquistas.proxima ? TEXTO_CONQUISTA[conquistas.proxima] : null} aoFechar={conquistas.dispensar} />
    </SafeAreaView>
  );
}

function Chave({ titulo, sub, valor, onChange }: { titulo: string; sub: string; valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitulo}>{titulo}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <Switch value={valor} onValueChange={onChange} trackColor={{ true: Colors.accent }} accessibilityLabel={titulo} />
    </View>
  );
}

function CardMed({ m, doses, onEditar, onAlternar, onDose }: {
  m: Medicacao;
  doses: DoseClassificada[];
  onEditar: () => void;
  onAlternar: () => void;
  onDose: (d: DoseClassificada) => void;
}) {
  const quando = m.sePrecisar ? 'Se precisar' : m.horarios.length ? formatarHorarios(m.horarios.map((h) => h.hora)) : 'Sem horário definido';
  return (
    <Card style={[styles.card, !m.ativa && { opacity: 0.6 }]}>
      <View style={styles.cardTopo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitulo}>{m.nome}{m.dose ? `, ${m.dose}` : ''}</Text>
          <Text style={styles.cardSub}>
            {quando}
            {m.desde ? ` · desde ${dataBr(m.desde)}` : ''}
            {!m.ativa && m.ate ? `: até ${dataBr(m.ate)}` : ''}
          </Text>
        </View>
        <Pressable onPress={onEditar} hitSlop={8} accessibilityLabel="Editar"><Ionicons name="create-outline" size={22} color={Colors.textSecondary} /></Pressable>
        <Pressable onPress={onAlternar} hitSlop={8} accessibilityLabel={m.ativa ? 'Marcar como interrompido' : 'Voltar a usar'}>
          <Ionicons name={m.ativa ? 'pause-circle-outline' : 'play-circle-outline'} size={24} color={Colors.textSecondary} />
        </Pressable>
      </View>
      {doses.length ? (
        <View style={styles.doses}>
          {doses.map((d) => {
            const rotulo = `${horaCurta(d.hora)} · ${rotuloEstadoDose(d)}`;
            return (
              <Pressable
                key={d.hora}
                onPress={() => onDose(d)}
                accessibilityRole="button"
                accessibilityLabel={`Dose das ${horaCurta(d.hora)}: ${rotuloEstadoDose(d)}`}
                style={({ pressed }) => [styles.dose, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.doseTexto}>{rotulo}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xs },
  toggleTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  toggleSub: { ...Typography.caption, color: Colors.textSecondary },
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  frase: { ...Typography.caption, color: Colors.textPrimary, marginBottom: Spacing.sm },
  ajuda: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary },
  erroDoses: { gap: Spacing.xs, marginBottom: Spacing.sm },
  erroTexto: { ...Typography.caption, color: Colors.warning },
  vazio: { ...Typography.body, color: Colors.textSecondary, fontStyle: 'italic' },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  avisoTexto: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  subtitulo: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  card: { gap: Spacing.md, padding: Spacing.lg },
  cardTopo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  doses: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  dose: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.md, borderRadius: Radius.linha, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  doseTexto: { ...Typography.body, color: Colors.textPrimary },
  cardTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  cardSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  offline: { ...Typography.caption, color: Colors.warning, textAlign: 'center' },
});
