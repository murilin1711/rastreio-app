import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCheckup } from '@core/cardio/useCheckup';
import type { ItemCheckup } from '@core/regras/cardio/tiposRisco';
import { Colors, InternalHeader, Spacing, Typography } from '@ui/index';

const ROTA: Record<ItemCheckup['chave'], string> = { pa: '/(app)/coracao/pressao', peso: '/(app)/coracao/risco/dados', tabagismo: '/(app)/minha-saude/perfil', glicemia_hba1c: '/(app)/coracao/exames/registrar', lipidios: '/(app)/coracao/exames/registrar', renal: '/(app)/coracao/exames/registrar', atividade: '/(app)/coracao', risco: '/(app)/coracao/risco' };

/** "Como está minha prevenção?" (§24): n/8 pelas janelas de C-014, sem pedir exames além dos que o módulo usa. */
export default function Checkup() {
  const router = useRouter();
  const { resultado, carregando, recarregar } = useCheckup();
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Coração & Metabolismo" title="Como está minha prevenção?" />
        {resultado ? (
          <>
            <Text style={styles.contador}>Informações atualizadas: {resultado.atualizados}/{resultado.total}</Text>
            <Text style={styles.sub}>Cada item vale pelo prazo que as diretrizes usam para reavaliação (pressão nos últimos dias; peso no último mês; exames de sangue no último ano).</Text>
            <View style={styles.lista}>
              {resultado.itens.map((i) => (
                <Pressable key={i.chave} disabled={i.atualizado} onPress={() => router.push(ROTA[i.chave] as never)} style={({ pressed }) => [styles.linha, pressed && { opacity: 0.7 }]}>
                  <Ionicons name={i.atualizado ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={i.atualizado ? Colors.success : i.naoSeAplica ? Colors.textMuted : Colors.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.titulo}>{i.rotulo}</Text>
                    {!i.atualizado || i.naoSeAplica ? <Text style={styles.frase}>{i.frase}</Text> : null}
                  </View>
                  {!i.atualizado ? <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} /> : null}
                </Pressable>
              ))}
            </View>
          </>
        ) : <Text style={styles.sub}>{carregando ? 'Verificando…' : 'Complete seu perfil para usar o check-up.'}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  contador: { ...Typography.display, color: Colors.primary },
  sub: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.xl },
  lista: { gap: 0 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  frase: { ...Typography.caption, color: Colors.textSecondary },
});
