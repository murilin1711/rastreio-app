import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AntecedenteFamiliar } from '@core/perfil/tipos';
import { usePerfil } from '@core/perfil/usePerfil';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { Secao } from '@modules/minha-saude/Secao';
import { grauPorParentesco, OPCOES_CONDICAO_FAMILIAR, OPCOES_GRAU, OPCOES_PARENTESCO, rotuloDe } from '@modules/minha-saude/opcoes';
import { Button, Card, Colors, Input, InternalHeader, Select, Spacing, Typography } from '@ui/index';

type Form = Partial<AntecedenteFamiliar>;

export default function Antecedentes() {
  const { online } = useSessao();
  const { antecedentes, salvarAntecedente, excluirAntecedente } = usePerfil();
  const [editando, setEditando] = useState<Form | null>(null);
  const [salvando, setSalvando] = useState(false);

  const gravar = async () => {
    if (!editando?.parentesco || !editando.grau || !editando.condicao) {
      Alert.alert('Faltou algo', 'Informe a condição, o parentesco e o grau.');
      return;
    }
    setSalvando(true);
    try {
      await salvarAntecedente({
        id: editando.id,
        parentesco: editando.parentesco,
        grau: editando.grau,
        condicao: editando.condicao,
        idadeDiagnostico: editando.idadeDiagnostico ?? null,
        observacao: editando.observacao?.trim() || null,
      });
      setEditando(null);
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = (a: AntecedenteFamiliar) =>
    Alert.alert('Remover antecedente', `${rotuloDe(OPCOES_PARENTESCO, a.parentesco)} — ${rotuloDe(OPCOES_CONDICAO_FAMILIAR, a.condicao)}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => excluirAntecedente(a.id).catch((e) => Alert.alert('Não foi possível remover', traduzirErro(e).mensagemUsuario)) },
    ]);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Saúde" title="Antecedentes familiares" />
        <Text style={styles.ajuda}>
          Registre casos de câncer e de infarto ou AVC precoce na família. A idade do familiar no diagnóstico ajuda a definir quando você deve começar alguns rastreamentos.
        </Text>

        {antecedentes.length === 0 && !editando ? (
          <Text style={styles.vazio}>Nenhum antecedente registrado. Se não houver casos na família, pode deixar assim.</Text>
        ) : null}

        <View style={{ gap: Spacing.sm, marginBottom: Spacing.xxl }}>
          {antecedentes.map((a) => (
            <Card key={a.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitulo}>{rotuloDe(OPCOES_CONDICAO_FAMILIAR, a.condicao)}</Text>
                <Text style={styles.cardSub}>
                  {rotuloDe(OPCOES_PARENTESCO, a.parentesco)}, {rotuloDe(OPCOES_GRAU, a.grau).toLowerCase()}
                  {a.idadeDiagnostico ? `, diagnóstico aos ${a.idadeDiagnostico} anos` : ''}
                </Text>
              </View>
              <Pressable onPress={() => setEditando(a)} hitSlop={8} accessibilityLabel="Editar"><Ionicons name="create-outline" size={22} color={Colors.textSecondary} /></Pressable>
              <Pressable onPress={() => excluir(a)} hitSlop={8} accessibilityLabel="Remover"><Ionicons name="trash-outline" size={22} color={Colors.danger} /></Pressable>
            </Card>
          ))}
        </View>

        {editando ? (
          <Secao titulo={editando.id ? 'Editar antecedente' : 'Novo antecedente'}>
            <Select placeholder="Condição" opcoes={OPCOES_CONDICAO_FAMILIAR} valor={editando.condicao ?? null} onChange={(v) => setEditando({ ...editando, condicao: v })} />
            <Select placeholder="Parentesco" opcoes={OPCOES_PARENTESCO} valor={editando.parentesco ?? null} onChange={(v) => setEditando({ ...editando, parentesco: v, grau: grauPorParentesco(v) ?? editando.grau })} />
            <Select placeholder="Grau" opcoes={OPCOES_GRAU} valor={editando.grau ?? null} onChange={(v) => setEditando({ ...editando, grau: v })} />
            <Input placeholder="Idade no diagnóstico, se souber" keyboardType="number-pad" value={editando.idadeDiagnostico?.toString() ?? ''} onChangeText={(v) => setEditando({ ...editando, idadeDiagnostico: v ? Number(v) : null })} />
            <Input placeholder="Observação" value={editando.observacao ?? ''} onChangeText={(v) => setEditando({ ...editando, observacao: v })} />
            {!online ? <Text style={styles.offline}>Sem conexão com a internet. Você poderá salvar quando a rede voltar.</Text> : null}
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Button label="Cancelar" variant="ghost" onPress={() => setEditando(null)} style={{ flex: 1 }} />
              <Button label="Salvar" onPress={gravar} loading={salvando} disabled={!online} style={{ flex: 1 }} />
            </View>
          </Secao>
        ) : (
          <Button label="Adicionar antecedente" variant="outline" onPress={() => setEditando({})} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  ajuda: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  vazio: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl, fontStyle: 'italic' },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  cardTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  cardSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  offline: { ...Typography.caption, color: Colors.warning, textAlign: 'center' },
});
