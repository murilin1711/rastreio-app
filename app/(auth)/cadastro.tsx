import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@core/supabase/client';
import { metadataDoAceite } from '@core/consentimento/repositorio';
import { apagarNome, lerNome } from '@core/onboarding/nomeGuardado';
import { traduzirErro } from '@core/supabase/erros';
import { AceiteTermos } from '@modules/conta/AceiteTermos';
import { BotoesSociais } from '@modules/conta/BotoesSociais';
import { Creditos } from '@modules/conta/Creditos';
import { Button, Colors, Input, LogoNero, Spacing, Typography } from '@ui/index';

export default function Cadastro() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [aceitou, setAceitou] = useState(false);
  // D-063: o nome dito ao Nero no onboarding já vem preenchido (a pessoa pode corrigir).
  useEffect(() => { lerNome().then((n) => { if (n) setNome((atual) => atual || n); }); }, []);

  const cadastrar = async () => {
    if (nome.trim().length < 2) return Alert.alert('Faltou algo', 'Informe seu nome.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return Alert.alert('E-mail inválido', 'Confira o endereço digitado.');
    if (senha.length < 8) return Alert.alert('Senha curta', 'A senha precisa ter pelo menos 8 caracteres.');
    if (!aceitou) return Alert.alert('Faltou marcar', 'Para criar a conta, marque a caixa de aceite dos termos.');

    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      // D-056: o aceite vai no metadata; o gatilho do banco o registra com a versão dos termos.
      options: { data: { nome: nome.trim(), ...metadataDoAceite() } },
    });
    setCarregando(false);

    if (error) return Alert.alert('Não foi possível cadastrar', traduzirErro(error).mensagemUsuario);
    apagarNome();
    // Sem sessão = a confirmação de e-mail está ligada: o código foi enviado e a pessoa continua
    // dentro do app, na tela que espera os seis números (D-019).
    if (!data.session) return router.replace({ pathname: '/(auth)/confirmar', params: { email: email.trim() } });
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <LogoNero variante="completa" width={140} style={{ alignSelf: 'center' }} />
          <Text style={styles.titulo}>Criar conta</Text>
          <View style={styles.form}>
            <Input placeholder="Nome" autoComplete="name" value={nome} onChangeText={setNome} />
            <Input placeholder="E-mail" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Input placeholder="Senha (mínimo 8 caracteres)" secureTextEntry autoComplete="new-password" value={senha} onChangeText={setSenha} />
            <AceiteTermos valor={aceitou} onChange={setAceitou} />
            <Button label="Criar conta" onPress={cadastrar} loading={carregando} />
            <BotoesSociais />
          </View>
          <Link href="/(auth)/login" replace style={styles.link}>
            Já tem conta? <Text style={styles.linkForte}>Entrar</Text>
          </Link>
          <Creditos />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  // Centralizado na altura, como o login: antes o conteúdo ficava encostado no topo (pedido do Murilo, 26/09).
  conteudo: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.xxl },
  titulo: { ...Typography.display, color: Colors.primary, textAlign: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xl },
  form: { gap: Spacing.md },
  link: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xl },
  linkForte: { fontFamily: 'Poppins-SemiBold', color: Colors.primary },
});
