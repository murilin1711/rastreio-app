import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { auth, db } from '../../../../config/firebase-config';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InternalHeader } from '@/components/ui/InternalHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors, Typography, Spacing, Radius } from '@/constants/Theme';

export default function SeusExamesDeRastreioColorretalFeminino() {
    const [proximoExame, setProximoExame] = useState<string | null>(null);
    const [examesAnteriores, setExamesAnteriores] = useState<{ exame: string; date: string; photo?: string }[]>([]);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [isImageModalVisible, setImageModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [exameSelecionado, setExameSelecionado] = useState<string | null>(null);
    const user = auth.currentUser;

    useEffect(() => {
        const fetchExames = async () => {
            if (user) {
                const userDocRef = doc(db, 'usuarios', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setProximoExame(userData.proximoExameColorretal || null);
                    setExamesAnteriores(userData.examesAnterioresColorretalFeminino || []);
                }
            }
        };
        fetchExames();
    }, [user]);

    const showDatePicker = () => setDatePickerVisibility(true);
    const hideDatePicker = () => setDatePickerVisibility(false);
    const openModal = () => setModalVisible(true);
    const closeModal = () => setModalVisible(false);
    const openImageModal = (uri: string | undefined) => {
        if (uri) {
            setSelectedImageUri(uri);
            setImageModalVisible(true);
        }
    };
    const closeImageModal = () => setImageModalVisible(false);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleDateConfirm = async (date: Date) => {
        const today = new Date();

        if (date > today) {
            Alert.alert(
                'Data Inválida',
                'Você não pode registrar uma data futura para o exame.',
                [{ text: 'OK', onPress: hideDatePicker }]
            );
            return;
        }

        if (exameSelecionado) {
            Alert.alert(
                'Resultado do Exame',
                'O resultado foi Normal ou Alterado?',
                [
                    {
                        text: 'Normal',
                        onPress: () => solicitarFoto(date, 'Normal'),
                    },
                    {
                        text: 'Alterado',
                        onPress: () => {
                            Alert.alert('Atenção', 'Procure um médico para melhor investigação.');
                            solicitarFoto(date, 'Alterado');
                        },
                    },
                ]
            );
        }
        hideDatePicker();
    };

    const solicitarFoto = async (date: Date, resultado: string) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão Negada', 'É necessário permitir acesso à galeria.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0].uri) {
            registrarExame(date, resultado, result.assets[0].uri);
        } else {
            Alert.alert('Foto não adicionada', 'Nenhuma foto foi selecionada.');
        }
    };

    const registrarExame = (date: Date, resultado: string, photoUri?: string) => {
        const formattedDate = date.toISOString();
        const novoExame = { exame: exameSelecionado || '', date: formattedDate, photo: photoUri || '' };
        const examesAtualizados = [...examesAnteriores, novoExame];
        setExamesAnteriores(examesAtualizados);

        let dataProximoExame: string | null = null;

        if (resultado === 'Normal') {
            const proximaData = new Date(date);
            proximaData.setFullYear(proximaData.getFullYear() + 10);
            dataProximoExame = proximaData.toISOString();
            setProximoExame(dataProximoExame);
        }

        if (user) {
            const userDocRef = doc(db, 'usuarios', user.uid);
            const updateData: any = {
                examesAnterioresColorretalFeminino: examesAtualizados,
            };

            if (dataProximoExame) {
                updateData.proximoExameColorretal = dataProximoExame;
            }

            updateDoc(userDocRef, updateData).catch((error) => {
                console.error('Erro ao atualizar os dados no Firebase:', error);
            });
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <ScrollView showsVerticalScrollIndicator={false}>
                <InternalHeader sectionLabel="SEUS EXAMES" title="Colorretal" />

                <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
                    {/* Próximo Exame */}
                    <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1, marginRight: Spacing.sm }}>
                            <Text style={{ ...Typography.subheading, color: Colors.textPrimary }}>Colonoscopia</Text>
                            <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
                                {proximoExame
                                    ? `Próximo: ${formatDate(proximoExame)}`
                                    : 'Nenhuma data marcada'}
                            </Text>
                        </View>
                        <StatusBadge status="pending" />
                    </Card>

                    {/* Botão Registrar */}
                    <Button label="Registrar Exame" onPress={openModal} pill style={{ marginTop: Spacing.sm }} />

                    {/* Exames Prévios */}
                    <Text style={{ ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.md }}>
                        Exames Prévios
                    </Text>

                    {examesAnteriores.length === 0 ? (
                        <Text style={{ ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginVertical: Spacing.sm }}>
                            Nenhum exame registrado.
                        </Text>
                    ) : (
                        examesAnteriores.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => item.photo && openImageModal(item.photo)}
                                activeOpacity={0.7}
                            >
                                <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Text style={{ ...Typography.body, color: Colors.textPrimary, flex: 1 }}>
                                        {`${item.exame} - ${formatDate(item.date)}`}
                                    </Text>
                                    {item.photo && (
                                        <Image source={{ uri: item.photo }} style={{ width: 50, height: 50, borderRadius: Radius.sm }} />
                                    )}
                                </Card>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Modal Selecionar Exame */}
            <Modal visible={isModalVisible} animationType="slide" transparent={true}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: Colors.background, padding: Spacing.xl, borderRadius: Radius.lg, alignItems: 'center', width: '80%' }}>
                        <Text style={{ ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.lg }}>Selecione o Exame</Text>
                        <Button
                            label="Colonoscopia"
                            onPress={() => {
                                setExameSelecionado('Colonoscopia');
                                showDatePicker();
                                closeModal();
                            }}
                            style={{ width: '100%', marginBottom: Spacing.sm }}
                        />
                        <Button
                            label="Cancelar"
                            variant="ghost"
                            onPress={closeModal}
                        />
                    </View>
                </View>
            </Modal>

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={hideDatePicker}
            />

            {/* Modal Imagem */}
            <Modal visible={isImageModalVisible} transparent={true} onRequestClose={closeImageModal}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
                    {selectedImageUri && (
                        <Image source={{ uri: selectedImageUri }} style={{ width: '90%', height: '80%', resizeMode: 'contain' }} />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}
