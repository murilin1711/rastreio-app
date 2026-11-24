import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { limparExpirados, listarAtivos, revogar, type Compartilhamento } from '@core/relatorios/compartilharQr';
import { rotuloEspecialidade } from '@core/relatorios/especialidades';
import { dataHoraBr } from '@core/relatorios/montar';
import { tituloRelatorio } from '@core/relatorios/montar';
import type { TipoRelatorio } from '@core/relatorios/tipos';
import { listarSessoes } from '@core/cardio/sessoesMrpa';
import { useAbrir } from '@core/navegacao/useVoltar';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { Button, Colors, InternalHeader, Opcoes, Radius, Spacing, Typography } from '@ui/index';

type Dias = '30' | '90' | '180';
/**
 * D-025: o Geral vem primeiro e recomendado — é o que serve para qualquer médico e o que a maioria
 * vai querer. Os outros três são recortes por assunto, para quem sabe o que procura. As descrições
 * foram reescritas sem jargão: quem lê é o paciente, não o médico. D-065: os recortes levam o nome
 * do módulo de onde vêm (spec de navegação §6.4), para a pessoa reconhecer o mesmo assunto aqui.
 */
const CARTOES: { tipo: TipoRelatorio; icone: keyof typeof Ionicons.glyphMap; titulo: string; descricao: string; recomendado?: boolean }[] = [
  { tipo: 'geral', icone: 'document-text-outline', titulo: 'Resumo completo', descricao: 'Tudo o que você registrou. Serve para qualquer médico.', recomendado: true },
  { tipo: 'cardio', icone: 'heart-outline', titulo: 'Pressão, coração e diabetes', descricao: 'Pressão, açúcar no sangue, colesterol, exames do coração e seus remédios.' },
  { tipo: 'oncologico', icone: 'shield-checkmark-outline', titulo: 'Exames de prevenção', descricao: 'Mamografia, papanicolau, colonoscopia e os outros exames de rotina: o que já fez e o que falta.' },
  { tipo: 'bemestar', icone: 'leaf-outline', titulo: 'Hábitos e bem-estar', descricao: 'Como você tem comido, se movimentado, bebido água e dormido.' },
];

/** Central de relatórios (§61, D-007): três relatórios, período das medidas e compartilhamentos ativos por QR. */
export default function Relatorios() {
  const router = useRouter();
  const { sessao } = useSessao();
  const [dias, setDias] = useState<Dias>('90');
  const [ativos, setAtivos] = useState<Compartilhamento[]>([]);
  /** Id da MRPA concluída mais recente (a lista vem do início mais novo ao mais antigo), ou null. */
  const [mrpaConcluida, setMrpaConcluida] = useState<string | null>(null);
  const abrir = useAbrir();

  const carregar = useCallback(async () => {
    if (!sessao?.user.id) return;
    listarSessoes(sessao.user.id).then((l) => l.find((s) => s.concluidaEm)?.id ?? null).catch(() => null).then(setMrpaConcluida);
    try { await limparExpirados(sessao.user.id); setAtivos(await listarAtivos(sessao.user.id)); } catch { setAtivos([]); }
  }, [sessao?.user.id]);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const encerrar = (c: Compartilhamento) => {
    Alert.alert('Encerrar compartilhamento?', 'O código QR deixa de funcionar imediatamente e o relatório e o PDF são removidos da nuvem.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Encerrar', style: 'destructive', onPress: async () => { try { await revogar(sessao!.user.id, c.id); await carregar(); } catch (e) { Alert.alert('Não foi possível encerrar', traduzirErro(e).mensagemUsuario); } } },
    ]);
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Minha Saúde" title="Levar ao médico" />
        <Text style={styles.ajuda}>O NERO organiza o que você registrou num documento para levar à consulta. Ele é feito no seu celular; só vai para a internet se você pedir um código QR.</Text>
        <Text style={styles.rotulo}>Período das medidas</Text>
        <Opcoes<Dias> opcoes={[{ valor: '30', rotulo: '30 dias' }, { valor: '90', rotulo: '90 dias' }, { valor: '180', rotulo: '180 dias' }]} valor={dias} onChange={setDias} />
        <View style={{ gap: Spacing.md, marginTop: Spacing.xxl }}>
          {CARTOES.map((c) => (
            <Pressable key={c.tipo} style={({ pressed }) => [styles.cartao, pressed && { opacity: 0.85 }]} onPress={() => router.push({ pathname: '/(app)/(tabs)/minha-saude/relatorios/previa', params: { tipo: c.tipo, dias } })} accessibilityRole="button">
              <View style={styles.icone}><Ionicons name={c.icone} size={24} color={Colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <View style={styles.tituloLinha}>
                  <Text style={styles.cartaoTitulo}>{c.titulo}</Text>
                  {c.recomendado ? <View style={styles.selo}><Text style={styles.seloTexto}>Recomendado</Text></View> : null}
                </View>
                <Text style={styles.cartaoDescricao}>{c.descricao}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>
        {mrpaConcluida ? (
          // A MRPA e a glicemia têm relatório próprio, com o formato que o médico espera (spec §6.6).
          <View style={styles.aviso}>
            <Text style={styles.avisoTexto}>O relatório da MRPA e o da glicemia ficam nas telas deles.</Text>
            <Pressable onPress={() => abrir(`/(app)/coracao/mrpa/relatorio?sessao=${mrpaConcluida}`)} style={styles.link} accessibilityRole="link" accessibilityLabel="Abrir o relatório da MRPA" hitSlop={8}>
              <Text style={styles.avisoLink}>Abrir o relatório da MRPA</Text>
            </Pressable>
            <Pressable onPress={() => abrir('/(app)/coracao/glicemia/relatorio')} style={styles.link} accessibilityRole="link" accessibilityLabel="Abrir o relatório da glicemia" hitSlop={8}>
              <Text style={styles.avisoLink}>Abrir o relatório da glicemia</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.divisor} />
        <Pressable style={({ pressed }) => [styles.especifico, pressed && { opacity: 0.85 }]} onPress={() => router.push('/(app)/(tabs)/minha-saude/consulta')} accessibilityRole="button">
          <View style={{ flex: 1 }}>
            <Text style={styles.cartaoTitulo}>Vou a um médico específico</Text>
            <Text style={styles.cartaoDescricao}>O documento começa pelo que esse médico precisa ver; o resto vem depois.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </Pressable>

        <Text style={styles.secao}>Compartilhamentos ativos</Text>
        {ativos.length === 0 ? <Text style={styles.vazio}>Nenhum código QR ativo. Ao gerar um, ele aparece aqui com a validade e pode ser encerrado a qualquer momento.</Text> : null}
        <View style={{ gap: Spacing.sm }}>
          {ativos.map((c) => (
            <View key={c.id} style={styles.linha}>
              <View style={{ flex: 1 }}>
                <Text style={styles.linhaTitulo}>{tituloRelatorio(c.tipo, c.especialidade ?? undefined)}</Text>
                <Text style={styles.linhaMeta}>Criado em {dataHoraBr(c.criadoEm)} · válido até {dataHoraBr(c.expiraEm)}{c.especialidade ? ` · ${rotuloEspecialidade(c.especialidade)}` : ''}</Text>
              </View>
              <Pressable onPress={() => encerrar(c)} hitSlop={8} accessibilityRole="button"><Text style={styles.encerrar}>Encerrar</Text></Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  ajuda: { ...Typography.body, color: Colors.textSecondary },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  cartao: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg },
  icone: { width: 48, height: 48, borderRadius: Radius.linha, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  cartaoTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  cartaoDescricao: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  tituloLinha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  /** Destaque contido: diz qual escolher sem gritar (D-025). */
  selo: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.chip, paddingHorizontal: 8, paddingVertical: 2 },
  seloTexto: { ...Typography.chip, color: Colors.textSecondary },
  aviso: { backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.md },
  avisoTexto: { ...Typography.body, color: Colors.textSecondary },
  link: { minHeight: 44, justifyContent: 'center' },
  avisoLink: { ...Typography.subheading, fontSize: 17, lineHeight: 23, color: Colors.primary, textDecorationLine: 'underline' },
  divisor: { height: 1, backgroundColor: Colors.border, marginTop: Spacing.xxl },
  especifico: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxxl, marginBottom: Spacing.sm },
  vazio: { ...Typography.body, color: Colors.textSecondary },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.lg },
  linhaTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  linhaMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  encerrar: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', color: Colors.danger },
});
