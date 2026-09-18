import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePerfil } from '@core/perfil/usePerfil';
import { useSessao } from '@core/sessao/SessaoProvider';
import { Button, Colors, EmBreveBadge, ListItem, NeroImage, Radius, Spacing, Typography } from '@ui/index';

export default function MinhaSaude() {
  const router = useRouter();
  const { sair } = useSessao();
  const { perfil, antecedentes } = usePerfil();

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.cabecalho}>
          <View style={{ flex: 1 }}>
            <Text style={styles.contexto}>Minha Saúde</Text>
            <Text style={styles.titulo}>{perfil?.nome || 'Seu perfil'}</Text>
          </View>
          <NeroImage variant="minha_saude" size={80} />
        </View>

        <View style={{ gap: Spacing.sm }}>
          <ListItem icon="person-outline" title="Meu perfil" subtitle="Dados básicos, tabagismo, condições e histórico" onPress={() => router.push('/(app)/minha-saude/perfil')} />
          <ListItem icon="people-outline" title="Antecedentes familiares" subtitle={antecedentes.length ? `${antecedentes.length} registrado${antecedentes.length > 1 ? 's' : ''}` : 'Nenhum registrado ainda'} onPress={() => router.push('/(app)/minha-saude/antecedentes')} />
          <ListItem icon="medkit-outline" title="Meus medicamentos" subtitle="Lista atual e histórico" onPress={() => router.push('/(app)/minha-saude/medicamentos')} />
          <ListItem icon="folder-open-outline" title="Meus documentos" subtitle="Laudos, receitas e imagens de exames" onPress={() => router.push('/(app)/minha-saude/documentos')} />
          <ListItem icon="document-text-outline" title="Relatórios" subtitle="PDF para o médico: cardiovascular, oncológico ou geral" onPress={() => router.push('/(app)/minha-saude/relatorios')} />
          <ListItem icon="calendar-outline" title="Preparar minha consulta" subtitle="Relatório focado na especialidade" onPress={() => router.push('/(app)/minha-saude/consulta')} />
        </View>

        <Text style={styles.secao}>Em breve</Text>
        <View style={{ gap: Spacing.sm }}>
          <EmBreve titulo="Meus exames" />
          <EmBreve titulo="Linha do tempo" />
        </View>

        <Button label="Sair da conta" variant="ghost" onPress={sair} style={{ marginTop: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function EmBreve({ titulo }: { titulo: string }) {
  return (
    <View style={styles.emBreve}>
      <Text style={[Typography.subheading, { color: Colors.textSecondary, flex: 1 }]}>{titulo}</Text>
      <EmBreveBadge />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  cabecalho: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xxl },
  contexto: { ...Typography.caption, color: Colors.textSecondary },
  titulo: { ...Typography.display, fontSize: 26, lineHeight: 32, color: Colors.primary },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  emBreve: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.linha, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', padding: Spacing.lg },
});
