import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@ui/theme';

/** ~2 s por frase, entre 90 e 260 ms por palavra (D-063): nem arrastado nas curtas, nem corrido nas longas. */
export const MS_POR_PALAVRA = (total: number) => Math.min(260, Math.max(90, Math.round(2000 / Math.max(total, 1))));

interface Props {
  linhaPequena?: string;
  fala: string;
  /** Chamado uma vez por fala, quando a última palavra aparece (ou na hora, com Reduzir movimento). */
  onTerminou: () => void;
  /** Contador: quando aumenta depois de a fala aparecer, a frase se completa. A tela incrementa ao receber um toque. */
  completar: number;
}

/**
 * A fala do Nero no onboarding (D-063): as palavras passam de cinza-claro à cor final, uma a uma. Tocar
 * completa a frase (a tela incrementa `completar`); com Reduzir movimento ela aparece inteira. O leitor
 * de tela recebe a frase inteira, sem depender da animação.
 */
export function FalaNero({ linhaPequena, fala, onTerminou, completar }: Props) {
  const palavras = fala.split(' ');
  const [mostradas, setMostradas] = useState(0);
  const avisou = useRef(false);
  const aoTerminar = useRef(onTerminou);
  aoTerminar.current = onTerminou;
  const total = useRef(palavras.length);
  total.current = palavras.length;

  const terminar = () => {
    setMostradas(total.current);
    if (avisou.current) return;
    avisou.current = true;
    aoTerminar.current();
  };

  useEffect(() => {
    let vivo = true;
    let relogio: ReturnType<typeof setInterval> | undefined;
    avisou.current = false;
    setMostradas(0);
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduzir) => {
        if (!vivo) return;
        if (reduzir) { terminar(); return; }
        let n = 0;
        relogio = setInterval(() => {
          n += 1;
          setMostradas(n);
          if (n >= total.current) { clearInterval(relogio); terminar(); }
        }, MS_POR_PALAVRA(total.current));
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

  return (
    <View accessible accessibilityRole="text" accessibilityLabel={[linhaPequena, fala].filter(Boolean).join(' ')}>
      {linhaPequena ? <Text style={styles.pequena}>{linhaPequena}</Text> : null}
      <Text style={styles.fala}>
        {palavras.map((p, i) => (
          <Text key={i} style={{ opacity: i < mostradas ? 1 : 0.18 }}>{p}{i < palavras.length - 1 ? ' ' : ''}</Text>
        ))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pequena: { ...Typography.heading, color: Colors.textMuted, marginBottom: Spacing.sm },
  fala: { fontFamily: 'Poppins-Bold', fontSize: 26, lineHeight: 33, color: Colors.primary },
});
