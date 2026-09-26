import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDocumentos } from '@core/documentos/useDocumentos';
import { Button, Colors, Spacing, Typography } from '@ui/index';
import { LinhaDocumento } from './LinhaDocumento';
import { useAbrir } from '@core/navegacao/useVoltar';

/** Bloco "Documentos" dentro do detalhe de um exame: lista os anexos e abre o formulário com o exame já vinculado. */
export function BlocoDocumentos({ exameId }: { exameId: string }) {
  const router = useRouter();
  const abrir = useAbrir();
  const { documentos, carregando, recarregar } = useDocumentos({ exameId });
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));

  return (
    <View style={styles.bloco}>
      <Text style={styles.secao}>Documentos</Text>
      {documentos.length === 0 && !carregando ? <Text style={styles.vazio}>Nenhum laudo ou imagem anexado a este exame.</Text> : null}
      <View style={{ gap: Spacing.sm }}>
        {documentos.map((d) => <LinhaDocumento key={d.id} documento={d} onPress={() => abrir({ pathname: '/(app)/(tabs)/minha-saude/documentos/[id]', params: { id: d.id } })} />)}
      </View>
      <Button label="Anexar documento" variant="outline" onPress={() => abrir({ pathname: '/(app)/(tabs)/minha-saude/documentos/novo', params: { exameId } })} style={{ marginTop: Spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { marginTop: Spacing.xxl },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.md },
  vazio: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.sm },
});
