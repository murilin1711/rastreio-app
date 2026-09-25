import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { montarLinhaDoTempoGeral } from '@core/linhaDoTempo/geral';
import type { AnoGeral, ModuloItem } from '@core/linhaDoTempo/agrupar';
import { useSessao } from '@core/sessao/SessaoProvider';
import { dataCurtaBr } from '@modules/coracao/componentes/formato';
import { Alerta, Colors, InternalHeader, Spacing, Typography, useEspacoAbas } from '@ui/index';

const COR_MODULO: Record<ModuloItem, string> = { cardio: '#c2410c', rastreando: Colors.logoCeu, medicacao: Colors.logoArdosia, consulta: Colors.accent, documento: Colors.textMuted, bem_estar: '#15803D' };

/** Linha do tempo geral (§60): todos os módulos, por ano; o ponto tem a cor do módulo ou do nível clínico. */
export default function LinhaDoTempoGeral() {
  const espacoAbas = useEspacoAbas();
  const router = useRouter();
  const { sessao } = useSessao();
  const [anos, setAnos] = useState<AnoGeral[]>([]);
  const [carregando, setCarregando] = useState(true);
  const recarregar = useCallback(async () => {
    if (!sessao?.user.id) return;
    setCarregando(true);
    try { setAnos(await montarLinhaDoTempoGeral(sessao.user.id)); } catch { setAnos([]); } finally { setCarregando(false); }
  }, [sessao?.user.id]);
  useEffect(() => { recarregar(); }, [recarregar]);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.conteudo, { paddingBottom: espacoAbas }]} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader variante="raiz" title="Histórico" />
        {anos.length ? anos.map((a) => (
          <View key={a.ano} style={styles.ano}>
            <Text style={styles.anoTitulo}>{a.ano}</Text>
            {a.itens.map((i, idx) => (
              <Pressable key={idx} style={({ pressed }) => [styles.linha, pressed && i.rota ? { opacity: 0.7 } : null]} onPress={() => i.rota && router.push(i.rota as Href)}>
                <View style={[styles.ponto, { backgroundColor: i.nivel ? Alerta[i.nivel].fg : COR_MODULO[i.modulo] }]} />
                <Text style={styles.data}>{dataCurtaBr(i.data)}</Text>
                <View style={{ flex: 1 }}><Text style={styles.titulo}>{i.titulo}</Text>{i.valor ? <Text style={styles.valor}>{i.valor}</Text> : null}</View>
              </Pressable>
            ))}
          </View>
        )) : !carregando ? <Text style={styles.vazio}>Exames, medidas, medicamentos, consultas e documentos aparecem aqui em ordem, conforme você registra.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl },
  ano: { marginBottom: Spacing.xxl },
  anoTitulo: { ...Typography.title, color: Colors.primary, marginBottom: Spacing.sm },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  ponto: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  data: { ...Typography.caption, color: Colors.textSecondary, width: 40, marginTop: 3 },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  valor: { ...Typography.body, color: Colors.textSecondary },
  vazio: { ...Typography.body, color: Colors.textSecondary },
});
