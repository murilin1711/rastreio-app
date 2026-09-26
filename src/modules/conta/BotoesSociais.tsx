import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { appleDisponivel, entrarComApple, entrarComGoogle, googleDisponivel, type ResultadoSocial } from '@core/auth/social';
import { traduzirErro } from '@core/supabase/erros';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

/**
 * "Continuar com a Apple" e "Continuar com o Google" (D-061), acima do e-mail no login e no cadastro.
 * O botão da Apple é o componente oficial (exigência da Apple). Para 60+, entrar sem senha evita a
 * senha esquecida, a maior causa de abandono.
 */
export function BotoesSociais() {
  const router = useRouter();
  const [temApple, setTemApple] = useState(false);
  const [ocupado, setOcupado] = useState<'apple' | 'google' | null>(null);
  useEffect(() => { appleDisponivel().then(setTemApple); }, []);

  const entrar = async (qual: 'apple' | 'google', fn: () => Promise<ResultadoSocial>) => {
    setOcupado(qual);
    try {
      if ((await fn()) === 'ok') router.replace('/');
    } catch (e) {
      Alert.alert('Não foi possível entrar', traduzirErro(e).mensagemUsuario);
    } finally {
      setOcupado(null);
    }
  };

  const temGoogle = googleDisponivel();
  if (!temApple && !temGoogle) return null;
  return (
    <View style={styles.bloco}>
      {temApple ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={Radius.linha}
          style={styles.apple}
          onPress={() => { if (!ocupado) entrar('apple', entrarComApple); }}
        />
      ) : null}
      {temGoogle ? (
        <Pressable style={({ pressed }) => [styles.google, pressed && { opacity: 0.8 }]} onPress={() => { if (!ocupado) entrar('google', entrarComGoogle); }} accessibilityRole="button" accessibilityLabel="Continuar com o Google">
          {ocupado === 'google' ? <ActivityIndicator color={Colors.textPrimary} /> : (
            <>
              <Ionicons name="logo-google" size={20} color={Colors.textPrimary} />
              <Text style={styles.googleTexto}>Continuar com o Google</Text>
            </>
          )}
        </Pressable>
      ) : null}
      <View style={styles.divisor}>
        <View style={styles.linha} />
        <Text style={styles.ou}>ou com seu e-mail</Text>
        <View style={styles.linha} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: Spacing.md },
  apple: { height: 52, width: '100%' },
  google: { height: 52, borderRadius: Radius.linha, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  googleTexto: { ...Typography.subheading, color: Colors.textPrimary },
  divisor: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.xs },
  linha: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  ou: { ...Typography.caption, color: Colors.textSecondary },
});
