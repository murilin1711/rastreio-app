import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Colors, Radius, Shadows, Spacing, Typography } from '@ui/theme';
import { fase, useSequencia } from './useSequencia';

/** Folhas que se juntam: de onde cada uma vem. */
const FOLHAS: { icone: keyof typeof Ionicons.glyphMap; x: number; y: number; giro: string }[] = [
  { icone: 'heart-outline', x: -110, y: -30, giro: '-14deg' },
  { icone: 'flask-outline', x: 0, y: -90, giro: '6deg' },
  { icone: 'medkit-outline', x: 110, y: -20, giro: '14deg' },
];

/** QR de enfeite (não codifica nada): grade fixa com os três cantos de um QR de verdade. */
const MODULOS = 21;
const cantos = (x: number, y: number) => (x < 7 && y < 7) || (x >= MODULOS - 7 && y < 7) || (x < 7 && y >= MODULOS - 7);
const cheio = (x: number, y: number) => {
  if (cantos(x, y)) { const cx = x < 7 ? x : x - (MODULOS - 7); const cy = y < 7 ? y : y - (MODULOS - 7); return cx === 0 || cy === 0 || cx === 6 || cy === 6 || (cx >= 2 && cx <= 4 && cy >= 2 && cy <= 4); }
  return ((x * 7 + y * 13 + x * y) % 5) < 2;
};
const CELULAS = Array.from({ length: MODULOS * MODULOS }, (_, i) => ({ x: i % MODULOS, y: Math.floor(i / MODULOS) })).filter((c) => cheio(c.x, c.y));

/** Tela 5: três folhas (pressão, exames, remédios) viram um relatório, e o código QR aparece. */
export function DemoRelatorio({ onTerminou }: { onTerminou?: () => void }) {
  const { progresso, repetir } = useSequencia(3000, onTerminou);
  const juntar = fase(progresso, 0, 0.5);
  const documento = fase(progresso, 0.5, 0.75);
  const qr = fase(progresso, 0.75, 1);
  return (
    <Pressable onPress={repetir} style={styles.area} accessibilityRole="image" accessibilityLabel="Exemplo: suas informações viram um relatório para o médico, com código QR">
      <View style={styles.palco}>
        {FOLHAS.map((f, i) => (
          <Animated.View key={i} style={[styles.folha, {
            opacity: documento.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [
              { translateX: juntar.interpolate({ inputRange: [0, 1], outputRange: [f.x, 0] }) },
              { translateY: juntar.interpolate({ inputRange: [0, 1], outputRange: [f.y, 0] }) },
              { rotate: juntar.interpolate({ inputRange: [0, 1], outputRange: [f.giro, '0deg'] }) },
            ],
          }]}>
            <Ionicons name={f.icone} size={26} color={Colors.primary} />
          </Animated.View>
        ))}
        <Animated.View style={[styles.documento, { opacity: documento, transform: [{ scale: documento.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
          <Ionicons name="document-text" size={30} color={Colors.primary} />
          <Text style={styles.titulo}>Relatório para o médico</Text>
          {[0.9, 0.7, 0.8].map((w, i) => <View key={i} style={[styles.linhaTexto, { width: `${w * 100}%` }]} />)}
        </Animated.View>
      </View>
      <Animated.View style={[styles.qr, { opacity: qr, transform: [{ translateY: qr.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
        <Svg width={84} height={84} viewBox={`0 0 ${MODULOS} ${MODULOS}`}>
          {CELULAS.map((c, i) => <Rect key={i} x={c.x} y={c.y} width={1} height={1} fill={Colors.primary} />)}
        </Svg>
        <Text style={styles.qrTexto}>Mostre ao médico</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  area: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, minHeight: 200 },
  palco: { width: 150, height: 180, alignItems: 'center', justifyContent: 'center' },
  folha: { position: 'absolute', width: 70, height: 90, borderRadius: Radius.linha, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadows.card },
  documento: { position: 'absolute', width: 140, height: 175, borderRadius: Radius.linha, backgroundColor: Colors.surface, padding: Spacing.md, gap: Spacing.xs, ...Shadows.card },
  titulo: { ...Typography.subheading, fontSize: 14, lineHeight: 18, color: Colors.primary },
  linhaTexto: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceAlt },
  qr: { alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.sm, ...Shadows.card },
  qrTexto: { ...Typography.caption, fontSize: 12, color: Colors.textSecondary },
});
