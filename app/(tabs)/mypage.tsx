import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';

function MenuCard({ title, description, onPress }: { title: string; description: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuCard, pressed && styles.pressed]}>
      <View><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuDescription}>{description}</Text></View>
      <Ionicons name="chevron-forward" size={18} color="#B1ADB4" />
    </Pressable>
  );
}

export default function MyPageScreen() {
  const { user, isGuest, signOutUser } = useAuth();
  const profile = useUserProfile(user?.uid ?? '');
  const insets = useSafeAreaInsets();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
      setLogoutOpen(false);
      router.replace('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      Alert.alert('로그아웃하지 못했어요', '네트워크 연결을 확인한 뒤 다시 시도해주세요.');
    } finally {
      setSigningOut(false);
    }
  };

  if (isGuest || !user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}><Text style={styles.headerTitle}>마이페이지</Text></View>
        <View style={styles.guestState}>
          <Ionicons name="person-circle-outline" size={68} color="#A0B243" />
          <Text style={styles.guestTitle}>로그인 후 이용할 수 있어요.</Text>
          <Pressable onPress={() => router.push('/login')} style={styles.loginButton}><Text style={styles.loginText}>로그인하기</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const nickname = profile?.nickname || user.displayName || user.email?.split('@')[0] || '서로서가';
  const email = profile?.email || user.email || '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}><Text style={styles.headerTitle}>마이페이지</Text></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          {profile?.photoURL ? <Image source={{ uri: profile.photoURL }} style={styles.profileImage} /> : (
            <View style={styles.profileImage}><Image source={require('../../assets/images/rental-symbol.png')} style={styles.symbol} resizeMode="contain" /></View>
          )}
          <View style={styles.profileCopy}><Text numberOfLines={1} style={styles.nickname}>{nickname}</Text><Text numberOfLines={1} style={styles.email}>{email}</Text></View>
        </View>
        <MenuCard title="개인정보 수정" description="계정 정보를 수정합니다." onPress={() => router.push('/profile-edit')} />
        <MenuCard title="로그아웃" description="현재 기기에서 로그아웃" onPress={() => setLogoutOpen(true)} />
        <MenuCard title="회원 탈퇴" description="서로서가 서비스 탈퇴" onPress={() => router.push('/withdraw')} />
        <MenuCard title="대여 내역" description="완료된 대여 기록을 조회합니다." onPress={() => router.push('/rental-history')} />
      </ScrollView>

      <Modal visible={logoutOpen} transparent animationType="slide" onRequestClose={() => setLogoutOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setLogoutOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(28, insets.bottom + 18) }]} onPress={() => undefined}>
            <View style={styles.handle} /><Text style={styles.sheetTitle}>로그아웃</Text><Text style={styles.sheetDescription}>현재 기기에서 로그아웃합니다.</Text>
            <Pressable disabled={signingOut} onPress={() => void signOut()} style={styles.logoutButton}>
              {signingOut ? <ActivityIndicator color="#FFF" /> : <Text style={styles.logoutText}>로그아웃</Text>}
            </Pressable>
            <Pressable onPress={() => setLogoutOpen(false)} style={styles.cancel}><Text style={styles.cancelText}>취소</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' }, header: { height: 77, alignItems: 'center', justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#878787' }, headerTitle: { color: '#111', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  content: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 30, gap: 9 }, profileCard: { height: 106, marginBottom: 1, borderWidth: 1.5, borderColor: '#B5D32C', borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17 },
  profileImage: { width: 67, height: 67, borderRadius: 17, backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center' }, symbol: { width: 44, height: 42 }, profileCopy: { flex: 1, marginLeft: 16 }, nickname: { color: '#1D1D23', fontSize: 16, fontWeight: '800' }, email: { marginTop: 7, color: '#85818A', fontSize: 9 },
  menuCard: { height: 78, borderWidth: 1, borderColor: '#E6E1E9', borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, backgroundColor: '#FFF' }, menuTitle: { color: '#1D1D23', fontSize: 14, fontWeight: '800' }, menuDescription: { marginTop: 7, color: '#85818A', fontSize: 10 }, pressed: { opacity: 0.6 },
  guestState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }, guestTitle: { marginTop: 13, color: '#58534E', fontSize: 15, fontWeight: '800' }, loginButton: { marginTop: 20, height: 44, paddingHorizontal: 28, borderRadius: 12, backgroundColor: '#BBDD2A', alignItems: 'center', justifyContent: 'center' }, loginText: { color: '#FFF', fontWeight: '900' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }, sheet: { minHeight: 250, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#FFF', paddingHorizontal: 34, paddingTop: 14 }, handle: { width: 69, height: 4, borderRadius: 99, backgroundColor: '#E2DDE5', alignSelf: 'center' }, sheetTitle: { marginTop: 31, color: '#1D1D23', fontSize: 22, fontWeight: '900' }, sheetDescription: { marginTop: 9, color: '#85818A', fontSize: 14 },
  logoutButton: { height: 45, marginTop: 20, borderRadius: 12, backgroundColor: '#F45659', alignItems: 'center', justifyContent: 'center' }, logoutText: { color: '#FFF', fontSize: 15, fontWeight: '900' }, cancel: { height: 42, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: '#85818A', fontSize: 15, fontWeight: '800' },
});
