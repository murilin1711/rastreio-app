import { type Href, useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Alert, Linking, Platform, Switch } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listarExamesCardio } from '@core/cardio/examesCardio';
import * as documentos from '@core/documentos/repositorio';
import { listarProximos } from '@core/lembretes/central';
import { useConsultas } from '@core/lembretes/useConsultas';
import { useMedicacoes } from '@core/medicacoes/useMedicacoes';
import { usePerfil } from '@core/perfil/usePerfil';
import { montarContexto } from '@core/rastreando/contexto';
import { bloqueioAtivo, definirBloqueio, pedirBiometria, recursoBiometrico, type RecursoBiometrico } from '@core/sessao/bloqueio';
import { urlEmailContato } from '@core/contato/contato';
import { EMAIL_CONTATO, URL_PRIVACIDADE, URL_TERMOS } from '@core/publicacao';
import { nomeComum } from '@core/relatorios/especialidades';
import { useSessao } from '@core/sessao/SessaoProvider';
import { dataHoraBr } from '@modules/coracao/componentes/formato';
import { Creditos } from '@modules/conta/Creditos';
import { BotaoAnotar } from '@modules/anotar/BotaoAnotar';
import { type AcaoModulo, Button, Colors, ListaAcoes, ListItem, NeroAnimado, Radius, Spacing, Typography, useEspacoAbas } from '@ui/index';

const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

/** Minha Saúde (§58–§63): índice transversal com contadores por entrada. */
export default function MinhaSaude() {
  const espacoAbas = useEspacoAbas();
  // Bloqueio por biometria (D-032): preferência do aparelho, não da conta.
  const [biometria, setBiometria] = useState<RecursoBiometrico | null>(null);
  const [travaLigada, setTravaLigada] = useState(false);
  useEffect(() => {
    recursoBiometrico().then(setBiometria);
    bloqueioAtivo().then(setTravaLigada);
  }, []);

  const alternarTrava = async (ligar: boolean) => {
    // Pede a biometria ANTES de ligar: se o rosto não for reconhecido agora, ligar trancaria a
    // pessoa para fora do próprio prontuário na próxima abertura.
    if (ligar && !(await pedirBiometria())) return;
    await definirBloqueio(ligar);
    setTravaLigada(ligar);
    if (ligar) Alert.alert('Pronto', `O NERO vai pedir ${biometria?.nome ?? 'a biometria'} ao abrir e quando você voltar depois de alguns minutos.`);
  };
  const router = useRouter();
  const { sessao, sair } = useSessao();
  const { perfil, antecedentes, recarregar: recarregarPerfil } = usePerfil();
  const { ativas, recarregar: recarregarMed } = useMedicacoes();
  const consultas = useConsultas();
  const [contadores, setContadores] = useState<{ exames: number; documentos: number; proximoLembrete: string | null } | null>(null);

  const carregar = useCallback(async () => {
    if (!sessao?.user.id) return;
    try {
      const [cardio, ctx, docs, lembretes] = await Promise.all([listarExamesCardio(sessao.user.id), montarContexto(sessao.user.id), documentos.listar(sessao.user.id), listarProximos(sessao.user.id, 30)]);
      setContadores({ exames: cardio.length + ctx.exames.length, documentos: docs.length, proximoLembrete: lembretes[0] ? `${dataHoraBr(lembretes[0].quando)} · ${lembretes[0].rotulo}` : null });
    } catch { setContadores(null); }
  }, [sessao?.user.id]);
  useFocusEffect(useCallback(() => { carregar(); recarregarPerfil(); recarregarMed(); consultas.recarregar(); }, [carregar, recarregarPerfil, recarregarMed, consultas.recarregar]));


  /** D-057: abre o e-mail; sem app de e-mail configurado, mostra o endereço para anotar. */
  const falarComNero = () => {
    const url = urlEmailContato({
      versaoApp: Constants.expoConfig?.version ?? '?',
      build: Constants.expoConfig?.ios?.buildNumber ?? null,
      sistema: `${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Platform.Version}`,
    });
    Linking.openURL(url).catch(() => Alert.alert('Fale com o NERO', `Escreva para ${EMAIL_CONTATO}. Respondemos por e-mail.`));
  };
  const acoes: AcaoModulo[] = [
    { chave: 'remedios', icone: 'medkit-outline', titulo: 'Meus remédios', subtitulo: ativas.length ? `${plural(ativas.length, 'em uso', 'em uso')} · histórico` : perfil?.semMedicacoes ? 'Você informou que não usa medicamentos' : 'Nenhum cadastrado ainda', rota: '/(app)/(tabs)/minha-saude/medicamentos' },
    { chave: 'exames', icone: 'flask-outline', titulo: 'Meus exames', subtitulo: contadores ? plural(contadores.exames, 'exame de todos os módulos', 'exames de todos os módulos') : 'Laboratoriais, cardiológicos e de rastreamento', rota: '/(app)/(tabs)/minha-saude/exames' },
    { chave: 'documentos', icone: 'folder-open-outline', titulo: 'Meus documentos', subtitulo: contadores?.documentos ? plural(contadores.documentos, 'documento guardado', 'documentos guardados') : 'Laudos, receitas e imagens de exames', rota: '/(app)/(tabs)/minha-saude/documentos' },
    { chave: 'relatorios', icone: 'document-text-outline', titulo: 'Levar ao médico', subtitulo: consultas.proxima ? `Sua consulta de ${dataHoraBr(consultas.proxima.dataHora)} · ${nomeComum(consultas.proxima.especialidade)}` : 'Um resumo da sua saúde para a consulta', rota: '/(app)/(tabs)/minha-saude/relatorios' },
    { chave: 'lembretes', icone: 'notifications-outline', titulo: 'Meus lembretes', subtitulo: contadores?.proximoLembrete ? `Próximo: ${contadores.proximoLembrete}` : 'Próximos 30 dias, preferências e consultas', rota: '/(app)/(tabs)/agenda' },
    { chave: 'perfil', icone: 'person-outline', titulo: 'Meu perfil', subtitulo: perfil?.perfilInicialCompleto ? 'Dados básicos, tabagismo, condições e histórico' : 'Faltam informações essenciais', rota: '/(app)/(tabs)/minha-saude/perfil' },
    { chave: 'antecedentes', icone: 'people-outline', titulo: 'Antecedentes familiares', subtitulo: antecedentes.length ? plural(antecedentes.length, 'registrado', 'registrados') : perfil?.semAntecedentesFamiliares ? 'Você informou que não há casos na família' : 'Nenhum registrado ainda', rota: '/(app)/(tabs)/minha-saude/antecedentes' },
  ];
  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.conteudo, { paddingBottom: espacoAbas }]}>
        <View style={styles.cabecalho}>
          <View style={{ flex: 1 }}>
            <Text style={styles.contexto}>Minha Saúde</Text>
            <Text style={styles.titulo}>{perfil?.nome || 'Seu perfil'}</Text>
          </View>
          <NeroAnimado size={96} style={styles.nero} />
        </View>

        {/* Lista única (spec de navegação §6.3, D-065): as três seções viraram uma, na ordem do uso. A
            "Linha do tempo" saiu daqui: mora na aba Histórico. Levar ao médico é uma porta só (D-025). */}
        <View style={styles.acoes}>
          <ListaAcoes acoes={acoes} onAbrir={(rota) => router.push(rota as Href)} />
        </View>

        {biometria?.disponivel ? (
          <>
            <Text style={styles.secao}>Segurança</Text>
            <View style={styles.trava}>
              <View style={{ flex: 1 }}>
                <Text style={styles.travaTitulo}>Pedir {biometria.nome} ao abrir</Text>
                <Text style={styles.travaSub}>Quem pegar seu celular desbloqueado não vê suas informações de saúde.</Text>
              </View>
              <Switch value={travaLigada} onValueChange={alternarTrava} trackColor={{ true: Colors.accent }} />
            </View>
          </>
        ) : null}

        <Text style={styles.secao}>Ajuda</Text>
        <ListItem icon="library-outline" title="Fontes científicas" subtitle="As diretrizes por trás de cada número do app, com link para o original" onPress={() => router.push('/(app)/fontes')} />
        <View style={{ height: Spacing.sm }} />
        <ListItem icon="mail-outline" title="Fale com o NERO" subtitle={`Dúvidas, problemas ou sugestões: ${EMAIL_CONTATO}`} onPress={falarComNero} />

        <Button label="Sair da conta" variant="ghost" onPress={sair} style={{ marginTop: Spacing.xxxl }} />
        <Button label="Excluir minha conta" variant="ghost" onPress={() => router.push('/(app)/(tabs)/minha-saude/excluir-conta')} />
        {/* Exigido pelas duas lojas na ficha do app, e esperado também aqui dentro. */}
        <Button label="Política de privacidade" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(URL_PRIVACIDADE).catch(() => {})} />
        <Button label="Termos de uso" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(URL_TERMOS).catch(() => {})} />
        <Creditos />
      </ScrollView>
      <BotaoAnotar origem="/minha-saude" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl },
  cabecalho: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  /** Calibrado pelo Murilo em 23/09: fora da borda e um pouco acima da linha do nome. */
  nero: { marginRight: 30, transform: [{ translateY: -11 }] },
  contexto: { ...Typography.caption, color: Colors.textSecondary },
  titulo: { ...Typography.display, fontSize: 26, lineHeight: 32, color: Colors.primary },
  acoes: { marginTop: Spacing.xxl },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  trava: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.linha, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg },
  travaTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  travaSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
