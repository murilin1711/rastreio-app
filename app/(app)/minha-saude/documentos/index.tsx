import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROTULO_TIPO_DOCUMENTO, type TipoDocumento } from '@core/documentos/tipos';
import { useDocumentos } from '@core/documentos/useDocumentos';
import { traduzirErro } from '@core/supabase/erros';
import { escolherArquivo } from '@modules/minha-saude/componentes/escolherArquivo';
import { LinhaDocumento } from '@modules/minha-saude/componentes/LinhaDocumento';
import { Button, Colors, InternalHeader, Opcoes, Spacing, Typography } from '@ui/index';

type Filtro = TipoDocumento | 'todos';
const FILTROS: { valor: Filtro; rotulo: string }[] = [{ valor: 'todos', rotulo: 'Todos' }, ...(Object.keys(ROTULO_TIPO_DOCUMENTO) as TipoDocumento[]).map((t) => ({ valor: t, rotulo: ROTULO_TIPO_DOCUMENTO[t] }))];

/** Meus Documentos (§59, D-008): laudos, receitas, atestados e imagens, com ou sem exame vinculado. */
export default function Documentos() {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const { documentos, carregando, erro, recarregar } = useDocumentos(filtro === 'todos' ? {} : { tipo: filtro });
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));

  const adicionar = async () => {
    try {
      const a = await escolherArquivo();
      if (!a) return;
      router.push({ pathname: '/(app)/minha-saude/documentos/novo', params: { uri: a.uri, mime: a.mime, nome: a.nome } });
    } catch (e) {
      Alert.alert('Não foi possível escolher o arquivo', traduzirErro(e).mensagemUsuario);
    }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Minha Saúde" title="Meus documentos" onBack={() => router.back()} />
        <Text style={styles.ajuda}>Guarde laudos, receitas e imagens de exames. Só você vê estes arquivos; eles entram no relatório apenas se você pedir.</Text>
        <Button label="Adicionar documento" onPress={adicionar} style={{ marginTop: Spacing.lg }} />
        <Text style={styles.rotulo}>Mostrar</Text>
        <Opcoes<Filtro> opcoes={FILTROS} valor={filtro} onChange={setFiltro} />
        {erro ? <Text style={styles.erro}>{erro.mensagemUsuario}</Text> : null}
        <View style={{ gap: Spacing.sm, marginTop: Spacing.xxl }}>
          {documentos.length === 0 && !carregando ? (
            <Text style={styles.vazio}>{filtro === 'todos' ? 'Nenhum documento guardado ainda. Fotografe um laudo ou escolha um PDF para começar.' : 'Nenhum documento deste tipo.'}</Text>
          ) : documentos.map((d) => <LinhaDocumento key={d.id} documento={d} onPress={() => router.push({ pathname: '/(app)/minha-saude/documentos/[id]', params: { id: d.id } })} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  ajuda: { ...Typography.body, color: Colors.textSecondary },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  erro: { ...Typography.caption, color: Colors.danger, marginTop: Spacing.md },
  vazio: { ...Typography.body, color: Colors.textSecondary },
});
