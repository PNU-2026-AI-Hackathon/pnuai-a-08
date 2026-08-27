import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatMessage, MeetingPlace } from '@/models/ChatMessage';

type Props = {
  message: ChatMessage | null;
  currentUserId: string;
  isAccepting: boolean;
  onClose: () => void;
  onAccept: (message: ChatMessage) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value));
}

function AppointmentSection({ title, date, place }: { title: string; date: string; place: MeetingPlace }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.valueLabel}>날짜 및 시간</Text>
        <Text numberOfLines={1} style={styles.value}>{formatDate(date)}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.valueLabel}>장소</Text>
        <Text numberOfLines={1} style={styles.value}>{place.name}</Text>
      </View>
      <View style={styles.mapPreview}>
        <View style={styles.roadOne} />
        <View style={styles.roadTwo} />
        <Ionicons name="location" size={38} color="#D74E41" />
        <Text numberOfLines={2} style={styles.address}>{place.address}</Text>
      </View>
    </View>
  );
}

export function MeetingDetailModal({ message, currentUserId, isAccepting, onClose, onAccept }: Props) {
  const meeting = message?.meeting;
  const accepted = meeting?.status === 'ACCEPTED';
  const canAccept = Boolean(message && meeting && message.senderId !== currentUserId && !accepted);

  return (
    <Modal visible={Boolean(message)} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerSpace} />
          <Text style={styles.title}>약속 확인</Text>
          <Pressable onPress={onClose} style={styles.close}><Ionicons name="close" size={25} color="#111" /></Pressable>
        </View>
        {meeting ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <AppointmentSection title="대여" date={meeting.loanAt} place={meeting.loanPlace} />
            <AppointmentSection title="반납" date={meeting.returnAt} place={meeting.returnPlace} />
            <Pressable
              disabled={!canAccept || isAccepting}
              onPress={() => message && onAccept(message)}
              style={[styles.accept, (!canAccept || isAccepting) && styles.acceptDisabled]}
            >
              {isAccepting ? <ActivityIndicator color="#FFF" /> : (
                <Text style={styles.acceptText}>
                  {accepted ? '성사된 약속이에요' : canAccept ? '약속 수락' : '상대방의 수락을 기다리고 있어요'}
                </Text>
              )}
            </Pressable>
            <Text style={styles.notice}>
              약속 수락 후 대여 시작 전까지 홈의 빌린 책에 대여 예정으로 표시됩니다.
            </Text>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' }, header: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  headerSpace: { width: 40 }, close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, title: { color: '#111', fontSize: 18, fontWeight: '900' },
  content: { paddingHorizontal: 34, paddingBottom: 30 }, section: { marginTop: 24 }, sectionTitle: { marginBottom: 13, color: '#111', fontSize: 18, fontWeight: '900' },
  valueRow: { height: 46, marginBottom: 9, borderWidth: 1.5, borderColor: '#C0DA3B', borderRadius: 11, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  valueLabel: { color: '#A6C321', fontSize: 15, fontWeight: '800' }, value: { flex: 1, marginLeft: 12, color: '#A6C321', textAlign: 'right', fontSize: 12 },
  mapPreview: { height: 130, overflow: 'hidden', borderRadius: 14, backgroundColor: '#333532', alignItems: 'center', justifyContent: 'center', padding: 16 },
  roadOne: { position: 'absolute', width: 450, height: 9, backgroundColor: '#838683', transform: [{ rotate: '21deg' }] }, roadTwo: { position: 'absolute', width: 450, height: 9, backgroundColor: '#838683', transform: [{ rotate: '-58deg' }] },
  address: { marginTop: 5, color: '#FFF', fontSize: 10, textAlign: 'center' }, accept: { height: 48, marginTop: 32, borderRadius: 13, backgroundColor: '#BBDD2A', alignItems: 'center', justifyContent: 'center' },
  acceptDisabled: { backgroundColor: '#D0D0C8' }, acceptText: { color: '#FFF', fontSize: 15, fontWeight: '900' }, notice: { marginTop: 10, color: '#89847F', fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
