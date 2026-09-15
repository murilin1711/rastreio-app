import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, NeroImage, Spacing, Typography } from '@ui/index';

/** Tela-ponte até a Fase 1 religar as telas do Rastreando ao novo banco. */
export default function Rastreando() {
  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <View style={styles.centro}>
        <NeroImage variant="rastreando" size={200} />
        <Text style={styles.titulo}>Rastreando</Text>
        <Text style={styles.texto}>
          O rastreamento oncológico está sendo integrado ao NERO. Em breve, seus rastreamentos de mama, colo do útero, intestino, pulmão e próstata aparecem aqui, organizados pelo seu perfil.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl, gap: Spacing.md },
  titulo: { ...Typography.display, color: Colors.primary },
  texto: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', maxWidth: 320 },
});
