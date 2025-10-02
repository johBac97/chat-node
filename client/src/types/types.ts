export type UserPayload = {
  username: string;
  userId: string;
  online: boolean;
};

export type Message = {
  toUserId: string;
  fromUserId: string;
  content: string;
  id: string | null;
  timestamp: Date | null;
};

export type ClientMessage = {
  toUserId: string;
  fromUserId: string;
  content: string;
};

export type Chats = {
  [userId: string]: Message[];
};
