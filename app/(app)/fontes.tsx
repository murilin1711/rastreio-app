import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CREDITOS } from '@core/publicacao';
import { GRUPOS_FONTES, REFERENCIAS } from '@core/referencias/catalogo';
import { LinhaFonte } from '@modules/fontes/FontesDaTela';
import { Colors, InternalHeader, Radius, Spacing, Typography } from '@ui/index';

/** Acervo de fontes científicas (diretriz 1.4.1 da App Store). Aberto de Minha Saúde e do pé das telas clínicas. */
export default function FontesCientificas() {
  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Minha Saúde" title="Fontes científicas" />
        <Text style={styles.intro}>
          Os parâmetros, cálculos e textos do NERO seguem as diretrizes abaixo. Toque em uma fonte para abrir o documento original.
          O NERO organiza informações e não substitui a avaliação do seu médico.
        </Text>
        {GRUPOS_FONTES.map((g) => (
          <View key={g.titulo} style={styles.grupo}>
            <Text style={styles.secao}>{g.titulo}</Text>
            <View style={styles.caixa}>
              {g.ids.map((id) => <LinhaFonte key={id} referencia={REFERENCIAS[id]} />)}
            </View>
          </View>
        ))}
        <Text style={styles.nota}>Revisão do conteúdo clínico: {CREDITOS.replace('Criado por ', '')}.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  intro: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  grupo: { marginTop: Spacing.lg },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.sm },
  caixa: { backgroundColor: Colors.surface, borderRadius: Radius.linha, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.sm },
  nota: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xxl },
});
