import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { ResultModal } from '@/components/ui/ResultModal';
import { Colors, Typography, Spacing, Radius } from '@/constants/Theme';

const fatoresDeRisco = [
  'Você possui 45 anos ou mais',
  'Você está acima do peso',
  'Sua alimentação é rica em carne vermelha ou processados',
  'Sua alimentação é rica em comidas gordurosas e hipercalóricas',
  'Você fuma ou já fumou',
  'Consome álcool',
  'Realiza atividade física menos que 3x na semana',
  'Possui familiares que tiveram câncer colorretal',
  'Possui diabetes tipo 2',
  'Nenhuma das anteriores'
];

const CalculeSeuRiscoColorretalHomem = () => {
  const [selecoes, setSelecoes] = useState<boolean[]>(Array(fatoresDeRisco.length).fill(false));
  const [resultado, setResultado] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const router = useRouter();

  const auth = getAuth();
  const firestore = getFirestore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/Login/TelaLogin');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSelecao = (index: number) => {
    const novasSelecoes = [...selecoes];
    if (index === fatoresDeRisco.length - 1) {
      novasSelecoes.fill(false);
      novasSelecoes[index] = true;
    } else {
      novasSelecoes[index] = !novasSelecoes[index];
      novasSelecoes[fatoresDeRisco.length - 1] = false;
    }
    setSelecoes(novasSelecoes);
  };

  const calcularRisco = async () => {
    const selecionados = selecoes.reduce((acc, selecionado, index) => {
      if (selecionado) acc.push(fatoresDeRisco[index]);
      return acc;
    }, [] as string[]);

    if (selecionados.length === 0) {
      Alert.alert('Aviso', 'Você ainda não selecionou nenhum item');
      return;
    }

    let resultadoTexto = '';

    if (selecionados.includes('Nenhuma das anteriores')) {
      resultadoTexto = 'Você possui risco habitual para este tipo de câncer, porém, você ainda não possui indicação de iniciar o rastreio, converse com seu médico para entender quando ele deve iniciar e fique atento aos sinais e sintomas, aos fatores de risco e métodos de prevenção';
    } else if (selecionados.includes('Você possui 45 anos ou mais')) {
      const fatoresAdicionais = selecionados.length - 1;
      if (fatoresAdicionais === 0) {
        resultadoTexto = 'Você possui risco habitual para este tipo de câncer e sua indicação de rastreio é a realização de colonoscopia a partir dos 45 anos e repetir em 5-10 anos a depender do resultado';
      } else if (fatoresAdicionais === 1) {
        resultadoTexto = 'Você possui risco habitual para este tipo de câncer e sua indicação de rastreio é a realização de colonoscopia a partir dos 45 anos e repetir em 5-10 anos a depender do resultado';
      } else {
        resultadoTexto = 'Você possui maior risco para este tipo de câncer, sua indicação de rastreio é a realização de colonoscopia a partir dos 45 anos e repetir em 5-10 anos a depender do resultado, porém, não deixe de procurar um médico para avaliar a necessidade de outro método de rastreio';
      }
    } else {
      resultadoTexto = 'Você possui risco habitual para este tipo de câncer, porém, você ainda não possui indicação de iniciar o rastreio, converse com seu médico para entender quando ele deve iniciar e fique atento aos sinais e sintomas, aos fatores de risco e métodos de prevenção';
    }

    setResultado(resultadoTexto);
    setModalVisible(true);

    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(firestore, 'usuarios', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const resultados = userData.resultado || [];
        const novoResultado = {
          tipo: 'Colorretal',
          resultado: resultadoTexto,
          data: new Date().toISOString()
        };

        const resultadosAtualizados = resultados.filter((res: any) => res.tipo !== 'Colorretal');
        resultadosAtualizados.push(novoResultado);

        await updateDoc(userDocRef, { resultado: resultadosAtualizados });
      }
    }
  };

  const handleOk = () => {
    setModalVisible(false);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Blue header */}
      <View style={{ backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 22, height: 22, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 7, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={12} color={Colors.white} />
          </TouchableOpacity>
          <Text style={{ ...Typography.label, color: 'rgba(255,255,255,0.5)' }}>CALCULE SEU RISCO</Text>
        </View>
        <Text style={{ ...Typography.heading, color: Colors.white, marginBottom: Spacing.md }}>Colorretal</Text>
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i === 0 ? Colors.white : 'rgba(255,255,255,0.25)' }} />
          ))}
        </View>
      </View>

      {/* White body */}
      <ScrollView style={{ flex: 1, backgroundColor: Colors.white }} contentContainerStyle={{ padding: Spacing.lg }}>
        <Text style={{ ...Typography.subheading, color: Colors.textPrimary, marginBottom: Spacing.md }}>
          Marque os fatores de risco que se aplicam a você
        </Text>

        {fatoresDeRisco.map((fator, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleSelecao(index)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md,
              borderRadius: Radius.md, borderWidth: 2,
              borderColor: selecoes[index] ? Colors.primary : Colors.border,
              backgroundColor: selecoes[index] ? '#f0f4ff' : Colors.background,
              marginBottom: Spacing.sm,
            }}
          >
            <View style={{
              width: 16, height: 16, borderRadius: 8, borderWidth: 2,
              borderColor: selecoes[index] ? Colors.primary : Colors.border,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: selecoes[index] ? Colors.primary : 'transparent'
            }}>
              {selecoes[index] && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white }} />}
            </View>
            <Text style={{
              ...Typography.body,
              color: selecoes[index] ? Colors.textPrimary : Colors.textSecondary,
              flex: 1,
              fontFamily: selecoes[index] ? 'Poppins-SemiBold' : 'Poppins-Regular'
            }}>{fator}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fixed footer */}
      <View style={{ padding: Spacing.lg, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border }}>
        <Button label="Calcular Risco" onPress={calcularRisco} />
      </View>

      <ResultModal visible={modalVisible} resultado={resultado} onClose={handleOk} />
    </SafeAreaView>
  );
};

export default CalculeSeuRiscoColorretalHomem;
