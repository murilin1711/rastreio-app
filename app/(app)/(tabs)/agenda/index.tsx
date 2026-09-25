import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agruparPorDia } from '@core/lembretes/origem';
import { separarRotina } from '@core/lembretes/rotina';
import { useLembretes } from '@core/lembretes/useLembretes';
import { CardRotina } from '@modules/minha-saude/componentes/CardRotina';
import { LinhaLembrete } from '@modules/minha-saude/componentes/LinhaLembrete';
import { Button, Colors, InternalHeader, Spacing, Typography, useEspacoAbas } from '@ui/index';

const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
function tituloDia(dia: string, hoje = new Date()): string {
  const [a, m, d] = dia.split('-').map(Number);
  const dt = new Date(a, m - 1, d);
  const diff = Math.round((dt.getTime() - new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime()) / 86_400_000);
  const data = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
  if (diff === 0) return `Hoje · ${data}`;
  if (diff === 1) return `Amanhã · ${data}`;
  return `${DIAS_SEMANA[dt.getDay()]} · ${data}`;
}

/**
 * Central de lembretes (§63, D-010). O que se repete todo dia fica no card "Todo dia" (D-049); a agenda
 * mostra só o que é pontual (consulta, exame), agrupado por dia, nos próximos e nos últimos 30 dias.
 */
export default function Lembretes() {
  const espacoAbas = useEspacoAbas();
  const router = useRouter();
  const { proximos, passados, carregando, erro, recarregar } = useLembretes(30);
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));
  const { rotina, pontuais } = separarRotina(proximos);
  const grupos = agruparPorDia(pontuais);
  const passadosPontuais = separarRotina(passados).pontuais;

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.conteudo, { paddingBottom: espacoAbas }]} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader variante="raiz" title="Agenda" />
        <View style={styles.acoes}>
          <Button label="Preferências" variant="outline" onPress={() => router.push('/(app)/(tabs)/agenda/preferencias')} style={{ flex: 1 }} />
          <Button label="Minhas consultas" variant="outline" onPress={() => router.push('/(app)/(tabs)/agenda/consultas')} style={{ flex: 1 }} />
        </View>
        {erro ? <Text style={styles.erro}>{erro.mensagemUsuario}</Text> : null}
        {rotina.length ? <CardRotina itens={rotina} onAbrir={(i) => router.push(i.rota as Href)} /> : null}
        <Text style={styles.secao}>Próximos 30 dias</Text>
        {grupos.length === 0 && !carregando ? <Text style={styles.vazio}>{rotina.length ? 'Nenhuma consulta ou exame nos próximos 30 dias.' : 'Nenhum lembrete agendado. Exames, medicamentos, MRPA, glicemia e consultas aparecem aqui quando você os cadastra.'}</Text> : null}
        {grupos.map((g) => (
          <View key={g.dia} style={styles.grupo}>
            <Text style={styles.dia}>{tituloDia(g.dia)}</Text>
            <View style={{ gap: Spacing.xs }}>{g.itens.map((l) => <LinhaLembrete key={l.id} lembrete={l} onPress={() => router.push(l.rota as Href)} />)}</View>
          </View>
        ))}
        {passadosPontuais.length ? (
          <>
            <Text style={styles.secao}>Últimos 30 dias</Text>
            <View style={{ gap: Spacing.xs }}>{passadosPontuais.slice(0, 30).map((l) => <LinhaLembrete key={l.id} lembrete={l} onPress={() => router.push(l.rota as Href)} />)}</View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl },
  acoes: { flexDirection: 'row', gap: Spacing.sm },
  erro: { ...Typography.caption, color: Colors.danger, marginTop: Spacing.md },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  vazio: { ...Typography.body, color: Colors.textSecondary },
  grupo: { marginBottom: Spacing.lg },
  dia: { ...Typography.subheading, color: Colors.textSecondary, marginBottom: Spacing.xs },
});
