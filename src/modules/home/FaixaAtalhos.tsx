import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Shadows, Spacing, Typography } from '@ui/theme';

/**
 * Atalhos da Home, abaixo dos módulos (D-053): o que precisa de acesso rápido, sem entrar no módulo.
 * Faixa que rola para o lado, escolhida pelo Murilo numa prévia em 25/09. Futuro: planos do médico
 * (portal) e a próxima consulta.
 */
export const ATALHOS: { icone: keyof typeof Ionicons.glyphMap; rotulo: string; rota: string }[] = [
  { icone: 'document-text-outline', rotulo: 'Relatório', rota: '/(app)/(tabs)/minha-saude/relatorios' },
  { icone: 'pulse-outline', rotulo: 'Medir pressão', rota: '/(app)/coracao/pressao/registrar' },
  { icone: 'water-outline', rotulo: 'Medir glicemia', rota: '/(app)/coracao/glicemia/registrar' },
  { icone: 'medkit-outline', rotulo: 'Remédios', rota: '/(app)/(tabs)/minha-saude/medicamentos' },
  { icone: 'calendar-outline', rotulo: 'Consultas', rota: '/(app)/(tabs)/agenda/consultas' },
];

/** `sangria` é o padding lateral da tela: a faixa vai de borda a borda, e o primeiro item alinha com o texto. */
export function FaixaAtalhos({ onAbrir, sangria }: { onAbrir: (rota: string) => void; sangria: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -sangria }} contentContainerStyle={{ paddingHorizontal: sangria, gap: Spacing.sm }}>
      {ATALHOS.map((a) => (
        <TouchableOpacity key={a.rota} activeOpacity={0.7} onPress={() => onAbrir(a.rota)} style={styles.item} accessibilityRole="button" accessibilityLabel={a.rotulo === 'Relatório' ? 'Relatório para o médico' : a.rotulo}>
          <View style={styles.circulo}><Ionicons name={a.icone} size={26} color={Colors.primary} /></View>
          <Text style={styles.rotulo}>{a.rotulo}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  item: { width: 88, alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.xs },
  circulo: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadows.card },
  rotulo: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', fontSize: 12, lineHeight: 16, color: Colors.textPrimary, textAlign: 'center' },
});
