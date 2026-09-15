import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from "firebase/firestore";
import LottieView from 'lottie-react-native';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Radius, Typography } from '@/constants/Theme';

export default function PerfilIndividual() {
    const [escolha, setEscolha] = useState<string | null>(null);
    const router = useRouter();

    const confirmarEscolha = async () => {
        if (escolha) {
            Alert.alert(
                'Confirmação',
                `Você tem certeza que deseja escolher ${escolha === 'mulher' ? 'Mulher' : 'Homem'}?`,
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
                                    router.push('/PerfilIndividual/PerfilIndividualMulher');
                                } else {
                                    router.push('/PerfilIndividual/PerfilIndividualHomem');
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
            <ScrollView showsVerticalScrollIndicator={false}>
                <InternalHeader sectionLabel="SEU PERFIL" title="Perfil Individual" />
                <View style={styles.content}>
                    <TouchableOpacity
                        style={[styles.optionButton, escolha === 'mulher' && styles.optionButtonSelected]}
                        onPress={() => setEscolha('mulher')}>
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
                        onPress={() => setEscolha('homem')}>
                        <FontAwesome5 name="male" size={24} color={Colors.white} />
                        <Text style={styles.optionText}>HOMEM</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.confirmButton} onPress={confirmarEscolha}>
                        <Text style={styles.confirmButtonText}>Confirmar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.accent,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: Radius.pill,
        marginVertical: 10,
        width: '80%',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    optionButtonSelected: {
        backgroundColor: Colors.primary,
    },
    optionText: {
        color: Colors.white,
        fontSize: 18,
        marginLeft: 10,
        fontFamily: 'Poppins-Bold',
    },
    confirmButton: {
        backgroundColor: Colors.accent,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: Radius.pill,
        marginTop: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    confirmButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
    },
    lottie: {
        width: 300,
        height: 300,
        marginBottom: -30,
        marginTop: -30,
    },
    backButton: {
        backgroundColor: Colors.surface,
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: Radius.pill,
        alignItems: 'center',
        marginTop: 8,
        alignSelf: 'center',
        width: 120,
    },
    backButtonText: {
        color: Colors.primary,
        fontSize: 15,
        fontFamily: 'Poppins-SemiBold',
    },
});
