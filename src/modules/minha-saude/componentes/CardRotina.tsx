import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ItemRotina } from '@core/lembretes/rotina';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';
import { ICONE } from './LinhaLembrete';

/** Card de rotina da Agenda: "Todo dia" (remédio, glicemia, MRPA, água) e "Toda semana" (check-in, D-060), com os horários. */
export function CardRotina({ itens, onAbrir }: { itens: ItemRotina[]; onAbrir: (item: ItemRotina) => void }) {
  return (
    <View style={styles.card}>
      {(['dia', 'semana'] as const).map((f, g) => {
        const grupo = itens.filter((i) => i.frequencia === f);
        if (!grupo.length) return null;
        return (
          <View key={f} style={g > 0 && itens.some((i) => i.frequencia === 'dia') ? styles.grupoSeguinte : null}>
            <Text style={styles.titulo}>{f === 'dia' ? 'Todo dia' : 'Toda semana'}</Text>
            {grupo.map((item, i) => (
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
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg, marginTop: Spacing.xxl },
  titulo: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.xs },
  grupoSeguinte: { marginTop: Spacing.md },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  divisor: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  icone: { width: 40, height: 40, borderRadius: Radius.linha, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  nome: { ...Typography.subheading, color: Colors.textPrimary },
  horarios: { ...Typography.caption, color: Colors.textSecondary },
  aviso: { ...Typography.caption, color: Colors.textMuted },
});
