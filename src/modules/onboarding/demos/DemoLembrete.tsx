import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LogoNero } from '@ui/components/LogoNero';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';
import { fase, useSequencia } from './useSequencia';

/** Tela 6: um iPhone estilizado às 08:00 e a notificação do remédio descendo, com o texto real (D-044). */
export function DemoLembrete({ onTerminou }: { onTerminou?: () => void }) {
  const { progresso, repetir } = useSequencia(2600, onTerminou);
  const aviso = fase(progresso, 0.2, 0.7);
  return (
    <Pressable onPress={repetir} style={styles.area} accessibilityRole="image" accessibilityLabel="Exemplo: às 8 horas, a notificação Hora de tomar seu remédio, Losartana 50 miligramas">
      <View style={styles.aparelho}>
        <View style={styles.ilha} />
        <Text style={styles.hora}>08:00</Text>
        <Text style={styles.data}>segunda-feira</Text>
        <Animated.View style={[styles.notificacao, { opacity: aviso, transform: [{ translateY: aviso.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }] }]}>
          <View style={styles.icone}><LogoNero variante="simbolo" width={20} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>Hora de tomar seu remédio 💊</Text>
            <Text style={styles.corpo}>Losartana 50 mg</Text>
          </View>
          <Text style={styles.agora}>agora</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  area: { alignItems: 'center' },
  aparelho: { width: 250, height: 230, borderRadius: 36, backgroundColor: Colors.hero, paddingHorizontal: Spacing.md, alignItems: 'center', overflow: 'hidden' },
  ilha: { width: 70, height: 20, borderRadius: 10, backgroundColor: '#000', marginTop: Spacing.sm },
  hora: { fontFamily: 'Poppins-Bold', fontSize: 48, lineHeight: 56, color: Colors.white, marginTop: Spacing.sm },
  data: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },
  notificacao: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: Radius.linha + 4, padding: Spacing.sm, marginTop: Spacing.md },
  icone: { width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  titulo: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#111' },
  corpo: { ...Typography.caption, fontSize: 13, color: '#333' },
  agora: { ...Typography.caption, fontSize: 11, color: '#666', alignSelf: 'flex-start' },
});
