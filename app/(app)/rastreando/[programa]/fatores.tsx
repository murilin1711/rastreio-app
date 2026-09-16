import { Redirect, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { handlers } from '@core/regras/programas';
import type { Programa } from '@core/regras/tipos';
import { PROGRAMAS } from '@core/rastreando/tipos';
import { useRastreando } from '@core/rastreando/useRastreando';
import { CONTEUDO } from '@modules/rastreando/conteudo';
import { Card, Colors, InternalHeader, Spacing, Typography } from '@ui/index';

/** §29.3: fatores educativos × fatores que mudam o protocolo. */
export default function Fatores() {
  const { programa } = useLocalSearchParams<{ programa: string }>();
  const { perfil } = useRastreando();
  if (!PROGRAMAS.includes(programa as Programa)) return <Redirect href="/(app)/rastreando" />;
  const p = programa as Programa;
  const c = CONTEUDO[p];
  const modificador = perfil ? handlers[p]?.fatoresModificadores(perfil) ?? null : null;

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel={c.titulo} title="Fatores de risco" />

        <Text style={styles.secao}>Fatores que mudam o seu protocolo</Text>
        <Text style={styles.ajuda}>Quando presentes, alteram a idade de início, o exame ou a periodicidade — e pedem avaliação individualizada.</Text>
        <Card style={styles.card}>
          {c.fatoresModificadores.map((f) => (
            <View key={f} style={styles.item}><Ionicons name="alert-circle-outline" size={18} color={Colors.warning} /><Text style={styles.itemTexto}>{f}</Text></View>
          ))}
        </Card>
        {modificador ? (
          <View style={styles.aviso}>
            <Text style={styles.avisoTitulo}>No seu perfil</Text>
            <Text style={styles.avisoTexto}>{modificador}</Text>
          </View>
        ) : (
          <Text style={styles.ok}>Pelo que consta no seu perfil, nenhum fator que mude o protocolo. Mantenha antecedentes e histórico atualizados em Minha Saúde.</Text>
        )}

        <Text style={[styles.secao, { marginTop: Spacing.xxl }]}>Fatores que aumentam o risco</Text>
        <Text style={styles.ajuda}>Não mudam o calendário de rastreamento, mas valem para prevenção.</Text>
        <Card style={styles.card}>
          {c.fatoresEducativos.map((f) => (
            <View key={f} style={styles.item}><Ionicons name="information-circle-outline" size={18} color={Colors.accent} /><Text style={styles.itemTexto}>{f}</Text></View>
          ))}
        </Card>
        <Text style={styles.fonte}>Fontes: {c.fonteResumo}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  secao: { ...Typography.heading, color: Colors.textPrimary },
  ajuda: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md, marginTop: 2 },
  card: { gap: Spacing.md },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  itemTexto: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  aviso: { backgroundColor: '#fef3c7', borderRadius: 12, padding: Spacing.lg, marginTop: Spacing.md },
  avisoTitulo: { ...Typography.subheading, color: Colors.warning, marginBottom: Spacing.xs },
  avisoTexto: { ...Typography.body, color: Colors.textPrimary },
  ok: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.md },
  fonte: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xxl },
});
