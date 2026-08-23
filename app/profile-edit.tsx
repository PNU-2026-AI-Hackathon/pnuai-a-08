import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { userRepository } from '@/services/userRepository';

export default function ProfileEditScreen() {
  const { user } = useAuth();
  const profile = useUserProfile(user?.uid ?? '');
  const [nickname, setNickname] = useState(() => user?.displayName ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (profile?.nickname) setNickname(profile.nickname); }, [profile?.nickname]);

  const save = async () => {
    if (!user) return;
    if (nickname.trim().length < 2 || nickname.trim().length > 20) {
      Alert.alert('닉네임을 확인해주세요', '닉네임은 2자 이상 20자 이하로 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      await userRepository.updateNickname(user.uid, nickname);
      Alert.alert('저장했어요', '닉네임이 변경되었습니다.', [{ text: '확인', onPress: () => router.back() }]);
    } catch {
      Alert.alert('저장하지 못했어요', 'Firestore 연결을 확인한 뒤 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={23} color="#111" /></Pressable>
          <Text style={styles.title}>개인정보 수정</Text><View style={styles.back} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}><Text style={styles.label}>닉네임</Text><TextInput value={nickname} onChangeText={setNickname} maxLength={20} placeholder="닉네임을 입력하세요" placeholderTextColor="#85818A" style={styles.input} /></View>
          <View style={styles.field}><Text style={styles.label}>이메일</Text><View style={[styles.input, styles.readOnly]}><Text numberOfLines={1} style={styles.readOnlyText}>{profile?.email || user?.email || ''}</Text></View></View>
          <View style={styles.googleNotice}>
            <Ionicons name="logo-google" size={25} color="#A0B243" />
            <View style={styles.googleCopy}><Text style={styles.googleTitle}>Google 계정으로 로그인 중</Text><Text style={styles.googleDescription}>비밀번호는 서로서가에 저장되지 않으며 Google 계정에서 관리합니다.</Text></View>
          </View>
        </ScrollView>
        <Pressable disabled={saving || !user} onPress={() => void save()} style={[styles.save, (saving || !user) && styles.disabled]}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>저장</Text>}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' }, page: { flex: 1 }, header: { height: 77, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#878787', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13 }, back: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }, title: { color: '#111', fontSize: 18, fontWeight: '900' },
  content: { paddingHorizontal: 38, paddingTop: 18 }, field: { marginTop: 17 }, label: { marginBottom: 8, color: '#111', fontSize: 15, fontWeight: '900' }, input: { height: 43, borderWidth: 1, borderColor: 'rgba(0,0,0,0.5)', borderRadius: 7, paddingHorizontal: 9, justifyContent: 'center', color: '#333', fontSize: 14 }, readOnly: { backgroundColor: '#F6F5F3' }, readOnlyText: { color: '#85818A', fontSize: 14 },
  googleNotice: { minHeight: 82, marginTop: 34, borderRadius: 13, backgroundColor: '#F5F7E9', flexDirection: 'row', alignItems: 'center', padding: 15 }, googleCopy: { flex: 1, marginLeft: 12 }, googleTitle: { color: '#4F5630', fontSize: 14, fontWeight: '800' }, googleDescription: { marginTop: 5, color: '#85818A', fontSize: 11, lineHeight: 16 },
  save: { height: 48, marginHorizontal: 37, marginBottom: 12, borderRadius: 13, backgroundColor: '#BBDD2A', alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.5 }, saveText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
});
