import { Text, View } from 'react-native';
import { Colors, NeroImage, Typography } from '@ui/index';

// Provisório — substituído pelo roteador de entrada na Task 4.
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
      <NeroImage size={160} />
      <Text style={{ ...Typography.display, color: Colors.primary, marginTop: 16 }}>NERO</Text>
    </View>
  );
}
