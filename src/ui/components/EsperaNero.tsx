import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { NeroAnimado } from '@ui/components/NeroAnimado';
import { Colors, Radius, Shadows, Spacing, Typography } from '@ui/theme';

/**
 * Piso da espera (D-023): mesmo quando a operação termina antes, o Nero fica no ar por este tempo.
 * Sem isso, um PDF que fica pronto em menos de um segundo faz a animação piscar e a folha de
 * compartilhamento abrir por cima dela.
 */
export const PISO_ESPERA_MS = 2000;

/** Completa o piso a partir do instante em que a espera apareceu. */
export function completarPiso(desde: number, ms = PISO_ESPERA_MS): Promise<void> {
  const resta = ms - (Date.now() - desde);
  return resta > 0 ? new Promise((r) => setTimeout(r, resta)) : Promise.resolve();
}

/**
 * Quanto se espera, no máximo, pelo aviso de que a espera saiu da tela. O aviso vem do `onDismiss` do
 * `Modal`, que **só existe no iOS**; no Android é este limite que destrava. Também protege o caso de
 * o evento se perder: melhor abrir a folha um pouco depois do que nunca.
 */
export const LIMITE_FECHAMENTO_MS = 900;

/**
 * Espera a espera realmente sair da tela antes de apresentar uma folha nativa (compartilhar, por
 * exemplo).
 *
 * Por que não um `setTimeout` fixo: no iOS a folha de compartilhamento é um view controller, e
 * apresentá-la enquanto o modal anterior ainda faz o dismiss faz o sistema **descartá-la em
 * silêncio** — sem folha e sem erro. Um atraso fixo não resolve porque o contador começa antes de o
 * dismiss sequer iniciar: esconder o modal só agenda um re-render. A condição certa é o evento.
 *
 * Uso: `const fechamento = useFechamentoDaEspera()` → passar `fechamento.onFechada` ao `EsperaNero` e
 * dar `await fechamento.aguardar()` entre esconder a espera e abrir a folha.
 */
export function useFechamentoDaEspera() {
  const resolver = React.useRef<(() => void) | null>(null);
  return React.useMemo(() => ({
    onFechada: () => { resolver.current?.(); },
    aguardar: () => new Promise<void>((r) => {
      const limite = setTimeout(() => { resolver.current = null; r(); }, LIMITE_FECHAMENTO_MS);
      resolver.current = () => { clearTimeout(limite); resolver.current = null; r(); };
    }),
  }), []);
}

interface Props {
  visivel: boolean;
  /** Primeira linha: o que está acontecendo, no gerúndio. */
  titulo: string;
  /** Segunda linha: quanto tempo esperar ou o que vem depois. */
  detalhe?: string;
  /** Sem esta prop o modal não oferece saída — use só onde interromper deixaria dado pela metade. */
  onCancelar?: () => void;
  /** Avisa que o modal saiu da tela de fato (iOS). Ver `useFechamentoDaEspera`. */
  onFechada?: () => void;
}

/**
 * Espera das operações longas (D-023): o Nero pensa no meio da tela enquanto o app trabalha.
 * Substitui o spinner dentro do botão nos três pontos em que a espera passa de um segundo —
 * gerar PDF, calcular risco e enviar documento. O mascote só lê bem grande (em ≤44 px vira
 * mancha azul), por isso é modal e não indicador em linha. Números calibrados pelo Murilo:
 * mascote 152, véu 45 %.
 */
export function EsperaNero({ visivel, titulo, detalhe, onCancelar, onFechada }: Props) {
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={() => onCancelar?.()} onDismiss={onFechada}>
      <View style={styles.fundo} accessibilityViewIsModal>
        <View style={styles.caixa} accessibilityLiveRegion="polite">
          <NeroAnimado clipe="pensando" size={152} />
          <Text style={styles.titulo}>{titulo}</Text>
          {detalhe ? <Text style={styles.detalhe}>{detalhe}</Text> : null}
          {onCancelar ? (
            <Pressable onPress={onCancelar} accessibilityRole="button" hitSlop={8} style={styles.cancelar}>
              <Text style={styles.cancelarLabel}>Cancelar</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(15, 45, 99, 0.45)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  caixa: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xxl, alignItems: 'center', gap: Spacing.xs, maxWidth: 420, width: '100%', ...Shadows.card },
  titulo: { ...Typography.subheading, color: Colors.textPrimary, textAlign: 'center', marginTop: Spacing.md },
  detalhe: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  cancelar: { marginTop: Spacing.lg, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  cancelarLabel: { ...Typography.subheading, color: Colors.textSecondary },
});
