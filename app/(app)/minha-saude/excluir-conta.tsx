import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { excluirConta } from '@core/sessao/excluirConta';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { Button, Colors, Input, InternalHeader, Spacing, Typography } from '@ui/index';

const PALAVRA = 'EXCLUIR';

/** D-013: exclusão irreversível da conta (exigência App Store / Play). O logout acontece dentro de `excluirConta`. */
export default function ExcluirConta() {
  const { sessao, online } = useSessao();
  const [confirmacao, setConfirmacao] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const pronto = confirmacao.trim().toUpperCase() === PALAVRA;

  const confirmar = () => {
    Alert.alert('Excluir sua conta?', 'Isso apaga todos os seus registros, documentos e relatórios. Não dá para desfazer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: executar },
    ]);
  };

  const executar = async () => {
    if (!sessao?.user.id) return;
    setExcluindo(true);
    try {
      await excluirConta(sessao.user.id);
    } catch (e) {
      setExcluindo(false);
      Alert.alert('Não foi possível excluir', traduzirErro(e).mensagemUsuario);
    }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Saúde" title="Excluir minha conta" />

        <View style={styles.bloco}>
          <Text style={styles.paragrafo}>Ao excluir a conta, apagamos de forma definitiva:</Text>
          <Text style={styles.item}>• seu perfil de saúde e antecedentes familiares;</Text>
          <Text style={styles.item}>• exames, medidas, medicações, refeições, atividades, sono, metas e check-ins;</Text>
          <Text style={styles.item}>• documentos anexados e relatórios em PDF;</Text>
          <Text style={styles.item}>• links de QR Code ainda ativos, que deixam de abrir.</Text>
          <Text style={styles.paragrafo}>Se quiser guardar uma cópia, gere o relatório geral em PDF antes de continuar.</Text>
        </View>

        <Text style={styles.rotulo}>Para confirmar, digite {PALAVRA}</Text>
        <Input placeholder={PALAVRA} value={confirmacao} onChangeText={setConfirmacao} autoCapitalize="characters" autoCorrect={false} />

        {!online ? <Text style={styles.offline}>Sem conexão com a internet. A exclusão precisa de rede.</Text> : null}
        <Button label="Excluir minha conta" variant="danger" onPress={confirmar} loading={excluindo} disabled={!pronto || !online} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  bloco: { gap: Spacing.sm, marginBottom: Spacing.xl },
  paragrafo: { ...Typography.body, color: Colors.textPrimary },
  item: { ...Typography.body, color: Colors.textSecondary, paddingLeft: Spacing.sm },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginBottom: Spacing.sm },
  offline: { ...Typography.caption, color: Colors.warning, textAlign: 'center', marginTop: Spacing.sm },
});
