import { Redirect, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Programa } from '@core/regras/tipos';
import { PROGRAMAS } from '@core/rastreando/tipos';
import { Colors, InternalHeader, Spacing, Typography } from '@ui/index';

// Esboço — implementado nas Tasks 10–12 da Fase 1.
export default function Tela() {
  const { programa } = useLocalSearchParams<{ programa: string }>();
  if (!PROGRAMAS.includes(programa as Programa)) return <Redirect href="/(app)/rastreando" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <InternalHeader sectionLabel="Rastreando" title="registrar" />
      <Text style={{ ...Typography.body, color: Colors.textSecondary, paddingHorizontal: Spacing.xxl }}>Em construção.</Text>
    </SafeAreaView>
  );
}
