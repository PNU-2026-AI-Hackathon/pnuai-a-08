export const chatReportReasonOptions = [
  { value: 'ABUSE', label: '욕설 및 괴롭힘' },
  { value: 'FRAUD', label: '사기 또는 부적절한 대여' },
  { value: 'SPAM', label: '스팸 및 광고' },
  { value: 'OTHER', label: '기타 문제' },
] as const;

export type ChatReportReason = (typeof chatReportReasonOptions)[number]['value'];
