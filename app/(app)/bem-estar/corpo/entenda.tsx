import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCorpo } from '@core/bemestar/useCorpo';
import { Card, Colors, InternalHeader, Spacing, Typography } from '@ui/index';

/** "Entenda cada medida" (§72): uma seção por regra, com a fonte. */
export default function Entenda() {
  const router = useRouter();
  const { parametros: p } = useCorpo();
  const secoes = p ? [
    { titulo: 'IMC', regra: p.imc.regra }, { titulo: 'IMC a partir dos 60 anos', regra: p.imcIdoso.regra },
    { titulo: 'Circunferência abdominal', regra: p.cintura.regra }, { titulo: 'Relação cintura/altura', regra: p.rca.regra },
    { titulo: 'Relação cintura/quadril', regra: p.rcq.regra }, { titulo: 'Como medir a cintura', regra: p.tecnica.regra },
    { titulo: 'Peso máximo da vida', regra: p.pmav.regra }, { titulo: 'Tendência do peso', regra: p.tendencia.regra },
  ] : [];
  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Meu Corpo" title="Entenda cada medida" onBack={() => router.back()} />
        {secoes.map((s) => (
          <Card key={s.titulo} style={styles.card}>
            <Text style={styles.titulo}>{s.titulo}</Text>
            <Text style={styles.texto}>{s.regra.mensagemPaciente}</Text>
            <Text style={styles.fonte}>Fonte: {s.regra.fonte} ({s.regra.ano})</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  card: { padding: Spacing.lg, gap: Spacing.xs },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  texto: { ...Typography.body, color: Colors.textPrimary },
  fonte: { ...Typography.caption, color: Colors.textSecondary },
});
