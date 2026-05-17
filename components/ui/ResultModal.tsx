import React from 'react';
import { Modal, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { Colors, Typography, Spacing, Radius } from '@/constants/Theme';

interface ResultModalProps {
  visible: boolean;
  resultado: string | null;
  onClose: () => void;
}

function getRiskInfo(text: string): {
  color: string;
  bgLight: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  const lower = text.toLowerCase();
  if (lower.includes('alto risco')) {
    return { color: Colors.danger, bgLight: '#fff1f1', label: 'Alto Risco', icon: 'alert-circle' };
  }
  if (lower.includes('maior risco')) {
    return { color: Colors.warning, bgLight: '#fffbeb', label: 'Risco Elevado', icon: 'warning' };
  }
  return { color: Colors.success, bgLight: '#f0fdf4', label: 'Risco Habitual', icon: 'checkmark-circle' };
}

export function ResultModal({ visible, resultado, onClose }: ResultModalProps) {
  if (!resultado) return null;
  const { color, bgLight, label, icon } = getRiskInfo(resultado);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,45,99,0.55)' }}>
        <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', maxHeight: '82%' }}>

          {/* Cabeçalho colorido */}
          <View style={{ backgroundColor: color, paddingTop: Spacing.xxl, paddingBottom: Spacing.xl, paddingHorizontal: Spacing.xl, alignItems: 'center' }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md }}>
              <Ionicons name={icon} size={40} color={Colors.white} />
            </View>
            <Text style={{ ...Typography.label, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>SEU RESULTADO</Text>
            <Text style={{ ...Typography.title, color: Colors.white }}>{label}</Text>
          </View>

          {/* Corpo */}
          <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl }} showsVerticalScrollIndicator={false}>
            <View style={{ backgroundColor: bgLight, borderRadius: Radius.md, padding: Spacing.lg }}>
              <Text style={{ ...Typography.body, color: Colors.textPrimary, textAlign: 'center', lineHeight: 24 }}>
                {resultado}
              </Text>
            </View>
            <Button label="Entendido" onPress={onClose} />
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}
