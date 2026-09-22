import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ESPERA_REENVIO_S, TAMANHO_CODIGO, codigoCompleto, normalizarCodigo, segundosParaReenviar } from '@core/auth/codigo';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { Button, Colors, InternalHeader, Spacing, Typography } from '@ui/index';

/**
 * Confirmação do e-mail por código de seis dígitos (D-019).
 *
 * A tela fica parada esperando o código: a pessoa abre o e-mail, lê seis números e volta — o app
 * não saiu do lugar. Nada de link, que obrigaria a passar pelo navegador e torcer para ele devolver
 * a pessoa ao app. O código é verificado sozinho assim que o sexto dígito entra, sem botão de
 * "confirmar": um passo a menos para quem tem dificuldade com telas.
 */
export default function Confirmar() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [enviadoEm, setEnviadoEm] = useState<number>(() => Date.now());
  const [faltam, setFaltam] = useState(ESPERA_REENVIO_S);
  const [aviso, setAviso] = useState<string | null>(null);
  // Guarda o último código já verificado para não repetir a chamada com o mesmo valor.
  const tentado = useRef<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setFaltam(segundosParaReenviar(enviadoEm, Date.now())), 1000);
    return () => clearInterval(id);
  }, [enviadoEm]);

  const verificar = useCallback(async (token: string) => {
    if (tentado.current === token) return;
    tentado.current = token;
    setVerificando(true);
    setErro(null);
    const { error } = await supabase.auth.verifyOtp({ email: String(email), token, type: 'signup' });
    setVerificando(false);
    if (error) {
      setErro('O código não conferiu. Confira os números no e-mail e digite de novo.');
      return;
    }
    router.replace('/');
  }, [email, router]);

  const aoDigitar = (texto: string) => {
    const limpo = normalizarCodigo(texto);
    setCodigo(limpo);
    if (erro && limpo !== tentado.current) setErro(null);
    if (codigoCompleto(limpo)) void verificar(limpo);
  };

  const reenviar = async () => {
    setAviso(null);
    setErro(null);
    const { error } = await supabase.auth.resend({ type: 'signup', email: String(email) });
    if (error) return setErro(traduzirErro(error).mensagemUsuario);
    tentado.current = null;
    setEnviadoEm(Date.now());
    setFaltam(ESPERA_REENVIO_S);
    setAviso('Enviamos outro código. Pode levar alguns instantes para chegar.');
  };

  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <InternalHeader sectionLabel="NERO" title="Confirme seu e-mail" />
          <View style={styles.form}>
            <Text style={styles.explicacao}>
              Enviamos um código de {TAMANHO_CODIGO} números para{'\n'}
              <Text style={styles.email}>{String(email)}</Text>
            </Text>
            <Text style={styles.instrucao}>Abra seu e-mail, veja o código e digite aqui:</Text>
            <TextInput
              testID="campo-codigo"
              style={styles.campo}
              value={codigo}
              onChangeText={aoDigitar}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              autoFocus
              maxLength={TAMANHO_CODIGO}
              editable={!verificando}
              placeholder="000000"
              placeholderTextColor={Colors.textSecondary}
            />
            {erro ? <Text style={styles.erro}>{erro}</Text> : null}
            {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
            <Button
              testID="botao-reenviar"
              label={faltam > 0 ? `Enviar outro código em ${faltam}s` : 'Enviar outro código'}
              onPress={reenviar}
              disabled={faltam > 0}
              variant="outline"
            />
            <Text style={styles.rodape}>
              O código serve para termos certeza de que o e-mail é seu. É por ele que você recupera a senha se um dia esquecer.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { flexGrow: 1, paddingHorizontal: Spacing.xxl },
  form: { gap: Spacing.md },
  explicacao: { ...Typography.body, color: Colors.textPrimary, textAlign: 'center' },
  email: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary },
  instrucao: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  campo: {
    ...Typography.display,
    textAlign: 'center',
    letterSpacing: 12,
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  erro: { ...Typography.body, color: Colors.danger, textAlign: 'center' },
  aviso: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  rodape: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md },
});
