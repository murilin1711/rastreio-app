import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessao } from '@core/sessao/SessaoProvider';
import { supabase } from '@core/supabase/client';
import { Button, Colors, Typography } from '@ui/index';

// Provisório — substituído pelo fluxo em passos na Task 8.
export default function PerfilInicial() {
  const router = useRouter();
  const { sessao } = useSessao();
  const concluir = async () => {
    if (!sessao) return;
    await supabase.from('perfil_saude').update({ perfil_inicial_completo: true }).eq('user_id', sessao.user.id);
    router.replace('/');
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center', gap: 16 }}>
      <Text style={{ ...Typography.title, color: Colors.primary }}>Perfil inicial (provisório)</Text>
      <Button label="Concluir" onPress={concluir} />
    </SafeAreaView>
  );
}
