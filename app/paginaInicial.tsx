import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { CrabLottie } from '@/components/ui/CrabLottie';
import { Colors, Typography, Spacing } from '@/constants/Theme';

export default function PaginaInicial() {
  const router = useRouter();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Hero azul */}
      <View style={styles.hero}>
        <CrabLottie size={80} opacity={0.85} style={styles.crab} />
        <Text style={styles.appName}>Rastreando</Text>
        <Text style={styles.tagline}>Rastreamento oncológico{'\n'}para você e seus pacientes</Text>
      </View>

      {/* Botões */}
      <View style={styles.actions}>
        <Button label="Entrar" onPress={() => router.push('/Login/TelaLogin')} style={styles.btn} />
        <Button label="Criar conta" variant="outline" onPress={() => router.push('/Cadastro/TelaCadastro')} style={styles.btn} />
        <Button label="Sou profissional de saúde →" variant="ghost" onPress={() => router.push('/Login/TelaLogin')} style={styles.btn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  hero:    { backgroundColor: Colors.primary, alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl + 16, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  crab:    { marginBottom: Spacing.lg },
  appName: { ...Typography.display, color: Colors.white, marginBottom: Spacing.sm },
  tagline: { ...Typography.body, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  actions: { flex: 1, padding: Spacing.xl, gap: Spacing.md, justifyContent: 'center' },
  btn:     { width: '100%' },
});
