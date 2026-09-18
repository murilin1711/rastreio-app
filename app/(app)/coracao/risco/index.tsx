import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRiscoCv } from '@core/cardio/useRiscoCv';
import { dataLongaBr } from '@modules/coracao/componentes/formato';
import { entendaPrevent, fraseCategoria, ROTULO_MOTIVO_INELEGIVEL } from '@modules/coracao/conteudo/risco';
import { Button, Card, Colors, InternalHeader, ListItem, Spacing, StatusBadge, Typography } from '@ui/index';

const ROTULO_CAT = { baixo: 'Risco baixo pelo escore', intermediario: 'Risco intermediário pelo escore', alto: 'Risco alto pelo escore' } as const;
const NIVEL_CAT = { baixo: 'verde', intermediario: 'amarelo', alto: 'laranja' } as const;

/** Meu Risco Cardiovascular (§13, §15): último cálculo ou "Calcular agora"; elegibilidade pela diretriz. */
export default function MeuRisco() {
  const router = useRouter();
  const { perfil, parametros, ultimo, elegibilidade, carregando, salvarPerfil, recarregar } = useRiscoCv();
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));

  const perguntarEvento = () => {
    Alert.alert('Uma pergunta antes', 'Você já teve infarto, AVC, angioplastia, ponte de safena ou outro procedimento nas artérias?', [
      { text: 'Não', onPress: () => salvarPerfil({ eventoCvPrevio: false }) },
      { text: 'Sim', onPress: () => salvarPerfil({ eventoCvPrevio: true }) },
    ]);
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Coração & Metabolismo" title="Meu Risco Cardiovascular" />
        <Text style={styles.sub}>{entendaPrevent}</Text>

        {ultimo ? (
          <Card style={styles.card}>
            <Text style={styles.rotulo}>Último cálculo · {dataLongaBr(ultimo.calculadoEm.slice(0, 10))}</Text>
            <Text style={styles.valor}>{String(ultimo.ascvd10).replace('.', ',')} %</Text>
            <Text style={styles.rotulo}>em 10 anos</Text>
            <StatusBadge nivel={NIVEL_CAT[ultimo.categoria]} label={ROTULO_CAT[ultimo.categoria]} />
            <Text style={styles.nota}>{fraseCategoria}</Text>
          </Card>
        ) : null}

        {perfil && perfil.eventoCvPrevio == null ? (
          <View style={styles.acoes}><Button label="Calcular agora" onPress={perguntarEvento} /></View>
        ) : elegibilidade && !elegibilidade.ok ? (
          <Card style={styles.card}>
            <Text style={styles.texto}>{parametros?.elegibilidade.regra.mensagemPaciente}</Text>
            <Text style={styles.nota}>{elegibilidade.motivo ? ROTULO_MOTIVO_INELEGIVEL[elegibilidade.motivo] : ''}</Text>
            {elegibilidade.motivo === 'evento_previo' ? <Button label="Corrigir: não tive evento" variant="ghost" onPress={() => salvarPerfil({ eventoCvPrevio: false })} /> : null}
          </Card>
        ) : (
          <View style={styles.acoes}>
            <Button label={ultimo ? 'Calcular de novo' : 'Calcular agora'} onPress={() => router.push('/(app)/coracao/risco/dados')} />
            {ultimo ? <Button label="Ver último resultado" variant="outline" onPress={() => router.push('/(app)/coracao/risco/resultado')} /> : null}
          </View>
        )}

        <View style={styles.lista}>
          <ListItem icon="list-outline" title="Fatores agravantes e escore de cálcio" subtitle="O que pode mudar a interpretação do seu risco" onPress={() => router.push('/(app)/coracao/risco/agravantes')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  sub: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xxl },
  card: { padding: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.xxl },
  rotulo: { ...Typography.caption, color: Colors.textSecondary },
  valor: { fontFamily: 'Poppins-ExtraBold', fontSize: 48, lineHeight: 54, color: Colors.textPrimary, letterSpacing: -1 },
  texto: { ...Typography.body, color: Colors.textPrimary },
  nota: { ...Typography.caption, color: Colors.textSecondary },
  acoes: { gap: Spacing.sm, marginBottom: Spacing.xxl },
  lista: { gap: Spacing.sm },
});
