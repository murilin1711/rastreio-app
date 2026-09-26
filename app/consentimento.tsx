import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registrarConsentimento } from '@core/consentimento/repositorio';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { type Aceites, AceiteTermos } from '@modules/conta/AceiteTermos';
import { Button, Colors, InternalHeader, Spacing, Typography } from '@ui/index';

/**
 * D-056: quem tem conta sem o aceite na versão atual (contas de antes dos termos, ou depois de uma versão
 * nova) passa por aqui antes do app. Recusar é sair da conta; excluir fica em Minha Saúde.
 */
export default function Consentimento() {
  const router = useRouter();
  const { sessao, sair } = useSessao();
  const [aceites, setAceites] = useState<Aceites>({ termos: false, dadosSaude: false });
  const [salvando, setSalvando] = useState(false);

  const continuar = async () => {
    if (!aceites.termos || !aceites.dadosSaude) {
      return Alert.alert('Faltou marcar', 'Para continuar, marque as duas caixas: os termos de uso e a autorização para guardar seus dados de saúde.');
    }
    if (!sessao) return;
    setSalvando(true);
    try {
      await registrarConsentimento(sessao.user.id);
      router.replace('/');
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader variante="raiz" title="Antes de continuar" />
        <Text style={styles.texto}>
          O NERO agora tem termos de uso. Para continuar, leia e aceite os termos e autorize o app a guardar seus dados de saúde, como já fazia.
        </Text>
        <AceiteTermos valor={aceites} onChange={setAceites} />
        <Button label="Continuar" onPress={continuar} loading={salvando} style={{ marginTop: Spacing.xl }} />
        <Button label="Sair da conta" variant="ghost" onPress={() => { sair(); }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, gap: Spacing.md },
  texto: { ...Typography.body, color: Colors.textSecondary },
});
