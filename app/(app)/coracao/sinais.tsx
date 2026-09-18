import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fraseSinais, sinaisAlerta } from '@modules/coracao/conteudo/sinais';
import { Alerta, Colors, InternalHeader, Radius, Spacing, Typography } from '@ui/index';

/** §23 — quando procurar atendimento. */
export default function SinaisAlerta() {
  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Coração & Metabolismo" title="Quando procurar atendimento" />
        <View style={styles.lista}>
          {sinaisAlerta.map((s) => (
            <View key={s} style={styles.item}>
              <View style={styles.ponto} />
              <Text style={styles.texto}>{s}</Text>
            </View>
          ))}
        </View>
        <View style={styles.destaque}>
          <Text style={styles.destaqueTexto}>{fraseSinais}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  lista: { gap: Spacing.md },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: Alerta.vermelho.fg, marginTop: 8 },
  texto: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  destaque: { backgroundColor: Alerta.vermelho.bg, borderRadius: Radius.bloco, padding: Spacing.xl, marginTop: Spacing.xxl },
  destaqueTexto: { ...Typography.body, color: Alerta.vermelho.fg },
});
