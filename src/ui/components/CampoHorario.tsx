import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@ui/components/Button';
import { Colors, Radius, Shadows, Spacing, Typography } from '@ui/theme';

interface Props {
  /** 'HH:MM', ou null para "sem horário ainda". */
  valor: string | null;
  onChange: (hora: string) => void;
  rotulo?: string;
  /** Texto quando `valor` é nulo. */
  vazio?: string;
  accessibilityLabel?: string;
}

const paraData = (hora: string | null) => {
  const d = new Date();
  const [h, m] = (hora ?? '08:00').split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};
const paraHora = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * Horário escolhido na roda do próprio celular, nunca digitado (D-045). Digitar dois-pontos no teclado
 * é das tarefas mais difíceis para o público 60+, e horário digitado admite formato inválido.
 *
 * No iPhone a roda (a mesma do Despertador) sobe numa folha com "Pronto", e só grava ao confirmar —
 * girar até o horário não dispara nada no meio do caminho. No Android abre o relógio do sistema.
 * Minutos de 5 em 5.
 */
export function CampoHorario({ valor, onChange, rotulo, vazio = 'Escolher horário', accessibilityLabel }: Props) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState(() => paraData(valor));

  const abrir = () => { setRascunho(paraData(valor)); setAberto(true); };
  const confirmar = () => { setAberto(false); onChange(paraHora(rascunho)); };

  const aoMudarAndroid = (e: DateTimePickerEvent, d?: Date) => {
    setAberto(false);
    if (e.type === 'set' && d) onChange(paraHora(d));
  };

  return (
    <View>
      {rotulo ? <Text style={styles.rotulo}>{rotulo}</Text> : null}
      <Pressable
        onPress={abrir}
        style={({ pressed }) => [styles.campo, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? rotulo ?? 'Horário'}
        accessibilityValue={{ text: valor ?? vazio }}
      >
        <Ionicons name="time-outline" size={20} color={Colors.primary} />
        <Text style={[styles.valor, !valor && styles.vazio]}>{valor ?? vazio}</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </Pressable>

      {Platform.OS === 'android' ? (
        aberto ? <DateTimePicker value={rascunho} mode="time" is24Hour minuteInterval={5} onChange={aoMudarAndroid} /> : null
      ) : (
        <Modal visible={aberto} transparent animationType="slide" onRequestClose={() => setAberto(false)}>
          <Pressable style={styles.fundo} onPress={() => setAberto(false)} accessibilityLabel="Fechar sem mudar" />
          <View style={styles.folha}>
            {rotulo ? <Text style={styles.folhaTitulo}>{rotulo}</Text> : null}
            <DateTimePicker
              value={rascunho}
              mode="time"
              display="spinner"
              locale="pt-BR"
              minuteInterval={5}
              onChange={(_e, d) => { if (d) setRascunho(d); }}
              textColor={Colors.textPrimary}
              style={styles.roda}
            />
            <Button label="Pronto" onPress={confirmar} />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginBottom: Spacing.sm },
  campo: {
    minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.linha,
  },
  valor: { ...Typography.body, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, flex: 1 },
  vazio: { fontFamily: 'Poppins-Regular', color: Colors.textMuted },
  fundo: { flex: 1, backgroundColor: 'rgba(11, 30, 68, 0.35)' },
  folha: {
    backgroundColor: Colors.surface, padding: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.md,
    borderTopLeftRadius: Radius.bloco, borderTopRightRadius: Radius.bloco, ...Shadows.card,
  },
  folhaTitulo: { ...Typography.heading, color: Colors.textPrimary, textAlign: 'center' },
  roda: { alignSelf: 'stretch' },
});
