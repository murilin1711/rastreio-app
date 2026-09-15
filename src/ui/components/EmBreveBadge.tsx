import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

export function EmBreveBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>Em breve</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.chip, paddingVertical: 3, paddingHorizontal: Spacing.sm },
  text:  { ...Typography.caption, fontFamily: 'Poppins-SemiBold', color: Colors.textSecondary },
});
