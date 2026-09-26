import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, Text } from 'react-native';
import { URL_PRIVACIDADE, URL_TERMOS } from '@core/publicacao';
import { Colors, Spacing, Typography } from '@ui/theme';

/**
 * Caixa de aceite do cadastro (D-056). Eram duas (termos e dados de saúde); o Murilo preferiu uma só em
 * 26/09, com menos texto. O consentimento de saúde continua explícito na frase, e o banco registra os
 * dois aceites. Tocar no link abre o documento; tocar no resto da linha marca a caixa.
 */
export function AceiteTermos({ valor, onChange }: { valor: boolean; onChange: (v: boolean) => void }) {
  const abrir = (url: string) => { WebBrowser.openBrowserAsync(url).catch(() => {}); };
  return (
    <Pressable onPress={() => onChange(!valor)} style={styles.linha} accessibilityRole="checkbox" accessibilityState={{ checked: valor }} accessibilityLabel="Aceito os Termos de uso e a Política de privacidade e autorizo o uso dos meus dados de saúde" hitSlop={4}>
      <Ionicons name={valor ? 'checkbox' : 'square-outline'} size={26} color={valor ? Colors.primary : Colors.textMuted} />
      <Text style={styles.texto}>
        Aceito os <Text style={styles.link} onPress={() => abrir(URL_TERMOS)}>Termos de uso</Text> e a{' '}
        <Text style={styles.link} onPress={() => abrir(URL_PRIVACIDADE)}>Política de privacidade</Text> e autorizo o uso dos meus dados de saúde.
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: Spacing.xs },
  texto: { ...Typography.caption, fontSize: 14, lineHeight: 20, color: Colors.textPrimary, flex: 1 },
  link: { fontFamily: 'Poppins-SemiBold', color: Colors.primary, textDecorationLine: 'underline' },
});
