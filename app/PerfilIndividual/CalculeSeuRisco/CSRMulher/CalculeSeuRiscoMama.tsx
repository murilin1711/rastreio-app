import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing, Radius } from '@/constants/Theme';

const fatoresDeRisco = [
  'Possui entre 40 e 74 anos',
  'História familiar de câncer de ovário, câncer de mama em homens, câncer de mama em mãe, irmã ou filha',
  'Realiza menos de 150min de atividade física por semana',
  'Primeira menstruação < 12 anos',
  'Menopausa > 45 anos',
  'Fuma ou já fumou',
  'Possui sobrepeso',
  'Nunca engravidou',
  'Fez ou faz uso de anticoncepcional oral ou terapia de reposição hormonal',
  'Nenhuma das anteriores'
];

const CalculeSeuRiscoMama = () => {
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
      resultadoTexto =
        'Você possui risco habitual para este tipo de câncer, porém, você ainda não possui indicação de iniciar o rastreio, converse com seu médico para entender quando ele deve iniciar e fique atento aos sinais e sintomas, aos fatores de risco e métodos de prevenção';
    } else if (selecionados.includes('História familiar de câncer de ovário, câncer de mama em homens, câncer de mama em mãe, irmã ou filha')) {
      resultadoTexto =
        'Pelas informações fornecidas, você possui alto risco para câncer de mama, procure um especialista para confirmar o seu alto risco e individualizar seus exames de rastreio.';
    } else if (selecionados.includes('Possui entre 40 e 74 anos')) {
      const fatoresAdicionais = selecionados.filter(
        (fator) => fator !== 'Possui entre 40 e 74 anos' && fator !== 'Nenhuma das anteriores'
      ).length;

      if (fatoresAdicionais === 0) {
        resultadoTexto =
          'Você possui risco habitual para este tipo de câncer e sua indicação de rastreio é a realização de mamografia anualmente';
      } else if (fatoresAdicionais === 1) {
        resultadoTexto =
          'Você possui risco habitual para este tipo de câncer e sua indicação de rastreio é a realização de mamografia anualmente';
      } else {
        resultadoTexto =
          'Você possui maior risco para este tipo de câncer, sua indicação de rastreio é a realização de mamografia anualmente, além de mudanças de hábitos de vida para reduzir seu risco, porém, não deixe de procurar um médico para avaliar a necessidade de outro método de rastreio';
      }
    } else {
      resultadoTexto =
        'Você possui risco habitual para este tipo de câncer, porém, é importante discutir com seu médico qual a melhor estratégia de rastreio.';
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
          tipo: 'Mama',
          resultado: resultadoTexto,
          data: new Date().toISOString()
        };

        const resultadosAtualizados = resultados.filter((res: any) => res.tipo !== 'Mama');
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
        <Text style={{ ...Typography.heading, color: Colors.white, marginBottom: Spacing.md }}>Mama</Text>
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

      {/* Result modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ width: '85%', backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: Radius.lg, alignItems: 'center' }}>
            <Text style={{ ...Typography.label, color: Colors.textMuted, marginBottom: Spacing.sm }}>SEU RESULTADO</Text>
            <Text style={{ ...Typography.body, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xl }}>
              {resultado}
            </Text>
            <Button label="Ok" onPress={handleOk} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CalculeSeuRiscoMama;
