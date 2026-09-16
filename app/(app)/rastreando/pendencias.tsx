import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, InternalHeader, Spacing, Typography } from '@ui/index';

// Esboço — implementado na Task 12 da Fase 1.
export default function Tela() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <InternalHeader sectionLabel="Rastreando" title="pendencias" />
      <Text style={{ ...Typography.body, color: Colors.textSecondary, paddingHorizontal: Spacing.xxl }}>Em construção.</Text>
    </SafeAreaView>
  );
}
