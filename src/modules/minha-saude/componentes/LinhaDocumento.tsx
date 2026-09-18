import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ehImagem, formatarTamanho } from '@core/documentos/mapeamento';
import { ROTULO_TIPO_DOCUMENTO, type Documento } from '@core/documentos/tipos';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

function dataBr(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** Linha de documento: ícone por tipo de arquivo, nome, data e o que está vinculado. */
export function LinhaDocumento({ documento, vinculo, onPress }: { documento: Documento; vinculo?: string; onPress?: () => void }) {
  const icone: keyof typeof Ionicons.glyphMap = ehImagem(documento.mime) ? 'image-outline' : 'document-text-outline';
  const meta = [documento.dataDocumento ? dataBr(documento.dataDocumento) : dataBr(documento.criadoEm), ROTULO_TIPO_DOCUMENTO[documento.tipo], formatarTamanho(documento.tamanho)].join(' · ');
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.linha} accessibilityRole="button">
      <View style={styles.icone}><Ionicons name={icone} size={22} color={Colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.nome} numberOfLines={1}>{documento.nome}</Text>
        <Text style={styles.meta}>{meta}</Text>
        {vinculo ? <Text style={styles.vinculo}>Vinculado a: {vinculo}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.lg, gap: Spacing.md },
  icone: { width: 44, height: 44, backgroundColor: Colors.background, borderRadius: Radius.linha, alignItems: 'center', justifyContent: 'center' },
  nome: { ...Typography.subheading, color: Colors.textPrimary },
  meta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  vinculo: { ...Typography.caption, color: Colors.accent, marginTop: 2 },
});
