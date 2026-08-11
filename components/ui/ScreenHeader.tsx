import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/Theme';
import { ProgressBar } from './ProgressBar';
import { CrabLottie } from './CrabLottie';

interface ScreenHeaderProps {
  greeting: string;
  progressValue: number;
  nextExamName?: string;
  nextExamDate?: string;
  onNextExamPress?: () => void;
}

export function ScreenHeader({ greeting, progressValue, nextExamName, nextExamDate, onNextExamPress }: ScreenHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <CrabLottie size={52} opacity={0.4} style={styles.crab} />
        <Text style={styles.appLabel}>Rastreando</Text>
        <Text style={styles.greeting}>{greeting}</Text>
        <ProgressBar
          value={progressValue}
          label={`${progressValue}% em dia`}
        />
      </View>

      {nextExamName && (
        <TouchableOpacity activeOpacity={0.85} onPress={onNextExamPress} style={styles.card}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>PRÓXIMO EXAME</Text>
            <Text style={styles.cardName}>{nextExamName}</Text>
            {nextExamDate && <Text style={styles.cardDate}>{nextExamDate}</Text>}
          </View>
          <View style={styles.cardButton}>
            <Text style={styles.cardButtonText}>Agendar</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:        { position: 'relative', zIndex: 1 },
  header:         { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: 44 },
  crab:           { position: 'absolute', top: Spacing.xxl, right: Spacing.lg },
  appLabel:       { ...Typography.label, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  greeting:       { ...Typography.display, color: Colors.white, marginBottom: Spacing.lg, fontSize: 30 },
  card:           {
    position: 'absolute',
    bottom: -36,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  cardInfo:       { flex: 1 },
  cardLabel:      { ...Typography.label, fontSize: 9, color: Colors.textMuted, marginBottom: 4 },
  cardName:       { ...Typography.heading, fontSize: 18, color: Colors.textPrimary },
  cardDate:       { ...Typography.body, fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardButton:     { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  cardButtonText: { ...Typography.label, color: Colors.white, fontSize: 11 },
});
