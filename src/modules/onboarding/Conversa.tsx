import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { type Fala, falaComNome, indiceDoMarco } from '@core/onboarding/roteiro';
import { Spacing } from '@ui/theme';
import { FalaNero, MS_ENCOLHER } from './FalaNero';

const PAUSA_ENTRE_FALAS = 450;
/** Telas 5 e 6 (pedido do Murilo): uma coisa de cada vez, com tempo de ver cada cartão entrar. */
const PAUSA_LENTA = 1300;
const RITMO_LENTO = 1.5;

interface Props {
  falas: Fala[];
  nome: string | null;
  /** Só o Nero na tela antes da primeira fala. */
  atrasoInicialMs?: number;
  /** Mais devagar: palavras mais espaçadas e pausa maior entre as falas. */
  lento?: boolean;
  completar: number;
  /** Um cartão da demonstração deve aparecer (a palavra do marco foi dita). */
  onMarco?: (cartao: string) => void;
  onTerminou: () => void;
}

/**
 * As falas de uma tela, uma depois da outra (D-063). Uma fala com `encolher` fica pequena e cinza quando
 * termina e a próxima entra embaixo; uma com `substituir` entra no lugar da anterior. Os `marcos` avisam a
 * tela quando a palavra de um cartão aparece. Com Reduzir movimento, tudo aparece sem pausas.
 */
export function Conversa({ falas, nome, atrasoInicialMs = 0, lento = false, completar, onMarco, onTerminou }: Props) {
  const [atual, setAtual] = useState(-1);
  const reduzir = useRef(false);
  const disparados = useRef(new Set<string>());
  const aoMarco = useRef(onMarco);
  aoMarco.current = onMarco;
  const aoTerminar = useRef(onTerminou);
  aoTerminar.current = onTerminou;

  useEffect(() => {
    let vivo = true;
    let t: ReturnType<typeof setTimeout> | undefined;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((r) => {
        reduzir.current = r;
        if (!vivo) return;
        if (r || !atrasoInicialMs) setAtual(0);
        else t = setTimeout(() => setAtual(0), atrasoInicialMs);
      });
    return () => { vivo = false; if (t) clearTimeout(t); };
  }, [atrasoInicialMs]);

  const progrediu = (i: number, palavras: number) => {
    const f = falas[i];
    for (const m of f.marcos ?? []) {
      const k = `${i}:${m.cartao}`;
      if (!disparados.current.has(k) && indiceDoMarco(f.texto, m.palavra) < palavras) {
        disparados.current.add(k);
        aoMarco.current?.(m.cartao);
      }
    }
  };

  const terminou = (i: number) => {
    progrediu(i, Number.MAX_SAFE_INTEGER);
    if (i >= falas.length - 1) { aoTerminar.current(); return; }
    const espera = reduzir.current ? 0 : (lento ? PAUSA_LENTA : PAUSA_ENTRE_FALAS) + (falas[i].encolher ? MS_ENCOLHER : 0);
    if (espera) setTimeout(() => setAtual((a) => Math.max(a, i + 1)), espera);
    else setAtual((a) => Math.max(a, i + 1));
  };

  return (
    <View style={styles.coluna}>
      {falas.map((f, i) => (i > atual ? null : (
        <FalaNero
          key={i}
          fala={falaComNome(f.texto, nome)}
          completar={i === atual ? completar : 0}
          encolhida={!!f.encolher && i < atual}
          oculta={!!falas[i + 1]?.substituir && i + 1 <= atual}
          ritmo={lento ? RITMO_LENTO : 1}
          onProgresso={(n) => progrediu(i, n)}
          onTerminou={() => terminou(i)}
        />
      )))}
    </View>
  );
}

const styles = StyleSheet.create({
  coluna: { gap: Spacing.sm },
});
