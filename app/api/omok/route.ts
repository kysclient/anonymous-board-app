import { experimental_upgradeWebSocket } from "@vercel/functions";
import { registerOmokSocket } from "@/lib/omok/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export function GET() {
  return experimental_upgradeWebSocket((socket) => {
    void registerOmokSocket(socket);
  }, { maxPayload: 2048 });
}
