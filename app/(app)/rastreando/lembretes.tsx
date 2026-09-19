import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pedirPermissaoNotificacoes } from '@core/rastreando/lembretes';
import { permissaoConcedida } from '@core/lembretes/permissao';
import { reagendarTudo } from '@core/lembretes/preferencias';
import { useSessao } from '@core/sessao/SessaoProvider';
import { supabase } from '@core/supabase/client';
import { Button, Card, Colors, InternalHeader, Spacing, Typography } from '@ui/index';

interface Lembrete { id: string; agendado_para: string; titulo: string; mensagem: string | null }
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** §38, §63: próximos lembretes do Rastreando (90 dias). */
export default function Lembretes() {
  const { sessao } = useSessao();
  const [lista, setLista] = useState<Lembrete[]>([]);
  const [permissao, setPermissao] = useState<boolean | null>(null);

  useEffect(() => {
    if (!sessao) return;
    const ate = new Date(); ate.setDate(ate.getDate() + 90);
    supabase.from('lembretes').select('id, agendado_para, titulo, mensagem').eq('user_id', sessao.user.id).eq('status', 'pendente')
      .gte('agendado_para', new Date().toISOString()).lte('agendado_para', ate.toISOString()).order('agendado_para')
      .then(({ data }) => setLista((data ?? []) as Lembrete[]));
    // Ao abrir, apenas consulta: quem pede é o botão abaixo, por ação explícita da pessoa.
    permissaoConcedida().then(setPermissao);
  }, [sessao?.user.id]);

  const porMes = lista.reduce<Record<string, Lembrete[]>>((acc, l) => {
    const d = new Date(l.agendado_para); const k = `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
    (acc[k] ??= []).push(l); return acc;
  }, {});

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Rastreando" title="Lembretes" />
        {permissao === false ? (
          <Card style={{ gap: Spacing.sm, marginBottom: Spacing.xl }}>
            <Text style={styles.avisoTitulo}>Notificações desativadas</Text>
            <Text style={styles.ajuda}>Os lembretes ficam aqui no app. Para recebê-los também como notificação, ative nas configurações do celular.</Text>
            <Button label="Tentar ativar" variant="outline" onPress={() => pedirPermissaoNotificacoes().then(async (ok) => { setPermissao(ok); if (ok && sessao) await reagendarTudo(sessao.user.id).catch(() => {}); })} />
          </Card>
        ) : null}
        {lista.length === 0 ? <Text style={styles.ajuda}>Nenhum lembrete nos próximos 90 dias. Eles são criados automaticamente quando um exame tem próxima data prevista.</Text> : null}
        {Object.entries(porMes).map(([mes, itens]) => (
          <View key={mes} style={{ marginBottom: Spacing.xl }}>
            <Text style={styles.mes}>{mes}</Text>
            {itens.map((l) => {
              const d = new Date(l.agendado_para);
              return (
                <View key={l.id} style={styles.item}>
                  <Text style={styles.dia}>{String(d.getDate()).padStart(2, '0')}</Text>
                  <Text style={styles.texto}>{(l.mensagem ?? '').replace(/\s*notif:[\w-]+/, '')}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  ajuda: { ...Typography.body, color: Colors.textSecondary },
  avisoTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  mes: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.sm, textTransform: 'capitalize' },
  item: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dia: { fontFamily: 'Poppins-Bold', fontSize: 18, color: Colors.primary, width: 32 },
  texto: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
});
