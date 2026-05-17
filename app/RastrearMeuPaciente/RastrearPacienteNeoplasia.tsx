import { useLocalSearchParams, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Radius, Shadows } from '@/constants/Theme';

const firestore = getFirestore();

export default function RastrearPacienteNeoplasia() {
    const router = useRouter();
    const { neoplasia } = useLocalSearchParams();
    const [title, setTitle] = useState<string>('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/Login/TelaLogin');
            }
        });

        if (neoplasia) {
            setTitle(neoplasia as string);
        }

        return () => unsubscribe();
    }, [neoplasia]);

    const redirecionarParaSinaisAlarmeFatoresRisco = async () => {
        const user = auth.currentUser;

        if (user) {
            const userDocRef = doc(firestore, 'usuarios', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const genero = userData.genero;

                if (genero && neoplasia) {
                    router.push({
                        pathname: `/RastrearMeuPaciente/SinaisAlarmeFatoresRisco/SinaisAlarmeFatoresRisco`,
                        params: { sexo: genero, neoplasia },
                    });
                } else {
                    console.error('Dados de gênero ou neoplasia ausentes');
                }
            } else {
                console.error('Documento do usuário não encontrado');
            }
        } else {
            console.error('Usuário não está logado');
        }
    };

    const redirecionarParaIndicacoesRastreio = async () => {
        const user = auth.currentUser;

        if (user) {
            const userDocRef = doc(firestore, 'usuarios', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const genero = userData.genero;

                if (genero && neoplasia) {
                    router.push({
                        pathname: `/RastrearMeuPaciente/IndicacoesRastreio/IndicacoesRastreio`,
                        params: { sexo: genero, neoplasia },
                    });
                } else {
                    console.error('Dados de gênero ou neoplasia ausentes');
                }
            } else {
                console.error('Documento do usuário não encontrado');
            }
        } else {
            console.error('Usuário não está logado');
        }
    };

    const redirecionarParaCondutaManejoResultados = async () => {
        const user = auth.currentUser;

        if (user) {
            const userDocRef = doc(firestore, 'usuarios', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const genero = userData.genero;

                if (genero && neoplasia) {
                    router.push({
                        pathname: `/RastrearMeuPaciente/CondutaManejoResultados/CondutaManejoResultados`,
                        params: { sexo: genero, neoplasia },
                    });
                } else {
                    console.error('Dados de gênero ou neoplasia ausentes');
                }
            } else {
                console.error('Documento do usuário não encontrado');
            }
        } else {
            console.error('Usuário não está logado');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <InternalHeader sectionLabel="RASTREAR" title="Por Neoplasia" />

                <View style={styles.body}>
                    <View style={styles.neoplasiaTag}>
                        <Text style={styles.neoplasiaTagText}>{title}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={redirecionarParaSinaisAlarmeFatoresRisco}
                        activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Sinais de Alarme e Fatores de Risco</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={redirecionarParaIndicacoesRastreio}
                        activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Indicações de Rastreio</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={redirecionarParaCondutaManejoResultados}
                        activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Conduta e Manejo Após Resultados</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
    },
    body: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
    },
    neoplasiaTag: {
        backgroundColor: Colors.danger,
        borderRadius: Radius.pill,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.xxl,
        ...(Shadows.floating as object),
    },
    neoplasiaTagText: {
        fontSize: 20,
        color: Colors.white,
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: Radius.lg,
        marginVertical: Spacing.sm,
        width: '80%',
        alignItems: 'center',
        ...(Shadows.card as object),
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        textAlign: 'center',
    },
});
