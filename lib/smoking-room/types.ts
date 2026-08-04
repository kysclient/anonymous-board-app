export const SMOKING_ROOM_MOODS = ["chill", "spicy", "secret", "funny"] as const;
export const SMOKING_ROOM_IDS = ["rooftop", "river", "alley", "space"] as const;

export type SmokingRoomMood = (typeof SMOKING_ROOM_MOODS)[number];
export type SmokingRoomId = (typeof SMOKING_ROOM_IDS)[number];

export interface SmokingRoomMessage {
  id: string;
  clientId: string;
  name: string;
  text: string;
  mood: SmokingRoomMood;
  roomId: SmokingRoomId;
  createdAt: number;
}

export type SmokingRoomClientEvent =
  | { type: "join"; clientId: string; name: string; roomId: SmokingRoomId }
  | { type: "profile"; name: string }
  | { type: "speak"; text: string; mood: SmokingRoomMood }
  | { type: "teleport"; roomId: SmokingRoomId }
  | { type: "report"; messageId: string; reason: string }
  | { type: "ping" };

export type SmokingRoomServerEvent =
  | { type: "snapshot"; roomId: SmokingRoomId; messages: SmokingRoomMessage[]; online: number }
  | { type: "message"; roomId: SmokingRoomId; message: SmokingRoomMessage }
  | { type: "presence"; roomId: SmokingRoomId; online: number }
  | { type: "report-received"; messageId: string }
  | { type: "error"; message: string }
  | { type: "pong"; roomId: SmokingRoomId; online: number };
