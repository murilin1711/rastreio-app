import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fontesDoTema, type Referencia, type TemaFonte } from '@core/referencias/catalogo';
import { Colors, Radius, Spacing, Typography } from '@ui/index';

export const abrirFonte = (url: string) => { WebBrowser.openBrowserAsync(url).catch(() => {}); };

/** Uma referência tocável: abre o documento original no navegador do app. */
export function LinhaFonte({ referencia }: { referencia: Referencia }) {
  return (
    <TouchableOpacity
      onPress={() => abrirFonte(referencia.url)}
      style={styles.linha}
      accessibilityRole="link"
      accessibilityLabel={`${referencia.titulo}, ${referencia.emissor}, ${referencia.ano}. Abrir a fonte`}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.titulo}>{referencia.titulo}</Text>
        <Text style={styles.emissor}>{referencia.emissor} · {referencia.ano}</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={Colors.accent} />
    </TouchableOpacity>
  );
}

/**
 * Bloco "Fontes" no pé de toda tela com informação clínica (diretriz 1.4.1 da App Store): cada
 * referência abre o documento original, e o link do fim leva ao acervo completo.
 */
export function FontesDaTela({ tema, referencias }: { tema?: TemaFonte; referencias?: (Referencia & { id: string })[] }) {
  const router = useRouter();
  const lista = referencias ?? (tema ? fontesDoTema(tema) : []);
  return (
    <View style={styles.caixa} testID="fontes-da-tela">
      <View style={styles.cabecalho}>
        <Ionicons name="library-outline" size={18} color={Colors.primary} />
        <Text style={styles.rotulo}>Fontes</Text>
      </View>
      {lista.map((r) => <LinhaFonte key={r.id} referencia={r} />)}
      <TouchableOpacity onPress={() => router.push('/(app)/fontes')} accessibilityRole="link">
        <Text style={styles.todas}>Ver todas as fontes científicas</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Para telas sem referência própria (índices, diários): só leva ao acervo, sem citar o que não se aplica. */
export function LinkFontes() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push('/(app)/fontes')} style={styles.link} accessibilityRole="link">
      <Ionicons name="library-outline" size={16} color={Colors.accent} />
      <Text style={styles.linkTexto}>Fontes científicas do NERO</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  caixa: { backgroundColor: Colors.surface, borderRadius: Radius.linha, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.xxl },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  rotulo: { ...Typography.subheading, color: Colors.primary },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xs },
  titulo: { ...Typography.caption, color: Colors.textPrimary },
  emissor: { ...Typography.caption, color: Colors.textSecondary },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.md, marginTop: Spacing.lg },
  linkTexto: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', color: Colors.accent },
  todas: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', color: Colors.accent, marginTop: Spacing.xs },
});
