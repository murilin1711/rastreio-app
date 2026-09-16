import { Redirect, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Programa } from '@core/regras/tipos';
import { PROGRAMAS, ROTULO_EXAME, type TipoExameRastreamento } from '@core/rastreando/tipos';
import { useRastreando } from '@core/rastreando/useRastreando';
import { resumoResultado } from '@modules/rastreando/componentes/CartaoExame';
import { dataBr, NIVEL_PENDENCIA } from '@modules/rastreando/componentes/statusUI';
import { CONTEUDO } from '@modules/rastreando/conteudo';
import { Alerta, Colors, InternalHeader, Spacing, Typography } from '@ui/index';

/** §39: linha do tempo do programa, por ano. */
export default function Historico() {
  const { programa } = useLocalSearchParams<{ programa: string }>();
  const { exames, avaliacoes } = useRastreando();
  if (!PROGRAMAS.includes(programa as Programa)) return <Redirect href="/(app)/rastreando" />;
  const p = programa as Programa;
  const meus = exames.filter((e) => e.programa === p).sort((a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao));
  const anos = [...new Set(meus.map((e) => e.dataRealizacao.slice(0, 4)))];
  const proxima = avaliacoes?.[p]?.proximaData;

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel={CONTEUDO[p].titulo} title="Histórico" />
        {proxima ? <Text style={styles.proxima}>Próximo previsto: {dataBr(proxima)}</Text> : null}
        {meus.length === 0 ? <Text style={styles.vazio}>Nenhum exame registrado ainda. Sua linha do tempo começa no primeiro registro.</Text> : null}
        {anos.map((ano) => (
          <View key={ano} style={styles.ano}>
            <Text style={styles.anoTitulo}>{ano}</Text>
            {meus.filter((e) => e.dataRealizacao.startsWith(ano)).map((e) => (
              <View key={e.id} style={styles.evento}>
                <View style={[styles.ponto, { backgroundColor: Alerta[NIVEL_PENDENCIA[e.nivelAlerta] ?? 'cinza'].fg }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventoTitulo}>{ROTULO_EXAME[e.tipo as TipoExameRastreamento] ?? e.tipo} — {resumoResultado(e)}</Text>
                  <Text style={styles.eventoData}>{dataBr(e.dataRealizacao)}{e.proximaAcao ? ` · ${e.proximaAcao}` : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  proxima: { ...Typography.subheading, color: Colors.accent, marginBottom: Spacing.xl },
  vazio: { ...Typography.body, color: Colors.textSecondary },
  ano: { marginBottom: Spacing.xl },
  anoTitulo: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.sm },
  evento: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', paddingVertical: Spacing.sm, borderLeftWidth: 2, borderLeftColor: Colors.border, paddingLeft: Spacing.md, marginLeft: 4 },
  ponto: { width: 10, height: 10, borderRadius: 5, marginTop: 6, marginLeft: -Spacing.md - 6 },
  eventoTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  eventoData: { ...Typography.caption, color: Colors.textSecondary },
});
