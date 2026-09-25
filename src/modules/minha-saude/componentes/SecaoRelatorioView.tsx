import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TITULO_COMPLEMENTO, type Bloco, type SecaoRelatorio } from '@core/relatorios/tipos';
import { Colors, Radius, Spacing, StatusBadge, Typography } from '@ui/index';
import { larguraColunas } from './larguraTabela';

/** Renderização nativa de uma seção do relatório — a prévia mostra o mesmo conteúdo do PDF. */
export function SecaoRelatorioView({ secao }: { secao: SecaoRelatorio }) {
  return (
    <>
      {secao.abreComplemento ? <Text style={styles.complemento}>{TITULO_COMPLEMENTO}</Text> : null}
      <View style={styles.secao}>
        <Text style={styles.titulo}>{secao.titulo}</Text>
        {secao.blocos.map((b, i) => <BlocoView key={i} bloco={b} />)}
      </View>
    </>
  );
}

function BlocoView({ bloco }: { bloco: Bloco }) {
  switch (bloco.tipo) {
    case 'texto': return <Text style={styles.texto}>{bloco.texto}</Text>;
    case 'lista': return <View style={{ gap: 2 }}>{bloco.itens.map((t, i) => <Text key={i} style={styles.texto}>• {t}</Text>)}</View>;
    case 'chip': return <View style={{ alignSelf: 'flex-start', marginTop: Spacing.xs }}><StatusBadge nivel={bloco.nivel} label={bloco.texto} /></View>;
    case 'barras': return (
      <View style={{ gap: 4, marginTop: Spacing.xs }}>
        {bloco.itens.map((it, i) => (
          <View key={i} style={styles.barra}>
            <Text style={styles.barraRotulo}>{it.rotulo}</Text>
            <View style={styles.trilho}><View style={[styles.preenchido, { width: `${Math.max(2, Math.min(100, Math.round((it.valor / it.max) * 100)))}%` }]} /></View>
            <Text style={styles.barraValor}>{it.texto}</Text>
          </View>
        ))}
      </View>
    );
    case 'tabela': return <TabelaView colunas={bloco.colunas} linhas={bloco.linhas} />;
  }
}

/**
 * Cada coluna cabe a maior palavra dela (D-050). Cabendo na tela, é tabela, com as colunas esticadas na
 * proporção. Não cabendo, cada linha vira um bloco ("Dose: 50", "Desde: 12/12/2025"): rolar para o lado
 * esconderia colunas de quem não percebe que dá para rolar. Célula vazia ("—") não aparece no bloco.
 */
function TabelaView({ colunas, linhas }: { colunas: string[]; linhas: string[][] }) {
  const [disponivel, setDisponivel] = useState(0);
  const base = larguraColunas(colunas, linhas);
  const total = base.reduce((a, b) => a + b, 0);
  const medir = (e: { nativeEvent: { layout: { width: number } } }) => setDisponivel(e.nativeEvent.layout.width - 2);
  if (disponivel && total > disponivel) {
    return (
      <View style={styles.tabela} onLayout={medir}>
        {linhas.map((l, i) => (
          <View key={i} style={[styles.bloco, i % 2 ? styles.zebra : null]}>
            <Text style={styles.blocoTitulo}>{l[0]}</Text>
            {l.slice(1).map((c, j) => (c && c !== '—' ? <Text key={j} style={styles.texto}><Text style={styles.blocoRotulo}>{colunas[j + 1]}: </Text>{c}</Text> : null))}
          </View>
        ))}
      </View>
    );
  }
  const fator = disponivel > total ? disponivel / total : 1;
  const col = (j: number) => ({ width: Math.floor(base[j] * fator) });
  return (
    <View style={styles.tabela} onLayout={medir}>
      <View style={[styles.linha, styles.cabecalho]}>{colunas.map((c, j) => <Text key={j} style={[styles.celula, styles.celulaCab, col(j)]}>{c}</Text>)}</View>
      {linhas.map((l, i) => (
        <View key={i} style={[styles.linha, i % 2 ? styles.zebra : null]}>{l.map((c, j) => <Text key={j} style={[styles.celula, col(j)]}>{c}</Text>)}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Divisor da terceira parte (D-025): o que vem daqui para baixo é complemento, não foco. */
  complemento: { ...Typography.heading, color: Colors.textSecondary, marginTop: Spacing.xxl, paddingTop: Spacing.lg, borderTopWidth: 2, borderTopColor: Colors.border },
  secao: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg, gap: Spacing.xs },
  titulo: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.xs },
  texto: { ...Typography.caption, fontSize: 13, lineHeight: 19, color: Colors.textPrimary },
  barra: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  barraRotulo: { ...Typography.caption, color: Colors.textSecondary, width: 76 },
  trilho: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.surfaceAlt, overflow: 'hidden' },
  preenchido: { height: '100%', backgroundColor: Colors.accent },
  barraValor: { ...Typography.caption, color: Colors.textPrimary, width: 56, textAlign: 'right' },
  tabela: { borderRadius: Radius.linha, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginTop: Spacing.xs },
  linha: { flexDirection: 'row' },
  cabecalho: { backgroundColor: Colors.surfaceAlt },
  zebra: { backgroundColor: Colors.background },
  celula: { ...Typography.caption, fontSize: 11, lineHeight: 15, color: Colors.textPrimary, paddingVertical: 4, paddingHorizontal: 4 },
  celulaCab: { fontFamily: 'Poppins-SemiBold', color: Colors.textSecondary },
  bloco: { padding: Spacing.sm, gap: 2 },
  blocoTitulo: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary },
  blocoRotulo: { color: Colors.textSecondary },
});
