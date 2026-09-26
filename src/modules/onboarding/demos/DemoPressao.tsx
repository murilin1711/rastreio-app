import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Alerta, Colors, Radius, Shadows, Spacing, Typography } from '@ui/theme';
import { fase, useSequencia } from './useSequencia';

const TracoAnimado = Animated.createAnimatedComponent(Path);
const PontoAnimado = Animated.createAnimatedComponent(Circle);

/** Sete dias de exemplo, todos dentro do normal (D-063: sem valor fora do normal nem cor de alerta). */
const SISTOLICAS = [124, 129, 126, 122, 127, 125, 128];
const L = 260, A = 90, MIN = 115, MAX = 135;
const pontos = SISTOLICAS.map((v, i) => ({ x: 10 + (i * (L - 20)) / (SISTOLICAS.length - 1), y: A - 10 - ((v - MIN) / (MAX - MIN)) * (A - 20) }));
const TRACO = pontos.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
const COMPRIMENTO = pontos.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pontos[i].x, p.y - pontos[i].y), 0);

/** Tela 4: o cartão da pressão entra, o gráfico da semana se desenha, e a média aparece. */
export function DemoPressao({ onTerminou }: { onTerminou?: () => void }) {
  const { progresso, repetir } = useSequencia(3000, onTerminou);
  const cartao = fase(progresso, 0, 0.3);
  const desenho = fase(progresso, 0.3, 0.85);
  const media = fase(progresso, 0.85, 1);
  return (
    <Pressable onPress={repetir} accessibilityRole="image" accessibilityLabel="Exemplo: pressão de hoje 128 por 78, no alvo, e o gráfico da semana">
      <Animated.View style={[styles.cartao, { opacity: cartao, transform: [{ translateY: cartao.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
        <View style={styles.linha}>
          <Ionicons name="heart-outline" size={18} color={Colors.primary} />
          <Text style={styles.rotulo}>Pressão de hoje</Text>
          <View style={styles.etiqueta}><Text style={styles.etiquetaTexto}>no alvo</Text></View>
        </View>
        <Text style={styles.valor}>128 por 78</Text>
        <Svg width={L} height={A} style={styles.grafico}>
          <TracoAnimado d={TRACO} stroke={Colors.accent} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={`${COMPRIMENTO} ${COMPRIMENTO}`} strokeDashoffset={desenho.interpolate({ inputRange: [0, 1], outputRange: [COMPRIMENTO, 0] })} />
          {pontos.map((p, i) => (
            <PontoAnimado key={i} cx={p.x} cy={p.y} r={4} fill={Colors.primary}
              opacity={desenho.interpolate({ inputRange: [i / pontos.length, (i + 0.6) / pontos.length], outputRange: [0, 1], extrapolate: 'clamp' })} />
          ))}
        </Svg>
        <Animated.Text style={[styles.media, { opacity: media }]}>Média da semana: 126 por 80</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg, gap: Spacing.xs, ...Shadows.card },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  rotulo: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  etiqueta: { backgroundColor: Alerta.verde.bg, borderRadius: Radius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  etiquetaTexto: { ...Typography.caption, fontSize: 12, color: Alerta.verde.fg },
  valor: { fontFamily: 'Poppins-Bold', fontSize: 28, lineHeight: 34, color: Colors.primary },
  grafico: { alignSelf: 'center', marginTop: Spacing.xs },
  media: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
});
