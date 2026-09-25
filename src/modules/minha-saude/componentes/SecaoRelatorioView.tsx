import { StyleSheet, Text, View } from 'react-native';
import { TITULO_COMPLEMENTO, type Bloco, type SecaoRelatorio } from '@core/relatorios/tipos';
import { Colors, Radius, Spacing, StatusBadge, Typography } from '@ui/index';

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
    case 'tabela': return (
      <View style={styles.tabela}>
        <View style={[styles.linha, styles.cabecalho]}>{bloco.colunas.map((c, i) => <Text key={i} style={[styles.celula, styles.celulaCab]} numberOfLines={2}>{c}</Text>)}</View>
        {bloco.linhas.map((l, i) => (
          <View key={i} style={[styles.linha, i % 2 ? styles.zebra : null]}>{l.map((c, j) => <Text key={j} style={styles.celula}>{c}</Text>)}</View>
        ))}
      </View>
    );
  }
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
  celula: { flex: 1, ...Typography.caption, fontSize: 11, lineHeight: 15, color: Colors.textPrimary, paddingVertical: 4, paddingHorizontal: 4 },
  celulaCab: { fontFamily: 'Poppins-SemiBold', color: Colors.textSecondary },
});
