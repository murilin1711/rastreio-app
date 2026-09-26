import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { URL_PRIVACIDADE, URL_TERMOS } from '@core/publicacao';
import { Colors, Spacing, Typography } from '@ui/theme';

export interface Aceites { termos: boolean; dadosSaude: boolean }

/**
 * As duas caixas do cadastro (D-056), separadas porque a LGPD pede consentimento "específico e
 * destacado" para dado de saúde (art. 11, I). Tocar no link abre o documento; tocar no resto da linha
 * marca a caixa.
 */
export function AceiteTermos({ valor, onChange }: { valor: Aceites; onChange: (v: Aceites) => void }) {
  const abrir = (url: string) => { WebBrowser.openBrowserAsync(url).catch(() => {}); };
  return (
    <View style={styles.bloco}>
      <Caixa marcada={valor.termos} onPress={() => onChange({ ...valor, termos: !valor.termos })} rotuloAcessivel="Li e aceito os Termos de uso e a Política de privacidade">
        Li e aceito os <Text style={styles.link} onPress={() => abrir(URL_TERMOS)}>Termos de uso</Text> e a{' '}
        <Text style={styles.link} onPress={() => abrir(URL_PRIVACIDADE)}>Política de privacidade</Text>.
      </Caixa>
      <Caixa marcada={valor.dadosSaude} onPress={() => onChange({ ...valor, dadosSaude: !valor.dadosSaude })} rotuloAcessivel="Autorizo o NERO a guardar e organizar meus dados de saúde">
        Autorizo o NERO a guardar e organizar meus dados de saúde (exames, medidas, remédios e documentos) para me mostrar lembretes, recomendações e relatórios.
      </Caixa>
    </View>
  );
}

function Caixa({ marcada, onPress, rotuloAcessivel, children }: { marcada: boolean; onPress: () => void; rotuloAcessivel: string; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} style={styles.linha} accessibilityRole="checkbox" accessibilityState={{ checked: marcada }} accessibilityLabel={rotuloAcessivel} hitSlop={4}>
      <Ionicons name={marcada ? 'checkbox' : 'square-outline'} size={26} color={marcada ? Colors.primary : Colors.textMuted} />
      <Text style={styles.texto}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: Spacing.md, marginTop: Spacing.xs },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  texto: { ...Typography.caption, fontSize: 14, lineHeight: 20, color: Colors.textPrimary, flex: 1 },
  link: { fontFamily: 'Poppins-SemiBold', color: Colors.primary, textDecorationLine: 'underline' },
});
