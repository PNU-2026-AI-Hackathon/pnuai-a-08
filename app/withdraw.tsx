import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WithdrawScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={23} color="#111" /></Pressable><Text style={styles.title}>회원 탈퇴</Text><View style={styles.back} /></View>
      <View style={styles.content}>
        <Image source={require('../pictures/Logo_full.png')} style={styles.wordmark} resizeMode="contain" />
        <Text style={styles.warning}>회원 탈퇴 시 계정이 삭제되며{`\n`}이후 복구할 수 없습니다.{`\n`}정말 탈퇴하시겠어요?</Text>
        <View style={styles.buttons}>
          <Pressable onPress={() => Alert.alert('탈퇴 기능 준비 중', '인증 계정과 대여 데이터를 안전하게 정리하는 백엔드 기능이 연결된 후 사용할 수 있습니다.')} style={styles.yes}><Text style={styles.yesText}>네</Text></Pressable>
          <Pressable onPress={() => router.back()} style={styles.no}><Text style={styles.noText}>아니요</Text></Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' }, header: { height: 77, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#878787', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13 }, back: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }, title: { color: '#111', fontSize: 18, fontWeight: '900' }, content: { flex: 1, alignItems: 'center', paddingTop: 176 },
  wordmark: { width: 123, height: 26 }, warning: { marginTop: 34, color: '#1D1D23', fontSize: 20, lineHeight: 31, fontWeight: '900', textAlign: 'center' }, buttons: { flexDirection: 'row', gap: 20, marginTop: 74 }, yes: { width: 120, height: 44, borderWidth: 1, borderColor: '#85818A', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, yesText: { color: '#85818A', fontSize: 15, fontWeight: '800' }, no: { width: 120, height: 44, borderRadius: 12, backgroundColor: '#BBDD2A', alignItems: 'center', justifyContent: 'center' }, noText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
});
