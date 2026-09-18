import { useEffect, useRef } from 'react';
import { useRouter, type Href } from 'expo-router';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMedicacoes } from '@core/medicacoes/useMedicacoes';
import { useRastreando } from '@core/rastreando/useRastreando';
import { sincronizarLembretesMedicacao } from '@core/cardio/lembretesCardio';
import { useResumoCardio } from '@core/cardio/useResumoCardio';
import { useSessao } from '@core/sessao/SessaoProvider';
import { usePerfil } from '@core/perfil/usePerfil';
import { CardModulo } from '@modules/home/CardModulo';
import { ItemHoje } from '@modules/home/ItemHoje';
import { montarItensHoje, type ItemHoje as Item } from '@modules/home/montarItensHoje';
import { traduzirErro } from '@core/supabase/erros';
import { Colors, LogoNero, Radius, Spacing, Typography } from '@ui/index';

function saudacao(nome?: string | null) {
  const h = new Date().getHours();
  const periodo = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiro = nome?.trim().split(' ')[0];
  return primeiro ? `${periodo}, ${primeiro}` : periodo;
}

/** Home do NERO (§55, §56, §89): pendências e galeria de módulos. */
export default function Home() {
  const router = useRouter();
  const { perfil, antecedentes, carregando, recarregar, salvar } = usePerfil();
  const { ativas, recarregar: recarregarMed } = useMedicacoes();
  const rastreando = useRastreando();
  const cardio = useResumoCardio();
  const { sessao } = useSessao();
  const itens = montarItensHoje({
    perfil, antecedentesQtd: antecedentes.length, medicacoesAtivasQtd: ativas.length,
    rastreando: rastreando.avaliacoes ? { pendencias: rastreando.pendencias, sintomas: rastreando.sintomas, avaliacoes: rastreando.avaliacoes } : undefined,
    cardio: cardio.resumo,
  });
  const subtituloCardio = cardio.resumo?.mrpaAtiva
    ? `MRPA em andamento — dia ${Math.min(Math.max(cardio.resumo.mrpaAtiva.dia, 1), cardio.resumo.mrpaAtiva.diasPrevistos)} de ${cardio.resumo.mrpaAtiva.diasPrevistos}`
    : cardio.resumo?.ultimaPA ? `Última pressão ${cardio.resumo.ultimaPA.pas}/${cardio.resumo.ultimaPA.pad}` : 'Pressão, glicemia e risco cardiovascular';

  // §21: reagenda os lembretes de medicação (7 dias) uma vez por abertura do app
  const sincronizou = useRef(false);
  useEffect(() => {
    if (sincronizou.current || !sessao?.user.id || !ativas.length) return;
    sincronizou.current = true;
    sincronizarLembretesMedicacao(sessao.user.id, ativas.filter((m) => m.lembrar && m.horarios.length)).catch(() => {});
  }, [sessao?.user.id, ativas]);
  const subtituloRastreando = rastreando.sintomas.length ? 'Sinal de alerta registrado' : rastreando.pendencias.length ? `${rastreando.pendencias.length} pendência${rastreando.pendencias.length > 1 ? 's' : ''}` : rastreando.avaliacoes ? 'Rastreamento de câncer pelo seu perfil' : 'Carregando…';
  const pendentes = itens.filter((i) => i.nivel !== 'verde').length;
  const inicial = perfil?.nome?.trim().charAt(0).toUpperCase() ?? '';

  const atualizar = () => { recarregar(); recarregarMed(); rastreando.recarregar(); cardio.recarregar(); };

  const declararNegativa = (item: Item) => {
    const acao = item.acaoSecundaria;
    if (!acao) return;
    const explicacao = acao.campo === 'semMedicacoes'
      ? 'Vamos registrar que você não usa medicamentos. Se começar a usar algum, adicione em Minha Saúde › Meus medicamentos.'
      : 'Vamos registrar que não há casos de câncer ou infarto precoce na família. Se souber de algum depois, adicione em Minha Saúde › Antecedentes familiares.';
    Alert.alert(acao.rotulo, explicacao, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => salvar({ [acao.campo]: true }).catch((e) => Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario)) },
    ]);
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={atualizar} tintColor={Colors.primary} />}
      >
        <View style={styles.topo}>
          <View style={styles.marca}>
            <LogoNero variante="simbolo" width={26} />
            <Text style={styles.marcaTexto}>NERO</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarTexto}>{inicial}</Text></View>
        </View>

        <Text style={styles.saudacao}>{saudacao(perfil?.nome)}</Text>
        <Text style={styles.pergunta}>Como está sua saúde hoje?</Text>

        <View style={styles.secaoTopo}>
          <Text style={styles.secao}>Pendências</Text>
          {pendentes > 0 ? <View style={styles.contador}><Text style={styles.contadorTexto}>{pendentes}</Text></View> : null}
        </View>
        <View style={{ gap: Spacing.sm }}>
          {itens.map((i) => <ItemHoje key={i.id} item={i} onPress={() => router.push(i.rota as Href)} onAcaoSecundaria={declararNegativa} />)}
        </View>

        <Text style={[styles.secao, { marginTop: Spacing.xxxl, marginBottom: Spacing.md }]}>Módulos</Text>
        <View style={styles.grade}>
          <View style={styles.linhaGrade}>
            <CardModulo titulo="Rastreando" descricao={subtituloRastreando} icone="search-outline" capa={[Colors.logoAco, Colors.logoCiano]} onPress={() => router.push('/(app)/rastreando')} />
            <CardModulo titulo="Minha Saúde" descricao="Perfil, medicamentos e relatórios" icone="person-outline" capa={[Colors.logoMarinho, Colors.logoAco]} onPress={() => router.push('/(app)/minha-saude')} />
          </View>
          <View style={styles.linhaGrade}>
            <CardModulo titulo="Coração & Metabolismo" descricao={subtituloCardio} icone="heart-outline" capa={['#B4321F', '#F2734A']} onPress={() => router.push('/(app)/coracao')} />
            <CardModulo titulo="Saúde & Bem-estar" descricao="Peso, alimentação, atividade e sono" icone="leaf-outline" capa={['#15803D', '#5FCB8A']} emBreve />
          </View>
        </View>

        <Text style={styles.rodape}>O NERO organiza suas informações e não substitui a avaliação do seu médico.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  marca: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  marcaTexto: { fontFamily: 'Poppins-ExtraBold', fontSize: 15, letterSpacing: 2, color: Colors.primary },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { fontFamily: 'Poppins-Bold', fontSize: 15, color: Colors.white },
  saudacao: { ...Typography.display, fontSize: 28, lineHeight: 34, color: Colors.primary },
  pergunta: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.xxl },
  secaoTopo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  secao: { ...Typography.heading, color: Colors.textPrimary },
  contador: { minWidth: 22, height: 22, borderRadius: Radius.pill, paddingHorizontal: 6, backgroundColor: Colors.warning, alignItems: 'center', justifyContent: 'center' },
  contadorTexto: { fontFamily: 'Poppins-Bold', fontSize: 12, color: Colors.white },
  grade: { gap: Spacing.md },
  linhaGrade: { flexDirection: 'row', gap: Spacing.md },
  rodape: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xxxl },
});
