import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROTULO_PROGRAMA } from '@core/rastreando/tipos';
import { useRastreando } from '@core/rastreando/useRastreando';
import { resumoResultado } from '@modules/rastreando/componentes/CartaoExame';
import { dataBr, NIVEL_PENDENCIA } from '@modules/rastreando/componentes/statusUI';
import { Button, Card, Colors, InternalHeader, SaidaConcluida, Spacing, StatusBadge, Typography, useSaidaConcluida } from '@ui/index';

/** §50: exames cujo fluxo ainda não foi concluído. */
export default function Pendencias() {
  const router = useRouter();
  const { pendencias, exames, carregando, recarregar } = useRastreando();
  // Pendência resolvida fica verde e só então sai da lista (D-024).
  const saida = useSaidaConcluida(pendencias, (p) => p.id, !carregando);
  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Rastreando" title="Pendências" />
        <Text style={styles.ajuda}>Resultados que precisam de uma próxima etapa. Quando você registrar o exame relacionado, a pendência fecha e o NERO define o novo calendário.</Text>
        {saida.lista.length === 0 && !carregando ? <Text style={styles.vazio}>Nenhuma pendência. Quando um exame precisar de continuidade, ele aparece aqui.</Text> : null}
        <View style={{ gap: Spacing.md }}>
          {saida.lista.map(({ item: p, concluido }) => {
            const origem = exames.find((e) => e.id === p.exameOrigemId);
            return (
              <SaidaConcluida key={p.id} concluido={concluido} aoSair={() => saida.aoSair(p)}>
                <Card style={{ gap: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.programa}>{ROTULO_PROGRAMA[p.programa]}</Text>
                    {concluido
                      ? <StatusBadge nivel="verde" label="Concluída" />
                      : <StatusBadge nivel={NIVEL_PENDENCIA[p.nivelAlerta] ?? 'laranja'} label="Pendência" />}
                  </View>
                  <Text style={styles.descricao}>{p.descricao}</Text>
                  {origem ? <Text style={styles.origem}>Origem: {resumoResultado(origem)} em {dataBr(origem.dataRealizacao)}</Text> : null}
                  {origem?.mensagem ? <Text style={styles.mensagem}>{origem.mensagem}</Text> : null}
                  {concluido ? null : <Button label="Registrar exame relacionado" variant="outline" onPress={() => router.push({ pathname: '/(app)/rastreando/[programa]/registrar', params: { programa: p.programa, pendencia: p.exameOrigemId } })} />}
                </Card>
              </SaidaConcluida>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  ajuda: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  vazio: { ...Typography.body, color: Colors.textSecondary },
  programa: { ...Typography.heading, color: Colors.textPrimary },
  descricao: { ...Typography.subheading, color: Colors.textPrimary },
  origem: { ...Typography.caption, color: Colors.textSecondary },
  mensagem: { ...Typography.body, color: Colors.textSecondary },
});
