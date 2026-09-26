import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, Radius, Shadows, Spacing, Typography } from '@ui/theme';
import { fase, useSequencia } from './useSequencia';

const TracoAnimado = Animated.createAnimatedComponent(Path);
const PontoAnimado = Animated.createAnimatedComponent(Circle);

/** Sete dias de exemplo, todos dentro do normal (D-063: sem valor fora do normal nem cor de alerta). */
const SISTOLICAS = [124, 129, 126, 122, 127, 125, 128];
const L = 250, A = 64, MIN = 115, MAX = 135;
const pontos = SISTOLICAS.map((v, i) => ({ x: 8 + (i * (L - 16)) / (SISTOLICAS.length - 1), y: A - 8 - ((v - MIN) / (MAX - MIN)) * (A - 16) }));
const TRACO = pontos.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
const COMPRIMENTO = pontos.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pontos[i].x, p.y - pontos[i].y), 0);

const subir = (v: Animated.AnimatedInterpolation<number>) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] });

/**
 * Tela 4, depois da fala (ajuste do Murilo: fala e cartão ao mesmo tempo confundiam). O cartão da pressão
 * entra e o gráfico da semana se desenha; depois entra o da glicemia. Sem etiqueta verde de "no alvo".
 */
export function DemoPressao({ onTerminou }: { onTerminou?: () => void }) {
  const { progresso, repetir } = useSequencia(3600, onTerminou);
  const pressao = fase(progresso, 0, 0.25);
  const desenho = fase(progresso, 0.2, 0.6);
  const media = fase(progresso, 0.55, 0.7);
  const glicemia = fase(progresso, 0.7, 1);
  return (
    <Pressable onPress={repetir} style={styles.area} accessibilityRole="image" accessibilityLabel="Exemplo: pressão de hoje 128 por 78 com o gráfico da semana, e glicemia em jejum 95">
      <Animated.View style={[styles.cartao, subir(pressao)]}>
        <View style={styles.linha}>
          <Ionicons name="heart-outline" size={18} color={Colors.primary} />
          <Text style={styles.rotulo}>Pressão de hoje</Text>
        </View>
        <Text style={styles.valor}>128 por 78</Text>
        <Svg width={L} height={A} style={styles.grafico}>
          <TracoAnimado d={TRACO} stroke={Colors.accent} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={`${COMPRIMENTO} ${COMPRIMENTO}`} strokeDashoffset={desenho.interpolate({ inputRange: [0, 1], outputRange: [COMPRIMENTO, 0] })} />
          {pontos.map((p, i) => (
            <PontoAnimado key={i} cx={p.x} cy={p.y} r={3.5} fill={Colors.primary}
              opacity={desenho.interpolate({ inputRange: [i / pontos.length, (i + 0.6) / pontos.length], outputRange: [0, 1], extrapolate: 'clamp' })} />
          ))}
        </Svg>
        <Animated.Text style={[styles.media, { opacity: media }]}>Média da semana: 126 por 80</Animated.Text>
      </Animated.View>
      <Animated.View style={[styles.cartao, subir(glicemia)]}>
        <View style={styles.linha}>
          <Ionicons name="water-outline" size={18} color={Colors.primary} />
          <Text style={styles.rotulo}>Glicemia em jejum</Text>
        </View>
        <Text style={styles.valor}>95 mg/dL</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  area: { gap: Spacing.md },
  cartao: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg, gap: 2, ...Shadows.card },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  rotulo: { ...Typography.caption, color: Colors.textSecondary },
  valor: { fontFamily: 'Poppins-Bold', fontSize: 26, lineHeight: 32, color: Colors.primary },
  grafico: { alignSelf: 'center', marginTop: Spacing.xs },
  media: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
});
