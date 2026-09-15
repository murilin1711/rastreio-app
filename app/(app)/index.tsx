import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessao } from '@core/sessao/SessaoProvider';
import { Button, Colors, Typography } from '@ui/index';

// Provisório — Home definitiva na Task 11.
export default function Home() {
  const { sessao, sair } = useSessao();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center', gap: 16 }}>
      <Text style={{ ...Typography.title, color: Colors.primary }}>Home (provisória)</Text>
      <Text style={{ ...Typography.body, color: Colors.textSecondary }}>{sessao?.user.email}</Text>
      <Button label="Sair da conta" variant="outline" onPress={sair} />
    </SafeAreaView>
  );
}
