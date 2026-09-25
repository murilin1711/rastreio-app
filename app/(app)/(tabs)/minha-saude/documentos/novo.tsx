import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rotuloExame } from '@core/cardio/tiposExames';
import { rotuloExameParaVinculo, type ExameParaVinculo } from '@core/documentos/mapeamento';
import { inserir, listarExamesParaVinculo } from '@core/documentos/repositorio';
import { apagarArquivo, enviar, type ArquivoEscolhido } from '@core/documentos/storage';
import { ROTULO_TIPO_DOCUMENTO, type TipoDocumento } from '@core/documentos/tipos';
import { ROTULO_EXAME } from '@core/rastreando/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { escolherArquivo } from '@modules/minha-saude/componentes/escolherArquivo';
import { Button, CampoData, Colors, completarPiso, EsperaNero, Input, InternalHeader, Select, Spacing, Typography } from '@ui/index';

const SEM_VINCULO = '__nenhum__';
const TIPOS = (Object.keys(ROTULO_TIPO_DOCUMENTO) as TipoDocumento[]).map((t) => ({ valor: t, rotulo: ROTULO_TIPO_DOCUMENTO[t] }));

/**
 * Formulário do documento. Chega de duas formas: com o arquivo já escolhido (uri/mime/nome, vindo da lista)
 * ou só com `exameId` (vindo do detalhe de um exame) — neste caso pede o arquivo aqui mesmo.
 */
export default function NovoDocumento() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string; mime?: string; nome?: string; exameId?: string }>();
  const { sessao } = useSessao();
  const [arquivo, setArquivo] = useState<ArquivoEscolhido | null>(params.uri && params.mime ? { uri: params.uri, mime: params.mime, nome: params.nome ?? 'documento' } : null);
  const [tipo, setTipo] = useState<TipoDocumento | null>(params.mime?.startsWith('image/') ? 'laudo' : null);
  const [nome, setNome] = useState('');
  const [data, setData] = useState<string | null>(null);
  const [observacao, setObservacao] = useState('');
  const [exameId, setExameId] = useState<string>(params.exameId ?? SEM_VINCULO);
  const [exames, setExames] = useState<ExameParaVinculo[]>([]);
  const [salvando, setSalvando] = useState(false);
  const cancelado = useRef(false);

  useEffect(() => {
    if (!sessao?.user.id) return;
    listarExamesParaVinculo(sessao.user.id).then(setExames).catch(() => setExames([]));
  }, [sessao?.user.id]);

  const opcoesExame = [{ valor: SEM_VINCULO, rotulo: 'Nenhum exame' }, ...exames.map((e) => ({ valor: e.id, rotulo: rotuloExameParaVinculo(e, { rastreando: ROTULO_EXAME, cardio: rotuloExame }) }))];

  const pedirArquivo = async () => {
    try {
      const a = await escolherArquivo();
      if (a) { setArquivo(a); if (!tipo && a.mime.startsWith('image/')) setTipo('laudo'); }
    } catch (e) {
      Alert.alert('Não foi possível escolher o arquivo', traduzirErro(e).mensagemUsuario);
    }
  };

  const salvar = async () => {
    if (!sessao?.user.id) return;
    if (!arquivo) { Alert.alert('Faltou algo', 'Escolha o arquivo do documento.'); return; }
    if (!tipo) { Alert.alert('Faltou algo', 'Escolha o tipo do documento.'); return; }
    const nomeFinal = nome.trim() || ROTULO_TIPO_DOCUMENTO[tipo];
    cancelado.current = false;
    const inicio = Date.now();
    setSalvando(true);
    try {
      const enviado = await enviar(sessao.user.id, arquivo);
      // O upload não aborta no meio; se o usuário desistiu enquanto ele corria, o arquivo já está
      // no bucket e precisa ser apagado — sem isso ficaria um órfão sem registro que o liste.
      if (cancelado.current) { apagarArquivo(enviado.caminho).catch(() => {}); return; }
      await inserir(sessao.user.id, { exameId: exameId === SEM_VINCULO ? null : exameId, tipo, nome: nomeFinal, caminho: enviado.caminho, mime: enviado.mime, tamanho: enviado.tamanho, dataDocumento: data, observacao: observacao.trim() || null });
      // Arquivo pequeno em rede boa sobe em menos de um segundo — o piso evita o piscar (D-023).
      await completarPiso(inicio);
      router.back();
    } catch (e) {
      if (!cancelado.current) Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Meus documentos" title="Novo documento" onBack={() => router.back()} />
        <Text style={styles.rotulo}>Arquivo</Text>
        {arquivo ? <Text style={styles.texto}>{arquivo.nome}</Text> : <Text style={styles.ajuda}>Nenhum arquivo escolhido.</Text>}
        <Button label={arquivo ? 'Trocar arquivo' : 'Escolher arquivo'} variant="outline" onPress={pedirArquivo} style={{ marginTop: Spacing.sm }} />
        <Text style={styles.rotulo}>Tipo</Text>
        <Select opcoes={TIPOS} valor={tipo} onChange={setTipo} placeholder="Escolha o tipo" />
        <Text style={styles.rotulo}>Nome (opcional)</Text>
        <Input value={nome} onChangeText={setNome} placeholder={tipo ? ROTULO_TIPO_DOCUMENTO[tipo] : 'Ex.: Laudo da mamografia'} />
        <Text style={styles.rotulo}>Data do documento (opcional)</Text>
        <CampoData valor={data} onChange={setData} />
        <Text style={styles.rotulo}>Exame vinculado</Text>
        <Select opcoes={opcoesExame} valor={exameId} onChange={setExameId} placeholder="Escolha o exame" />
        <Text style={styles.rotulo}>Observação (opcional)</Text>
        <Input value={observacao} onChangeText={setObservacao} multiline />
        <Button label="Salvar documento" onPress={salvar} disabled={salvando} style={{ marginTop: Spacing.xxl }} />
        <EsperaNero
          visivel={salvando}
          titulo="Enviando seu documento…"
          detalhe="Isso leva alguns segundos."
          onCancelar={() => { cancelado.current = true; setSalvando(false); }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  texto: { ...Typography.body, color: Colors.textPrimary },
  ajuda: { ...Typography.caption, color: Colors.textSecondary },
});
