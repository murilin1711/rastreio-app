import { useLocalSearchParams } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { db } from '../../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Radius } from '@/constants/Theme';

const SinaisAlarmeFatoresRisco: React.FC = () => {
  const { sexo, neoplasia } = useLocalSearchParams();
  const [sinaisFatores, setSinaisFatores] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSinaisFatores = async () => {
      try {
        const combinacao = `${sexo}_${neoplasia}`.toLowerCase();
        console.log(`Buscando dados para combinação: ${combinacao}`);

        const sintomasAgrupados: any[] = [];

        const adminSnapshot = await getDocs(collection(db, 'administradores'));
        const adminIds = adminSnapshot.docs.map(doc => doc.id);

        for (const adminId of adminIds) {
          console.log(`Verificando dados para administrador: ${adminId}`);
          const combinacoesRef = collection(db, `sinaisAlarmeFatoresRisco/${adminId}/combinacoes`);
          const querySnapshot = await getDocs(combinacoesRef);

          querySnapshot.forEach((doc) => {
            if (doc.id.toLowerCase() === combinacao) {
              console.log(`Dados encontrados para combinação: ${combinacao}`);
              const data = doc.data();
              sintomasAgrupados.push({
                adminId: adminId,
                id: doc.id,
                sinais: data.sintomas || [],
              });
            }
          });
        }

        setSinaisFatores(sintomasAgrupados);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar sinais de alarme e fatores de risco:', error);
        setLoading(false);
      }
    };

    if (sexo && neoplasia) {
      fetchSinaisFatores();
    }
  }, [sexo, neoplasia]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <InternalHeader sectionLabel="ALERTAS" title="Sinais e Fatores de Risco" />
        <View style={styles.content}>
          <FlatList
            data={sinaisFatores}
            keyExtractor={(item) => item.adminId + item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View>
                {item.sinais.map((sinal: any, index: number) => (
                  <View key={index} style={styles.item}>
                    <Image
                      source={{ uri: sinal.imagem }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                    <Text style={styles.description}>{sinal.descricao}</Text>
                  </View>
                ))}
              </View>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  item: {
    backgroundColor: Colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: Radius.sm,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
});

export default SinaisAlarmeFatoresRisco;
