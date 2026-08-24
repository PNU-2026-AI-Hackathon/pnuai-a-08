import { Ionicons } from '@expo/vector-icons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { ChatReportModal } from '@/components/ChatReportModal';
import { MeetingComposerModal } from '@/components/MeetingComposerModal';
import { MeetingDetailModal } from '@/components/MeetingDetailModal';
import { useChatThread } from '@/hooks/useChatThread';
import { ChatReportReason } from '@/models/ChatModeration';
import { ChatMessage, MeetingProposal } from '@/models/ChatMessage';
import { chatMediaRepository } from '@/services/chatMediaRepository';
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
  const imageRatio = message.image?.width && message.image.height
    ? message.image.width / message.image.height
    : 1;
  const imageHeight = Math.min(260, Math.max(125, 210 / imageRatio));
  return (
    <View>
      {showDay ? <Text style={styles.day}>{formatDay(message.createdAt)}</Text> : null}
      <View style={[styles.messageRow, mine ? styles.mineRow : styles.otherRow]}>
        {!mine ? <View style={styles.avatarSmall}><Ionicons name="person" size={20} color="#919191" /></View> : null}
        {message.type === 'MEETING' ? (
          <MeetingCard message={message} mine={mine} onOpen={() => onOpenMeeting(message)} />
        ) : message.type === 'IMAGE' && message.image ? (
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel="채팅 사진 크게 보기"
            onPress={() => void Linking.openURL(message.image!.downloadUrl)}
            style={[styles.imageMessage, { height: imageHeight }]}
          >
            <Image source={{ uri: message.image.downloadUrl }} resizeMode="cover" style={styles.chatImage} />
          </Pressable>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAction, setMenuAction] = useState<'leave' | 'block' | 'mute' | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [sendingMedia, setSendingMedia] = useState<'사진' | '카메라' | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (messages.length) requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length]);

  useEffect(() => {
    if (room) setNotificationsMuted(room.memberSettings.notificationsMuted);
  }, [room]);

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

  const sendPickedImage = async (asset: ImagePickerAsset, source: '사진' | '카메라') => {
    if (!user || sendingMedia) return;
    setSendingMedia(source);
    setExtraOpen(false);
    try {
      await chatMediaRepository.sendImage({
        roomId,
        senderId: user.uid,
        localUri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      });
    } catch (mediaError) {
      console.error('채팅 사진 전송 실패:', mediaError);
      const errorCode = mediaError instanceof Error ? mediaError.message : '';
      Alert.alert(
        '사진을 보내지 못했어요',
        errorCode === 'CHAT_IMAGE_TOO_LARGE'
          ? '10MB 이하의 사진을 선택해주세요.'
          : errorCode.includes('storage') || errorCode.includes('Storage')
            ? 'Firebase Storage가 활성화되어 있는지 확인해주세요.'
            : '사진 파일과 채팅방 상태를 확인한 뒤 다시 시도해주세요.',
      );
    } finally {
      setSendingMedia(null);
    }
  };

  const openImagePicker = async (source: '사진' | '카메라') => {
    if (sendingMedia) return;
    try {
      const ImagePicker = await import('expo-image-picker');
      const permission = source === '카메라'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          source === '카메라' ? '카메라 권한이 필요해요' : '사진 접근 권한이 필요해요',
          source === '카메라'
            ? '채팅에서 사진을 촬영하려면 카메라 권한을 허용해주세요.'
            : '채팅에 사진을 보내려면 사진 접근 권한을 허용해주세요.',
          permission.canAskAgain
            ? [{ text: '확인' }]
            : [
                { text: '취소', style: 'cancel' },
                { text: '설정 열기', onPress: () => void Linking.openSettings() },
              ],
        );
        return;
      }

      const result = source === '카메라'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.82 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82 });
      const asset = result.canceled ? undefined : result.assets[0];
      if (asset) await sendPickedImage(asset, source);
    } catch (pickerError) {
      console.error('이미지 선택기 실행 실패:', pickerError);
      Alert.alert(
        `${source}를 열지 못했어요`,
        '현재 설치된 development APK에 이미지 선택 모듈이 없습니다. 새 development APK를 설치해주세요.',
      );
    }
  };

  const openExtra = (label: string) => {
    if (label === '사진' || label === '카메라') {
      void openImagePicker(label);
      return;
    }
    if (label === '약속 잡기') {
      setMeetingOpen(true);
      return;
    }
    if (label === '위치 공유') {
      Alert.alert('위치 공유', '카카오 장소 검색 키가 연결되면 현재 위치 공유를 추가할 예정입니다.');
      return;
    }
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

  const leaveRoom = async () => {
    if (!user || menuAction) return;
    setMenuAction('leave');
    try {
      await chatRepository.leaveRoom(roomId, user.uid);
      setMenuOpen(false);
      router.replace('/(tabs)/community');
    } catch (leaveError) {
      console.error('채팅방 나가기 실패:', leaveError);
      Alert.alert('채팅방을 나가지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setMenuAction(null);
    }
  };

  const confirmLeaveRoom = () => {
    setMenuOpen(false);
    Alert.alert(
      '채팅방 나가기',
      '채팅 기록은 상대방에게 남아 있으며, 내 채팅 목록에서는 이 방이 사라집니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '나가기', style: 'destructive', onPress: () => void leaveRoom() },
      ],
    );
  };

  const blockUser = async () => {
    if (!user || menuAction) return;
    setMenuAction('block');
    try {
      await chatRepository.blockUser(roomId, user.uid);
      setMenuOpen(false);
      router.replace('/(tabs)/community');
      Alert.alert('차단했어요', '이 사용자의 채팅방은 목록에서 숨겨지고 새 메시지를 주고받을 수 없습니다.');
    } catch (blockError) {
      console.error('사용자 차단 실패:', blockError);
      Alert.alert('차단하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setMenuAction(null);
    }
  };

  const confirmBlockUser = () => {
    if (!room) return;
    setMenuOpen(false);
    Alert.alert(
      '차단하기',
      `${room.otherUser.displayName}님을 차단하면 서로 새 메시지를 주고받을 수 없고 채팅방이 목록에서 숨겨집니다.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '차단', style: 'destructive', onPress: () => void blockUser() },
      ],
    );
  };

  const submitReport = async (reason: ChatReportReason) => {
    if (!user || reporting) return;
    setReporting(true);
    try {
      await chatRepository.reportUser(roomId, user.uid, reason);
      setReportOpen(false);
      Alert.alert('신고가 접수됐어요', '운영진이 채팅방과 신고 내용을 확인할 예정입니다.');
    } catch (reportError) {
      console.error('채팅 신고 실패:', reportError);
      Alert.alert('신고를 접수하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setReporting(false);
    }
  };

  const toggleNotifications = async () => {
    if (!user || menuAction) return;
    const nextMuted = !notificationsMuted;
    setMenuAction('mute');
    try {
      await chatRepository.setNotificationsMuted(roomId, user.uid, nextMuted);
      setNotificationsMuted(nextMuted);
      setMenuOpen(false);
      Alert.alert(
        nextMuted ? '채팅방 알림을 해제했어요' : '채팅방 알림을 켰어요',
        nextMuted ? '이 채팅방의 새 메시지 알림을 받지 않습니다.' : '이 채팅방의 새 메시지 알림을 받습니다.',
      );
    } catch (muteError) {
      console.error('채팅방 알림 설정 실패:', muteError);
      Alert.alert('알림 설정을 바꾸지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setMenuAction(null);
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="채팅방 메뉴"
            onPress={() => setMenuOpen(true)}
            style={styles.menu}
          >
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
              {sendingMedia ? (
                <ActivityIndicator size="small" color="#9DBB37" />
              ) : (
                <Ionicons name={extraOpen ? 'close' : 'add'} size={28} color="#777" />
              )}
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
                <Pressable key={action.label} disabled={Boolean(sendingMedia)} onPress={() => openExtra(action.label)} style={styles.extraItem}>
                  <View style={styles.extraIcon}>
                    {sendingMedia === action.label ? (
                      <ActivityIndicator color="#9DBB37" />
                    ) : (
                      <Ionicons name={action.icon} size={29} color={action.label === '위치 공유' ? '#47C7F4' : '#9DBB37'} />
                    )}
                  </View>
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
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => !menuAction && setMenuOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="채팅방 메뉴 닫기"
          disabled={Boolean(menuAction)}
          onPress={() => setMenuOpen(false)}
          style={styles.menuBackdrop}
        >
          <Pressable
            accessibilityRole="menu"
            onPress={(event) => event.stopPropagation()}
            style={[styles.menuPopup, { top: insets.top + 78 }]}
          >
            <Pressable
              accessibilityRole="menuitem"
              disabled={Boolean(menuAction)}
              onPress={confirmLeaveRoom}
              style={({ pressed }) => [styles.menuOption, pressed && styles.menuOptionPressed]}
            >
              <Text style={[styles.menuOptionText, styles.leaveText]}>채팅방 나가기</Text>
            </Pressable>
            <Pressable
              accessibilityRole="menuitem"
              disabled={Boolean(menuAction)}
              onPress={confirmBlockUser}
              style={({ pressed }) => [styles.menuOption, pressed && styles.menuOptionPressed]}
            >
              <Text style={styles.menuOptionText}>차단하기</Text>
            </Pressable>
            <Pressable
              accessibilityRole="menuitem"
              disabled={Boolean(menuAction)}
              onPress={() => {
                setMenuOpen(false);
                setReportOpen(true);
              }}
              style={({ pressed }) => [styles.menuOption, pressed && styles.menuOptionPressed]}
            >
              <Text style={styles.menuOptionText}>신고하기</Text>
            </Pressable>
            <Pressable
              accessibilityRole="menuitem"
              disabled={Boolean(menuAction)}
              onPress={() => void toggleNotifications()}
              style={({ pressed }) => [styles.menuOption, styles.lastMenuOption, pressed && styles.menuOptionPressed]}
            >
              {menuAction === 'mute' ? (
                <ActivityIndicator size="small" color="#333" />
              ) : (
                <Text style={styles.menuOptionText}>
                  {notificationsMuted ? '채팅방 알림 켜기' : '채팅방 알림 해제'}
                </Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <ChatReportModal
        visible={reportOpen}
        otherUserName={room.otherUser.displayName}
        isSubmitting={reporting}
        onClose={() => setReportOpen(false)}
        onSubmit={(reason) => void submitReport(reason)}
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
  imageMessage: { width: 210, overflow: 'hidden', borderRadius: 12, backgroundColor: '#ECECEC' },
  chatImage: { width: '100%', height: '100%' },
  meetingCard: { width: 207, overflow: 'hidden', borderWidth: 1.5, borderColor: '#BBDD2A', borderRadius: 17, backgroundColor: '#FFF' }, mineMeeting: { marginLeft: 'auto' }, otherMeeting: {}, meetingHeader: { height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BBDD2A' },
  meetingHeaderText: { color: '#FFF', fontSize: 12, fontWeight: '800' }, meetingBody: { padding: 11 }, meetingLine: { color: '#555', fontSize: 11, lineHeight: 18 }, meetingStrong: { fontWeight: '900' }, meetingPlace: { color: '#555', fontSize: 11, lineHeight: 18 }, meetingAction: { height: 30, marginTop: 8, borderRadius: 10, backgroundColor: '#D9D9D9', alignItems: 'center', justifyContent: 'center' }, meetingActionText: { color: '#111', fontSize: 11, fontWeight: '800' },
  composerArea: { paddingHorizontal: 15, backgroundColor: '#FFF' }, composer: { height: 50, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.5)', borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5 }, addButton: { width: 34, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, height: 38, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.45)', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 0, color: '#222', fontSize: 14 }, sendButton: { width: 38, height: 38, marginLeft: 5, borderRadius: 11, backgroundColor: '#B8D83C', alignItems: 'center', justifyContent: 'center' },
  extraRow: { height: 112, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16 }, extraItem: { width: '24%', alignItems: 'center' }, extraIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#F1F1F1', alignItems: 'center', justifyContent: 'center' }, extraLabel: { marginTop: 7, color: '#111', fontSize: 11 },
  bottomNav: { height: 68, marginHorizontal: 16, marginTop: 10, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#FFF', shadowColor: '#5D442D', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 4 },
  navItem: { width: '19%', height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, navActive: { backgroundColor: '#F2FFC0' }, navLabel: { marginTop: 4, color: '#B1B1B1', fontSize: 9 }, navLabelActive: { color: '#91A52F', fontWeight: '800' },
  menuBackdrop: { flex: 1, backgroundColor: 'transparent' },
  menuPopup: {
    position: 'absolute',
    right: 6,
    width: 217,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#B1B1B1',
    borderRadius: 14,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  menuOption: {
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#B1B1B1',
  },
  lastMenuOption: { borderBottomWidth: 0 },
  menuOptionPressed: { backgroundColor: '#F4F4F4' },
  menuOptionText: { color: '#111', fontSize: 12, fontWeight: '800' },
  leaveText: { color: '#FF4B4B' },
});
