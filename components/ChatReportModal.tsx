import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatReportReason, chatReportReasonOptions } from '@/models/ChatModeration';

type ChatReportModalProps = {
  visible: boolean;
  otherUserName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (reason: ChatReportReason) => void;
};

export function ChatReportModal({
  visible,
  otherUserName,
  isSubmitting,
  onClose,
  onSubmit,
}: ChatReportModalProps) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ChatReportReason | null>(null);

  useEffect(() => {
    if (!visible) setReason(null);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isSubmitting ? undefined : onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="신고 창 닫기"
        disabled={isSubmitting}
        onPress={onClose}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityRole="none"
          onPress={(event) => event.stopPropagation()}
          style={[styles.sheet, { paddingBottom: Math.max(24, insets.bottom + 12) }]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>신고하기</Text>
          <Text style={styles.description}>
            {otherUserName}님의 어떤 행동을 신고하시나요?
          </Text>

          <View style={styles.reasons}>
            {chatReportReasonOptions.map((option) => {
              const selected = reason === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setReason(option.value)}
                  style={({ pressed }) => [styles.reason, pressed && styles.pressed]}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={21}
                    color={selected ? '#A5BE28' : '#9B9B9B'}
                  />
                  <Text style={styles.reasonLabel}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Pressable disabled={isSubmitting} onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              disabled={!reason || isSubmitting}
              onPress={() => reason && onSubmit(reason)}
              style={[styles.submitButton, (!reason || isSubmitting) && styles.submitDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitText}>신고 접수</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: '#FFF',
  },
  handle: {
    width: 42,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
    backgroundColor: '#D6D6D6',
  },
  title: {
    marginTop: 18,
    color: '#2B2019',
    fontSize: 20,
    fontWeight: '900',
  },
  description: {
    marginTop: 7,
    color: '#746E69',
    fontSize: 13,
  },
  reasons: {
    marginTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDD',
  },
  reason: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDD',
  },
  pressed: { opacity: 0.58 },
  reasonLabel: {
    color: '#222',
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#EEE',
  },
  cancelText: { color: '#555', fontSize: 14, fontWeight: '800' },
  submitButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FF4B4B',
  },
  submitDisabled: { opacity: 0.38 },
  submitText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});
