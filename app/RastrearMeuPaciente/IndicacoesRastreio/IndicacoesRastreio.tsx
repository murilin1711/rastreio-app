import { useLocalSearchParams } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { db } from '../../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Typography, Radius } from '@/constants/Theme';

const IndicacoesRastreio: React.FC = () => {
    const { sexo, neoplasia } = useLocalSearchParams();
    const [texto, setTexto] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchIndicacoes = async () => {
            try {
                const adminSnapshot = await getDocs(collection(db, 'administradores'));
                const adminIds = adminSnapshot.docs.map(doc => doc.id);

                console.log('IDs dos administradores:', adminIds);

                let indicacoesEncontradas = false;

                const sexoStr = Array.isArray(sexo) ? sexo[0] : sexo;
                const neoplasiaStr = Array.isArray(neoplasia) ? neoplasia[0] : neoplasia;

                for (const adminId of adminIds) {
                    const documentId = `${adminId}_${sexoStr?.toLowerCase()}_${neoplasiaStr?.toLowerCase()}`;
                    console.log('Tentando buscar documento com ID:', documentId);

                    const docRef = doc(db, 'indicacoesRastreio', documentId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        console.log('Documento encontrado:', docSnap.data());
                        setTexto(docSnap.data().texto);
                        indicacoesEncontradas = true;
                        break;
                    } else {
                        console.log('Nenhum documento encontrado para o ID:', documentId);
                    }
                }

                if (!indicacoesEncontradas) {
                    setTexto("Nenhuma indicação encontrada.");
                }

                setLoading(false);
            } catch (error) {
                console.error('Erro ao buscar indicações de rastreio:', error);
                setLoading(false);
            }
        };

        if (sexo && neoplasia) {
            console.log('Parâmetros recebidos - Sexo:', sexo, 'Neoplasia:', neoplasia);
            fetchIndicacoes();
        } else {
            console.error('Dados de sexo ou neoplasia ausentes.');
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
                <InternalHeader sectionLabel="RASTREAR" title="Indicações de Rastreio" />
                <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
                    <View style={styles.contentCard}>
                        <Text style={styles.indicacaoText}>
                            {texto ?? "Nenhuma indicação encontrada."}
                        </Text>
                    </View>
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
    contentCard: {
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    indicacaoText: {
        ...Typography.body,
        color: Colors.textPrimary,
        textAlign: 'left',
    },
});

export default IndicacoesRastreio;
