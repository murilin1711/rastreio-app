import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, FlatList, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/firebase-config';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { Colors, Spacing, Typography, Radius } from '@/constants/Theme';

export default function ProximosExames() {
    const [proximosExames, setProximosExames] = useState<{ exame: string; date: string }[]>([]);
    const user = auth.currentUser;

    const fetchProximosExames = async () => {
        if (user) {
            try {
                const userDocRef = doc(db, 'usuarios', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    console.log('Dados do usuário recuperados do Firestore:', userData);

                    const exames = [];

                    if (userData.proximoExamePulmao) {
                        exames.push({
                            exame: 'Tomografia Computadorizada (Pulmão)',
                            date: userData.proximoExamePulmao,
                        });
                    }

                    if (userData.proximoExameColorretal) {
                        exames.push({
                            exame: 'Colonoscopia (Colorretal)',
                            date: userData.proximoExameColorretal,
                        });
                    }

                    if (userData.proximoExameMama) {
                        exames.push({
                            exame: 'Mamografia (Mama)',
                            date: userData.proximoExameMama,
                        });
                    }

                    if (userData.proximoExameColoDeUtero) {
                        exames.push({
                            exame: 'Citologia Oncótica (Colo de Útero)',
                            date: userData.proximoExameColoDeUtero,
                        });
                    }

                    if (userData.proximoExameProstata) {
                        exames.push({
                            exame: 'PSA (Próstata)',
                            date: userData.proximoExameProstata,
                        });
                    }

                    console.log('Exames formatados para exibição:', exames);

                    setProximosExames(exames);
                } else {
                    console.log('Nenhum documento encontrado para o usuário no Firestore.');
                }
            } catch (error) {
                console.error('Erro ao buscar exames do Firestore:', error);
            }
        } else {
            console.log('Usuário não autenticado.');
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchProximosExames();
        }, [user])
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const excluirExame = async (index: number) => {
        if (!user) return;

        const exameRemovido = proximosExames[index];
        const novosExames = proximosExames.filter((_, i) => i !== index);

        try {
            const userDocRef = doc(db, 'usuarios', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const updates: any = {};

                if (exameRemovido.exame.includes('Pulmão')) {
                    updates.proximoExamePulmao = null;
                } else if (exameRemovido.exame.includes('Colorretal')) {
                    updates.proximoExameColorretal = null;
                } else if (exameRemovido.exame.includes('Mama')) {
                    updates.proximoExameMama = null;
                } else if (exameRemovido.exame.includes('Colo de Útero')) {
                    updates.proximoExameColoDeUtero = null;
                } else if (exameRemovido.exame.includes('Próstata')) {
                    updates.proximoExameProstata = null;
                }

                await updateDoc(userDocRef, updates);
                setProximosExames(novosExames);
                Alert.alert('Sucesso', 'Exame excluído com sucesso.');
            }
        } catch (error) {
            console.error('Erro ao excluir exame:', error);
            Alert.alert('Erro', 'Não foi possível excluir o exame. Tente novamente.');
        }
    };

    const confirmarExclusao = (index: number) => {
        Alert.alert(
            'Excluir Exame',
            'Tem certeza que deseja excluir este exame?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Excluir', style: 'destructive', onPress: () => excluirExame(index) },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <ScrollView showsVerticalScrollIndicator={false}>
                <InternalHeader sectionLabel="AGENDA" title="Próximos Exames" />
                <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
                    <FlatList
                        data={proximosExames}
                        keyExtractor={(item, index) => index.toString()}
                        scrollEnabled={false}
                        renderItem={({ item, index }) => (
                            <View style={styles.itemContainer}>
                                <View style={styles.itemTextContainer}>
                                    <Text style={styles.itemTitle}>{item.exame}</Text>
                                    <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => confirmarExclusao(index)}
                                >
                                    <MaterialIcons name="delete" size={24} color={Colors.white} />
                                </TouchableOpacity>
                            </View>
                        )}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>Nenhum próximo exame agendado.</Text>
                        }
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: Radius.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemTitle: {
        ...Typography.subheading,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    itemDate: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
    deleteButton: {
        backgroundColor: '#dc2626',
        padding: Spacing.sm,
        borderRadius: Radius.pill,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: Spacing.sm,
    },
    emptyText: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginVertical: Spacing.sm,
    },
});
