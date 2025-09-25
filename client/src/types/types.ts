export type UserPayload = {
  username: string;
  userId: string;
  online: boolean;
};

export type Message = {
  toUserId: string;
  fromUserId: string;
  content: string;
};
