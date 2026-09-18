import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { handlers } from '@core/regras/programas';
import type { Programa } from '@core/regras/tipos';
import { PROGRAMAS, ROTULO_PROGRAMA } from '@core/rastreando/tipos';
import { useRastreando } from '@core/rastreando/useRastreando';
import { CardPrograma } from '@modules/rastreando/componentes/CardPrograma';
import { NIVEL_PENDENCIA } from '@modules/rastreando/componentes/statusUI';
import { Alerta, Button, Colors, LogoNero, Radius, Spacing, Typography } from '@ui/index';

/** "Seus rastreamentos" (§28, §37): só o que é aplicável ao perfil, com o que exige ação no topo. */
export default function Rastreando() {
  const router = useRouter();
  const { avaliacoes, perfil, pendencias, sintomas, carregando, erro, recarregar } = useRastreando();

  const aplicaveis = perfil ? PROGRAMAS.filter((p) => handlers[p]?.aplicavel(perfil) ?? true) : [];
  const outros = PROGRAMAS.filter((p) => !aplicaveis.includes(p));
  const pares = (lista: Programa[]) => lista.reduce<Programa[][]>((acc, p, i) => (i % 2 === 0 ? [...acc, [p]] : (acc[acc.length - 1].push(p), acc)), []);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <View style={styles.topo}>
          <View style={styles.marca}><LogoNero variante="simbolo" width={26} /><Text style={styles.marcaTexto}>RASTREANDO</Text></View>
        </View>
        <Text style={styles.titulo}>Seus rastreamentos</Text>
        <Text style={styles.sub}>Organizados pelo seu perfil, segundo as diretrizes brasileiras. Rastreamento é para quem não tem sintomas.</Text>

        {erro ? (
          <View style={styles.erro}>
            <Text style={styles.erroTexto}>{erro.mensagemUsuario}</Text>
            <Button label="Tentar de novo" variant="outline" onPress={recarregar} />
          </View>
        ) : null}

        {pendencias.length > 0 ? (
          <>
            <View style={styles.secaoTopo}>
              <Text style={styles.secao}>Pendências</Text>
              <View style={styles.contador}><Text style={styles.contadorTexto}>{pendencias.length}</Text></View>
            </View>
            <View style={{ gap: Spacing.sm, marginBottom: Spacing.xxl }}>
              {pendencias.map((p) => (
                <Pressable key={p.id} onPress={() => router.push('/(app)/rastreando/pendencias')} style={({ pressed }) => [styles.pend, pressed && { opacity: 0.7 }]}>
                  <View style={[styles.anel, { borderColor: Alerta[NIVEL_PENDENCIA[p.nivelAlerta] ?? 'laranja'].fg }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendTitulo}>{ROTULO_PROGRAMA[p.programa]}: {p.descricao}</Text>
                    <Text style={styles.pendSub}>Registre o exame relacionado para concluir.</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {avaliacoes && perfil ? (
          <>
            <Text style={styles.secao}>Para o seu perfil</Text>
            <View style={styles.grade}>
              {pares(aplicaveis).map((linha, i) => (
                <View key={i} style={styles.linhaGrade}>
                  {linha.map((p) => (
                    <CardPrograma key={p} programa={p} avaliacao={avaliacoes[p]} pendencia={pendencias.find((x) => x.programa === p)} sintomas={sintomas.filter((s) => s.programa === p).length} onPress={() => router.push({ pathname: '/(app)/rastreando/[programa]', params: { programa: p } })} />
                  ))}
                  {linha.length === 1 ? <View style={{ flex: 1 }} /> : null}
                </View>
              ))}
            </View>
            {outros.length ? (
              <>
                <Text style={[styles.secao, { marginTop: Spacing.xxl }]}>Não se aplicam ao seu perfil</Text>
                <Text style={styles.outros}>{outros.map((p) => ROTULO_PROGRAMA[p]).join(' · ')}</Text>
              </>
            ) : null}
          </>
        ) : null}

        <View style={{ marginTop: Spacing.xxxl, gap: Spacing.sm }}>
          <Button label="Ver lembretes" variant="outline" onPress={() => router.push('/(app)/rastreando/lembretes')} />
          <Button label="Relatório de rastreamento" variant="outline" onPress={() => router.push({ pathname: '/(app)/minha-saude/relatorios/previa', params: { tipo: 'oncologico', dias: '180' } })} />
        </View>
        <Text style={styles.rodape}>O NERO organiza as recomendações para o seu perfil e não substitui a avaliação do seu médico.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  topo: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  marca: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  marcaTexto: { fontFamily: 'Poppins-ExtraBold', fontSize: 13, letterSpacing: 2, color: Colors.accent },
  titulo: { ...Typography.display, fontSize: 28, lineHeight: 34, color: Colors.primary },
  sub: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.xxl },
  erro: { gap: Spacing.md, marginBottom: Spacing.xxl },
  erroTexto: { ...Typography.body, color: Colors.danger },
  secaoTopo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.md },
  contador: { minWidth: 22, height: 22, borderRadius: Radius.pill, paddingHorizontal: 6, backgroundColor: Colors.warning, alignItems: 'center', justifyContent: 'center' },
  contadorTexto: { fontFamily: 'Poppins-Bold', fontSize: 12, color: Colors.white },
  pend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.linha, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  anel: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  pendTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  pendSub: { ...Typography.caption, color: Colors.textSecondary },
  grade: { gap: Spacing.md },
  linhaGrade: { flexDirection: 'row', gap: Spacing.md },
  outros: { ...Typography.body, color: Colors.textSecondary },
  rodape: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xxl },
});
