import { useLocalSearchParams } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { db } from '../../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Typography, Radius } from '@/constants/Theme';

const SinaisESintomas: React.FC = () => {
  const { sexo, neoplasia } = useLocalSearchParams();
  const [sinaisSintomas, setSinaisSintomas] = useState<{ combinacao: string; sintomas: string[] }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSinaisSintomas = async () => {
      try {
        const sintomasAgrupados: { [key: string]: string[] } = {};

        if (sexo && neoplasia) {
          const combinacao = `${sexo}_${neoplasia}`.toLowerCase();
          console.log(`Buscando sintomas para combinação: ${combinacao}`);

          const adminSnapshot = await getDocs(collection(db, 'administradores'));
          const adminIds = adminSnapshot.docs.map(doc => doc.id);

          for (const adminId of adminIds) {
            console.log(`Verificando combinação para administrador: ${adminId}`);
            const combinacoesRef = collection(db, `sinaisSintomas/${adminId}/combinacoes`);
            const querySnapshot = await getDocs(combinacoesRef);

            querySnapshot.forEach((doc) => {
              if (doc.id.toLowerCase() === combinacao) {
                console.log(`Sintomas encontrados para ${combinacao}:`, doc.data().sintomas);
                const data = doc.data();
                if (sintomasAgrupados[combinacao]) {
                  sintomasAgrupados[combinacao] = [...sintomasAgrupados[combinacao], ...data.sintomas];
                } else {
                  sintomasAgrupados[combinacao] = data.sintomas || [];
                }
              }
            });
          }

          const allSintomasArray = Object.entries(sintomasAgrupados).map(([combinacao, sintomas]) => ({
            combinacao,
            sintomas: Array.from(new Set(sintomas)),
          }));

          console.log("Sintomas agrupados final:", allSintomasArray);

          setSinaisSintomas(allSintomasArray);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar sinais e sintomas:', error);
        setLoading(false);
      }
    };

    fetchSinaisSintomas();
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

  if (sinaisSintomas.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <InternalHeader sectionLabel="ALERTAS" title="Sinais e Sintomas" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum sintoma encontrado para {sexo} - {neoplasia}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <InternalHeader sectionLabel="ALERTAS" title="Sinais e Sintomas" />
        <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
          {sinaisSintomas.map((group, groupIndex) => (
            <View key={`${group.combinacao}_${groupIndex}`} style={styles.item}>
              {group.sintomas.map((sintoma, index) => (
                <View key={`${group.combinacao}_${index}`} style={styles.sintomaItem}>
                  <Text style={styles.sintomasText}>{sintoma}</Text>
                </View>
              ))}
            </View>
          ))}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  item: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sintomasText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  sintomaItem: {
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default SinaisESintomas;
