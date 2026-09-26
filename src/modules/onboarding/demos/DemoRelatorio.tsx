import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Colors, Radius, Shadows, Spacing, Typography } from '@ui/theme';
import { useEntrada } from './useEntrada';
import { fase, useSequencia } from './useSequencia';

/** As informações que entram no relatório, na ordem em que o Nero as diz (tela 5). */
const CARTOES: { id: string; icone: keyof typeof Ionicons.glyphMap; titulo: string; detalhe: string }[] = [
  { id: 'historico', icone: 'time-outline', titulo: 'Histórico', detalhe: 'Doenças e família' },
  { id: 'exames', icone: 'flask-outline', titulo: 'Exames', detalhe: 'Colesterol, glicemia' },
  { id: 'medicacoes', icone: 'medkit-outline', titulo: 'Medicações', detalhe: 'Losartana 50 mg' },
];
const ALTURA_CARTAO = 58;
const VAO = 10;

/** QR de enfeite (não codifica nada): grade fixa com os três cantos de um QR de verdade. */
const MODULOS = 21;
const cantos = (x: number, y: number) => (x < 7 && y < 7) || (x >= MODULOS - 7 && y < 7) || (x < 7 && y >= MODULOS - 7);
const cheio = (x: number, y: number) => {
  if (cantos(x, y)) { const cx = x < 7 ? x : x - (MODULOS - 7); const cy = y < 7 ? y : y - (MODULOS - 7); return cx === 0 || cy === 0 || cx === 6 || cy === 6 || (cx >= 2 && cx <= 4 && cy >= 2 && cy <= 4); }
  return ((x * 7 + y * 13 + x * y) % 5) < 2;
};
const CELULAS = Array.from({ length: MODULOS * MODULOS }, (_, i) => ({ x: i % MODULOS, y: Math.floor(i / MODULOS) })).filter((c) => cheio(c.x, c.y));

interface Props {
  /** Cartões cujas palavras o Nero já disse. */
  visiveis: string[];
  /** Última fala terminou: os cartões entram no relatório e o QR aparece. */
  juntar: boolean;
  onTerminou?: () => void;
}

/**
 * Tela 5 (ajuste do Murilo, 26/09): cada informação aparece quando o Nero a nomeia; na frase da consulta,
 * tudo entra no relatório (mais devagar que a primeira versão) e o código QR aparece ao lado.
 */
export function DemoRelatorio({ visiveis, juntar, onTerminou }: Props) {
  // Junção mais devagar (pedido do Murilo): dá para ver cada cartão entrar no relatório.
  const { progresso, repetir } = useSequencia(6000, onTerminou, juntar);
  const entrar = fase(progresso, 0, 0.6);
  const documento = fase(progresso, 0.45, 0.75);
  const qr = fase(progresso, 0.75, 1);
  return (
    <Pressable onPress={juntar ? repetir : undefined} style={styles.area} accessibilityRole="image" accessibilityLabel="Exemplo: histórico, exames e medicações entram num relatório para o médico, com código QR">
      <View style={styles.palco}>
        {CARTOES.map((c, i) => (
          <Cartao key={c.id} cartao={c} indice={i} visivel={visiveis.includes(c.id)} entrar={entrar} />
        ))}
        <Animated.View style={[styles.documento, { opacity: documento, transform: [{ scale: documento.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
          <Ionicons name="document-text" size={28} color={Colors.primary} />
          <Text style={styles.docTitulo}>Relatório para o médico</Text>
          {[0.92, 0.7, 0.84, 0.6].map((w, i) => <View key={i} style={[styles.linhaTexto, { width: `${w * 100}%` }]} />)}
        </Animated.View>
      </View>
      <Animated.View style={[styles.qr, { opacity: qr, transform: [{ translateY: qr.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
        <Svg width={78} height={78} viewBox={`0 0 ${MODULOS} ${MODULOS}`}>
          {CELULAS.map((c, i) => <Rect key={i} x={c.x} y={c.y} width={1} height={1} fill={Colors.primary} />)}
        </Svg>
        <Text style={styles.qrTexto}>Mostre ao médico</Text>
      </Animated.View>
    </Pressable>
  );
}

/** Um cartão: entra quando é nomeado e, na junção, desliza para dentro do relatório e some. */
function Cartao({ cartao, indice, visivel, entrar }: { cartao: (typeof CARTOES)[number]; indice: number; visivel: boolean; entrar: Animated.AnimatedInterpolation<number> }) {
  const aparecer = useEntrada(visivel, 800, false);
  if (!visivel) return null;
  const topo = indice * (ALTURA_CARTAO + VAO);
  const centro = (ALTURA_TOTAL - ALTURA_CARTAO) / 2;
  return (
    <Animated.View style={[styles.cartao, { top: topo,
      opacity: Animated.multiply(aparecer, entrar.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] })),
      transform: [
        { translateX: aparecer.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) },
        { translateY: entrar.interpolate({ inputRange: [0, 1], outputRange: [0, centro - topo] }) },
        { scale: entrar.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }) },
      ] }]}>
      <View style={styles.icone}><Ionicons name={cartao.icone} size={20} color={Colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.titulo}>{cartao.titulo}</Text>
        <Text style={styles.detalhe}>{cartao.detalhe}</Text>
      </View>
    </Animated.View>
  );
}

const ALTURA_TOTAL = CARTOES.length * ALTURA_CARTAO + (CARTOES.length - 1) * VAO;

const styles = StyleSheet.create({
  area: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  palco: { width: 200, height: ALTURA_TOTAL },
  cartao: { position: 'absolute', left: 0, right: 0, height: ALTURA_CARTAO, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.linha, paddingHorizontal: Spacing.sm, ...Shadows.card },
  icone: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  titulo: { ...Typography.subheading, fontSize: 14, lineHeight: 18, color: Colors.primary },
  detalhe: { ...Typography.caption, fontSize: 12, lineHeight: 16, color: Colors.textSecondary },
  documento: { position: 'absolute', left: 15, right: 15, top: 0, bottom: 0, borderRadius: Radius.linha, backgroundColor: Colors.surface, padding: Spacing.md, gap: Spacing.xs, ...Shadows.card },
  docTitulo: { ...Typography.subheading, fontSize: 14, lineHeight: 18, color: Colors.primary },
  linhaTexto: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceAlt },
  qr: { alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.sm, ...Shadows.card },
  qrTexto: { ...Typography.caption, fontSize: 12, color: Colors.textSecondary },
});
