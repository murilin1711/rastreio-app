import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ehImagem, formatarTamanho } from '@core/documentos/mapeamento';
import { buscar, excluir } from '@core/documentos/repositorio';
import { urlAssinada } from '@core/documentos/storage';
import { ROTULO_TIPO_DOCUMENTO, type Documento } from '@core/documentos/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { Button, Card, Colors, InternalHeader, Radius, Spacing, Typography } from '@ui/index';

function dataBr(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** Detalhe do documento: imagem inline com URL assinada (1 h); PDF abre no navegador do sistema. */
export default function DetalheDocumento() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessao } = useSessao();
  const { width } = useWindowDimensions();
  const [doc, setDoc] = useState<Documento | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [apagando, setApagando] = useState(false);

  useEffect(() => {
    if (!sessao?.user.id) return;
    buscar(sessao.user.id, id)
      .then(async (d) => { setDoc(d); if (d) setUrl(await urlAssinada(d.caminho)); })
      .catch((e) => setErro(traduzirErro(e).mensagemUsuario));
  }, [sessao?.user.id, id]);

  const abrirPdf = async () => {
    if (!url) return;
    await WebBrowser.openBrowserAsync(url);
  };

  const apagar = () => {
    Alert.alert('Apagar documento?', 'O arquivo será removido de forma permanente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => {
        if (!sessao?.user.id) return;
        setApagando(true);
        try { await excluir(sessao.user.id, id); router.back(); } catch (e) { Alert.alert('Não foi possível apagar', traduzirErro(e).mensagemUsuario); } finally { setApagando(false); }
      } },
    ]);
  };

  const larguraImagem = width - Spacing.xxl * 2;

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Meus documentos" title={doc?.nome ?? 'Documento'} onBack={() => router.back()} />
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        {!doc && !erro ? <Text style={styles.texto}>Carregando…</Text> : null}
        {doc ? (
          <>
            {ehImagem(doc.mime) && url ? (
              <Image source={{ uri: url }} style={[styles.imagem, { width: larguraImagem, height: larguraImagem * 1.3 }]} resizeMode="contain" accessibilityLabel={doc.nome} />
            ) : (
              <View style={styles.pdf}>
                <Text style={styles.texto}>Arquivo PDF</Text>
                <Button label="Abrir PDF" onPress={abrirPdf} disabled={!url} style={{ marginTop: Spacing.md }} />
              </View>
            )}
            <Card style={styles.card}>
              <Text style={styles.meta}>{ROTULO_TIPO_DOCUMENTO[doc.tipo]} · {formatarTamanho(doc.tamanho)}</Text>
              <Text style={styles.meta}>{doc.dataDocumento ? `Data do documento: ${dataBr(doc.dataDocumento)}` : `Guardado em ${dataBr(doc.criadoEm)}`}</Text>
              {doc.observacao ? <Text style={styles.texto}>{doc.observacao}</Text> : null}
            </Card>
            <Button label="Apagar documento" variant="ghost" onPress={apagar} loading={apagando} style={{ marginTop: Spacing.xxl }} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  imagem: { borderRadius: Radius.linha, backgroundColor: Colors.surfaceAlt },
  pdf: { borderRadius: Radius.bloco, backgroundColor: Colors.surface, padding: Spacing.xl, alignItems: 'center' },
  card: { padding: Spacing.xl, gap: Spacing.xs, marginTop: Spacing.lg },
  meta: { ...Typography.caption, color: Colors.textSecondary },
  texto: { ...Typography.body, color: Colors.textPrimary },
  erro: { ...Typography.body, color: Colors.danger },
});
