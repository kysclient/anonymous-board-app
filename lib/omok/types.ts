export type Stone = 0 | 1 | 2;
export type GameStatus = "waiting" | "playing" | "finished";

export interface OmokPlayer {
  clientId: string;
  name: string;
  color: 1 | 2;
  connected: boolean;
}

export interface OmokMove {
  row: number;
  col: number;
  color: 1 | 2;
  move: number;
}

export interface OmokChatMessage {
  id: string;
  clientId: string;
  name: string;
  text: string;
  createdAt: number;
  system?: boolean;
}

export interface OmokRoomState {
  roomId: string;
  title: string;
  createdAt: number;
  board: Stone[][];
  players: OmokPlayer[];
  spectators: number;
  status: GameStatus;
  turn: 1 | 2;
  winner: Stone;
  winningLine: Array<[number, number]>;
  moves: OmokMove[];
  chats: OmokChatMessage[];
  rematchVotes: string[];
  round: number;
  updatedAt: number;
}

export interface OmokRoomSummary {
  roomId: string;
  title: string;
  status: GameStatus;
  players: Array<Pick<OmokPlayer, "name" | "color" | "connected">>;
  spectators: number;
  moves: number;
  round: number;
  updatedAt: number;
}

export type OmokClientEvent =
  | { type: "join"; roomId: string; clientId: string; name: string; roomTitle?: string }
  | { type: "place"; row: number; col: number }
  | { type: "chat"; text: string }
  | { type: "rematch" }
  | { type: "ping" };

export type OmokServerEvent =
  | { type: "state"; state: OmokRoomState }
  | { type: "error"; message: string }
  | { type: "pong" };

export const BOARD_SIZE = 15;

export function createEmptyBoard(): Stone[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 0 as Stone)
  );
}
