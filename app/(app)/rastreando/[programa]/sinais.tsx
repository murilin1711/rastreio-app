import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Programa } from '@core/regras/tipos';
import { registrarSintoma, resolverSintoma } from '@core/rastreando/sintomas';
import { PROGRAMAS } from '@core/rastreando/tipos';
import { useRastreando } from '@core/rastreando/useRastreando';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { CONTEUDO } from '@modules/rastreando/conteudo';
import { Button, Card, Colors, InternalHeader, Radius, Spacing, Typography } from '@ui/index';

/** §29.4 / §52: sinais de alerta têm prioridade sobre o calendário de rastreamento. */
export default function Sinais() {
  const { programa } = useLocalSearchParams<{ programa: string }>();
  const { sessao, online } = useSessao();
  const { sintomas, recarregar } = useRastreando();
  const [ocupado, setOcupado] = useState<string | null>(null);
  if (!PROGRAMAS.includes(programa as Programa)) return <Redirect href="/(app)/rastreando" />;
  const p = programa as Programa;
  const c = CONTEUDO[p];
  const abertos = sintomas.filter((s) => s.programa === p);

  const marcar = (id: string, texto: string) =>
    Alert.alert('Registrar este sinal?', `"${texto}"\n\nO NERO vai priorizar a orientação de procurar avaliação médica, acima do calendário de rastreamento.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Registrar', onPress: async () => {
        if (!sessao) return;
        setOcupado(id);
        try { await registrarSintoma(sessao.user.id, p, id); await recarregar(); }
        catch (e) { Alert.alert('Não foi possível registrar', traduzirErro(e).mensagemUsuario); }
        finally { setOcupado(null); }
      } },
    ]);

  const resolver = (id: string) =>
    Alert.alert('Já fui avaliado', 'Marcar este sinal como avaliado por um profissional? O calendário de rastreamento volta ao normal.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        setOcupado(id);
        try { await resolverSintoma(id); await recarregar(); }
        catch (e) { Alert.alert('Não foi possível atualizar', traduzirErro(e).mensagemUsuario); }
        finally { setOcupado(null); }
      } },
    ]);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel={c.titulo} title="Sinais de alerta" />
        <View style={styles.destaque}>
          <Ionicons name="alert-circle" size={22} color={Colors.danger} />
          <Text style={styles.destaqueTexto}>Rastreamento é para quem não tem sintomas. Se você tem algum destes sinais, não espere a data do próximo exame: procure avaliação médica.</Text>
        </View>

        {abertos.length ? (
          <Card style={styles.alerta}>
            <Text style={styles.alertaTitulo}>Você informou {abertos.length === 1 ? 'um sinal de alerta' : `${abertos.length} sinais de alerta`}</Text>
            <Text style={styles.alertaTexto}>Esses sintomas podem representar uma condição que necessita avaliação. Procure um profissional de saúde para investigação adequada.</Text>
            {abertos.map((s) => (
              <View key={s.id} style={styles.abertoLinha}>
                <Text style={styles.abertoTexto}>{c.sinaisAlerta.find((x) => x.id === s.sintoma)?.texto ?? s.sintoma}</Text>
                <Button label="Já fui avaliado" variant="ghost" onPress={() => resolver(s.id)} loading={ocupado === s.id} disabled={!online} />
              </View>
            ))}
          </Card>
        ) : null}

        <View style={{ gap: Spacing.sm }}>
          {c.sinaisAlerta.filter((s) => !abertos.some((a) => a.sintoma === s.id)).map((s) => (
            <View key={s.id} style={styles.item}>
              <Text style={styles.itemTexto}>{s.texto}</Text>
              <Button label="Tenho este sinal" variant="outline" onPress={() => marcar(s.id, s.texto)} loading={ocupado === s.id} disabled={!online} />
            </View>
          ))}
        </View>
        <Text style={styles.fonte}>Fontes: {c.fonteResumo}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  destaque: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', marginBottom: Spacing.xxl },
  destaqueTexto: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  alerta: { gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.danger, marginBottom: Spacing.xxl },
  alertaTitulo: { ...Typography.heading, color: Colors.danger },
  alertaTexto: { ...Typography.body, color: Colors.textPrimary },
  abertoLinha: { gap: Spacing.xs, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  abertoTexto: { ...Typography.subheading, color: Colors.textPrimary },
  item: { backgroundColor: Colors.surface, borderRadius: Radius.linha, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.md },
  itemTexto: { ...Typography.body, color: Colors.textPrimary },
  fonte: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xxl },
});
