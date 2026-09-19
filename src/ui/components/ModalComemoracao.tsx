import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '@ui/components/Button';
import { NeroAnimado } from '@ui/components/NeroAnimado';
import { Colors, Radius, Shadows, Spacing, Typography } from '@ui/theme';

interface Props {
  /** Nulo esconde o modal. */
  conteudo: { titulo: string; incentivo: string } | null;
  aoFechar: () => void;
}

/**
 * Comemoração de conquista ou marco de meta (D-016): o Nero comemora no meio da tela, com o que
 * aconteceu e um incentivo para continuar registrando. Só é usada em conquistas de comportamento —
 * nunca em resultado de exame, pendência de rastreamento ou classificação de pressão.
 */
export function ModalComemoracao({ conteudo, aoFechar }: Props) {
  return (
    <Modal visible={conteudo != null} transparent animationType="fade" onRequestClose={aoFechar}>
      <View style={styles.fundo}>
        <View style={styles.caixa}>
          <NeroAnimado clipe="comemorar" size={140} />
          <Text style={styles.titulo}>{conteudo?.titulo}</Text>
          <Text style={styles.incentivo}>{conteudo?.incentivo}</Text>
          <Button label="Fechar" onPress={aoFechar} style={styles.botao} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(11, 30, 68, 0.55)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  caixa: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.xxl, alignItems: 'center', gap: Spacing.sm, maxWidth: 420, width: '100%', ...Shadows.card },
  titulo: { ...Typography.heading, color: Colors.textPrimary, textAlign: 'center' },
  incentivo: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  botao: { marginTop: Spacing.lg, alignSelf: 'stretch' },
});
