import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Radius, Shadows } from '@/constants/Theme';

export default function PerfilIndividualMulher() {
    const router = useRouter();

    const fillAnim1 = useRef(new Animated.Value(0)).current;
    const fillAnim2 = useRef(new Animated.Value(0)).current;
    const fillAnim3 = useRef(new Animated.Value(0)).current;
    const fillAnim4 = useRef(new Animated.Value(0)).current;

    const [actionCompleted1, setActionCompleted1] = useState(false);
    const [actionCompleted2, setActionCompleted2] = useState(false);
    const [actionCompleted3, setActionCompleted3] = useState(false);
    const [actionCompleted4, setActionCompleted4] = useState(false);

    const handlePressIn1 = () => {
        Animated.timing(fillAnim1, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                setActionCompleted1(true);
                router.push('/PerfilIndividual/PerfilInformacoesNeoplasia?neoplasia=Colo de Útero');
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
                router.push('/PerfilIndividual/PerfilInformacoesNeoplasia?neoplasia=Mama');
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
                router.push('/PerfilIndividual/PerfilInformacoesNeoplasia?neoplasia=Colorretal');
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

    const handlePressIn4 = () => {
        Animated.timing(fillAnim4, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                setActionCompleted4(true);
                router.push('/PerfilIndividual/PerfilInformacoesNeoplasia?neoplasia=Pulmão');
            }
        });
    };

    const handlePressOut4 = () => {
        if (!actionCompleted4) {
            Animated.timing(fillAnim4, {
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

    const backgroundColorInterpolation4 = fillAnim4.interpolate({
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
                                <FontAwesome5 name="venus" size={30} color={Colors.white} />
                                <Text style={styles.buttonText}>Colo de Útero</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View style={[styles.squareButton, { backgroundColor: backgroundColorInterpolation2 }]}>
                            <TouchableOpacity
                                onPressIn={handlePressIn2}
                                onPressOut={handlePressOut2}
                                activeOpacity={1}
                                style={styles.squareButtonInner}
                            >
                                <FontAwesome5 name="ribbon" size={30} color={Colors.white} />
                                <Text style={styles.buttonText}>Mama</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View style={[styles.squareButton, { backgroundColor: backgroundColorInterpolation3 }]}>
                            <TouchableOpacity
                                onPressIn={handlePressIn3}
                                onPressOut={handlePressOut3}
                                activeOpacity={1}
                                style={styles.squareButtonInner}
                            >
                                <FontAwesome5 name="stethoscope" size={30} color={Colors.white} />
                                <Text style={styles.buttonText}>Colorretal</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View style={[styles.squareButton, { backgroundColor: backgroundColorInterpolation4 }]}>
                            <TouchableOpacity
                                onPressIn={handlePressIn4}
                                onPressOut={handlePressOut4}
                                activeOpacity={1}
                                style={styles.squareButtonInner}
                            >
                                <FontAwesome5 name="lungs" size={30} color={Colors.white} />
                                <Text style={styles.buttonText}>Pulmão</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    <LottieView
                        source={require('../../assets/lottie/mulher2.json')}
                        autoPlay
                        loop={true}
                        style={styles.lottie}
                    />
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
    lottie: {
        width: 300,
        height: 200,
        marginBottom: Spacing.lg,
    },
});
