export type UserPayload = {
  username: string;
  userId: string;
  online: boolean;
};

export type Message = {
  recipientId: string;
  senderId: string;
  content: string;
  id: string;
  timestamp: Date;
};

export type ClientMessage = {
  recipientId: string;
  senderId: string;
  content: string;
};

export type Chats = {
  [userId: string]: Message[];
};
