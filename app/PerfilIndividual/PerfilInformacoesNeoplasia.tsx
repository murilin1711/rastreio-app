import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Radius } from '@/constants/Theme';


const firestore = getFirestore();
const authInstance = getAuth();

export default function PerfilInformacoesNeoplasia() {
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
            console.log("Neoplasia capturada da URL:", neoplasia);
            setTitle(neoplasia as string);
        }

        return () => unsubscribe();
    }, [neoplasia]);

    const redirecionarParaCalculoDeRisco = async () => {
        const user = authInstance.currentUser;

        if (user) {
            const userDocRef = doc(firestore, 'usuarios', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const genero = userData.genero;

                let caminho = '';

                if (genero === 'homem') {
                    switch (neoplasia) {
                        case 'Próstata':
                            caminho = '/PerfilIndividual/CalculeSeuRisco/CSRHomem/CalculeSeuRiscoProstata';
                            break;
                        case 'Colorretal':
                            caminho = '/PerfilIndividual/CalculeSeuRisco/CSRHomem/CalculeSeuRiscoColorretal';
                            break;
                        case 'Pulmão':
                            caminho = '/PerfilIndividual/CalculeSeuRisco/CSRHomem/CalculeSeuRiscoPulmao';
                            break;
                        default:
                            console.error('Neoplasia desconhecida para homens');
                    }
                } else if (genero === 'mulher') {
                    switch (neoplasia) {
                        case 'Colo de Útero':
                            caminho = '/PerfilIndividual/CalculeSeuRisco/CSRMulher/CalculeSeuRiscoColoDeUtero';
                            break;
                        case 'Mama':
                            caminho = '/PerfilIndividual/CalculeSeuRisco/CSRMulher/CalculeSeuRiscoMama';
                            break;
                        case 'Colorretal':
                            caminho = '/PerfilIndividual/CalculeSeuRisco/CSRMulher/CalculeSeuRiscoColorretal';
                            break;
                        case 'Pulmão':
                            caminho = '/PerfilIndividual/CalculeSeuRisco/CSRMulher/CalculeSeuRiscoPulmao';
                            break;
                        default:
                            console.error('Neoplasia desconhecida para mulheres');
                    }
                } else {
                    console.error('Gênero desconhecido');
                }

                if (caminho) {
                    router.push(caminho as Href<string>);
                }
            } else {
                console.error('Documento do usuário não encontrado');
            }
        } else {
            console.error('Usuário não está logado');
        }
    };

    const redirecionarParaExamesDeRastreio = async () => {
        const user = authInstance.currentUser;

        if (user) {
            const userDocRef = doc(firestore, 'usuarios', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const genero = userData.genero;

                let caminho = '';

                if (genero === 'homem') {
                    switch (neoplasia) {
                        case 'Próstata':
                            caminho = '/PerfilIndividual/SeusExamesDeRastreio/SEDRHomem/SeusExamesDeRastreioProstataMasculino';
                            break;
                        case 'Colorretal':
                            caminho = '/PerfilIndividual/SeusExamesDeRastreio/SEDRHomem/SeusExamesDeRastreioColorretalMasculino';
                            break;
                        case 'Pulmão':
                            caminho = '/PerfilIndividual/SeusExamesDeRastreio/SEDRHomem/SeusExamesDeRastreioPulmaoMasculino';
                            break;
                        default:
                            console.error('Neoplasia desconhecida para homens');
                    }
                } else if (genero === 'mulher') {
                    switch (neoplasia) {
                        case 'Colo de Útero':
                            caminho = '/PerfilIndividual/SeusExamesDeRastreio/SEDRMulher/SeusExamesDeRastreioColoDeUteroFeminino';
                            break;
                        case 'Mama':
                            caminho = '/PerfilIndividual/SeusExamesDeRastreio/SEDRMulher/SeusExamesDeRastreioMamaFeminino';
                            break;
                        case 'Colorretal':
                            caminho = '/PerfilIndividual/SeusExamesDeRastreio/SEDRMulher/SeusExamesDeRastreioColorretalFeminino';
                            break;
                        case 'Pulmão':
                            caminho = '/PerfilIndividual/SeusExamesDeRastreio/SEDRMulher/SeusExamesDeRastreioPulmaoFeminino';
                            break;
                        default:
                            console.error('Neoplasia desconhecida para mulheres');
                    }
                } else {
                    console.error('Gênero desconhecido');
                }

                if (caminho) {
                    router.push(caminho as Href<string>);
                }
            } else {
                console.error('Documento do usuário não encontrado');
            }
        } else {
            console.error('Usuário não está logado');
        }
    };

    const redirecionarParaSinaisESintomas = async () => {
        const user = authInstance.currentUser;

        if (user) {
            const userDocRef = doc(firestore, 'usuarios', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const genero = userData.genero;

                if (genero && neoplasia) {
                    router.push({
                        pathname: `/PerfilIndividual/SinaisESintomas/SinaisESintomas`,
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
            <ScrollView showsVerticalScrollIndicator={false}>
                <InternalHeader sectionLabel="INFORMAÇÕES" title="Neoplasia" />
                <View style={styles.content}>
                    <LottieView
                        source={require('../../assets/lottie/lupa2.json')}
                        autoPlay
                        loop={false}
                        speed={3}
                        style={styles.lottie}
                    />
                    <View style={styles.neoplasiaLabel}>
                        <Text style={styles.title}>{title}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={redirecionarParaCalculoDeRisco}>
                        <Text style={styles.buttonText}>Calcule seu Risco</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={redirecionarParaExamesDeRastreio}>
                        <Text style={styles.buttonText}>Seus exames de rastreio</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={redirecionarParaSinaisESintomas}>
                        <Text style={styles.buttonText}>Sinais e sintomas</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    neoplasiaLabel: {
        backgroundColor: Colors.accent,
        borderRadius: Radius.pill,
        paddingHorizontal: 20,
        marginBottom: Spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
    },
    title: {
        fontSize: 24,
        color: Colors.white,
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
        lineHeight: 50,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: Radius.pill,
        marginVertical: 10,
        width: '80%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 18,
        fontFamily: 'Poppins-SemiBold',
    },
    lottie: {
        width: 200,
        height: 200,
        alignSelf: 'center',
    },
});
