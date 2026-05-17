import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, SafeAreaView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase-config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CrabLottie } from '@/components/ui/CrabLottie';
import { Colors, Typography, Spacing } from '@/constants/Theme';

export default function TelaLogin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      const user = userCredential.user;

      const userRef = doc(db, 'usuarios', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const tipoUsuario = userData.tipoUsuario;

        if (tipoUsuario === 'populacao') {
          router.push('/Home/TelaDeHomeUsuario');
        } else if (tipoUsuario === 'saude') {
          router.push('/Home/TelaDeHomeProfissional');
        } else {
          Alert.alert('Erro', 'Tipo de usuário desconhecido.');
        }
      } else {
        Alert.alert('Erro', 'Documento do usuário não encontrado.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao realizar login. Verifique suas credenciais e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Mini hero */}
      <View style={{ backgroundColor: Colors.primary, alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.xxl + 8, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <CrabLottie size={44} opacity={0.75} style={{ marginBottom: Spacing.sm }} />
        <Text style={{ ...Typography.heading, color: Colors.white }}>Bem-vindo de volta</Text>
      </View>

      {/* Formulário */}
      <View style={{ flex: 1, padding: Spacing.xl, gap: Spacing.md, justifyContent: 'center' }}>
        <Input
          icon={<Ionicons name="mail-outline" size={16} color={Colors.textMuted} />}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          icon={<Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />}
          placeholder="Senha"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />
        <Button label="Entrar" onPress={handleLogin} loading={loading} style={{ marginTop: Spacing.sm }} />
        <Text style={{ ...Typography.caption, color: Colors.textMuted, textAlign: 'center' }}>
          Não tem conta?{' '}
          <Text style={{ color: Colors.primary, fontFamily: 'Poppins-SemiBold' }} onPress={() => router.push('/Cadastro/TelaCadastro')}>
            Criar conta
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
