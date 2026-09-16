import { Redirect, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Programa } from '@core/regras/tipos';
import { PROGRAMAS } from '@core/rastreando/tipos';
import { CONTEUDO } from '@modules/rastreando/conteudo';
import { Colors, InternalHeader, Radius, Spacing, Typography } from '@ui/index';

export default function Entenda() {
  const { programa } = useLocalSearchParams<{ programa: string }>();
  if (!PROGRAMAS.includes(programa as Programa)) return <Redirect href="/(app)/rastreando" />;
  const c = CONTEUDO[programa as Programa];
  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel={c.titulo} title="Entenda este câncer" />
        {c.entenda.map((p, i) => <Text key={i} style={styles.par}>{p}</Text>)}
        {c.noSus ? (
          <View style={styles.sus}>
            <Text style={styles.susTitulo}>No SUS</Text>
            <Text style={styles.susTexto}>{c.noSus}</Text>
          </View>
        ) : null}
        <Text style={styles.fonte}>Fontes: {c.fonteResumo}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  par: { ...Typography.body, fontSize: 16, lineHeight: 26, color: Colors.textPrimary, marginBottom: Spacing.lg },
  sus: { backgroundColor: Colors.surface, borderRadius: Radius.linha, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginTop: Spacing.sm },
  susTitulo: { ...Typography.subheading, color: Colors.primary, marginBottom: Spacing.xs },
  susTexto: { ...Typography.body, color: Colors.textSecondary },
  fonte: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xxl },
});
