import { Animated, StyleSheet, Text, View } from 'react-native';
import { LogoNero } from '@ui/components/LogoNero';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';
import { useEntrada } from './useEntrada';

/** As quatro notificações da tela 6, com os textos reais do app (`docs/nero/notificacoes.md`). */
const AVISOS: Record<string, { titulo: string; corpo: string }> = {
  remedio: { titulo: 'Hora de tomar seu remédio 💊', corpo: 'Losartana 50 mg' },
  consulta: { titulo: 'Sua consulta é amanhã 📅', corpo: 'Cardiologia às 14:30. Toque para preparar o relatório.' },
  exame: { titulo: 'Seu exame está chegando 🔎', corpo: 'Mamografia · daqui a 30 dias' },
  agua: { titulo: 'Hora de beber água 💧', corpo: 'Sua meta de hoje: 2 L.' },
};

/**
 * Tela 6 (ajustes do Murilo, 26/09): um iPhone maior, na tela bloqueada, e cada notificação aparecendo
 * quando o Nero fala dela. A nova entra **embaixo** da anterior, devagar, sem mexer nas que já estão: pôr
 * a mais nova em cima empurrava as outras e parecia que piscavam e trocavam de lugar.
 */
export function DemoLembrete({ visiveis }: { visiveis: string[] }) {
  const ordem = visiveis;
  return (
    <View style={styles.aparelho} accessibilityRole="image" accessibilityLabel="Exemplo: notificações do Nero na tela bloqueada, de remédio, consulta, exame e água">
      <View style={styles.ilha} />
      <Text style={styles.hora}>08:00</Text>
      <Text style={styles.data}>segunda-feira</Text>
      <View style={styles.lista}>
        {ordem.map((id) => <Aviso key={id} id={id} />)}
      </View>
    </View>
  );
}

function Aviso({ id }: { id: string }) {
  const v = useEntrada(true, 600);
  const a = AVISOS[id];
  if (!a) return null;
  return (
    <Animated.View style={[styles.notificacao, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
      <View style={styles.icone}><LogoNero variante="simbolo" width={18} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.titulo} numberOfLines={2}>{a.titulo}</Text>
        <Text style={styles.corpo} numberOfLines={2}>{a.corpo}</Text>
      </View>
      <Text style={styles.agora}>agora</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  aparelho: { alignSelf: 'center', width: 300, minHeight: 330, borderRadius: 40, backgroundColor: Colors.hero, paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg, alignItems: 'center' },
  ilha: { width: 76, height: 22, borderRadius: 11, backgroundColor: '#000', marginTop: Spacing.sm },
  hora: { fontFamily: 'Poppins-Bold', fontSize: 42, lineHeight: 50, color: Colors.white, marginTop: Spacing.xs },
  data: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },
  lista: { alignSelf: 'stretch', gap: Spacing.xs, marginTop: Spacing.md },
  notificacao: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.93)', borderRadius: Radius.linha + 4, paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.sm },
  icone: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  titulo: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', fontSize: 12.5, lineHeight: 16, color: '#111' },
  corpo: { ...Typography.caption, fontSize: 12, lineHeight: 15, color: '#333' },
  agora: { ...Typography.caption, fontSize: 10.5, color: '#666', alignSelf: 'flex-start' },
});
