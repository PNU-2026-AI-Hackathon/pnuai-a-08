import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { MeetingComposerModal } from '@/components/MeetingComposerModal';
import { MeetingDetailModal } from '@/components/MeetingDetailModal';
import { useChatThread } from '@/hooks/useChatThread';
import { ChatMessage, MeetingProposal } from '@/models/ChatMessage';
import { chatRepository } from '@/services/chatRepository';

function formatDay(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
}

function formatMeetingDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value));
}

function MeetingCard({ message, mine, onOpen }: { message: ChatMessage; mine: boolean; onOpen: () => void }) {
  const meeting = message.meeting;
  if (!meeting) return null;
  return (
    <View style={[styles.meetingCard, mine ? styles.mineMeeting : styles.otherMeeting]}>
      <View style={styles.meetingHeader}><Text style={styles.meetingHeaderText}>{meeting.status === 'ACCEPTED' ? '대여 약속이 성사됐어요' : '약속을 만들었어요'}</Text></View>
      <View style={styles.meetingBody}>
        <Text style={styles.meetingLine}><Text style={styles.meetingStrong}>대여: </Text>{formatMeetingDate(meeting.loanAt)}</Text>
        <Text style={styles.meetingPlace}>         {meeting.loanPlace.name}</Text>
        <Text style={styles.meetingLine}><Text style={styles.meetingStrong}>반납: </Text>{formatMeetingDate(meeting.returnAt)}</Text>
        <Text style={styles.meetingPlace}>         {meeting.returnPlace.name}</Text>
        <Pressable onPress={onOpen} style={styles.meetingAction}>
          <Text style={styles.meetingActionText}>약속 보기</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MessageItem({ message, userId, showDay, onOpenMeeting }: { message: ChatMessage; userId: string; showDay: boolean; onOpenMeeting: (message: ChatMessage) => void }) {
  const mine = message.senderId === userId;
  return (
    <View>
      {showDay ? <Text style={styles.day}>{formatDay(message.createdAt)}</Text> : null}
      <View style={[styles.messageRow, mine ? styles.mineRow : styles.otherRow]}>
        {!mine ? <View style={styles.avatarSmall}><Ionicons name="person" size={20} color="#919191" /></View> : null}
        {message.type === 'MEETING' ? (
          <MeetingCard message={message} mine={mine} onOpen={() => onOpenMeeting(message)} />
        ) : mine ? (
          <LinearGradient colors={['#D0D9A0', '#C0DA3B']} style={styles.mineBubble}>
            <Text style={styles.bubbleText}>{message.text}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.otherBubble}><Text style={styles.bubbleText}>{message.text}</Text></View>
        )}
      </View>
    </View>
  );
}

const extraActions = [
  { label: '사진', icon: 'image-outline' as const },
  { label: '카메라', icon: 'camera-outline' as const },
  { label: '약속 잡기', icon: 'calendar-outline' as const },
  { label: '위치 공유', icon: 'location-outline' as const },
];

function BottomNavigation() {
  const items = [
    ['탐색', 'search-outline', '/(tabs)/explore'],
    ['도서 대여', 'book-outline', '/(tabs)/rental'],
    ['홈', 'home-outline', '/(tabs)/home'],
    ['채팅', 'chatbubble-outline', '/(tabs)/community'],
    ['마이페이지', 'person-circle-outline', '/(tabs)/mypage'],
  ] as const;
  return (
    <View style={styles.bottomNav}>
      {items.map(([label, icon, href]) => (
        <Pressable key={label} onPress={() => router.replace(href)} style={[styles.navItem, label === '채팅' && styles.navActive]}>
          <Ionicons name={icon} size={22} color={label === '채팅' ? '#91A52F' : '#B1B1B1'} />
          <Text style={[styles.navLabel, label === '채팅' && styles.navLabelActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function ChatThreadScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { room, messages, isLoading, error } = useChatThread(roomId ?? '', user?.uid ?? '');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<ChatMessage | null>(null);
  const [acceptingMeeting, setAcceptingMeeting] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (messages.length) requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length]);

  const send = async () => {
    if (!user || !input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      await chatRepository.sendMessage(roomId, user.uid, text);
    } catch (sendError) {
      console.error('메시지 전송 실패:', sendError);
      setInput(text);
      Alert.alert('전송하지 못했어요', '채팅방 상태를 확인한 뒤 다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  };

  const createMeeting = async (meeting: MeetingProposal) => {
    if (!user || savingMeeting) return;
    setSavingMeeting(true);
    try {
      await chatRepository.createMeetingProposal(roomId, user.uid, meeting);
      setMeetingOpen(false);
      setExtraOpen(false);
    } catch (meetingError) {
      console.error('약속 신청 실패:', meetingError);
      Alert.alert('약속을 만들지 못했어요', '입력한 날짜와 채팅방 상태를 확인해주세요.');
    } finally {
      setSavingMeeting(false);
    }
  };

  const openExtra = (label: string) => {
    if (label === '약속 잡기') {
      setMeetingOpen(true);
      return;
    }
    if (label === '위치 공유') {
      Alert.alert('위치 공유', '카카오 장소 검색 키가 연결되면 현재 위치 공유를 추가할 예정입니다.');
      return;
    }
    Alert.alert(`${label} 전송 준비 중`, 'Firebase Storage가 활성화된 뒤 이미지 전송을 연결합니다.');
  };

  const acceptMeeting = async (message: ChatMessage) => {
    if (!user || acceptingMeeting) return;
    setAcceptingMeeting(true);
    try {
      await chatRepository.acceptMeetingProposal(roomId, message.id, user.uid);
      setSelectedMeeting(null);
      Alert.alert('약속이 성사됐어요', '홈의 빌린 책에 대여 예정으로 추가했습니다.');
    } catch (acceptError) {
      console.error('약속 수락 실패:', acceptError);
      Alert.alert('약속을 수락하지 못했어요', '책이 이미 예약되었거나 대여할 수 없는 상태인지 확인해주세요.');
    } finally {
      setAcceptingMeeting(false);
    }
  };

  if (!user) {
    return <SafeAreaView style={styles.center}><Text style={styles.errorText}>채팅은 로그인 후 사용할 수 있어요.</Text></SafeAreaView>;
  }

  if (isLoading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color="#A6C321" /></SafeAreaView>;
  }

  if (error || !room) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error ?? '채팅방을 찾지 못했어요.'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backAction}><Text style={styles.backActionText}>돌아가기</Text></Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={23} color="#5D442D" /></Pressable>
          {room.otherUser.photoURL ? <Image source={{ uri: room.otherUser.photoURL }} style={styles.avatar} /> : (
            <View style={styles.avatar}><Ionicons name="person" size={27} color="#888" /></View>
          )}
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.userName}>{room.otherUser.displayName}</Text>
            <Text numberOfLines={1} style={styles.bookName}>{room.book.title} · {room.book.author}</Text>
          </View>
          {room.book.coverUrl ? <Image source={{ uri: room.book.coverUrl }} style={styles.bookCover} /> : (
            <LinearGradient colors={[...room.book.colors]} style={styles.bookCover}><Ionicons name="book" size={15} color="#FFF" /></LinearGradient>
          )}
          <Pressable onPress={() => Alert.alert('채팅방 메뉴', '채팅방 나가기와 신고 기능은 다음 단계에서 연결합니다.')} style={styles.menu}>
            <Ionicons name="menu" size={27} color="#111" />
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MessageItem
              message={item}
              userId={user.uid}
              showDay={index === 0 || formatDay(messages[index - 1].createdAt) !== formatDay(item.createdAt)}
              onOpenMeeting={setSelectedMeeting}
            />
          )}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.empty}>대여에 관해 첫 메시지를 보내보세요.</Text>}
        />

        <View style={styles.composerArea}>
          <View style={styles.composer}>
            <Pressable onPress={() => setExtraOpen((current) => !current)} style={styles.addButton}>
              <Ionicons name={extraOpen ? 'close' : 'add'} size={28} color="#777" />
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => void send()}
              placeholder="메시지를 입력하세요"
              placeholderTextColor="rgba(0,0,0,0.45)"
              style={styles.input}
              returnKeyType="send"
              maxLength={1000}
            />
            <Pressable disabled={sending || !input.trim()} onPress={() => void send()} style={styles.sendButton}>
              {sending ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send-outline" size={24} color="#FFF" />}
            </Pressable>
          </View>
          {extraOpen ? (
            <View style={styles.extraRow}>
              {extraActions.map((action) => (
                <Pressable key={action.label} onPress={() => openExtra(action.label)} style={styles.extraItem}>
                  <View style={styles.extraIcon}><Ionicons name={action.icon} size={29} color={action.label === '위치 공유' ? '#47C7F4' : '#9DBB37'} /></View>
                  <Text style={styles.extraLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
        <BottomNavigation />
        <View style={{ height: insets.bottom }} />
      </KeyboardAvoidingView>

      <MeetingComposerModal
        visible={meetingOpen}
        initialPlace={room.lendingPlace}
        isSaving={savingMeeting}
        onClose={() => setMeetingOpen(false)}
        onSubmit={(meeting) => void createMeeting(meeting)}
      />
      <MeetingDetailModal
        message={selectedMeeting}
        currentUserId={user.uid}
        isAccepting={acceptingMeeting}
        onClose={() => setSelectedMeeting(null)}
        onAccept={(message) => void acceptMeeting(message)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' }, page: { flex: 1, backgroundColor: '#FFF' }, center: { flex: 1, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', padding: 30 },
  errorText: { color: '#746E69', textAlign: 'center' }, backAction: { marginTop: 16, borderRadius: 99, backgroundColor: '#DDF06C', paddingHorizontal: 20, paddingVertical: 9 }, backActionText: { color: '#34271F', fontWeight: '800' },
  header: { height: 78, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#8B8986' },
  back: { width: 28, height: 44, alignItems: 'center', justifyContent: 'center' }, avatar: { width: 47, height: 47, borderRadius: 24, backgroundColor: '#E2E2E2', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0, marginLeft: 11 }, userName: { color: '#5D442D', fontSize: 14, fontWeight: '900' }, bookName: { marginTop: 5, color: '#555', fontSize: 10 },
  bookCover: { width: 30, height: 47, borderRadius: 4, alignItems: 'center', justifyContent: 'center' }, menu: { width: 43, height: 44, alignItems: 'center', justifyContent: 'center' },
  messages: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 16 }, empty: { marginTop: 80, color: '#AAA', textAlign: 'center', fontSize: 13 }, day: { marginVertical: 14, color: '#111', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }, mineRow: { justifyContent: 'flex-end' }, otherRow: { justifyContent: 'flex-start' }, avatarSmall: { width: 41, height: 41, marginRight: 10, borderRadius: 21, backgroundColor: '#E2E2E2', alignItems: 'center', justifyContent: 'center' },
  mineBubble: { maxWidth: '76%', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 }, otherBubble: { maxWidth: '72%', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#AEAEB2' }, bubbleText: { color: '#FFF', fontSize: 12, lineHeight: 20 },
  meetingCard: { width: 207, overflow: 'hidden', borderWidth: 1.5, borderColor: '#BBDD2A', borderRadius: 17, backgroundColor: '#FFF' }, mineMeeting: { marginLeft: 'auto' }, otherMeeting: {}, meetingHeader: { height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BBDD2A' },
  meetingHeaderText: { color: '#FFF', fontSize: 12, fontWeight: '800' }, meetingBody: { padding: 11 }, meetingLine: { color: '#555', fontSize: 11, lineHeight: 18 }, meetingStrong: { fontWeight: '900' }, meetingPlace: { color: '#555', fontSize: 11, lineHeight: 18 }, meetingAction: { height: 30, marginTop: 8, borderRadius: 10, backgroundColor: '#D9D9D9', alignItems: 'center', justifyContent: 'center' }, meetingActionText: { color: '#111', fontSize: 11, fontWeight: '800' },
  composerArea: { paddingHorizontal: 15, backgroundColor: '#FFF' }, composer: { height: 50, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.5)', borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5 }, addButton: { width: 34, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, height: 38, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.45)', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 0, color: '#222', fontSize: 14 }, sendButton: { width: 38, height: 38, marginLeft: 5, borderRadius: 11, backgroundColor: '#B8D83C', alignItems: 'center', justifyContent: 'center' },
  extraRow: { height: 112, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16 }, extraItem: { width: '24%', alignItems: 'center' }, extraIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#F1F1F1', alignItems: 'center', justifyContent: 'center' }, extraLabel: { marginTop: 7, color: '#111', fontSize: 11 },
  bottomNav: { height: 68, marginHorizontal: 16, marginTop: 10, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#FFF', shadowColor: '#5D442D', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 4 },
  navItem: { width: '19%', height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, navActive: { backgroundColor: '#F2FFC0' }, navLabel: { marginTop: 4, color: '#B1B1B1', fontSize: 9 }, navLabelActive: { color: '#91A52F', fontWeight: '800' },
});
