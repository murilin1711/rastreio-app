import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { LembreteCentral } from '@core/lembretes/central';
import type { TipoLembrete } from '@core/lembretes/origem';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

const ICONE: Record<TipoLembrete, keyof typeof Ionicons.glyphMap> = { exame: 'shield-checkmark-outline', mrpa: 'pulse-outline', glicemia: 'water-outline', medicacao: 'medkit-outline', consulta: 'calendar-outline', atualizacao: 'refresh-outline' };
const hora = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

/** Linha da central de lembretes: origem, hora, texto e atalho para a tela de origem. */
export function LinhaLembrete({ lembrete, onPress }: { lembrete: LembreteCentral; onPress?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.linha} accessibilityRole="button">
      <View style={styles.icone}><Ionicons name={ICONE[lembrete.tipo]} size={20} color={Colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.meta}>{hora(lembrete.quando)} · {lembrete.rotulo}{lembrete.silenciado ? ' · sem aviso no celular' : ''}</Text>
        <Text style={styles.texto}>{lembrete.texto}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.md },
  icone: { width: 40, height: 40, borderRadius: Radius.linha, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  meta: { ...Typography.caption, color: Colors.textSecondary },
  texto: { ...Typography.body, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
});
