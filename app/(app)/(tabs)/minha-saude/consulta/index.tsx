import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ESPECIALIDADES } from '@core/relatorios/especialidades';
import type { Especialidade } from '@core/relatorios/tipos';
import { TEXTO_CONSULTA } from '@modules/minha-saude/conteudo/relatorios';
import { Button, Colors, InternalHeader, Opcoes, Spacing, Typography } from '@ui/index';

type Dias = '30' | '90' | '180';
const ESPECIALIDADES_VALIDAS = new Set(ESPECIALIDADES.map((e) => e.id));

/** Preparar minha consulta (§62, D-009): especialidade + período → prévia do relatório focado. */
export default function PrepararConsulta() {
  const router = useRouter();
  const p = useLocalSearchParams<{ especialidade?: string; consultaId?: string }>();
  const inicial = p.especialidade && ESPECIALIDADES_VALIDAS.has(p.especialidade as Especialidade) ? (p.especialidade as Especialidade) : null;
  const [especialidade, setEspecialidade] = useState<Especialidade | null>(inicial);
  const [dias, setDias] = useState<Dias>('180');

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Minha Saúde" title="Preparar minha consulta" onBack={() => router.back()} />
        <Text style={styles.ajuda}>{TEXTO_CONSULTA.introducao}</Text>
        <Text style={styles.rotulo}>Especialidade</Text>
        <Opcoes<Especialidade> opcoes={ESPECIALIDADES.map((e) => ({ valor: e.id, rotulo: e.rotulo }))} valor={especialidade} onChange={setEspecialidade} />
        <Text style={styles.rotulo}>Período das medidas</Text>
        <Opcoes<Dias> opcoes={[{ valor: '30', rotulo: '30 dias' }, { valor: '90', rotulo: '90 dias' }, { valor: '180', rotulo: '180 dias' }]} valor={dias} onChange={setDias} />
        <Button label="Ver prévia" disabled={!especialidade} onPress={() => especialidade && router.push({ pathname: '/(app)/(tabs)/minha-saude/relatorios/previa', params: { tipo: 'consulta', especialidade, dias } })} style={{ marginTop: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  ajuda: { ...Typography.body, color: Colors.textSecondary },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
});
