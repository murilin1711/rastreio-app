import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { Button, Colors, Input, InternalHeader, Spacing, Typography } from '@ui/index';

/**
 * Recuperar a senha (D-033). Antes não existia: quem esquecia a senha perdia o acesso ao próprio
 * prontuário, sem nenhuma saída pelo app. Com o bloqueio por biometria (D-032) isso piorou, porque a
 * senha virou também a saída de quem não consegue usar o rosto.
 *
 * Três passos, na ordem que o Murilo descreveu:
 *   e-mail  →  código de seis dígitos  →  senha nova, digitada duas vezes
 *
 * **Código, não link**, igual ao cadastro: link obriga a sair do app, abrir o e-mail, tocar e voltar.
 * **Senha em tela própria**, depois do código validado: misturar as duas coisas faz a pessoa preencher
 * a senha antes de saber se o código está certo.
 * **Confirmação da senha**, porque um erro de digitação sem repetição tranca de novo quem acabou de
 * passar pelo trabalho de recuperar.
 */
type Etapa = 'email' | 'codigo' | 'senha';

/**
 * Travessia entre as etapas (D-035). As três trocavam de conteúdo no mesmo frame, dentro da mesma
 * tela, sem nada indicando que a pessoa tinha avançado — o "piscar" que o Murilo apontou no
 * TestFlight. Agora o bloco entra deslizando 16 px no sentido da navegação: da direita quando
 * avança, da esquerda quando volta. O cabeçalho fica parado de propósito, porque é ele que diz à
 * pessoa que ela continua na mesma tarefa.
 */
const MS_TRAVESSIA = 220;
const DESLOCAMENTO = 16;

export default function Recuperar() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [etapa, setEtapa] = useState<Etapa>('email');
  const entrada = useRef(new Animated.Value(1)).current;
  const sentido = useRef(1);
  const [email, setEmail] = useState(params.email ?? '');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [repetir, setRepetir] = useState('');
  const [ocupado, setOcupado] = useState(false);

  /** Troca de etapa com a travessia; `avancando` decide de que lado o bloco entra. */
  const irPara = (proxima: Etapa, avancando = true) => {
    sentido.current = avancando ? 1 : -1;
    setEtapa(proxima);
    entrada.setValue(0);
    Animated.timing(entrada, { toValue: 1, duration: MS_TRAVESSIA, useNativeDriver: true }).start();
  };

  const enviarCodigo = async () => {
    const alvo = email.trim();
    if (!alvo) {
      Alert.alert('Faltou o e-mail', 'Escreva o e-mail da sua conta para receber o código.');
      return;
    }
    setOcupado(true);
    const { error } = await supabase.auth.resetPasswordForEmail(alvo);
    setOcupado(false);
    // Um e-mail que não existe devolve sucesso de propósito: dizer "esta conta não existe" contaria
    // a um estranho quem tem conta no app. A tela segue igual nos dois casos.
    if (error) {
      Alert.alert('Não foi possível enviar', traduzirErro(error).mensagemUsuario);
      return;
    }
    setCodigo('');
    irPara('codigo');
  };

  const conferirCodigo = async () => {
    if (codigo.trim().length < 6) {
      Alert.alert('Código incompleto', 'Digite os seis números que chegaram no seu e-mail.');
      return;
    }
    setOcupado(true);
    // `verifyOtp` do tipo 'recovery' abre uma sessão temporária; é ela que autoriza o updateUser
    // na etapa seguinte. Por isso o código é conferido antes, e não junto com a senha.
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: codigo.trim(), type: 'recovery' });
    setOcupado(false);
    if (error) {
      Alert.alert('Código não confere', 'Verifique os números do e-mail. O código vale por uma hora.');
      return;
    }
    irPara('senha');
  };

  const salvarSenha = async () => {
    if (senha.length < 8) {
      Alert.alert('Senha muito curta', 'A nova senha precisa de pelo menos 8 caracteres.');
      return;
    }
    if (senha !== repetir) {
      Alert.alert('As senhas não são iguais', 'Digite a mesma senha nos dois campos.');
      return;
    }
    setOcupado(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setOcupado(false);
    if (error) {
      Alert.alert('Não foi possível trocar a senha', traduzirErro(error).mensagemUsuario);
      return;
    }
    Alert.alert('Senha alterada', 'Pronto, você já está dentro da sua conta.');
    router.replace('/');
  };

  const voltar = () => {
    if (etapa === 'senha') return irPara('codigo', false);
    if (etapa === 'codigo') return irPara('email', false);
    router.back();
  };

  const TITULO: Record<Etapa, string> = {
    email: 'Esqueci minha senha',
    codigo: 'Digite o código',
    senha: 'Crie uma senha nova',
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <InternalHeader sectionLabel="Entrar" title={TITULO[etapa]} onBack={voltar} />

          <Animated.View
            style={{
              opacity: entrada,
              transform: [{ translateX: entrada.interpolate({ inputRange: [0, 1], outputRange: [DESLOCAMENTO * sentido.current, 0] }) }],
            }}
          >
          {etapa === 'email' ? (
            <>
              <Text style={styles.ajuda}>Escreva o e-mail da sua conta. Vamos mandar um código de seis números.</Text>
              <View style={styles.form}>
                <Input
                  placeholder="E-mail"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={enviarCodigo}
                  style={styles.campo}
                />
                <Button label="Enviar código" onPress={enviarCodigo} loading={ocupado} style={styles.campo} />
              </View>
            </>
          ) : null}

          {etapa === 'codigo' ? (
            <>
              <Text style={styles.ajuda}>Mandamos um código para <Text style={styles.forte}>{email.trim()}</Text>. Ele vale por uma hora.</Text>
              <View style={styles.form}>
                <Input
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  value={codigo}
                  onChangeText={setCodigo}
                  onSubmitEditing={conferirCodigo}
                  style={[styles.campo, styles.codigo]}
                />
                <Button label="Continuar" onPress={conferirCodigo} loading={ocupado} style={styles.campo} />
                <Button label="Enviar outro código" variant="ghost" onPress={enviarCodigo} disabled={ocupado} />
                {/* A saída do beco sem saída (D-035). A tela avança mesmo quando não existe conta com
                    o e-mail digitado, de propósito: dizer "esta conta não existe" contaria a um
                    estranho quem tem conta no app. O preço era alguém esperar para sempre um código
                    que não vem — foi o que aconteceu com o próprio Murilo no TestFlight. Esta linha
                    nomeia as duas causas reais sem confirmar nenhuma delas. */}
                <Text style={styles.saida}>
                  Não chegou? Veja no spam. Se não estiver lá, confira se o e-mail está escrito certo e tente de novo.
                </Text>
              </View>
            </>
          ) : null}

          {etapa === 'senha' ? (
            <>
              <Text style={styles.ajuda}>Código confirmado. Agora escolha a senha que você vai usar para entrar.</Text>
              <View style={styles.form}>
                <Input
                  placeholder="Nova senha (mínimo 8 caracteres)"
                  secureTextEntry
                  autoComplete="new-password"
                  autoFocus
                  value={senha}
                  onChangeText={setSenha}
                  style={styles.campo}
                />
                <Input
                  placeholder="Digite a senha de novo"
                  secureTextEntry
                  autoComplete="new-password"
                  value={repetir}
                  onChangeText={setRepetir}
                  onSubmitEditing={salvarSenha}
                  style={styles.campo}
                />
                <Button label="Salvar e entrar" onPress={salvarSenha} loading={ocupado} style={styles.campo} />
              </View>
            </>
          ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  ajuda: { ...Typography.body, color: Colors.textSecondary },
  forte: { fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary },
  form: { gap: Spacing.md, marginTop: Spacing.xxl },
  campo: { minHeight: 56 },
  codigo: { fontFamily: 'Poppins-Bold', fontSize: 24, letterSpacing: 8, textAlign: 'center' },
  saida:  { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, paddingHorizontal: Spacing.md, lineHeight: 19 },
});
