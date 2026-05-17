import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect } from 'react';
import { BackHandler, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Radius, Shadows } from '@/constants/Theme';

export default function RastrearMulher() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.replace('/Login/TelaLogin');
            }
        });

        const backAction = () => {
            router.replace('/Home/TelaDeHomeProfissional');
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => {
            backHandler.remove();
            unsubscribe();
        };
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <InternalHeader
                    sectionLabel="RASTREAR"
                    title="Paciente Feminino"
                    onBack={() => router.push('/RastrearMeuPaciente/RastrearMeuPaciente')}
                />

                <View style={styles.body}>
                    <Text style={styles.subtitle}>Selecione uma neoplasia</Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/RastrearMeuPaciente/RastrearPacienteNeoplasia?neoplasia=Colo de Útero')}
                        activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Colo de Útero</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/RastrearMeuPaciente/RastrearPacienteNeoplasia?neoplasia=Mama')}
                        activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Mama</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/RastrearMeuPaciente/RastrearPacienteNeoplasia?neoplasia=Colorretal')}
                        activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Colorretal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/RastrearMeuPaciente/RastrearPacienteNeoplasia?neoplasia=Pulmão')}
                        activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Pulmão</Text>
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
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        fontFamily: 'Poppins-Regular',
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },
    button: {
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
    buttonText: {
        color: Colors.white,
        fontSize: 18,
        fontFamily: 'Poppins-SemiBold',
    },
});
