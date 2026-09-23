import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { criarCompartilhamento, revogar } from '@core/relatorios/compartilharQr';
import { compartilharArquivo, gerarPdf } from '@core/relatorios/gerarPdf';
import { dataHoraBr } from '@core/relatorios/montar';
import type { ChaveSecao, Especialidade, TipoRelatorio } from '@core/relatorios/tipos';
import { useRelatorio } from '@core/relatorios/useRelatorio';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { SecaoRelatorioView } from '@modules/minha-saude/componentes/SecaoRelatorioView';
import { TEXTO_QR } from '@modules/minha-saude/conteudo/relatorios';
import { Button, Colors, InternalHeader, Radius, Spacing, Typography } from '@ui/index';

/** Prévia nativa do relatório + "Gerar PDF e compartilhar" (no aparelho) + "Mostrar QR para o médico" (D-007). */
export default function PreviaRelatorio() {
  const router = useRouter();
  const { sessao } = useSessao();
  const p = useLocalSearchParams<{ tipo: TipoRelatorio; dias?: string; especialidade?: Especialidade; apenas?: string }>();
  const dias = (Number(p.dias) === 30 || Number(p.dias) === 180 ? Number(p.dias) : 90) as 30 | 90 | 180;
  const rel = useRelatorio({ tipo: p.tipo ?? 'geral', dias, especialidade: p.especialidade, apenas: p.apenas ? (p.apenas.split(',') as ChaveSecao[]) : undefined });
  const [gerando, setGerando] = useState(false);
  const [qr, setQr] = useState<{ id: string; svg: string; expiraEm: string } | null>(null);
  const [criandoQr, setCriandoQr] = useState(false);

  const gerarECompartilhar = async () => {
    setGerando(true);
    try { await compartilharArquivo(await gerarPdf(rel.html())); } catch (e) { Alert.alert('Não foi possível gerar o PDF', traduzirErro(e).mensagemUsuario); } finally { setGerando(false); }
  };

  const mostrarQr = () => {
    Alert.alert('Enviar o PDF para a nuvem?', TEXTO_QR.confirmacao, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Gerar código QR', onPress: async () => {
        if (!sessao?.user.id) return;
        setCriandoQr(true);
        try {
          const c = await criarCompartilhamento(sessao.user.id, p.tipo ?? 'geral', p.especialidade ?? null, rel.html(), (svg, validade) => rel.html(svg, validade));
          setQr({ id: c.id, svg: c.qrSvg, expiraEm: c.expiraEm });
        } catch (e) { Alert.alert('Não foi possível criar o código QR', traduzirErro(e).mensagemUsuario); } finally { setCriandoQr(false); }
      } },
    ]);
  };

  const encerrar = async () => {
    if (!qr || !sessao?.user.id) return;
    try { await revogar(sessao.user.id, qr.id); setQr(null); } catch (e) { Alert.alert('Não foi possível encerrar', traduzirErro(e).mensagemUsuario); }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Relatórios" title={rel.titulo} onBack={() => router.back()} />
        <Text style={styles.meta}>Período das medidas: {rel.periodo.rotulo}. Exames e rastreamentos entram sem limite de data.</Text>
        {rel.erro ? <Text style={styles.erro}>{rel.erro.mensagemUsuario}</Text> : null}
        {rel.carregando ? <Text style={styles.meta}>Montando o relatório…</Text> : null}
        <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
          {rel.secoes.map((s) => <SecaoRelatorioView key={s.chave} secao={s} />)}
        </View>
        {!rel.carregando && rel.dados ? (
          <View style={{ gap: Spacing.sm, marginTop: Spacing.xxl }}>
            <Button label="Gerar PDF e compartilhar" onPress={gerarECompartilhar} loading={gerando} />
            <Button label="Mostrar QR para o médico" variant="outline" onPress={mostrarQr} loading={criandoQr} />
            <Text style={styles.nota}>{TEXTO_QR.nota}</Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={!!qr} transparent animationType="fade" onRequestClose={() => setQr(null)}>
        <Pressable style={styles.fundo} onPress={() => setQr(null)}>
          <Pressable style={styles.folha} onPress={() => {}}>
            <Text style={styles.folhaTitulo}>Mostre este código ao médico</Text>
            {qr ? <View style={{ alignSelf: 'center', backgroundColor: '#fff', padding: Spacing.md, borderRadius: Radius.linha }}><SvgXml xml={qr.svg} width={240} height={240} /></View> : null}
            <Text style={styles.folhaTexto}>{TEXTO_QR.aberto} Válido até {qr ? dataHoraBr(qr.expiraEm) : ''}.</Text>
            <Button label="Encerrar compartilhamento" variant="ghost" onPress={encerrar} />
            <Button label="Fechar" onPress={() => setQr(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  meta: { ...Typography.caption, color: Colors.textSecondary },
  erro: { ...Typography.body, color: Colors.danger, marginTop: Spacing.md },
  nota: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },
  fundo: { flex: 1, backgroundColor: 'rgba(15,45,99,0.45)', justifyContent: 'flex-end' },
  folha: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.bloco, borderTopRightRadius: Radius.bloco, padding: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  folhaTitulo: { ...Typography.heading, color: Colors.textPrimary, textAlign: 'center' },
  folhaTexto: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
});
