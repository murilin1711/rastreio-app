import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listarExamesCardio } from '@core/cardio/examesCardio';
import * as documentos from '@core/documentos/repositorio';
import { listarProximos } from '@core/lembretes/central';
import { useConsultas } from '@core/lembretes/useConsultas';
import { useMedicacoes } from '@core/medicacoes/useMedicacoes';
import { usePerfil } from '@core/perfil/usePerfil';
import { montarContexto } from '@core/rastreando/contexto';
import { rotuloEspecialidade } from '@core/relatorios/especialidades';
import { useSessao } from '@core/sessao/SessaoProvider';
import { dataHoraBr } from '@modules/coracao/componentes/formato';
import { Button, Colors, ListItem, NeroAnimado, Spacing, Typography } from '@ui/index';

const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

/** Minha Saúde (§58–§63): índice transversal com contadores por entrada. */
export default function MinhaSaude() {
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

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.cabecalho}>
          <View style={{ flex: 1 }}>
            <Text style={styles.contexto}>Minha Saúde</Text>
            <Text style={styles.titulo}>{perfil?.nome || 'Seu perfil'}</Text>
          </View>
          <NeroAnimado size={96} />
        </View>

        <Text style={styles.secao}>Meus dados</Text>
        <View style={{ gap: Spacing.sm }}>
          <ListItem icon="person-outline" title="Meu perfil" subtitle={perfil?.perfilInicialCompleto ? 'Dados básicos, tabagismo, condições e histórico' : 'Faltam informações essenciais'} onPress={() => router.push('/(app)/minha-saude/perfil')} />
          <ListItem icon="people-outline" title="Antecedentes familiares" subtitle={antecedentes.length ? plural(antecedentes.length, 'registrado', 'registrados') : perfil?.semAntecedentesFamiliares ? 'Você informou que não há casos na família' : 'Nenhum registrado ainda'} onPress={() => router.push('/(app)/minha-saude/antecedentes')} />
          <ListItem icon="medkit-outline" title="Meus medicamentos" subtitle={ativas.length ? `${plural(ativas.length, 'em uso', 'em uso')} · histórico` : perfil?.semMedicacoes ? 'Você informou que não usa medicamentos' : 'Nenhum cadastrado ainda'} onPress={() => router.push('/(app)/minha-saude/medicamentos')} />
        </View>

        <Text style={styles.secao}>Meus registros</Text>
        <View style={{ gap: Spacing.sm }}>
          <ListItem icon="flask-outline" title="Meus exames" subtitle={contadores ? plural(contadores.exames, 'exame de todos os módulos', 'exames de todos os módulos') : 'Laboratoriais, cardiológicos e de rastreamento'} onPress={() => router.push('/(app)/minha-saude/exames')} />
          <ListItem icon="folder-open-outline" title="Meus documentos" subtitle={contadores?.documentos ? plural(contadores.documentos, 'documento guardado', 'documentos guardados') : 'Laudos, receitas e imagens de exames'} onPress={() => router.push('/(app)/minha-saude/documentos')} />
          <ListItem icon="time-outline" title="Linha do tempo" subtitle="Tudo em ordem cronológica, de todos os módulos" onPress={() => router.push('/(app)/minha-saude/linha-do-tempo')} />
        </View>

        <Text style={styles.secao}>Para o médico</Text>
        <View style={{ gap: Spacing.sm }}>
          <ListItem icon="document-text-outline" title="Relatórios" subtitle="PDF cardiovascular, oncológico ou geral; código QR" onPress={() => router.push('/(app)/minha-saude/relatorios')} />
          <ListItem icon="calendar-outline" title="Preparar minha consulta" subtitle={consultas.proxima ? `Próxima: ${rotuloEspecialidade(consultas.proxima.especialidade)}, ${dataHoraBr(consultas.proxima.dataHora)}` : 'Relatório focado na especialidade'} onPress={() => router.push(consultas.proxima ? { pathname: '/(app)/minha-saude/consulta', params: { especialidade: consultas.proxima.especialidade, consultaId: consultas.proxima.id } } : '/(app)/minha-saude/consulta')} />
          <ListItem icon="notifications-outline" title="Meus lembretes" subtitle={contadores?.proximoLembrete ? `Próximo: ${contadores.proximoLembrete}` : 'Próximos 30 dias, preferências e consultas'} onPress={() => router.push('/(app)/minha-saude/lembretes')} />
        </View>

        <Button label="Sair da conta" variant="ghost" onPress={sair} style={{ marginTop: Spacing.xxxl }} />
        <Button label="Excluir minha conta" variant="ghost" onPress={() => router.push('/(app)/minha-saude/excluir-conta')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  cabecalho: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  contexto: { ...Typography.caption, color: Colors.textSecondary },
  titulo: { ...Typography.display, fontSize: 26, lineHeight: 32, color: Colors.primary },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
});
