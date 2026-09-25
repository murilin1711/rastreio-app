import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConsultas } from '@core/lembretes/useConsultas';
import { ESPECIALIDADES, nomeComum, temTraducao } from '@core/relatorios/especialidades';
import type { Especialidade } from '@core/relatorios/tipos';
import { dataHoraBr } from '@modules/coracao/componentes/formato';
import { TEXTO_CONSULTA } from '@modules/minha-saude/conteudo/relatorios';
import { Button, Colors, InternalHeader, Opcoes, Radius, Spacing, Typography } from '@ui/index';

type Dias = '30' | '90' | '180';
const ESPECIALIDADES_VALIDAS = new Set(ESPECIALIDADES.map((e) => e.id));

/**
 * Escolha do médico a quem o documento se destina (§62, D-009, redesenhada em D-025).
 *
 * Duas coisas fazem esta tela para quem tem 70 anos: a consulta já marcada aparece pronta no topo,
 * sem pedir nada; e a lista chama cada médico como o paciente o chama ("Médico do coração"), com o
 * termo técnico menor embaixo, para ele reconhecer o que está escrito no encaminhamento.
 */
export default function PrepararConsulta() {
  const router = useRouter();
  const p = useLocalSearchParams<{ especialidade?: string; consultaId?: string }>();
  const inicial = p.especialidade && ESPECIALIDADES_VALIDAS.has(p.especialidade as Especialidade) ? (p.especialidade as Especialidade) : null;
  const [especialidade, setEspecialidade] = useState<Especialidade | null>(inicial);
  const [dias, setDias] = useState<Dias>('180');
  const { proxima } = useConsultas();

  const verPrevia = (esp: Especialidade, d: Dias = dias) =>
    router.push({ pathname: '/(app)/(tabs)/minha-saude/relatorios/previa', params: { tipo: 'consulta', especialidade: esp, dias: d } });

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Levar ao médico" title="Para qual médico?" onBack={() => router.back()} />
        <Text style={styles.ajuda}>{TEXTO_CONSULTA.introducao}</Text>

        {proxima ? (
          <Pressable style={({ pressed }) => [styles.marcada, pressed && { opacity: 0.9 }]} onPress={() => verPrevia(proxima.especialidade)} accessibilityRole="button">
            <View style={styles.icone}><Ionicons name="calendar" size={22} color={Colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.marcadaTitulo}>Sua consulta de {dataHoraBr(proxima.dataHora)}</Text>
              <Text style={styles.marcadaMeta}>{nomeComum(proxima.especialidade)} · toque para preparar</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}

        <Text style={styles.rotulo}>{proxima ? 'Ou escolha outro médico' : 'Escolha o médico'}</Text>
        <Opcoes<Especialidade>
          opcoes={ESPECIALIDADES.map((e) => ({ valor: e.id, rotulo: e.comum, descricao: temTraducao(e.id) ? e.rotulo : undefined }))}
          valor={especialidade}
          onChange={setEspecialidade}
        />

        <Text style={styles.rotulo}>Período das medidas</Text>
        <Opcoes<Dias> opcoes={[{ valor: '30', rotulo: '30 dias' }, { valor: '90', rotulo: '90 dias' }, { valor: '180', rotulo: '180 dias' }]} valor={dias} onChange={setDias} />
        <Button label="Ver prévia" disabled={!especialidade} onPress={() => especialidade && verPrevia(especialidade)} style={{ marginTop: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  ajuda: { ...Typography.body, color: Colors.textSecondary },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  marcada: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg, marginTop: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  icone: { width: 44, height: 44, borderRadius: Radius.linha, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  marcadaTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  marcadaMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
