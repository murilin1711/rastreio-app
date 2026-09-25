import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ehEmailNaoConfirmado } from '@core/auth/codigo';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { Button, Colors, Input, LogoNero, Spacing, Typography } from '@ui/index';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const entrar = async () => {
    if (!email.trim() || !senha) {
      Alert.alert('Faltou algo', 'Preencha e-mail e senha para entrar.');
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setCarregando(false);
    if (error) {
      // Quem se cadastrou e não terminou a confirmação travaria num alerta sem saída (D-019):
      // reenvia o código e leva para a tela que o espera.
      if (ehEmailNaoConfirmado(error)) {
        await supabase.auth.resend({ type: 'signup', email: email.trim() });
        return router.replace({ pathname: '/(auth)/confirmar', params: { email: email.trim() } });
      }
      Alert.alert('Não foi possível entrar', traduzirErro(error).mensagemUsuario);
      return;
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <LogoNero variante="completa" width={170} style={{ alignSelf: 'center' }} />
          <Text style={styles.titulo}>Que bom te ver</Text>
          <Text style={styles.sub}>Entre para continuar de onde parou</Text>

          {/*
            Sem o mascote aqui, de propósito (D-033): ele já se apresenta nos três slides do
            onboarding, e repetir na tela seguinte cansa. O login é a tela mais enxuta do app.
            Campos de 56 px, calibrados pelo Murilo: o público é de idosos.
          */}
          <View style={styles.form}>
            <Input placeholder="E-mail" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.campo} />
            <Input placeholder="Senha" secureTextEntry autoComplete="password" value={senha} onChangeText={setSenha} onSubmitEditing={entrar} style={styles.campo} />
            <Link href={{ pathname: '/(auth)/recuperar', params: email.trim() ? { email: email.trim() } : {} }} style={styles.esqueci}>
              Esqueci minha senha
            </Link>
            <Button label="Entrar" onPress={entrar} loading={carregando} style={styles.botao} />
          </View>

          <Link href="/(auth)/cadastro" style={styles.link}>
            Ainda não tem conta? <Text style={styles.linkForte}>Criar conta</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xxl },
  titulo: { ...Typography.display, color: Colors.primary, textAlign: 'center', marginTop: Spacing.xl },
  sub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  form: { gap: Spacing.md, marginTop: Spacing.xxxl },
  /** 56 px: alvo confortável para quem tem dificuldade de mira (D-033). */
  campo: { minHeight: 56 },
  botao: { minHeight: 56 },
  esqueci: { ...Typography.body, fontFamily: 'Poppins-SemiBold', color: Colors.accent, textAlign: 'right', marginTop: -Spacing.xs },
  link: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xxl },
  linkForte: { fontFamily: 'Poppins-SemiBold', color: Colors.primary },
});
