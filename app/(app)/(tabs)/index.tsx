import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useIsFocused, useRouter, type Href } from 'expo-router';
import { AccessibilityInfo, Alert, Animated, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMedicacoes } from '@core/medicacoes/useMedicacoes';
import { useRastreando } from '@core/rastreando/useRastreando';
import { sincronizarLembretesMedicacao } from '@core/cardio/lembretesCardio';
import { useHabitos } from '@core/bemestar/useHabitos';
import { useResumoCardio } from '@core/cardio/useResumoCardio';
import { useConsultas } from '@core/lembretes/useConsultas';
import { rotuloEspecialidade } from '@core/relatorios/especialidades';
import { useSessao } from '@core/sessao/SessaoProvider';
import { usePerfil } from '@core/perfil/usePerfil';
import { useSequencia } from '@core/bemestar/useSequencia';
import { useAvisos } from '@core/lembretes/useAvisos';
import { useConquistas } from '@core/bemestar/useConquistas';
import { CONQUISTA_PERFIL } from '@core/regras/bemestar/conquistas';
import { renovarAvisosDiarios } from '@core/lembretes/preferencias';
import { CardModulo } from '@modules/home/CardModulo';
import { SeloSequencia } from '@modules/home/SeloSequencia';
import { ItemHoje } from '@modules/home/ItemHoje';
import { EsqueletoPendencias } from '@modules/home/EsqueletoPendencias';
import { FaixaAtalhos } from '@modules/home/FaixaAtalhos';
import { montarItensHoje, type ItemHoje as Item } from '@modules/home/montarItensHoje';
import { traduzirErro } from '@core/supabase/erros';
import { TEXTO_SEQUENCIA } from '@modules/bem-estar/conteudo/sequencia';
import { TEXTO_CONQUISTA } from '@modules/bem-estar/conteudo/conquistas';
import { Colors, LogoNero, MS_ATRASO_AO_VOLTAR, ModalAtivarAvisos, ModalComemoracao, NeroAnimado, Radius, SaidaConcluida, Spacing, Typography, useEspacoAbas, useSaidaConcluida } from '@ui/index';
import { useAbrir } from '@core/navegacao/useVoltar';

/**
 * Abertura das pendências (D-041): espera todas as fontes, até este limite. Com sinal ruim, uma fonte
 * pode demorar muito; a partir daqui mostra o que já chegou em vez de prender a pessoa no esqueleto.
 */
const MS_LIMITE_ESQUELETO = 4000;
const MS_ENTRADA_LISTA = 200;

function saudacao(nome?: string | null) {
  const h = new Date().getHours();
  const periodo = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiro = nome?.trim().split(' ')[0];
  return primeiro ? `${periodo}, ${primeiro}` : periodo;
}

/** Home do NERO (§55, §56, §89): pendências e galeria de módulos. */
export default function Home() {
  const espacoAbas = useEspacoAbas();
  const router = useRouter();
  const abrir = useAbrir();
  const { perfil, antecedentes, carregando, recarregar, salvar } = usePerfil();
  const sequencia = useSequencia();
  const avisos = useAvisos();
  // Reavalia a cada volta à Home, não só ao abrir o app (D-042): as abas continuam montadas, e quem
  // acabou de criar o primeiro lembrete (um remédio, uma consulta) voltava aqui sem ser perguntado —
  // e o lembrete ficava silenciado até a próxima abertura.
  const avaliarAvisos = avisos.avaliar;
  useFocusEffect(useCallback(() => { avaliarAvisos(); }, [avaliarAvisos]));
  const { ativas, recarregar: recarregarMed } = useMedicacoes();
  const rastreando = useRastreando();
  const cardio = useResumoCardio();
  const consultas = useConsultas();
  const bemEstar = useHabitos();
  const { sessao } = useSessao();
  const pronto = !carregando && !rastreando.carregando && !cardio.carregando && !consultas.carregando && !bemEstar.carregando;
  const itens = montarItensHoje({
    perfil, antecedentesQtd: antecedentes.length, medicacoesAtivasQtd: ativas.length,
    bemEstar: bemEstar.habitos ? { movimentoMin: bemEstar.habitos.movimentoMin, metaMin: bemEstar.habitos.metaMin, perdaNaoIntencional: bemEstar.perdaNaoIntencional, checkinPendente: bemEstar.habitos.checkinPendente } : undefined,
    consultas: { proxima: consultas.proxima ? { id: consultas.proxima.id, especialidade: consultas.proxima.especialidade, rotuloEspecialidade: rotuloEspecialidade(consultas.proxima.especialidade), dataHora: consultas.proxima.dataHora } : null },
    rastreando: rastreando.avaliacoes ? { pendencias: rastreando.pendencias, sintomas: rastreando.sintomas, avaliacoes: rastreando.avaliacoes } : undefined,
    cardio: cardio.resumo,
    // Só afirma "nada pendente" quando todas as fontes responderam: antes disso o verde piscava na
    // abertura do app e era substituído pelas pendências reais (D-027).
    pronto,
  });
  // §21: reagenda os lembretes de medicação uma vez por abertura do app (renova a lista de 7 dias)
  const sincronizou = useRef(false);
  useEffect(() => {
    if (sincronizou.current || !sessao?.user.id || !ativas.length) return;
    sincronizou.current = true;
    sincronizarLembretesMedicacao(sessao.user.id, ativas.filter((m) => m.lembrar && m.horarios.length)).catch(() => {});
  }, [sessao?.user.id, ativas]);
  // D-048: glicemia e água também renovam a lista a cada abertura (não dependem de haver remédio).
  const renovou = useRef(false);
  useEffect(() => {
    if (renovou.current || !sessao?.user.id) return;
    renovou.current = true;
    renovarAvisosDiarios(sessao.user.id).catch(() => {});
  }, [sessao?.user.id]);
  /**
   * A lista entra inteira, de uma vez (D-041). Antes, cada pendência aparecia quando a sua fonte
   * respondia — uma depois da outra. Liberada, não volta ao esqueleto: puxar para atualizar mantém a
   * lista na tela enquanto recarrega.
   */
  const [liberada, setLiberada] = useState(false);
  const entrada = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (liberada) return;
    if (pronto) { setLiberada(true); return; }
    const t = setTimeout(() => setLiberada(true), MS_LIMITE_ESQUELETO);
    return () => clearTimeout(t);
  }, [pronto, liberada]);
  useEffect(() => {
    if (!liberada) return;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduzir) => Animated.timing(entrada, { toValue: 1, duration: reduzir ? 0 : MS_ENTRADA_LISTA, useNativeDriver: true }).start());
  }, [liberada, entrada]);

  const pendentes = itens.filter((i) => i.nivel !== 'verde').length;
  const inicial = perfil?.nome?.trim().charAt(0).toUpperCase() ?? '';

  const atualizar = () => { recarregar(); recarregarMed(); rastreando.recarregar(); cardio.recarregar(); consultas.recarregar(); bemEstar.recarregar(); };

  /**
   * Volta à Home recarrega as pendências (D-046). As abas continuam montadas, e a Home só buscava os
   * dados ao abrir: a pendência resolvida em outra tela ficava aqui até reabrir o app ou puxar a lista.
   * A primeira vez é a montagem, que já carrega.
   */
  const focada = useIsFocused();
  const atualizarRef = useRef(atualizar);
  atualizarRef.current = atualizar;
  const jaFocou = useRef(false);
  useFocusEffect(useCallback(() => { if (jaFocou.current) atualizarRef.current(); jaFocou.current = true; }, []));

  /** O giro do "puxar para atualizar" é só de quem puxou — a recarga ao voltar é silenciosa. */
  const [puxando, setPuxando] = useState(false);
  useEffect(() => { if (puxando && pronto) setPuxando(false); }, [puxando, pronto]);

  /**
   * Declaração negativa (D-028): marca, mostra o item em verde com "Desfazer" por 15 s e só então
   * o deixa sair. Substituiu o alerta de confirmação que havia antes — perguntar "tem certeza?" e
   * depois oferecer "desfazer" é pedir a mesma coisa duas vezes; o desfazer basta e não interrompe.
   *
   * O índice fica guardado para o item continuar no lugar dele enquanto o tempo corre, em vez de
   * pular para o fim da lista assim que sai da fonte.
   */
  const [declarado, setDeclarado] = useState<{ item: Item; indice: number } | null>(null);
  // "Perfil completo" sai quando a declaração se confirma (fim dos 15 s do "Desfazer"), não antes.
  const conquistas = useConquistas({ auto: false, chaves: CONQUISTA_PERFIL });

  /**
   * Pendência resolvida sai na frente da pessoa (D-046, pedido do Murilo): a bolinha fica verde e o
   * item encolhe, no lugar dele. A comparação só roda com a Home à vista e os dados prontos; fora
   * disso a lista fica congelada, para a saída não acontecer escondida enquanto a pessoa está em
   * outra tela. Ficam de fora o "Nada pendente" (verde, não é uma pendência resolvida) e a
   * declaração negativa, que tem a própria saída com "Desfazer".
   */
  const saida = useSaidaConcluida(itens, (i) => i.id, focada && pronto && liberada, (i) => i.nivel === 'verde' || i.id === declarado?.item.id);

  const declararNegativa = (item: Item) => {
    const acao = item.acaoSecundaria;
    if (!acao) return;
    // O alerta diz onde completar a informação depois — é a única hora em que a pessoa aprende o
    // caminho. Ele confirma; o "Desfazer" dos 15 s cobre o arrependimento, não a desinformação.
    const explicacao = acao.campo === 'semMedicacoes'
      ? 'Vamos registrar que você não usa medicamentos. Se começar a usar algum, adicione em Minha Saúde › Meus medicamentos.'
      : 'Vamos registrar que não há casos de câncer ou infarto precoce na família. Se souber de algum depois, adicione em Minha Saúde › Antecedentes familiares.';
    Alert.alert(acao.rotulo, explicacao, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => {
        setDeclarado({ item, indice: Math.max(itens.findIndex((i) => i.id === item.id), 0) });
        salvar({ [acao.campo]: true }).catch((e) => {
          setDeclarado(null);
          Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
        });
      } },
    ]);
  };

  const desfazerDeclaracao = () => {
    const acao = declarado?.item.acaoSecundaria;
    setDeclarado(null);
    if (acao) salvar({ [acao.campo]: false }).catch((e) => Alert.alert('Não foi possível desfazer', traduzirErro(e).mensagemUsuario));
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: espacoAbas }]}
        refreshControl={<RefreshControl refreshing={puxando} onRefresh={() => { setPuxando(true); atualizar(); }} tintColor={Colors.primary} />}
      >
        <View style={styles.topo}>
          <View style={styles.marca}>
            <LogoNero variante="simbolo" width={26} />
            <Text style={styles.marcaTexto}>NERO</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarTexto}>{inicial}</Text></View>
        </View>

        {/*
          Abertura no eixo central (D-022): a arte do Nero é frontal e simétrica — ele encara
          quem olha. Apoiado de lado em bordas ou faixas ele fica torto; centralizado, tudo se
          alinha sozinho. Tamanhos calibrados pelo Murilo no painel visual; em 23/09 ele subiu
          de 84 para 135 e dispensou o deslocamento vertical.
        */}
        <View style={styles.boasVindas}>
          <NeroAnimado entrada="acenar" size={135} />
          <Text style={styles.saudacao}>{saudacao(perfil?.nome)}</Text>
          <Text style={styles.pergunta}>Como está sua saúde hoje?</Text>
          <View style={styles.selo}><SeloSequencia dias={sequencia.sequencia} /></View>
        </View>

        <View style={styles.secaoTopo}>
          <Text style={styles.secao}>Pendências</Text>
          {liberada && pendentes > 0 ? <View style={styles.contador}><Text style={styles.contadorTexto}>{pendentes}</Text></View> : null}
        </View>
        {!liberada ? <EsqueletoPendencias /> : (
        <Animated.View style={{ gap: Spacing.sm, opacity: entrada }}>
          {(() => {
            const visiveis = saida.lista.filter((x) => x.item.id !== declarado?.item.id);
            if (declarado) visiveis.splice(Math.min(declarado.indice, visiveis.length), 0, { item: declarado.item, concluido: false });
            return visiveis.map(({ item: i, concluido }) => {
              const declaradoAqui = i.id === declarado?.item.id;
              const verde = declaradoAqui || concluido;
              // Saindo, o item aparece marcado — a bolinha vira o tique verde — e não aceita toque.
              const linha = <ItemHoje item={verde ? { ...i, nivel: 'verde' } : i} onPress={() => (verde ? undefined : abrir(i.rota))} onAcaoSecundaria={verde ? undefined : declararNegativa} />;
              if (declaradoAqui) return <SaidaConcluida key={i.id} concluido aoDesfazer={desfazerDeclaracao} aoSair={() => { setDeclarado(null); conquistas.avaliar(); }}>{linha}</SaidaConcluida>;
              if (concluido) return <SaidaConcluida key={i.id} concluido discreto atraso={MS_ATRASO_AO_VOLTAR} aoSair={() => saida.aoSair(i)}>{linha}</SaidaConcluida>;
              return <View key={i.id}>{linha}</View>;
            });
          })()}
        </Animated.View>
        )}

        <Text style={[styles.secao, { marginTop: Spacing.xxxl, marginBottom: Spacing.md }]}>Módulos</Text>
        <View style={styles.grade}>
          <View style={styles.linhaGrade}>
            <CardModulo titulo="Rastreamentos" icone="search-outline" capa={[Colors.logoAco, Colors.logoCiano]} onPress={() => router.push('/(app)/rastreando')} />
            <CardModulo titulo="Minha Saúde" icone="person-outline" capa={[Colors.logoMarinho, Colors.logoAco]} onPress={() => router.push('/(app)/(tabs)/minha-saude')} />
          </View>
          <View style={styles.linhaGrade}>
            <CardModulo titulo="Coração & Metabolismo" icone="heart-outline" capa={['#B4321F', '#F2734A']} onPress={() => router.push('/(app)/coracao')} />
            <CardModulo titulo="Saúde & Bem-estar" icone="leaf-outline" capa={['#15803D', '#5FCB8A']} onPress={() => router.push('/(app)/bem-estar')} />
          </View>
        </View>

        <Text style={[styles.secao, { marginTop: Spacing.xxxl, marginBottom: Spacing.md }]}>Atalhos</Text>
        <FaixaAtalhos sangria={Spacing.xxl} onAbrir={abrir} />

        <Text style={styles.rodape}>O NERO organiza suas informações e não substitui a avaliação do seu médico.</Text>
      </ScrollView>
      <ModalComemoracao conteudo={sequencia.marco ? TEXTO_SEQUENCIA[sequencia.marco] : null} aoFechar={sequencia.dispensarMarco} />
      <ModalComemoracao conteudo={conquistas.proxima ? TEXTO_CONQUISTA[conquistas.proxima] : null} aoFechar={conquistas.dispensar} />
      <ModalAtivarAvisos visivel={avisos.precisa && !sequencia.marco} aoAtivar={() => { avisos.ativar(); }} aoAdiar={() => { avisos.adiar(); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  marca: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  marcaTexto: { fontFamily: 'Poppins-ExtraBold', fontSize: 15, letterSpacing: 2, color: Colors.primary },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { fontFamily: 'Poppins-Bold', fontSize: 15, color: Colors.white },
  boasVindas: { alignItems: 'center', marginTop: Spacing.sm + 2, marginBottom: Spacing.xxl },
  saudacao: { ...Typography.display, fontSize: 28, lineHeight: 34, color: Colors.primary, textAlign: 'center' },
  pergunta: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  /** `SeloSequencia` se alinha à esquerda por conta própria; a linha o recentraliza. */
  selo: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.sm },
  secaoTopo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  secao: { ...Typography.heading, color: Colors.textPrimary },
  contador: { minWidth: 22, height: 22, borderRadius: Radius.pill, paddingHorizontal: 6, backgroundColor: Colors.warning, alignItems: 'center', justifyContent: 'center' },
  contadorTexto: { fontFamily: 'Poppins-Bold', fontSize: 12, color: Colors.white },
  grade: { gap: Spacing.md },
  linhaGrade: { flexDirection: 'row', gap: Spacing.md },
  rodape: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xxxl },
});
