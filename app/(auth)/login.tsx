import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { Button, Colors, Input, NeroImage, Spacing, Typography } from '@ui/index';

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
      Alert.alert('Não foi possível entrar', traduzirErro(error).mensagemUsuario);
      return;
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <NeroImage size={150} style={{ alignSelf: 'center' }} />
          <Text style={styles.titulo}>Bem-vindo ao NERO</Text>
          <Text style={styles.sub}>Entre para continuar seu acompanhamento.</Text>

          <View style={styles.form}>
            <Input placeholder="E-mail" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Input placeholder="Senha" secureTextEntry autoComplete="password" value={senha} onChangeText={setSenha} onSubmitEditing={entrar} />
            <Button label="Entrar" onPress={entrar} loading={carregando} />
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
  link: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xxl },
  linkForte: { fontFamily: 'Poppins-SemiBold', color: Colors.primary },
});
