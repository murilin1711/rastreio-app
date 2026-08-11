import * as EmailValidator from 'email-validator';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height } = Dimensions.get('window');
import { TextInputMask } from 'react-native-masked-text';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase-config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Typography, Spacing, Radius } from '@/constants/Theme';

const cadastroStyles = StyleSheet.create({
  hero:      { backgroundColor: Colors.primary, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  heroInner: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  backBtn:   { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md, marginBottom: Spacing.xl },
  label:     { ...Typography.label, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  title:     { ...Typography.display, color: Colors.white, fontSize: 26, marginBottom: Spacing.sm },
  tabs:      { flexDirection: 'row', gap: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.md, padding: 4, marginTop: Spacing.sm },
  tab:       { flex: 1, paddingVertical: 9, borderRadius: Radius.sm, alignItems: 'center' },
  tabText:   { ...Typography.subheading, fontSize: 13 },
});

const isValidCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;

  return true;
};

const isValidDate = (date: string): boolean => {
  const [day, month, year] = date.split('/').map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;
  const parsedDate = new Date(year, month - 1, day);
  if (parsedDate >= new Date()) return false;
  return true;
};

export default function TelaCadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'populacao' | 'saude'>('populacao');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCadastro = () => {
    if (!nome || !email || !cpf || !dataNascimento || !senha || !confirmarSenha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    if (!EmailValidator.validate(email)) {
      Alert.alert('Erro', 'Por favor, insira um endereço de email válido.');
      return;
    }
    if (!isValidCPF(cpf)) {
      Alert.alert('Erro', 'Por favor, insira um CPF válido.');
      return;
    }
    if (!isValidDate(dataNascimento)) {
      Alert.alert('Erro', 'Por favor, insira uma data de nascimento válida.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);

    createUserWithEmailAndPassword(auth, email, senha)
      .then(async (userCredential) => {
        const user = userCredential.user;
        await setDoc(doc(db, 'usuarios', user.uid), { nome, email, cpf, dataNascimento, tipoUsuario });
        await sendEmailVerification(user);
        setLoading(false);
        Alert.alert('Sucesso', 'Cadastro realizado com sucesso! Verifique seu email.');
        router.push('/paginaInicial');
      })
      .catch((error) => {
        setLoading(false);
        Alert.alert('Erro', error.message);
      });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Topo azul */}
        <View style={cadastroStyles.hero}>
          <SafeAreaView>
          <View style={cadastroStyles.heroInner}>
            <TouchableOpacity onPress={() => router.back()} style={cadastroStyles.backBtn}>
              <Ionicons name="chevron-back" size={18} color={Colors.white} />
            </TouchableOpacity>
            <Text style={cadastroStyles.label}>CRIAR CONTA</Text>
            <Text style={cadastroStyles.title}>Crie sua conta</Text>
            <View style={cadastroStyles.tabs}>
              <TouchableOpacity
                onPress={() => setTipoUsuario('populacao')}
                style={[cadastroStyles.tab, { backgroundColor: tipoUsuario === 'populacao' ? Colors.white : 'transparent' }]}
              >
                <Text style={[cadastroStyles.tabText, { color: tipoUsuario === 'populacao' ? Colors.primary : 'rgba(255,255,255,0.7)' }]}>Paciente</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTipoUsuario('saude')}
                style={[cadastroStyles.tab, { backgroundColor: tipoUsuario === 'saude' ? Colors.white : 'transparent' }]}
              >
                <Text style={[cadastroStyles.tabText, { color: tipoUsuario === 'saude' ? Colors.primary : 'rgba(255,255,255,0.7)' }]}>Profissional</Text>
              </TouchableOpacity>
            </View>
          </View>
          </SafeAreaView>
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md }} keyboardShouldPersistTaps="handled">
          <Input icon={<Ionicons name="person-outline" size={16} color={Colors.textMuted} />} placeholder="Nome completo" value={nome} onChangeText={setNome} />
          <Input icon={<Ionicons name="mail-outline" size={16} color={Colors.textMuted} />} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInputMask
            type={'cpf'}
            customTextInput={Input as any}
            customTextInputProps={{ icon: <Ionicons name="card-outline" size={16} color={Colors.textMuted} /> }}
            placeholder="CPF"
            value={cpf}
            onChangeText={setCpf}
          />
          <TextInputMask
            type={'custom'}
            options={{ mask: '99/99/9999' }}
            customTextInput={Input as any}
            customTextInputProps={{ icon: <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} /> }}
            placeholder="Data de Nascimento"
            value={dataNascimento}
            onChangeText={setDataNascimento}
          />
          <Input icon={<Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
          <Input icon={<Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />} placeholder="Confirmar Senha" secureTextEntry value={confirmarSenha} onChangeText={setConfirmarSenha} />
          <Button label="Criar conta" onPress={handleCadastro} loading={loading} style={{ marginTop: Spacing.sm }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
