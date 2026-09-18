import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

/** Escala 0–10 em botões (check-in §86–§87, fome §75). Sem cor de alerta. */
export function Escala010({ valor, onChange, rotulo, extremos }: { valor: number | null; onChange: (v: number) => void; rotulo?: string; extremos?: [string, string] }) {
  return (
    <View style={styles.bloco}>
      {rotulo ? <Text style={styles.rotulo}>{rotulo}</Text> : null}
      <View style={styles.escala}>
        {Array.from({ length: 11 }, (_, i) => (
          <Pressable key={i} onPress={() => onChange(i)} style={[styles.item, valor === i && styles.ativo]} accessibilityRole="button" accessibilityLabel={`${rotulo ?? ''} ${i}`}>
            <Text style={[styles.texto, valor === i && { color: Colors.white }]}>{i}</Text>
          </Pressable>
        ))}
      </View>
      {extremos ? <View style={styles.extremos}><Text style={styles.extremo}>{extremos[0]}</Text><Text style={styles.extremo}>{extremos[1]}</Text></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: Spacing.xs },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary },
  escala: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  item: { width: 36, height: 36, borderRadius: Radius.linha, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  ativo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  texto: { ...Typography.caption, color: Colors.textPrimary },
  extremos: { flexDirection: 'row', justifyContent: 'space-between' },
  extremo: { ...Typography.caption, fontSize: 11, color: Colors.textMuted },
});
