import React, { useEffect, useState } from 'react';
import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

/** Clipes do mascote (D-015): WebP animado com alpha, gerados de `docs/nero/mascote/animacoes.md`. */
export type NeroClipe = 'repouso' | 'acenar' | 'comemorar' | 'pensando';

interface Clipe { fonte: number; largura: number; altura: number; loop: boolean; duracaoMs: number; /** Quadro parado, para a pausa entre ciclos (`pausaMs`). */ parado?: number }

export const CLIPES: Record<NeroClipe, Clipe> = {
  repouso: { fonte: require('../../../assets/animacoes/nero/repouso.webp'), largura: 218, altura: 360, loop: true, duracaoMs: 4400 },
  acenar: { fonte: require('../../../assets/animacoes/nero/acenar.webp'), largura: 252, altura: 360, loop: false, duracaoMs: 3050 },
  // v2 (27/09): 5,25 s em loop, olhos abertos no fim do ciclo, centrado pelo tronco e em 640 px de altura
  // (nítido no onboarding, onde o Nero chega a 290 pt); mais largo por causa dos braços abertos.
  comemorar: { fonte: require('../../../assets/animacoes/nero/comemorar.webp'), largura: 490, altura: 640, loop: true, duracaoMs: 5250 },
  pensando: { fonte: require('../../../assets/animacoes/nero/pensando.webp'), largura: 248, altura: 360, loop: true, duracaoMs: 2550, parado: require('../../../assets/animacoes/nero/pensando-parado.png') },
};

/**
 * Largura da caixa: a do aceno (252/360), para a troca entre clipes não mexer no layout; `contain` centraliza.
 * Só cresce onde um dos clipes usados é mais largo (o comemorar v2, de braços abertos). Antes era a do clipe
 * mais largo de todos, e o comemorar v2 alargaria o Nero na Home e em Minha Saúde, calibrados pelo Murilo.
 */
const PROPORCAO_BASE = 252 / 360;
const proporcao = (c: NeroClipe) => CLIPES[c].largura / CLIPES[c].altura;
export const larguraDaCaixa = (size: number, clipe: NeroClipe, entrada?: NeroClipe) =>
  size * Math.max(PROPORCAO_BASE, proporcao(clipe), entrada ? proporcao(entrada) : 0);

interface Props {
  /** Clipe em loop mostrado normalmente. */
  clipe?: NeroClipe;
  /** Clipe tocado uma vez ao montar; ao terminar, troca para `clipe`. */
  entrada?: NeroClipe;
  /** Altura em pontos. */
  size?: number;
  /** Pausa entre um ciclo e outro do clipe, parado no primeiro quadro (onboarding, D-063). Só clipes com `parado`. */
  pausaMs?: number;
  style?: StyleProp<ImageStyle>;
}

/** Devolve qual clipe deve estar na tela: `entrada` até o fim da duração dela, depois `clipe`. */
export function useClipeAtual(clipe: NeroClipe, entrada?: NeroClipe): NeroClipe {
  const [atual, setAtual] = useState<NeroClipe>(entrada ?? clipe);
  useEffect(() => {
    if (!entrada) { setAtual(clipe); return; }
    setAtual(entrada);
    const t = setTimeout(() => setAtual(clipe), CLIPES[entrada].duracaoMs);
    return () => clearTimeout(t);
  }, [clipe, entrada]);
  return atual;
}

export function NeroAnimado({ clipe = 'repouso', entrada, size = 96, pausaMs, style }: Props) {
  const atual = useClipeAtual(clipe, entrada);
  const c = CLIPES[atual];
  // Ciclo com pausa: toca o clipe uma vez, fica parado `pausaMs` e recomeça (a `key` reinicia o WebP).
  const comPausa = !!pausaMs && !!c.parado;
  const [ciclo, setCiclo] = useState(0);
  const [parado, setParado] = useState(false);
  useEffect(() => {
    if (!comPausa) return;
    const t = setTimeout(() => {
      if (parado) { setParado(false); setCiclo((n) => n + 1); } else setParado(true);
    }, parado ? pausaMs : c.duracaoMs);
    return () => clearTimeout(t);
  }, [comPausa, parado, pausaMs, c.duracaoMs]);
  return (
    <Image
      key={`${atual}-${ciclo}-${parado ? 'p' : 'a'}`}
      source={comPausa && parado ? c.parado : c.fonte}
      style={[{ width: larguraDaCaixa(size, clipe, entrada), height: size }, style]}
      contentFit="contain"
      autoplay
      accessibilityLabel="Nero, mascote do aplicativo"
    />
  );
}
