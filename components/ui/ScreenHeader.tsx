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
  header:         { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 36 },
  crab:           { position: 'absolute', top: Spacing.lg, right: Spacing.lg },
  appLabel:       { ...Typography.label, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  greeting:       { ...Typography.display, color: Colors.white, marginBottom: Spacing.md, fontSize: 22 },
  card:           {
    position: 'absolute',
    bottom: -28,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  cardInfo:       {},
  cardLabel:      { ...Typography.label, fontSize: 9, color: Colors.textMuted, marginBottom: 2 },
  cardName:       { ...Typography.heading, fontSize: 13, color: Colors.textPrimary },
  cardDate:       { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  cardButton:     { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 11 },
  cardButtonText: { ...Typography.label, color: Colors.white },
});
