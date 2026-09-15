import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatarHorarios, parsearHorarios } from '@core/medicacoes/horarios';
import type { Medicacao } from '@core/medicacoes/tipos';
import { useMedicacoes } from '@core/medicacoes/useMedicacoes';
import { usePerfil } from '@core/perfil/usePerfil';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { Secao } from '@modules/minha-saude/Secao';
import { Button, CampoData, Card, Colors, Input, InternalHeader, Spacing, Typography } from '@ui/index';

type Form = Partial<Medicacao> & { horariosTexto?: string };

const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export default function Medicamentos() {
  const { online } = useSessao();
  const { medicacoes, salvar, alternarAtiva } = useMedicacoes();
  const { perfil, salvar: salvarPerfil } = usePerfil();
  const [editando, setEditando] = useState<Form | null>(null);
  const [salvando, setSalvando] = useState(false);

  const abrir = (m?: Medicacao) => setEditando(m ? { ...m, horariosTexto: formatarHorarios(m.horarios) } : { ativa: true, horariosTexto: '' });

  const gravar = async () => {
    const nome = editando?.nome?.trim();
    if (!nome) {
      Alert.alert('Faltou algo', 'Informe o nome do medicamento.');
      return;
    }
    const { horarios, invalidos } = parsearHorarios(editando?.horariosTexto ?? '');
    if (invalidos.length) {
      Alert.alert('Horário inválido', `Não entendi "${invalidos[0]}". Use o formato 08:00 ou 20h30, separados por vírgula.`);
      return;
    }
    setSalvando(true);
    try {
      await salvar({
        id: editando?.id,
        nome,
        dose: editando?.dose?.trim() || null,
        horarios,
        desde: editando?.desde ?? null,
        ate: editando?.ate ?? null,
        prescritor: editando?.prescritor?.trim() || null,
        ativa: editando?.ativa ?? true,
        observacao: editando?.observacao?.trim() || null,
      });
      if (perfil?.semMedicacoes) await salvarPerfil({ semMedicacoes: false });
      setEditando(null);
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally {
      setSalvando(false);
    }
  };

  const alternar = (m: Medicacao) =>
    alternarAtiva(m.id, !m.ativa).catch((e) => Alert.alert('Não foi possível atualizar', traduzirErro(e).mensagemUsuario));

  const ativas = medicacoes.filter((m) => m.ativa);
  const interrompidas = medicacoes.filter((m) => !m.ativa);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Saúde" title="Meus medicamentos" />
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

        <View style={{ gap: Spacing.sm }}>
          {ativas.map((m) => <CardMed key={m.id} m={m} onEditar={() => abrir(m)} onAlternar={() => alternar(m)} />)}
        </View>

        {interrompidas.length ? (
          <>
            <Text style={styles.subtitulo}>Interrompidos</Text>
            <View style={{ gap: Spacing.sm }}>
              {interrompidas.map((m) => <CardMed key={m.id} m={m} onEditar={() => abrir(m)} onAlternar={() => alternar(m)} />)}
            </View>
          </>
        ) : null}

        <View style={{ marginTop: Spacing.xxl }}>
          {editando ? (
            <Secao titulo={editando.id ? 'Editar medicamento' : 'Novo medicamento'}>
              <Input placeholder="Nome, por exemplo Losartana" value={editando.nome ?? ''} onChangeText={(v) => setEditando({ ...editando, nome: v })} />
              <Input placeholder="Dose, por exemplo 50 mg" value={editando.dose ?? ''} onChangeText={(v) => setEditando({ ...editando, dose: v })} />
              <Input placeholder="Horários, por exemplo 08:00, 20:00" value={editando.horariosTexto ?? ''} onChangeText={(v) => setEditando({ ...editando, horariosTexto: v })} />
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
    </SafeAreaView>
  );
}

function CardMed({ m, onEditar, onAlternar }: { m: Medicacao; onEditar: () => void; onAlternar: () => void }) {
  return (
    <Card style={[styles.card, !m.ativa && { opacity: 0.6 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitulo}>{m.nome}{m.dose ? `, ${m.dose}` : ''}</Text>
        <Text style={styles.cardSub}>
          {m.horarios.length ? formatarHorarios(m.horarios) : 'Sem horário definido'}
          {m.desde ? ` — desde ${dataBr(m.desde)}` : ''}
          {!m.ativa && m.ate ? ` — até ${dataBr(m.ate)}` : ''}
        </Text>
      </View>
      <Pressable onPress={onEditar} hitSlop={8} accessibilityLabel="Editar"><Ionicons name="create-outline" size={22} color={Colors.textSecondary} /></Pressable>
      <Pressable onPress={onAlternar} hitSlop={8} accessibilityLabel={m.ativa ? 'Marcar como interrompido' : 'Voltar a usar'}>
        <Ionicons name={m.ativa ? 'pause-circle-outline' : 'play-circle-outline'} size={24} color={Colors.textSecondary} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  ajuda: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  vazio: { ...Typography.body, color: Colors.textSecondary, fontStyle: 'italic' },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  avisoTexto: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  subtitulo: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  cardTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  cardSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  offline: { ...Typography.caption, color: Colors.warning, textAlign: 'center' },
});
