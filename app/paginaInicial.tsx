import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, BackHandler, Animated, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius } from '@/constants/Theme';

const BG = '#0a1f4e';

export default function PaginaInicial() {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <SafeAreaView style={styles.safe}>
        {/* Ícone + branding */}
        <View style={styles.center}>
          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            <View style={styles.iconCircle}>
              <Ionicons name="search-outline" size={56} color="#fff" />
            </View>
          </Animated.View>
          <Text style={styles.appName}>Rastreando</Text>
          <Text style={styles.tagline}>Rastreamento oncológico{'\n'}para você e seus pacientes</Text>
        </View>

        {/* Card translúcido com botões */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/Login/TelaLogin')} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnOutline} onPress={() => router.push('/Cadastro/TelaCadastro')} activeOpacity={0.85}>
            <Text style={styles.btnOutlineText}>Criar conta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost} onPress={() => router.push('/Login/TelaLogin')} activeOpacity={0.7}>
            <Text style={styles.btnGhostText}>Sou profissional de saúde →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  safe:      { flex: 1 },

  blob1: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(46,93,191,0.18)', top: -70, right: -70 },
  blob2: { position: 'absolute', width: 180, height: 180, borderRadius: 90,  backgroundColor: 'rgba(46,93,191,0.12)', bottom: 200, left: -70 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },

  iconCircle: {
    width: 116, height: 116, borderRadius: 58,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },

  appName: { ...Typography.display, color: '#fff', fontSize: 34 },
  tagline: { ...Typography.body, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },

  btnPrimary:     { backgroundColor: '#fff', borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center' },
  btnPrimaryText: { ...Typography.subheading, color: BG, fontSize: 15 },

  btnOutline:     { borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  btnOutlineText: { ...Typography.subheading, color: 'rgba(255,255,255,0.8)', fontSize: 15 },

  btnGhost:     { alignItems: 'center', paddingVertical: 6 },
  btnGhostText: { ...Typography.caption, color: 'rgba(255,255,255,0.38)', fontSize: 13 },
});
