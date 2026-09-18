import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLinhaDoTempo } from '@core/cardio/useLinhaDoTempo';
import { dataCurtaBr } from '@modules/coracao/componentes/formato';
import { Colors, InternalHeader, Spacing, Typography } from '@ui/index';

/** Linha do tempo cardiovascular (§20): por ano, linhas planas com ponto neutro. */
export default function LinhaDoTempo() {
  const { anos, carregando, recarregar } = useLinhaDoTempo();
  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Coração & Metabolismo" title="Minha linha do tempo" />
        {anos.length ? anos.map((a) => (
          <View key={a.ano} style={styles.ano}>
            <Text style={styles.anoTitulo}>{a.ano}</Text>
            {a.itens.map((i, idx) => (
              <View key={idx} style={styles.linha}>
                <View style={styles.ponto} />
                <Text style={styles.data}>{dataCurtaBr(i.data)}</Text>
                <View style={{ flex: 1 }}><Text style={styles.titulo}>{i.titulo}</Text>{i.valor ? <Text style={styles.valor}>{i.valor}</Text> : null}</View>
              </View>
            ))}
          </View>
        )) : !carregando ? <Text style={styles.vazio}>Conforme você registra pressão, glicemia, exames e cálculos de risco, eles aparecem aqui em ordem.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  ano: { marginBottom: Spacing.xxl },
  anoTitulo: { ...Typography.title, color: Colors.primary, marginBottom: Spacing.sm },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 8 },
  data: { ...Typography.caption, color: Colors.textSecondary, width: 40, marginTop: 3 },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  valor: { ...Typography.body, color: Colors.textSecondary },
  vazio: { ...Typography.body, color: Colors.textSecondary },
});
