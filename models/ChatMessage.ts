export type MeetingPlace = {
  placeId?: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  placeUrl?: string;
};

export type MeetingProposal = {
  loanAt: string;
  loanPlace: MeetingPlace;
  returnAt: string;
  returnPlace: MeetingPlace;
  status: 'PROPOSED' | 'ACCEPTED';
  acceptedBy?: string;
  acceptedAt?: string;
};

export type ChatImageAttachment = {
  downloadUrl: string;
  storagePath: string;
  mimeType: string;
  width?: number;
  height?: number;
  byteSize?: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  type: 'TEXT' | 'MEETING' | 'IMAGE';
  text: string;
  createdAt: string;
  meeting?: MeetingProposal;
  image?: ChatImageAttachment;
};
