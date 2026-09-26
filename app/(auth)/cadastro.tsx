import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@core/supabase/client';
import { metadataDoAceite } from '@core/consentimento/repositorio';
import { traduzirErro } from '@core/supabase/erros';
import { type Aceites, AceiteTermos } from '@modules/conta/AceiteTermos';
import { BotoesSociais } from '@modules/conta/BotoesSociais';
import { Button, Colors, Input, InternalHeader, Spacing, Typography } from '@ui/index';

export default function Cadastro() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [aceites, setAceites] = useState<Aceites>({ termos: false, dadosSaude: false });
  const aceitou = aceites.termos && aceites.dadosSaude;

  const cadastrar = async () => {
    if (nome.trim().length < 2) return Alert.alert('Faltou algo', 'Informe seu nome.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return Alert.alert('E-mail inválido', 'Confira o endereço digitado.');
    if (senha.length < 8) return Alert.alert('Senha curta', 'A senha precisa ter pelo menos 8 caracteres.');
    if (!aceitou) return Alert.alert('Faltou marcar', 'Para criar a conta, marque as duas caixas: os termos de uso e a autorização para guardar seus dados de saúde.');

    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      // D-056: o aceite vai no metadata; o gatilho do banco o registra com a versão dos termos.
      options: { data: { nome: nome.trim(), ...metadataDoAceite() } },
    });
    setCarregando(false);

    if (error) return Alert.alert('Não foi possível cadastrar', traduzirErro(error).mensagemUsuario);
    // Sem sessão = a confirmação de e-mail está ligada: o código foi enviado e a pessoa continua
    // dentro do app, na tela que espera os seis números (D-019).
    if (!data.session) return router.replace({ pathname: '/(auth)/confirmar', params: { email: email.trim() } });
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <InternalHeader variante="raiz" title="Criar conta" />
          <View style={styles.form}>
            <BotoesSociais />
            <Input placeholder="Nome" autoComplete="name" value={nome} onChangeText={setNome} />
            <Input placeholder="E-mail" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Input placeholder="Senha (mínimo 8 caracteres)" secureTextEntry autoComplete="new-password" value={senha} onChangeText={setSenha} />
            <AceiteTermos valor={aceites} onChange={setAceites} />
            <Button label="Criar conta" onPress={cadastrar} loading={carregando} />
            <Text style={styles.aviso}>
              Seus dados de saúde são seus. O NERO organiza informações e não substitui a avaliação do seu médico.
            </Text>
          </View>
          <Link href="/(auth)/login" replace style={styles.link}>
            Já tem conta? <Text style={styles.linkForte}>Entrar</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { flexGrow: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },
  form: { gap: Spacing.md },
  aviso: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md },
  link: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xxl, marginBottom: Spacing.xxl },
  linkForte: { fontFamily: 'Poppins-SemiBold', color: Colors.primary },
});
