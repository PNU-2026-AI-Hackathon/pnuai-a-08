import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radius } from '@/constants/theme';

export function MagazineAiButton({ title, description }: { title: string; description: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="AI와 대화하기"
      onPress={() =>
        router.push({
          pathname: '/(tabs)/home/ai',
          params: { contextTitle: title.replaceAll('\n', ' '), contextDescription: description },
        })
      }
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name="sparkles" size={16} color="#33291F" />
      <Text style={styles.label}>AI와 대화하기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    zIndex: 20,
    right: 18,
    bottom: 16,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: '#D8FF45',
    borderWidth: 1,
    borderColor: 'rgba(52,39,31,0.16)',
    shadowColor: '#34271F',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 7,
  },
  label: { color: '#33291F', fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
