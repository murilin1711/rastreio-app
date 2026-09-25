import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ItemRotina } from '@core/lembretes/rotina';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';
import { ICONE } from './LinhaLembrete';

/** Card "Todo dia" da Agenda: uma linha por rotina (remédio, glicemia, MRPA, água), com os horários. */
export function CardRotina({ itens, onAbrir }: { itens: ItemRotina[]; onAbrir: (item: ItemRotina) => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Todo dia</Text>
      {itens.map((item, i) => (
        <TouchableOpacity key={item.chave} activeOpacity={0.7} onPress={() => onAbrir(item)} style={[styles.linha, i > 0 && styles.divisor]} accessibilityRole="button">
          <View style={styles.icone}><Ionicons name={ICONE[item.tipo]} size={20} color={Colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.horarios}>{item.horarios}{item.ate ? ` · até ${item.ate}` : ''}</Text>
            {item.silenciado ? <Text style={styles.aviso}>Sem aviso no celular</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg, marginTop: Spacing.xxl },
  titulo: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.xs },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  divisor: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  icone: { width: 40, height: 40, borderRadius: Radius.linha, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  nome: { ...Typography.subheading, color: Colors.textPrimary },
  horarios: { ...Typography.caption, color: Colors.textSecondary },
  aviso: { ...Typography.caption, color: Colors.textMuted },
});
