import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@ui/theme';

/** ~2 s por frase, entre 90 e 260 ms por palavra (D-063): nem arrastado nas curtas, nem corrido nas longas. */
export const MS_POR_PALAVRA = (total: number) => Math.min(260, Math.max(90, Math.round(2000 / Math.max(total, 1))));
const MS_ENCOLHER = 380;

interface Props {
  linhaPequena?: string;
  fala: string;
  /** Chamado uma vez por fala, quando a última palavra aparece (ou na hora, com Reduzir movimento). */
  onTerminou: () => void;
  /** Contador: quando aumenta depois de a fala aparecer, a frase se completa. A tela incrementa ao receber um toque. */
  completar: number;
  /** Quantas palavras já apareceram (os cartões da demonstração aparecem junto da palavra). */
  onProgresso?: (palavras: number) => void;
  /** Fala já dita que encolhe e fica cinza para a próxima entrar embaixo (telas 1 e 5). */
  encolhida?: boolean;
  /** Fala substituída pela seguinte: some sem sair da árvore, para não reiniciar. */
  oculta?: boolean;
  /** Multiplica o tempo por palavra (telas 5 e 6 mais devagar). */
  ritmo?: number;
}

/**
 * A fala do Nero no onboarding (D-063): as palavras passam de cinza-claro à cor final, uma a uma. Tocar
 * completa a frase (a tela incrementa `completar`); com Reduzir movimento ela aparece inteira. O leitor
 * de tela recebe a frase inteira, sem depender da animação.
 */
export function FalaNero({ linhaPequena, fala, onTerminou, completar, onProgresso, encolhida = false, oculta = false, ritmo = 1 }: Props) {
  const palavras = fala.split(' ');
  const [mostradas, setMostradas] = useState(0);
  const avisou = useRef(false);
  const aoTerminar = useRef(onTerminou);
  aoTerminar.current = onTerminou;
  const aoProgredir = useRef(onProgresso);
  aoProgredir.current = onProgresso;
  const total = useRef(palavras.length);
  total.current = palavras.length;

  const ultimoAviso = useRef(0);
  const mostrar = (n: number) => {
    setMostradas(n);
    if (n !== ultimoAviso.current) { ultimoAviso.current = n; aoProgredir.current?.(n); }
  };
  const terminar = () => {
    mostrar(total.current);
    if (avisou.current) return;
    avisou.current = true;
    aoTerminar.current();
  };

  useEffect(() => {
    let vivo = true;
    let relogio: ReturnType<typeof setInterval> | undefined;
    avisou.current = false;
    ultimoAviso.current = 0;
    setMostradas(0);
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduzir) => {
        if (!vivo) return;
        if (reduzir) { terminar(); return; }
        let n = 0;
        relogio = setInterval(() => {
          n += 1;
          mostrar(n);
          if (n >= total.current) { clearInterval(relogio); terminar(); }
        }, Math.round(MS_POR_PALAVRA(total.current) * ritmo));
      })
      .catch(() => { if (vivo) terminar(); });
    return () => { vivo = false; if (relogio) clearInterval(relogio); };
    // A animação recomeça só quando a fala muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fala]);

  // Só toques depois de a fala aparecer contam: a pergunta dos avisos nasce com o contador da tela já
  // alto, e um toque antigo não pode completá-la antes de começar.
  const completarAoMontar = useRef(completar);
  useEffect(() => {
    // A tela zera o contador a cada passo: acompanhar a descida para o próximo toque contar.
    if (completar < completarAoMontar.current) { completarAoMontar.current = completar; return; }
    if (completar > completarAoMontar.current) terminar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completar]);

  // Encolher (tela 1: "Oi, eu sou o Nero!"): troca para o tamanho e o cinza da linha pequena e faz uma
  // transição curta. Animar o tamanho da letra não recalcula a altura do texto, e a frase longa da tela 5
  // ficava cortada numa linha só.
  const transicao = useRef(new Animated.Value(1)).current;
  const encolheuAntes = useRef(encolhida);
  useEffect(() => {
    if (encolhida === encolheuAntes.current) return;
    encolheuAntes.current = encolhida;
    transicao.setValue(0);
    Animated.timing(transicao, { toValue: 1, duration: MS_ENCOLHER, useNativeDriver: true }).start();
  }, [encolhida, transicao]);

  if (oculta) return null;
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={[linhaPequena, fala].filter(Boolean).join(' ')}>
      {linhaPequena ? <Text style={styles.pequena}>{linhaPequena}</Text> : null}
      <Animated.Text style={[styles.fala, encolhida ? styles.encolhida : styles.grande, {
        opacity: transicao.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
        transform: [{ translateY: transicao.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }],
      }]}>
        {palavras.map((p, i) => (
          <Text key={i} style={{ opacity: i < mostradas ? 1 : 0.18 }}>{p}{i < palavras.length - 1 ? ' ' : ''}</Text>
        ))}
      </Animated.Text>
    </View>
  );
}

export { MS_ENCOLHER };

const styles = StyleSheet.create({
  pequena: { ...Typography.heading, color: Colors.textMuted, marginBottom: Spacing.sm },
  fala: { fontFamily: 'Poppins-Bold' },
  grande: { fontSize: 26, lineHeight: 33, color: Colors.primary },
  encolhida: { fontSize: 18, lineHeight: 24, color: Colors.textMuted },
});
