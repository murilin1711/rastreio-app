import { useLocalSearchParams } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { db } from '../../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Typography, Radius } from '@/constants/Theme';

const CondutaManejoResultados: React.FC = () => {
  const { sexo, neoplasia } = useLocalSearchParams();
  const [condutas, setCondutas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCondutas = async () => {
      try {
        const combinacao = `${sexo}_${neoplasia}`.toLowerCase();
        console.log(`Buscando condutas para a combinação: ${combinacao}`);

        const condutasAgrupadas: { [key: string]: any[] } = {};

        const adminSnapshot = await getDocs(collection(db, 'administradores'));
        const adminIds = adminSnapshot.docs.map(doc => doc.id);

        for (const adminId of adminIds) {
          console.log(`Verificando dados para administrador: ${adminId}`);
          const combinacoesRef = collection(db, `condutaManejoResultado/${adminId}/combinacoes`);
          const querySnapshot = await getDocs(combinacoesRef);

          querySnapshot.forEach((doc) => {
            const docId = doc.id.toLowerCase();
            if (docId === combinacao) {
              console.log(`Dados encontrados para combinação: ${combinacao}`);
              const data = doc.data();
              if (condutasAgrupadas[docId]) {
                const novasCondutas = data.itens.filter((item: any) =>
                  !condutasAgrupadas[docId].some((existingItem: any) => JSON.stringify(existingItem) === JSON.stringify(item))
                );
                condutasAgrupadas[docId] = [...condutasAgrupadas[docId], ...novasCondutas];
              } else {
                condutasAgrupadas[docId] = data.itens || [];
              }
            }
          });
        }

        const condutasArray = Object.entries(condutasAgrupadas).map(([combinacao, itens]) => ({
          combinacao,
          itens,
        }));

        setCondutas(condutasArray);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar condutas de manejo:', error);
        setLoading(false);
      }
    };

    if (sexo && neoplasia) {
      fetchCondutas();
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
        <InternalHeader sectionLabel="RESULTADOS" title="Conduta e Manejo" />
        <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
          <FlatList
            data={condutas}
            keyExtractor={(item) => item.combinacao}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View>
                {item.itens.map((conduta: any, index: number) => (
                  <View key={index} style={styles.item}>
                    <Text style={styles.resultado}>{conduta.resultado}</Text>
                    <Text style={styles.description}>{conduta.descricao}</Text>
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
  item: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultado: {
    ...Typography.subheading,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});

export default CondutaManejoResultados;
