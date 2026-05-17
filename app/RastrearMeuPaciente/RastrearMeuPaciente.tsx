import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from "firebase/firestore";
import LottieView from 'lottie-react-native';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Radius, Shadows } from '@/constants/Theme';

export default function RastrearMeuPaciente() {
    const [escolha, setEscolha] = useState<string | null>(null);
    const router = useRouter();

    const confirmarEscolha = async () => {
        if (escolha) {
            Alert.alert(
                'Confirmação',
                `Você confirma sua escolha?`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                    },
                    {
                        text: 'Confirmar',
                        onPress: async () => {
                            const user = auth.currentUser;
                            if (user) {
                                const userRef = doc(db, "usuarios", user.uid);
                                await updateDoc(userRef, {
                                    genero: escolha,
                                });

                                if (escolha === 'mulher') {
                                    router.push('/RastrearMeuPaciente/RastrearMulher');
                                } else {
                                    router.push('/RastrearMeuPaciente/RastrearHomem');
                                }
                            }
                        },
                    },
                ]
            );
        } else {
            Alert.alert('Erro', 'Por favor, escolha uma opção antes de confirmar.');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <InternalHeader sectionLabel="RASTREAR" title="Meu Paciente" />

                <View style={styles.body}>
                    <Text style={styles.question}>Quem você quer rastrear?</Text>

                    <TouchableOpacity
                        style={[styles.optionButton, escolha === 'mulher' && styles.optionButtonSelected]}
                        onPress={() => setEscolha('mulher')}
                        activeOpacity={0.8}>
                        <FontAwesome5 name="female" size={24} color={Colors.white} />
                        <Text style={styles.optionText}>MULHER</Text>
                    </TouchableOpacity>

                    <LottieView
                        source={require('../../assets/lottie/escolha3.json')}
                        autoPlay
                        loop={true}
                        speed={1.2}
                        style={styles.lottie}
                    />

                    <TouchableOpacity
                        style={[styles.optionButton, escolha === 'homem' && styles.optionButtonSelected]}
                        onPress={() => setEscolha('homem')}
                        activeOpacity={0.8}>
                        <FontAwesome5 name="male" size={24} color={Colors.white} />
                        <Text style={styles.optionText}>HOMEM</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.confirmButton} onPress={confirmarEscolha} activeOpacity={0.8}>
                        <Text style={styles.confirmButtonText}>Confirmar</Text>
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
    question: {
        fontSize: 20,
        color: Colors.textPrimary,
        fontFamily: 'Poppins-SemiBold',
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: Radius.pill,
        marginVertical: Spacing.sm,
        width: '80%',
        justifyContent: 'center',
        ...(Shadows.card as object),
    },
    optionButtonSelected: {
        backgroundColor: Colors.danger,
    },
    optionText: {
        color: Colors.white,
        fontSize: 18,
        marginLeft: Spacing.sm,
        fontFamily: 'Poppins-SemiBold',
    },
    confirmButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: Radius.pill,
        marginTop: Spacing.xl,
        ...(Shadows.card as object),
    },
    confirmButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontFamily: 'Poppins-SemiBold',
    },
    lottie: {
        width: 300,
        height: 300,
        marginBottom: -30,
        marginTop: -30,
    },
});
