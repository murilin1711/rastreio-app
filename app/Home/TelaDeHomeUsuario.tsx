import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/firebase-config';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ListItem } from '@/components/ui/ListItem';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Colors, Spacing, Typography } from '@/constants/Theme';

export default function TelaDeHomeUsuario() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userSexo, setUserSexo] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  useEffect(() => {
    const fetchUserNameAndSexo = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserName(userData.nome);
          setUserSexo(userData.genero);
        }
      }
    };
    fetchUserNameAndSexo();
  }, []);

  const handlePerfilIndividualPress = async () => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'usuarios', user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const genero = docSnap.data().genero;
        if (genero === 'mulher') {
          router.push('/PerfilIndividual/PerfilIndividualMulher');
        } else if (genero === 'homem') {
          router.push('/PerfilIndividual/PerfilIndividualHomem');
        } else {
          router.push('/PerfilIndividual/PerfilIndividual');
        }
      }
    } else {
      Alert.alert('Erro', 'Usuário não autenticado.');
    }
  };

  const handleMarcarConsultaPress = () => {
    if (userSexo) {
      router.push({ pathname: '/MarcarConsulta/MarcarConsulta', params: { sexo: userSexo } });
    } else {
      Alert.alert('Erro', 'Sexo do usuário não encontrado.');
    }
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => router.replace('/Login/TelaLogin'))
      .catch((error) => {
        console.error('Erro ao realizar logout:', error);
        Alert.alert('Erro', 'Não foi possível realizar o logout. Tente novamente.');
      });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={{ zIndex: 1 }}>
        <ScreenHeader
          greeting={`Olá, ${userName || 'usuário'}.`}
          progressValue={65}
          nextExamName="Mamografia"
          nextExamDate="Junho 2025"
          onNextExamPress={() => router.push('/ProximosExames/ProximosExames')}
        />
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.background }}
        contentContainerStyle={{ paddingTop: 68, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <SectionTitle label="SEUS RASTREIOS" />

        <View style={{ gap: Spacing.md, marginBottom: Spacing.xxl }}>
          <ListItem icon="person-outline" title="Perfil Individual" subtitle={userSexo === 'mulher' ? 'Feminino' : userSexo === 'homem' ? 'Masculino' : 'Ver perfil'} onPress={handlePerfilIndividualPress} />
          <ListItem icon="calendar-outline" title="Próximos Exames" subtitle="Ver agenda" onPress={() => router.push('/ProximosExames/ProximosExames')} />
          <ListItem icon="medical-outline" title="Marcar Consulta" subtitle="Agendar atendimento" onPress={handleMarcarConsultaPress} />
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border }}
        >
          <Ionicons name="exit-outline" size={16} color={Colors.danger} />
          <Text style={{ ...Typography.label, color: Colors.danger }}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
