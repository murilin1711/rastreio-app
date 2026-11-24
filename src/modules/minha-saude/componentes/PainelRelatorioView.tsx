import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LEGENDA_DOSES, SIMBOLO_DOSE, contaRemedio, rotuloDoses } from '@core/relatorios/adesaoRelatorio';
import { svgSistolica } from '@core/relatorios/grafico';
import { RESSALVA_CURTA_PAINEL, SETA_TENDENCIA } from '@core/relatorios/html';
import { dataBr } from '@core/relatorios/montar';
import type { CartaoNumero, LinhaAdesao, PainelRelatorio, PontoPressao, ProgramaPainel } from '@core/relatorios/tipos';
import { Alerta, Colors, Radius, Spacing, Typography } from '@ui/index';

const ALTURA_GRAFICO = 140;

/**
 * Página 1 do relatório (painel, D-067) na prévia do app, em 1 coluna: quem mostra é a pessoa, no celular,
 * ao médico. Mesmos blocos e textos do PDF; bloco vazio não aparece. Sem selo de cor (Ruling S0): a única
 * cor de destaque é a caixa "Para atenção". Doses por símbolo, com rótulo acessível (a cor nunca sozinha).
 */
export function PainelRelatorioView({ painel }: { painel: PainelRelatorio }) {
  const c = painel.cabecalho;
  return (
    <View style={styles.painel}>
      <View style={styles.bloco}>
        <Text style={styles.nome}>{c.nome}{c.idade != null ? `, ${c.idade} anos` : ''}</Text>
        {c.sexo ? <Text style={styles.meta}>Sexo ao nascer: {c.sexo}</Text> : null}
        <Text style={styles.meta}>Condições informadas: {c.condicoes.length ? c.condicoes.join(', ') : 'nenhuma'}</Text>
        <Text style={styles.meta}>Tabagismo: {c.tabagismo}</Text>
      </View>

      {painel.atencao.length ? (
        <View style={styles.atencao} accessibilityRole="summary">
          <Text style={styles.atencaoTitulo} accessibilityRole="header">Para atenção nesta consulta</Text>
          {painel.atencao.map((t, i) => <Text key={i} style={styles.atencaoItem}>• {t}</Text>)}
        </View>
      ) : null}

      {painel.cartoes.map((k) => <Cartao key={k.tipo} cartao={k} />)}

      {painel.seriePressao ? <Grafico serie={painel.seriePressao} referencia={painel.referenciaSistolica} /> : null}

      {painel.adesao?.length ? (
        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo} accessibilityRole="header">Remédios: últimas 2 semanas</Text>
          {painel.adesao.map((l) => <LinhaRemedio key={l.medicacaoId} linha={l} />)}
          <Text style={styles.legenda}>{LEGENDA_DOSES}</Text>
        </View>
      ) : null}

      {painel.prevencao?.length ? (
        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo} accessibilityRole="header">Prevenção</Text>
          {painel.prevencao.map((p) => <LinhaPrevencao key={p.programa} item={p} detalhada={painel.prevencaoDetalhada} />)}
        </View>
      ) : null}

      <Text style={styles.legenda}>{`Detalhes logo abaixo. ${RESSALVA_CURTA_PAINEL}`}</Text>
    </View>
  );
}

function Cartao({ cartao: k }: { cartao: CartaoNumero }) {
  const seta = k.tendencia ? SETA_TENDENCIA[k.tendencia] : null;
  const det = [k.data, k.detalhe].filter(Boolean).join(' · ');
  return (
    <View style={styles.bloco}>
      <Text style={styles.cartaoTitulo}>{k.titulo}</Text>
      <Text style={styles.valor}>
        {k.valor}
        {k.unidade ? <Text style={styles.unidade}> {k.unidade}</Text> : null}
        {seta ? <Text style={styles.seta} accessibilityLabel={seta.rotulo}> {seta.seta}</Text> : null}
      </Text>
      {det ? <Text style={styles.meta}>{det}</Text> : null}
    </View>
  );
}

/** A largura vem do `onLayout`: o SVG é desenhado no tamanho da tela, sem cortar no iPhone SE. */
function Grafico({ serie, referencia }: { serie: PontoPressao[]; referencia: number }) {
  const [largura, setLargura] = useState(0);
  const medir = (e: LayoutChangeEvent) => setLargura(Math.floor(e.nativeEvent.layout.width));
  const xml = largura > 0 ? svgSistolica(serie, { largura, altura: ALTURA_GRAFICO, referencia }) : '';
  return (
    <View style={styles.bloco}>
      <Text style={styles.blocoTitulo} accessibilityRole="header">Pressão sistólica no período</Text>
      <View onLayout={medir} style={{ minHeight: ALTURA_GRAFICO }}>
        {xml ? <SvgXml xml={xml} width={largura} height={ALTURA_GRAFICO} accessibilityLabel={`Pressão sistólica no período: ${serie.length} medidas`} /> : null}
      </View>
      <Text style={styles.legenda}>{`Linha tracejada: referência domiciliar de ${referencia} mmHg.`}</Text>
    </View>
  );
}

function LinhaRemedio({ linha: l }: { linha: LinhaAdesao }) {
  const rotulo = rotuloDoses(l.doses);
  return (
    <View style={styles.remedio}>
      <Text style={styles.remedioNome}>{l.dose ? `${l.nome} ${l.dose}` : l.nome}</Text>
      {l.doses.length ? (
        <Text style={styles.doses} accessibilityLabel={rotulo}>{l.doses.map((e) => SIMBOLO_DOSE[e]).join(' ')}</Text>
      ) : null}
      <Text style={styles.meta}>{contaRemedio(l)}</Text>
    </View>
  );
}

function LinhaPrevencao({ item: p, detalhada }: { item: ProgramaPainel; detalhada: boolean }) {
  return (
    <Text style={styles.texto}>
      <Text style={styles.forte}>{p.rotulo}</Text>: {p.situacao}
      {detalhada && p.proximaData ? ` · próxima data: ${dataBr(p.proximaData)}` : ''}
      {detalhada && p.mensagem ? `. ${p.mensagem}` : ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  painel: { gap: Spacing.md },
  bloco: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg, gap: Spacing.xs },
  nome: { ...Typography.title, color: Colors.textPrimary },
  blocoTitulo: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.xs },
  meta: { ...Typography.body, color: Colors.textSecondary },
  texto: { ...Typography.body, color: Colors.textPrimary },
  forte: { fontFamily: 'Poppins-SemiBold' },
  legenda: { ...Typography.caption, color: Colors.textSecondary },
  atencao: { backgroundColor: Alerta.vermelho.bg, borderColor: Alerta.vermelho.fg, borderWidth: 1.5, borderRadius: Radius.bloco, padding: Spacing.lg, gap: Spacing.xs },
  atencaoTitulo: { ...Typography.heading, color: Alerta.vermelho.fg },
  atencaoItem: { ...Typography.body, color: Colors.textPrimary },
  cartaoTitulo: { ...Typography.subheading, color: Colors.textSecondary },
  valor: { ...Typography.display, color: Colors.textPrimary },
  unidade: { ...Typography.body, color: Colors.textSecondary },
  seta: { ...Typography.title, color: Colors.textPrimary },
  remedio: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceAlt, gap: 2 },
  remedioNome: { ...Typography.subheading, color: Colors.textPrimary },
  doses: { fontSize: 18, lineHeight: 26, letterSpacing: 1, color: Colors.textPrimary },
});
