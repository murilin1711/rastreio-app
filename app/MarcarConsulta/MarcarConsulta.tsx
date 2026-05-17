import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Typography, Radius } from '@/constants/Theme';

const MarcarConsulta: React.FC = () => {
  const [locais, setLocais] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLocais = async () => {
      try {
        const adminSnapshot = await getDocs(collection(db, 'administradores'));
        const adminIds = adminSnapshot.docs.map((doc) => doc.id);
        console.log('IDs dos administradores:', adminIds);

        const allLocaisArray: any[] = [];

        for (const adminId of adminIds) {
          const docHomemRef = doc(db, `marqueConsulta/${adminId}_homem`);
          const docHomemSnap = await getDoc(docHomemRef);
          if (docHomemSnap.exists()) {
            const data = docHomemSnap.data();
            if (data.locais && Array.isArray(data.locais)) {
              console.log(`Locais encontrados para homem (adminId: ${adminId}):`, data.locais);
              allLocaisArray.push(...data.locais);
            } else {
              console.log(`Nenhum array de locais encontrado para marqueConsulta/${adminId}_homem`);
            }
          }

          const docMulherRef = doc(db, `marqueConsulta/${adminId}_mulher`);
          const docMulherSnap = await getDoc(docMulherRef);
          if (docMulherSnap.exists()) {
            const data = docMulherSnap.data();
            if (data.locais && Array.isArray(data.locais)) {
              console.log(`Locais encontrados para mulher (adminId: ${adminId}):`, data.locais);
              allLocaisArray.push(...data.locais);
            } else {
              console.log(`Nenhum array de locais encontrado para marqueConsulta/${adminId}_mulher`);
            }
          }
        }

        console.log('Todos os locais encontrados:', allLocaisArray);
        setLocais(allLocaisArray);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar locais de consulta:', error);
        setLoading(false);
      }
    };

    fetchLocais();
  }, []);

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
        <InternalHeader sectionLabel="CONSULTA" title="Marcar Consulta" />
        <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
          <FlatList
            data={locais}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Text style={styles.nome}>{item.nome}</Text>
                <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
                  <Text style={styles.link}>Acessar</Text>
                </TouchableOpacity>
                <Text style={styles.telefone}>Telefone: {item.telefone}</Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
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
  nome: {
    ...Typography.subheading,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  link: {
    ...Typography.body,
    color: Colors.primary,
    textDecorationLine: 'underline',
    marginBottom: Spacing.xs,
  },
  telefone: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});

export default MarcarConsulta;
