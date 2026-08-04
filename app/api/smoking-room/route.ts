import { experimental_upgradeWebSocket } from "@vercel/functions";
import { registerSmokingRoomSocket } from "@/lib/smoking-room/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export function GET() {
  return experimental_upgradeWebSocket(
    (socket) => {
      registerSmokingRoomSocket(socket);
    },
    { maxPayload: 2_048 }
  );
}
