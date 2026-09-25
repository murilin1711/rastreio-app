import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '@ui/theme';

const EXPLICACAO = 'São os dias seguidos em que você anotou alguma coisa do seu dia: água, uma caminhada, o que comeu, uma medida de pressão. Serve para você acompanhar sua constância, então só vale o que aconteceu de verdade. Ficando um dia sem registrar o número volta a zero, e nada mais muda.';

/**
 * Selo de dias seguidos com registro (D-016, parte C). Só aparece com a sequência viva; quando ela
 * zera, o selo some em silêncio, sem aviso e sem "você perdeu", como decidido em 19/09.
 * Nunca diz o que foi registrado: conta dias, não eventos.
 *
 * Tocar abre a explicação do que o número significa (D-029): o foguinho é símbolo emprestado de app
 * de hábito, e quem nunca usou um não tem como adivinhar o que ele conta.
 *
 * **Por que modal e não balão** (D-029, corrigido em 24/09): a primeira versão era um balão
 * posicionado sob o selo. No React Native não existe `z-index` que resolva isso entre irmãos: o que
 * é desenhado depois fica por cima, e o balão vive dentro do bloco de boas-vindas, que vem antes de
 * Pendências e Módulos. O texto aparecia atrás dos cards. Modal desenha acima de tudo, sempre.
 */
export function SeloSequencia({ dias }: { dias: number }) {
  const [aberto, setAberto] = useState(false);
  if (dias < 1) return null;

  return (
    <>
      <Pressable
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`${dias} ${dias === 1 ? 'dia' : 'dias'} seguidos. Toque para saber o que isso significa.`}
        hitSlop={8}
        style={({ pressed }) => [styles.selo, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="flame" size={16} color={Colors.primary} />
        <Text style={styles.numero}>{dias}</Text>
        <Text style={styles.rotulo}>{dias === 1 ? 'dia' : 'dias'}</Text>
        <Ionicons name="information-circle-outline" size={13} color={Colors.textMuted} style={{ marginLeft: 1 }} />
      </Pressable>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        {/* Tocar fora fecha: é uma explicação, não uma decisão a tomar. */}
        <Pressable style={styles.fundo} onPress={() => setAberto(false)}>
          <Pressable style={styles.caixa} onPress={() => {}}>
            <View style={styles.chama}>
              <Ionicons name="flame" size={26} color={Colors.primary} />
            </View>
            <Text style={styles.titulo}>{dias} {dias === 1 ? 'dia seguido' : 'dias seguidos'}</Text>
            <Text style={styles.texto}>{EXPLICACAO}</Text>
            <Pressable onPress={() => setAberto(false)} accessibilityRole="button" style={({ pressed }) => [styles.fechar, pressed && { opacity: 0.6 }]}>
              <Text style={styles.fecharLabel}>Entendi</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'flex-start', paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  numero: { ...Typography.subheading, color: Colors.primary },
  rotulo: { ...Typography.caption, color: Colors.textSecondary },
  fundo: { flex: 1, backgroundColor: 'rgba(15, 45, 99, 0.45)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  caixa: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.xxl, alignItems: 'center', maxWidth: 420, width: '100%', ...Shadows.card },
  chama: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  titulo: { ...Typography.heading, color: Colors.textPrimary, textAlign: 'center' },
  texto: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  fechar: { marginTop: Spacing.xl, alignSelf: 'stretch', alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.linha, backgroundColor: Colors.surfaceAlt },
  fecharLabel: { ...Typography.subheading, color: Colors.primary },
});
