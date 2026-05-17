import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, SafeAreaView, ScrollView, StatusBar, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/firebase-config';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ListItem } from '@/components/ui/ListItem';
import { Colors, Spacing } from '@/constants/Theme';


export default function TelaDeHomeProfissional() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserName(userData.nome);
        }
      }
    };

    fetchUserName();
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        router.replace('/Login/TelaLogin');
      })
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
          greeting={`Olá, Dr. ${userName || 'Doutor'}.`}
          progressValue={75}
          nextExamName="Consulta"
          nextExamDate="Próxima semana"
          onNextExamPress={() => router.push('/RastrearMeuPaciente/RastrearMeuPaciente')}
        />
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.background }}
        contentContainerStyle={{ paddingTop: 44, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.sm }}
        showsVerticalScrollIndicator={false}
      >
        <ListItem
          icon="person-outline"
          title="Meu Perfil"
          subtitle="Ver meu perfil"
          onPress={() => router.push('/Home/TelaDeHomeProfissionalPessoal')}
        />
        <ListItem
          icon="people-outline"
          title="Rastrear Paciente"
          subtitle="Avaliar risco do paciente"
          onPress={() => router.push('/RastrearMeuPaciente/RastrearMeuPaciente')}
        />
        <ListItem
          icon="document-text-outline"
          title="Indicações de Rastreio"
          subtitle="Ver diretrizes"
          onPress={() => router.push('/RastrearMeuPaciente/IndicacoesRastreio/IndicacoesRastreio')}
        />
        <ListItem
          icon="clipboard-outline"
          title="Conduta e Manejo"
          subtitle="Ver recomendações"
          onPress={() => router.push('/RastrearMeuPaciente/CondutaManejoResultados/CondutaManejoResultados')}
        />

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: Spacing.xl, padding: Spacing.md }}
        >
          <Ionicons name="exit-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
