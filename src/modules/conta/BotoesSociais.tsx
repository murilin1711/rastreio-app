import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { appleDisponivel, entrarComApple, entrarComGoogle, googleDisponivel, type ResultadoSocial } from '@core/auth/social';
import { registrarErro } from '@core/erros/relatorio';
import { traduzirErro } from '@core/supabase/erros';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

/**
 * "Continuar com a Apple" e "Continuar com o Google" (D-061), **abaixo** do e-mail e da senha (pedido do
 * Murilo, 26/09). O botão da Apple é próprio, em português: o oficial saía em inglês ("Continue with
 * Apple"). A Apple permite botão próprio seguindo o visual dela (fundo preto, maçã, "Continuar com a Apple").
 * Falha de login vai para o relatório de erros: a primeira tentativa no aparelho falhou sem mensagem.
 */
export function BotoesSociais() {
  const router = useRouter();
  const [temApple, setTemApple] = useState(false);
  const [ocupado, setOcupado] = useState<'apple' | 'google' | null>(null);
  useEffect(() => { appleDisponivel().then(setTemApple); }, []);

  const entrar = async (qual: 'apple' | 'google', fn: () => Promise<ResultadoSocial>) => {
    if (ocupado) return;
    setOcupado(qual);
    try {
      if ((await fn()) === 'ok') router.replace('/');
    } catch (e) {
      registrarErro(e, { login: qual });
      Alert.alert('Não foi possível entrar', traduzirErro(e).mensagemUsuario);
    } finally {
      setOcupado(null);
    }
  };

  const temGoogle = googleDisponivel();
  if (!temApple && !temGoogle) return null;
  return (
    <View style={styles.bloco}>
      <View style={styles.divisor}>
        <View style={styles.linha} />
        <Text style={styles.ou}>ou</Text>
        <View style={styles.linha} />
      </View>
      {temApple ? (
        <Pressable style={({ pressed }) => [styles.botao, styles.apple, pressed && { opacity: 0.85 }]} onPress={() => entrar('apple', entrarComApple)} accessibilityRole="button" accessibilityLabel="Continuar com a Apple">
          {ocupado === 'apple' ? <ActivityIndicator color={Colors.white} /> : (
            <>
              <Ionicons name="logo-apple" size={22} color={Colors.white} />
              <Text style={[styles.texto, { color: Colors.white }]}>Continuar com a Apple</Text>
            </>
          )}
        </Pressable>
      ) : null}
      {temGoogle ? (
        <Pressable style={({ pressed }) => [styles.botao, styles.google, pressed && { opacity: 0.8 }]} onPress={() => entrar('google', entrarComGoogle)} accessibilityRole="button" accessibilityLabel="Continuar com o Google">
          {ocupado === 'google' ? <ActivityIndicator color={Colors.textPrimary} /> : (
            <>
              <Ionicons name="logo-google" size={20} color={Colors.textPrimary} />
              <Text style={[styles.texto, { color: Colors.textPrimary }]}>Continuar com o Google</Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: Spacing.md, marginTop: Spacing.md },
  botao: { height: 52, borderRadius: Radius.linha, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  apple: { backgroundColor: '#000' },
  google: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  texto: { ...Typography.subheading },
  divisor: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  linha: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  ou: { ...Typography.caption, color: Colors.textSecondary },
});
