import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import { auth } from '../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Radius, Shadows } from '@/constants/Theme';

export default function PerfilIndividualHomem() {
    const router = useRouter();

    const fillAnim1 = useRef(new Animated.Value(0)).current;
    const fillAnim2 = useRef(new Animated.Value(0)).current;
    const fillAnim3 = useRef(new Animated.Value(0)).current;

    const [actionCompleted1, setActionCompleted1] = useState(false);
    const [actionCompleted2, setActionCompleted2] = useState(false);
    const [actionCompleted3, setActionCompleted3] = useState(false);

    const headRotateX = useRef(new Animated.Value(0)).current;
    const headRotateY = useRef(new Animated.Value(0)).current;
    const initialBeta = useRef<number | null>(null);

    const handlePressIn1 = () => {
        Animated.timing(fillAnim1, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                setActionCompleted1(true);
                router.push('/PerfilIndividual/PerfilInformacoesNeoplasia?neoplasia=Próstata');
            }
        });
    };

    const handlePressOut1 = () => {
        if (!actionCompleted1) {
            Animated.timing(fillAnim1, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    };

    const handlePressIn2 = () => {
        Animated.timing(fillAnim2, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                setActionCompleted2(true);
                router.push('/PerfilIndividual/PerfilInformacoesNeoplasia?neoplasia=Colorretal');
            }
        });
    };

    const handlePressOut2 = () => {
        if (!actionCompleted2) {
            Animated.timing(fillAnim2, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    };

    const handlePressIn3 = () => {
        Animated.timing(fillAnim3, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                setActionCompleted3(true);
                router.push('/PerfilIndividual/PerfilInformacoesNeoplasia?neoplasia=Pulmão');
            }
        });
    };

    const handlePressOut3 = () => {
        if (!actionCompleted3) {
            Animated.timing(fillAnim3, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.replace('/Login/TelaLogin');
            }
        });

        const backAction = () => {
            router.replace('/Home/TelaDeHomeUsuario');
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => {
            backHandler.remove();
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        let subscription: ReturnType<typeof DeviceMotion.addListener> | undefined;
        DeviceMotion.requestPermissionsAsync().then(({ granted }) => {
            if (!granted) return;
            DeviceMotion.setUpdateInterval(50);
            subscription = DeviceMotion.addListener(({ rotation }) => {
                if (!rotation) return;
                if (initialBeta.current === null) initialBeta.current = rotation.beta;
                const gamma = rotation.gamma ?? 0;
                const betaOffset = (rotation.beta ?? 0) - (initialBeta.current ?? 0);
                const z = Math.max(-12, Math.min(12, gamma * 8));
                const x = Math.max(-8, Math.min(8, betaOffset * 8));
                headRotateY.setValue(z);
                headRotateX.setValue(x);
            });
        });
        return () => subscription?.remove();
    }, []);

    const backgroundColorInterpolation1 = fillAnim1.interpolate({
        inputRange: [0, 1],
        outputRange: [Colors.primary, Colors.danger],
    });

    const backgroundColorInterpolation2 = fillAnim2.interpolate({
        inputRange: [0, 1],
        outputRange: [Colors.primary, Colors.danger],
    });

    const backgroundColorInterpolation3 = fillAnim3.interpolate({
        inputRange: [0, 1],
        outputRange: [Colors.primary, Colors.danger],
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <InternalHeader
                    sectionLabel="SEU PERFIL"
                    title="Perfil Individual"
                    onBack={() => router.back()}
                    rightIcon="settings-outline"
                    onRightPress={() => router.push('/PerfilIndividual/PerfilIndividual')}
                />

                <View style={styles.body}>
                    <Text style={styles.subtitle}>Selecione uma neoplasia</Text>
                    <Text style={styles.hint}>Segure para escolher</Text>

                    <View style={styles.grid}>
                        <Animated.View style={[styles.squareButton, { backgroundColor: backgroundColorInterpolation1 }]}>
                            <TouchableOpacity
                                onPressIn={handlePressIn1}
                                onPressOut={handlePressOut1}
                                activeOpacity={1}
                                style={styles.squareButtonInner}
                            >
                                <FontAwesome5 name="mars" size={30} color={Colors.white} />
                                <Text style={styles.buttonText}>Próstata</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View style={[styles.squareButton, { backgroundColor: backgroundColorInterpolation2 }]}>
                            <TouchableOpacity
                                onPressIn={handlePressIn2}
                                onPressOut={handlePressOut2}
                                activeOpacity={1}
                                style={styles.squareButtonInner}
                            >
                                <FontAwesome5 name="stethoscope" size={30} color={Colors.white} />
                                <Text style={styles.buttonText}>Colorretal</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    <View style={styles.gridCentered}>
                        <Animated.View style={[styles.squareButtonWide, { backgroundColor: backgroundColorInterpolation3 }]}>
                            <TouchableOpacity
                                onPressIn={handlePressIn3}
                                onPressOut={handlePressOut3}
                                activeOpacity={1}
                                style={styles.squareButtonInner}
                            >
                                <FontAwesome5 name="lungs" size={30} color={Colors.white} />
                                <Text style={styles.buttonText}>Pulmão</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    <Animated.View
                        style={[styles.lottieWrapper, { transform: [{ rotateZ: headRotateY.interpolate({ inputRange: [-12, 12], outputRange: ['-12deg', '12deg'] }) }, { rotateX: headRotateX.interpolate({ inputRange: [-8, 8], outputRange: ['-8deg', '8deg'] }) }] }]}
                    >
                        <LottieView
                            source={require('../../assets/lottie/homem2.json')}
                            autoPlay
                            loop={true}
                            style={styles.lottie}
                        />
                    </Animated.View>
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
        fontSize: 18,
        color: Colors.textPrimary,
        fontFamily: 'Poppins-SemiBold',
        marginBottom: Spacing.xs,
    },
    hint: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontFamily: 'Poppins-Regular',
        marginBottom: Spacing.xl,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: Spacing.sm,
    },
    gridCentered: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginBottom: Spacing.xxl,
    },
    squareButton: {
        width: '47%',
        aspectRatio: 1,
        marginVertical: Spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Radius.lg,
        padding: 6,
        borderWidth: 2,
        borderColor: Colors.border,
        ...(Shadows.card as object),
    },
    squareButtonWide: {
        width: '47%',
        aspectRatio: 1,
        marginVertical: Spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Radius.lg,
        padding: 6,
        borderWidth: 2,
        borderColor: Colors.border,
        ...(Shadows.card as object),
    },
    squareButtonInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        marginTop: Spacing.sm,
        fontFamily: 'Poppins-SemiBold',
        textAlign: 'center',
    },
    lottieWrapper: {
        marginBottom: Spacing.lg,
    },
    lottie: {
        width: 300,
        height: 200,
    },
});
