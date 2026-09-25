import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import { Alerta, Colors, Radius, Spacing, Typography } from '@ui/theme';

/** Tempos da saída (D-024). Somados dão pouco mais de um segundo: dá para ver sem virar espera. */
const MS_VERDE = 260;
const MS_PAUSA = 620;
const MS_SUMIR = 320;
export const MS_SAIDA_CONCLUIDA = MS_VERDE + MS_PAUSA + MS_SUMIR;

/** Quanto a Home espera a transição de volta terminar antes de começar a saída (D-046). */
export const MS_ATRASO_AO_VOLTAR = 450;

/**
 * Espera quando há o que desfazer (D-028): 15 s é tempo de ler o que aconteceu, pensar e voltar
 * atrás — bem mais que a pausa de quem só está vendo um item sair.
 */
export const MS_DESFAZER = 15_000;

/** Volta do desfazer: rápido o bastante para parecer resposta, lento o bastante para não piscar. */
const MS_VOLTA = 220;

/**
 * Item de lista que, ao ser concluído, fica verde por um instante antes de sair (D-024).
 *
 * O problema que resolve: a pendência simplesmente desaparecia quando o exame relacionado era
 * registrado, e quem estava olhando a lista não via o que aconteceu. Agora o item se pinta de
 * verde com um tique, segura, e só então encolhe.
 *
 * Com `aoDesfazer`, a pausa passa a 15 s e o item ganha um "Desfazer" com uma linha de tempo
 * escoando na base — o padrão de quem acabou de tomar uma decisão e pode ter se enganado (D-028).
 *
 * Com Reduce Motion ligado o item apenas some — o sistema pede que nada se mova sozinho. Havendo
 * `aoDesfazer`, a espera é respeitada mesmo assim: sem ela não haveria como voltar atrás.
 */
export function SaidaConcluida({ concluido, aoSair, aoDesfazer, discreto = false, atraso = 0, children }: {
  concluido: boolean;
  aoSair?: () => void;
  /** Presente → mostra "Desfazer" e segura por `MS_DESFAZER` em vez da pausa curta. */
  aoDesfazer?: () => void;
  /** Só o item muda de cor (a bolinha fica verde); sem fundo verde nem tique ao lado (D-046). */
  discreto?: boolean;
  /** Espera antes de começar, em ms — ex.: a transição de volta para a tela terminar (D-046). */
  atraso?: number;
  children: React.ReactNode;
}) {
  const verde = useRef(new Animated.Value(0)).current;
  const sumindo = useRef(new Animated.Value(1)).current;
  const tempo = useRef(new Animated.Value(1)).current;
  /** 0→1: o cartão de desfazer abrindo; volta a 0 ao desfazer, para ele recolher em vez de piscar. */
  const cartao = useRef(new Animated.Value(0)).current;
  // A altura é lida no próprio handler, nunca dentro da função passada ao setState: o React só roda
  // essa função na renderização seguinte, quando o React Native já esvaziou o evento
  // (`nativeEvent` nulo). Era o crash do "Não uso medicamentos" no build 2 (D-039).
  const [altura, setAltura] = useState<number | null>(null);
  const [alturaCartao, setAlturaCartao] = useState<number | null>(null);
  const emCurso = useRef<Animated.CompositeAnimation | null>(null);
  const aoSairRef = useRef(aoSair);
  aoSairRef.current = aoSair;
  const espera = aoDesfazer ? MS_DESFAZER : MS_PAUSA;

  useEffect(() => {
    if (!concluido) return;
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduzir) => {
      if (!vivo) return;
      if (reduzir && !aoDesfazer) { aoSairRef.current?.(); return; }
      const seq = Animated.sequence([
        Animated.delay(reduzir ? 0 : atraso),
        Animated.parallel([
          Animated.timing(verde, { toValue: 1, duration: reduzir ? 0 : MS_VERDE, easing: Easing.out(Easing.quad), useNativeDriver: false }),
          Animated.timing(cartao, { toValue: 1, duration: reduzir ? 0 : MS_VERDE, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        ]),
        Animated.timing(tempo, { toValue: 0, duration: espera, easing: Easing.linear, useNativeDriver: false }),
        Animated.timing(sumindo, { toValue: 0, duration: reduzir ? 0 : MS_SUMIR, easing: Easing.in(Easing.quad), useNativeDriver: false }),
      ]);
      emCurso.current = seq;
      seq.start(({ finished }) => { if (finished && vivo) aoSairRef.current?.(); });
    });
    return () => { vivo = false; emCurso.current?.stop(); };
  }, [concluido, verde, sumindo, tempo, cartao, espera, aoDesfazer, atraso]);

  /** Desfazer devolve o item ao estado normal com a mesma calma com que ele entrou (D-028). */
  const desfazer = () => {
    emCurso.current?.stop();
    Animated.parallel([
      Animated.timing(cartao, { toValue: 0, duration: MS_VOLTA, easing: Easing.in(Easing.cubic), useNativeDriver: false }),
      Animated.timing(verde, { toValue: 0, duration: MS_VOLTA, easing: Easing.in(Easing.quad), useNativeDriver: false }),
    ]).start(() => aoDesfazer?.());
  };

  return (
    <Animated.View
      onLayout={(e) => { const h = e.nativeEvent.layout.height; setAltura((a) => a ?? h); }}
      style={[
        styles.caixa,
        {
          // Com o cartão de desfazer o verde vive nele e na bolinha do item; pintar o card inteiro
          // por cima disso seria verde demais para uma ação que ainda pode ser cancelada.
          backgroundColor: aoDesfazer || discreto ? 'transparent' : verde.interpolate({ inputRange: [0, 1], outputRange: ['rgba(220,252,231,0)', Alerta.verde.bg] }),
          opacity: sumindo,
          ...(altura != null ? { height: sumindo.interpolate({ inputRange: [0, 1], outputRange: [0, altura] }) } : null),
        },
      ]}
    >
      {children}
      {aoDesfazer ? (
        // Cartão irmão do item: mesma largura, mesma borda, mesmo raio — só o verde o distingue.
        // Ele abre e recolhe em altura, para desfazer não ser um corte seco.
        <Animated.View
          onLayout={(e) => { const h = e.nativeEvent.layout.height; setAlturaCartao((a) => a ?? h); }}
          style={[
            styles.cartao,
            {
              opacity: cartao,
              ...(alturaCartao != null ? { height: cartao.interpolate({ inputRange: [0, 1], outputRange: [0, alturaCartao] }) } : null),
            },
          ]}
        >
          <Pressable onPress={desfazer} accessibilityRole="button" style={({ pressed }) => [styles.cartaoToque, pressed && { opacity: 0.6 }]}>
            <Ionicons name="arrow-undo-outline" size={16} color={Alerta.verde.fg} />
            <Text style={styles.desfazerLabel}>Desfazer</Text>
          </Pressable>
          <Animated.View
            pointerEvents="none"
            style={[styles.tempo, { width: tempo.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
          />
        </Animated.View>
      ) : discreto ? null : (
        <Animated.View pointerEvents="none" style={[styles.tique, { opacity: verde }]}>
          <Ionicons name="checkmark-circle" size={22} color={Alerta.verde.fg} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

/**
 * Segura na lista, marcados como concluídos, os itens que sumiram da fonte — é o que dá tempo de
 * a saída acontecer. Cada um fica **no lugar em que estava** (D-046); antes ia para o fim da lista.
 *
 * `ativo` em falso (carregando, erro, tela fora de vista) **congela** a lista: nada muda escondido.
 * Uma lista que fica vazia porque ainda não carregou não é uma lista de pendências resolvidas, e a
 * pendência resolvida em outra tela precisa sair na frente da pessoa, quando ela volta. A diferença
 * é calculada já na renderização, para o item resolvido aparecer concluído no primeiro quadro, sem
 * sumir e reaparecer.
 *
 * `ignorar`: itens que somem da fonte sem terem sido "concluídos" (ex.: o "Nada pendente").
 */
export function useSaidaConcluida<T>(itens: T[], chaveDe: (i: T) => string, ativo = true, ignorar?: (i: T) => boolean) {
  const [saindo, setSaindo] = useState<{ item: T; indice: number }[]>([]);
  const anteriores = useRef<T[]>(itens);
  const congelada = useRef<{ item: T; concluido: boolean }[] | null>(null);
  const chaveRef = useRef(chaveDe);
  chaveRef.current = chaveDe;

  const diferenca = (antes: T[], agora: T[]) => {
    const chave = chaveRef.current;
    const presentes = new Set(agora.map(chave));
    return antes.map((item, indice) => ({ item, indice })).filter((x) => !presentes.has(chave(x.item)) && !ignorar?.(x.item));
  };

  useEffect(() => {
    if (!ativo) return;
    const chave = chaveRef.current;
    const sumiram = diferenca(anteriores.current, itens);
    anteriores.current = itens;
    if (sumiram.length) setSaindo((s) => [...s, ...sumiram.filter((x) => !s.some((y) => chave(y.item) === chave(x.item)))]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itens, ativo]);

  let lista: { item: T; concluido: boolean }[];
  if (!ativo && congelada.current) {
    lista = congelada.current;
  } else {
    const chave = chaveRef.current;
    // O que o efeito ainda vai gravar entra já nesta renderização.
    const pendentes = ativo ? diferenca(anteriores.current, itens) : [];
    const todos = [...saindo, ...pendentes.filter((x) => !saindo.some((y) => chave(y.item) === chave(x.item)))]
      .filter((x) => !itens.some((i) => chave(i) === chave(x.item))) // voltou para a fonte: não está saindo
      .sort((a, b) => a.indice - b.indice);
    lista = itens.map((item) => ({ item, concluido: false }));
    for (const x of todos) lista.splice(Math.min(x.indice, lista.length), 0, { item: x.item, concluido: true });
    if (ativo) congelada.current = lista;
  }

  return {
    /** Os itens da fonte, com os que estão saindo no lugar em que estavam. */
    lista,
    /** Chamar quando a animação de saída terminar, para tirar o item de vez. */
    aoSair: (item: T) => setSaindo((s) => s.filter((x) => chaveRef.current(x.item) !== chaveRef.current(item))),
  };
}

const styles = StyleSheet.create({
  caixa: { borderRadius: Radius.linha, overflow: 'hidden' },
  tique: { position: 'absolute', right: Spacing.lg, top: 0, bottom: 0, justifyContent: 'center', backgroundColor: 'transparent' },
  /**
   * Cartão do desfazer: o mesmo desenho do item da lista — borda de 1 px, raio `linha` e a mesma
   * largura —, só que verde. Antes era uma faixa sem borda e destoava do card de cima.
   */
  cartao: {
    backgroundColor: Alerta.verde.bg, borderRadius: Radius.linha,
    borderWidth: 1, borderColor: Alerta.verde.fg, overflow: 'hidden', marginTop: Spacing.xs,
  },
  cartaoToque: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md },
  desfazerLabel: { ...Typography.subheading, color: Alerta.verde.fg },
  /** Fio de 2 px na base do cartão: quanto resta, sem contagem regressiva escrita. */
  tempo: { position: 'absolute', left: 0, bottom: 0, height: 2, backgroundColor: Alerta.verde.fg, opacity: 0.5 },
});
