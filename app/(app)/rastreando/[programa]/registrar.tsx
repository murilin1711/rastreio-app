import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Programa, ResultadoClassificacao } from '@core/regras/tipos';
import { registrarExame } from '@core/rastreando/registrarExame';
import { PROGRAMAS, ROTULO_EXAME, TIPOS_POR_PROGRAMA, type TipoExameRastreamento } from '@core/rastreando/tipos';
import { useRastreando } from '@core/rastreando/useRastreando';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { usePedidoDeAvisos } from '@core/lembretes/usePedidoDeAvisos';
import { PassoPerfil } from '@modules/minha-saude/PassoPerfil';
import { FormResultado, resultadoValido, type Resultado } from '@modules/rastreando/componentes/FormResultado';
import { ResultadoClassificacaoView } from '@modules/rastreando/componentes/ResultadoClassificacaoView';
import { resumoResultado } from '@modules/rastreando/componentes/CartaoExame';
import { dataBr } from '@modules/rastreando/componentes/statusUI';
import { CONTEUDO } from '@modules/rastreando/conteudo';
import { Button, CampoData, Colors, Input, InternalHeader, Opcoes, Spacing, Typography } from '@ui/index';

/** Registro de exame de rastreamento (§30, §42, §51). */
export default function Registrar() {
  const router = useRouter();
  const { programa, pendencia } = useLocalSearchParams<{ programa: string; pendencia?: string }>();
  const { sessao, online } = useSessao();
  const { pendencias, exames, recarregar } = useRastreando();
  const avisos = usePedidoDeAvisos();

  const valido = PROGRAMAS.includes(programa as Programa);
  const p = (valido ? programa : 'mama') as Programa;
  const tipos = TIPOS_POR_PROGRAMA[p];
  const pendsPrograma = pendencias.filter((x) => x.programa === p);

  const [tipo, setTipo] = useState<TipoExameRastreamento | null>(tipos.length === 1 ? tipos[0] : null);
  const [data, setData] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado>({});
  const [resolve, setResolve] = useState<string | null>(pendencia ?? null);
  const [instituicao, setInstituicao] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [laudo, setLaudo] = useState('');
  const [passo, setPasso] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [saida, setSaida] = useState<{ resultado: ResultadoClassificacao; lembretesOk: boolean } | null>(null);

  if (!valido) return <Redirect href="/(app)/rastreando" />;
  const c = CONTEUDO[p];

  // Passos: 1 tipo (se >1) · 2 data · 3 resultado · 4 pendência (se houver) · 5 opcionais
  const temTipo = tipos.length > 1;
  const temPend = pendsPrograma.length > 0 && !pendencia;
  const sequencia = [temTipo ? 'tipo' : null, 'data', 'resultado', temPend ? 'pendencia' : null, 'opcionais'].filter(Boolean) as string[];
  const atual = sequencia[passo - 1];
  const TOTAL = sequencia.length;

  const salvar = async () => {
    if (!sessao || !tipo || !data) return;
    await avisos.pedir(); // D-043: o exame cria os lembretes da próxima data; pergunta antes de gravar.
    setSalvando(true);
    try {
      const r = await registrarExame(sessao.user.id, {
        programa: p, tipo, dataRealizacao: data, resultado,
        laudoTexto: laudo.trim() || undefined, instituicao: instituicao.trim() || undefined, solicitante: solicitante.trim() || undefined,
        resolveExameId: resolve && resolve !== 'nao' ? resolve : null,
      });
      await recarregar();
      setSaida({ resultado: r.resultado, lembretesOk: r.lembretesOk });
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally { setSalvando(false); }
  };

  if (saida) {
    return (
      <SafeAreaView style={styles.tela} edges={['top']}>
        <ScrollView contentContainerStyle={styles.conteudo}>
          <InternalHeader sectionLabel={c.titulo} title="Exame registrado" onBack={() => router.replace({ pathname: '/(app)/rastreando/[programa]', params: { programa: p } })} />
          <ResultadoClassificacaoView r={saida.resultado} lembretesOk={saida.lembretesOk} />
          <View style={{ gap: Spacing.sm, marginTop: Spacing.xxl }}>
            <Button label="Ver meus exames" onPress={() => router.replace({ pathname: '/(app)/rastreando/[programa]/exames', params: { programa: p } })} />
            <Button label="Voltar aos Rastreamentos" variant="outline" onPress={() => router.replace('/(app)/rastreando')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const comum = { passo, total: TOTAL, salvando, ultimo: passo === TOTAL, onVoltar: passo > 1 ? () => setPasso(passo - 1) : () => router.back() };
  const avancar = () => (passo === TOTAL ? salvar() : setPasso(passo + 1));

  const tela = (() => { switch (atual) {
    case 'tipo':
      return (
        <PassoPerfil {...comum} titulo="Qual exame você fez?" podeAvancar={!!tipo} onAvancar={avancar}>
          <Opcoes opcoes={tipos.map((t) => ({ valor: t, rotulo: ROTULO_EXAME[t] }))} valor={tipo} onChange={(t) => { setTipo(t); setResultado({}); }} />
        </PassoPerfil>
      );
    case 'data':
      return (
        <PassoPerfil {...comum} titulo={`Quando foi feito o exame?`} ajuda={tipo ? ROTULO_EXAME[tipo] : undefined} podeAvancar={!!data} onAvancar={avancar}>
          <CampoData valor={data} onChange={setData} />
        </PassoPerfil>
      );
    case 'resultado':
      return (
        <PassoPerfil {...comum} titulo="Qual foi o resultado?" ajuda="Copie do laudo. Se algo não estiver no laudo, deixe em branco." podeAvancar={!!tipo && resultadoValido(tipo, resultado)} onAvancar={avancar}>
          {tipo ? <FormResultado tipo={tipo} valor={resultado} onChange={setResultado} /> : null}
        </PassoPerfil>
      );
    case 'pendencia':
      return (
        <PassoPerfil {...comum} titulo="Este exame está relacionado a uma pendência anterior?" ajuda="Se sim, o NERO fecha a pendência e define a próxima etapa a partir deste resultado." podeAvancar={!!resolve} onAvancar={avancar}>
          <Opcoes
            opcoes={[
              ...pendsPrograma.map((pd) => {
                const origem = exames.find((e) => e.id === pd.exameOrigemId);
                return { valor: pd.exameOrigemId, rotulo: pd.descricao, descricao: origem ? `${resumoResultado(origem)} em ${dataBr(origem.dataRealizacao)}` : undefined };
              }),
              { valor: 'nao', rotulo: 'Não, é um exame de rotina' },
            ]}
            valor={resolve}
            onChange={setResolve}
          />
        </PassoPerfil>
      );
    default:
      return (
        <PassoPerfil {...comum} titulo="Informações complementares" ajuda="Opcionais. Ajudam no relatório para o seu médico." podeAvancar={online} onAvancar={avancar} podePular onPular={salvar}>
          <View style={{ gap: Spacing.md }}>
            <Input placeholder="Onde foi feito (opcional)" value={instituicao} onChangeText={setInstituicao} />
            <Input placeholder="Médico solicitante (opcional)" value={solicitante} onChangeText={setSolicitante} />
            <Input placeholder="Conclusão do laudo, em texto (opcional)" value={laudo} onChangeText={setLaudo} multiline />
            {!online ? <Text style={styles.offline}>Sem conexão com a internet. Você poderá salvar quando a rede voltar.</Text> : null}
          </View>
        </PassoPerfil>
      );
  } })();
  return <>{tela}{avisos.modal}</>;
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  offline: { ...Typography.caption, color: Colors.warning },
});
