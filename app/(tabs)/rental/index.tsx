import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type RentalActionProps = {
  label: string;
  color: string;
  accessibilityHint: string;
  onPress: () => void;
};

function RentalAction({ label, color, accessibilityHint, onPress }: RentalActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
    >
      <Ionicons name="arrow-forward" color={color} size={32} style={styles.arrow} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export default function RentalScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Image
        source={require('../../../assets/login/seoroseoga-wordmark.png')}
        style={styles.wordmark}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="서로서가"
      />

      <View style={styles.content}>
        <Image
          source={require('../../../assets/images/rental-symbol.png')}
          style={styles.symbol}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="서로서가 심볼"
        />

        <View style={styles.actions}>
          <RentalAction
            label="빌릴래요"
            color="#B7D81E"
            accessibilityHint="대여 가능한 책 둘러보기 화면으로 이동합니다"
            onPress={() => router.push('/rental/borrow')}
          />
          <RentalAction
            label="빌려줄래요"
            color="#5D442D"
            accessibilityHint="빌려줄 책 등록 화면으로 이동합니다"
            onPress={() => router.push('/rental/lend')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  wordmark: {
    position: 'absolute',
    top: 24,
    left: '50%',
    marginLeft: -58.5,
    width: 117,
    height: 25,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -32 }],
  },
  symbol: {
    width: 43,
    height: 41,
  },
  actions: {
    width: 176,
    marginTop: 38,
    gap: 10,
  },
  action: {
    width: '100%',
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actionPressed: {
    opacity: 0.62,
  },
  arrow: { marginRight: 16 },
  actionLabel: {
    color: '#5D442D',
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.7,
  },
});
