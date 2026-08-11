import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import LottieView from 'lottie-react-native';
import { auth, db } from '../../config/firebase-config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Typography, Spacing, Radius } from '@/constants/Theme';

const BG = '#0a1f4e';

export default function TelaLogin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const crabX        = useRef(new Animated.Value(0)).current;
  const crabBob      = useRef(new Animated.Value(0)).current;
  const lottieRef    = useRef<LottieView>(null);
  const blurTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MAX_OFFSET  = 90;
  const MAX_CHARS   = 30;
  const PX_PER_CHAR = (MAX_OFFSET * 2) / MAX_CHARS;

  const onFieldFocus = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    // Para a dança e posiciona à esquerda
    lottieRef.current?.pause();
    Animated.spring(crabX, { toValue: -MAX_OFFSET, useNativeDriver: true, speed: 14, bounciness: 8 }).start();
  };

  const onFieldBlur = () => {
    blurTimeout.current = setTimeout(() => {
      // Retoma a dança e volta ao centro
      lottieRef.current?.play();
      Animated.spring(crabX,   { toValue: 0, useNativeDriver: true, speed: 8, bounciness: 10 }).start();
      Animated.spring(crabBob, { toValue: 0, useNativeDriver: true, speed: 8, bounciness: 10 }).start();
    }, 80);
  };

  const moveCrab = (text: string) => {
    const target = -MAX_OFFSET + Math.min(text.length, MAX_CHARS) * PX_PER_CHAR;
    Animated.spring(crabX, { toValue: target, useNativeDriver: true, speed: 28, bounciness: 6 }).start();
    // Pequeno pulo por letra
    Animated.sequence([
      Animated.timing(crabBob, { toValue: -7, duration: 50, useNativeDriver: true }),
      Animated.spring(crabBob, { toValue: 0, useNativeDriver: true, speed: 40, bounciness: 14 }),
    ]).start();
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/paginaInicial');
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const userRef = doc(db, 'usuarios', userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const tipo = userDoc.data().tipoUsuario;
        if (tipo === 'populacao') router.push('/Home/TelaDeHomeUsuario');
        else if (tipo === 'saude') router.push('/Home/TelaDeHomeProfissional');
        else Alert.alert('Erro', 'Tipo de usuário desconhecido.');
      } else {
        Alert.alert('Erro', 'Documento do usuário não encontrado.');
      }
    } catch {
      Alert.alert('Erro', 'Falha ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} bounces={false} keyboardShouldPersistTaps="handled">

        {/* Topo azul com onda */}
        <View style={styles.hero}>
          <Animated.View style={{ transform: [{ translateX: crabX }, { translateY: crabBob }] }}>
            <LottieView
              ref={lottieRef}
              source={require('../../assets/lottie/dancing-crab.json')}
              autoPlay
              loop
              style={styles.crab}
            />
          </Animated.View>
          <Text style={styles.appName}>Rastreando</Text>
          <Text style={styles.subtitle}>Bem-vindo de volta</Text>

          {/* Onda SVG na base */}
          <View style={styles.wave}>
            <Svg width="100%" height={48} viewBox="0 0 375 48" preserveAspectRatio="none">
              <Path
                d="M0 48 Q94 16 188 32 Q282 48 375 18 L375 48 Z"
                fill={Colors.background}
              />
            </Svg>
          </View>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          <Input
            icon={<Ionicons name="mail-outline" size={16} color={Colors.textMuted} />}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onFocus={onFieldFocus}
            onBlur={onFieldBlur}
            onChangeText={(t) => { setEmail(t); moveCrab(t); }}
          />
          <Input
            icon={<Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />}
            placeholder="Senha"
            secureTextEntry
            value={senha}
            onFocus={onFieldFocus}
            onBlur={onFieldBlur}
            onChangeText={(t) => { setSenha(t); moveCrab(t); }}
          />
          <Button label="Entrar" onPress={handleLogin} loading={loading} style={{ marginTop: Spacing.sm }} />
          <Text style={styles.link}>
            Não tem conta?{' '}
            <Text style={styles.linkBold} onPress={() => router.push('/Cadastro/TelaCadastro')}>
              Criar conta
            </Text>
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: BG,
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 0,
    position: 'relative',
  },
  crab: {
    width: 180,
    height: 180,
  },
  appName: {
    ...Typography.display,
    color: '#fff',
    fontSize: 28,
    marginTop: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: Spacing.xl,
  },
  wave: {
    width: '100%',
    marginBottom: -1,
  },
  form: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  link: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  linkBold: {
    color: Colors.primary,
    fontFamily: 'Poppins-SemiBold',
  },
});
