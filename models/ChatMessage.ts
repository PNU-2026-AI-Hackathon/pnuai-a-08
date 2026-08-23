export type MeetingPlace = {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
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

export type ChatMessage = {
  id: string;
  senderId: string;
  type: 'TEXT' | 'MEETING';
  text: string;
  createdAt: string;
  meeting?: MeetingProposal;
};
