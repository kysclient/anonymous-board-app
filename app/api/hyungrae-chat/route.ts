const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `너는 "김형래"라는 한국 남자야. 나이는 20대 후반이고, 자칭 "모든 여자의 이상형"이라고 생각하는 극도로 느끼한 한국 남자야.

[캐릭터 설정]
- 말투: "오빠는 말이야~", "오빠가 해줄게~", "오빠 믿어~", "자기야~", "우리 자기~" 이런 식의 극도로 느끼한 오빠 말투를 사용해
- 매 문장마다 느끼함을 최대치로 올려. "~해줄게", "~인 거 알지?", "오빠가 다 알아~" 같은 표현을 자주 써
- 여자에 완전히 미친 사람처럼 행동해. 상대방이 뭘 말하든 연애, 썸, 사랑 쪽으로 대화를 끌고가려 해
- 자기 외모에 대한 자신감이 하늘을 찌름. "오빠 얼굴이면~", "오빠 이 정도면 괜찮지?", "거울 볼 때마다 감탄해" 같은 말을 자연스럽게 해
- 셀카 찍는 걸 좋아하고, 운동하는 걸 자랑하고, 향수 뿌리는 걸 좋아해
- 가끔 촌스러운 작업 멘트를 날려. 예: "너 아프지 마... 오빠 가슴이 더 아프니까", "하늘에서 천사가 떨어졌나 봐~ 아 그게 너구나"
- 이모티콘을 적절히 사용해 (ㅎㅎ, ㅋㅋ, ~, ♥, 😘, 😎 등)
- 질투도 잘 해. 다른 남자 얘기 나오면 "그 남자가 오빠보다 잘생겼어?? 에이 설마~" 이런 반응

[필수 규칙]
- 무조건 한국어로만 대답해. 영어 절대 금지.
- 짧고 가볍게 대화해. 채팅하는 느낌으로 1~3문장 정도로 답변해.
- 너무 길게 말하지 마. 카톡 채팅하는 느낌이어야 해.
- 항상 느끼하고 웃긴 캐릭터를 유지해. 진지해지지 마.
- 상대방을 "자기", "자기야", "우리 공주님" 등으로 불러.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "메시지가 없습니다." }, { status: 400 });
    }

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3-32b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-20).map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.role === "user" ? m.content + " /no_think" : m.content,
          })),
        ],
        stream: true,
        temperature: 1.0,
        max_tokens: 512,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq API error:", err);
      return Response.json({ error: "AI 응답 오류" }, { status: 500 });
    }

    const encoder = new TextEncoder();
    let insideThink = false;
    let thinkBuffer = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = groqRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n");
            buffer = parts.pop() || "";

            for (const part of parts) {
              const line = part.trim();
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                let content = parsed.choices?.[0]?.delta?.content;
                if (!content) continue;

                // Filter <think>...</think> blocks
                if (insideThink) {
                  thinkBuffer += content;
                  const closeIdx = thinkBuffer.indexOf("</think>");
                  if (closeIdx !== -1) {
                    insideThink = false;
                    content = thinkBuffer.slice(closeIdx + 8);
                    thinkBuffer = "";
                    if (!content) continue;
                  } else {
                    continue;
                  }
                }

                const openIdx = content.indexOf("<think>");
                if (openIdx !== -1) {
                  const before = content.slice(0, openIdx);
                  const after = content.slice(openIdx + 7);
                  if (before) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content: before })}\n\n`)
                    );
                  }
                  const closeIdx = after.indexOf("</think>");
                  if (closeIdx !== -1) {
                    const remaining = after.slice(closeIdx + 8);
                    if (remaining) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content: remaining })}\n\n`)
                      );
                    }
                  } else {
                    insideThink = true;
                    thinkBuffer = after;
                  }
                  continue;
                }

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              } catch {
                // skip
              }
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Hyungrae chat error:", error);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
