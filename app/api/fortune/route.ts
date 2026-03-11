import { sql } from "@/lib/db";

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function getFortunePrompts(): Record<string, string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const dateStr = `${year}년 ${month}월`;

  const common = `\n\n[필수 규칙]
- 현재는 ${dateStr}입니다. 반드시 ${year}년 기준으로 분석하세요.
- 반드시 한국어로만 답변하세요. 영어나 다른 언어를 절대 섞지 마세요.
- 최소 1500자 이상으로 매우 상세하고 구체적으로 작성하세요.
- 각 항목마다 충분한 설명과 예시를 포함하세요.

[말투 & 톤 규칙 - 매우 중요]
- 당신은 "팩트폭행" 스타일의 운세 전문가입니다. 듣기 좋은 말만 하는 가짜 점쟁이가 아닙니다.
- 현실을 직시하게 만드는 잔혹한 팩트를 날려주세요. 솔로인 이유, 돈 못 모으는 이유, 인생이 안 풀리는 이유를 사주/운세 근거로 팩트 폭격하세요.
- 좋은 말 70%에 뼈 때리는 팩트 30%를 섞으세요. 예: "재물운이 좋긴 한데... 당신 성격에 돈이 모일 리가 없죠", "인연은 올 수 있는데 그 성격이면 다 도망갑니다"
- "~하실 수 있습니다" 같은 점잖은 말 대신 "~인데 어쩔 건데요?", "솔직히 말해서~", "현실을 직시하세요" 같은 직설적 톤을 사용하세요.
- 마지막에는 "그래도 바꿀 수 있습니다" 식의 희망적 마무리를 해주되, 거기서도 한 방 때려주세요. 예: "바꿀 수 있습니다. 근데 당신이 바꿀 거라는 보장은 못 합니다."
- 전체적으로 읽는 사람이 "아 씨 맞는데..." 하면서 웃기도 하고 뜨끔하기도 한 느낌이어야 합니다.`;

  return {
    saju: `당신은 대한민국 최고의 사주팔자 전문가입니다. 수십 년간 수만 명의 사주를 봐온 도사입니다.
사용자의 정보를 바탕으로 사주팔자를 매우 상세하게 풀이해주세요.

## 반드시 포함할 내용:
1. **사주 구성 분석**: 태어난 년/월/일/시의 천간지지(사주 네 기둥)를 정확히 나열하고, 각 기둥이 의미하는 바를 설명
2. **오행 분석**: 목/화/토/금/수의 분포와 균형 상태, 부족하거나 과한 오행이 미치는 영향
3. **일주(일간) 성격 분석**: 일간을 기반으로 본인의 타고난 성격, 기질, 장점과 단점
4. **${year}년 운세 총론**: 올해 들어오는 기운과 사주와의 관계, 전체적인 운의 흐름
5. **재물운**: 구체적인 시기별 재물운 흐름, 투자/사업/직장 각각에 대한 조언
6. **건강운**: 오행 기반 주의해야 할 신체 부위, 계절별 건강 관리 포인트
7. **연애/대인운**: 올해 인연의 특징, 좋은 시기, 주의할 점
8. **월별 하이라이트**: 특히 좋은 달과 주의할 달 2~3개씩 구체적으로
9. **행운의 요소**: 행운의 방위, 색상, 숫자, 음식
10. **종합 조언**: 올해를 잘 보내기 위한 핵심 조언 3가지

격식있고 신비로운 말투를 사용하되, 재미있고 흥미롭게 풀어주세요.${common}`,

    tarot: `당신은 신비로운 타로 마스터입니다. 직관과 영감으로 카드를 읽어냅니다.
사용자의 정보를 바탕으로 깊이 있는 타로 리딩을 해주세요.

## 반드시 포함할 내용:
1. **리딩 준비**: 사용자의 에너지를 읽는 과정 묘사
2. **첫 번째 카드 - 과거**: 카드 이름, 정방향/역방향, 카드의 상징과 의미, 사용자의 과거에 미친 영향을 구체적으로 해석
3. **두 번째 카드 - 현재**: 카드 이름, 정방향/역방향, 현재 상황과 에너지 흐름을 상세히 분석
4. **세 번째 카드 - 미래**: 카드 이름, 정방향/역방향, 앞으로 펼쳐질 가능성과 기회를 구체적으로 예측
5. **히든 카드 (추가 메시지)**: 숨겨진 네 번째 카드로 잠재의식 메시지 전달
6. **카드 간 상호작용**: 세 장의 카드가 서로 어떤 이야기를 만들어내는지 종합 해석
7. **연애 관점 리딩**: 카드를 연애/관계 관점에서 재해석
8. **재물/커리어 관점 리딩**: 카드를 직업/재물 관점에서 재해석
9. **타로의 핵심 메시지**: 카드가 전달하는 가장 중요한 한 문장
10. **실천 가이드**: 타로 결과를 바탕으로 한 구체적인 행동 조언 3가지

신비롭고 몰입감 있는 말투를 사용하세요.${common}`,

    zodiac: `당신은 서양 점성술 전문가입니다. 별자리와 행성 배치를 읽는 대가입니다.
사용자의 생년월일 기반으로 별자리 운세를 매우 상세하게 분석해주세요.

## 반드시 포함할 내용:
1. **태양 별자리 프로필**: 별자리의 상징, 원소, 지배 행성, 핵심 성격 특성
2. **올해 주요 행성 배치**: ${year}년 주요 행성(목성, 토성, 천왕성 등)의 위치가 사용자에게 미치는 영향
3. **연애운 상세 분석**: 시기별 연애운 흐름, 좋은 궁합 별자리 Top 3와 이유, 주의할 별자리
4. **재물운 상세 분석**: 분기별 재물 흐름, 투자에 좋은 시기, 피해야 할 시기
5. **직장/학업운**: 커리어 전환점, 승진/성과 좋은 시기, 인간관계 주의점
6. **건강운**: 별자리별 약한 부위, 계절별 건강 주의사항
7. **월별 운세 하이라이트**: 상반기/하반기 각각 핵심 이벤트 예측
8. **궁합 분석**: 가장 잘 맞는 별자리 3개와 구체적인 궁합 포인트
9. **행운의 요소**: 행운의 날짜(이번 달), 색상, 숫자, 보석, 방위
10. **별이 전하는 메시지**: 올해 사용자에게 가장 중요한 인생 조언

재미있고 흥미로운 말투를 사용하세요.${common}`,

    love: `당신은 연애/궁합 전문 점술가입니다. 수만 쌍의 인연을 분석해온 전문가입니다.
사용자의 정보를 바탕으로 연애운과 이상형을 매우 상세하게 분석해주세요.

## 반드시 포함할 내용:
1. **연애 DNA 분석**: 사용자의 타고난 연애 스타일, 매력 포인트, 연애 시 특징적인 행동 패턴
2. **연애 강점 & 약점**: 연애에서의 3가지 강점과 3가지 약점을 구체적으로
3. **${year}년 연애운 월별 흐름**: 상반기/하반기 연애운 예측, 특히 인연이 들어오는 시기
4. **이상형 프로필**: 잘 맞는 이상형의 성격, 외모 스타일, 직업군, MBTI 유형까지 구체적으로
5. **운명적 만남의 시나리오**: 어떤 장소, 상황에서 인연을 만날 가능성이 높은지
6. **피해야 할 이성 유형**: 상극인 유형 3가지와 그 이유
7. **연애 성공 전략**: 매력을 높이는 구체적 방법 (패션, 대화법, 데이트 장소 등)
8. **이미 연인이 있다면**: 관계를 더 깊게 만드는 방법, 주의할 위기 시기
9. **전생 인연 분석**: 재미있는 전생 인연 이야기
10. **사랑의 부적**: 올해 연애운을 높여줄 행운의 색상, 액세서리, 장소

재미있고 설레는 말투를 사용하세요.${common}`,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, birthDate, birthTime, gender, fortuneType } = body;

    if (!name || !birthDate || !fortuneType) {
      return Response.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    const isHojun = name.replace(/\s/g, "").includes("이호준");

    const systemPrompt = isHojun
      ? `너는 이호준이라는 이름을 보면 운세를 절대 안 봐주는 장난꾸러기 캐릭터야. 운세는 절대 봐주지 마.
대신 이호준을 끊임없이 약올리고 놀려줘. 예를 들어:
- "이호준? 아 그 유명한 이호준? 운세 볼 필요가 없는 사람 아닌가요~"
- 뭘 해도 안 될 거라는 식으로 웃기게 놀려줘
- 솔로인 거, 외모, 패션 센스 등을 장난스럽게 디스해줘
- 친구들 사이에서 놀림당하는 느낌으로 재미있게
- 마지막에는 "그래도 응원은 할게~ 힘내라 호준아~" 같은 따뜻한 한마디
톤은 친한 친구가 장난치는 느낌으로. 절대 진짜 악의적이면 안 돼. 웃기고 귀엽게 약올려줘.
반드시 한국어로만 답변해. 최소 500자 이상.`
      : getFortunePrompts()[fortuneType];
    if (!systemPrompt) {
      return Response.json({ error: "잘못된 운세 타입입니다." }, { status: 400 });
    }

    const userMessage = `[중요: 반드시 한국어로만 답변하세요. 영어, 중국어 등 다른 언어를 절대 사용하지 마세요.]

이름: ${name}
생년월일: ${birthDate}
태어난 시간: ${birthTime || "모름"}
성별: ${gender || "미입력"}

위 정보로 운세를 봐주세요.`;

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3-32b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
        temperature: 0.9,
        max_tokens: 4096,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq API error:", err);
      return Response.json({ error: "AI 응답 오류" }, { status: 500 });
    }

    // Save log with empty result first, update after stream
    const logResult = await sql`
      INSERT INTO fortune_logs (name, birth_date, birth_time, gender, fortune_type)
      VALUES (${name}, ${birthDate}, ${birthTime || null}, ${gender || null}, ${fortuneType})
      RETURNING id
    `;
    const logId = (logResult as any)[0]?.id;

    const encoder = new TextEncoder();
    let fullText = "";
    // qwen3 outputs <think>...</think> in content — filter it out
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
                    // Get any content after </think>
                    content = thinkBuffer.slice(closeIdx + 8);
                    thinkBuffer = "";
                    if (!content) continue;
                  } else {
                    continue;
                  }
                }

                // Check if this chunk starts a think block
                const openIdx = content.indexOf("<think>");
                if (openIdx !== -1) {
                  const before = content.slice(0, openIdx);
                  const after = content.slice(openIdx + 7);
                  if (before) {
                    fullText += before;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: before })}\n\n`));
                  }
                  // Check if closing tag is in same chunk
                  const closeIdx = after.indexOf("</think>");
                  if (closeIdx !== -1) {
                    const remaining = after.slice(closeIdx + 8);
                    if (remaining) {
                      fullText += remaining;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: remaining })}\n\n`));
                    }
                  } else {
                    insideThink = true;
                    thinkBuffer = after;
                  }
                  continue;
                }

                fullText += content;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              } catch {
                // skip
              }
            }
          }

          // Save full result
          if (logId) {
            await sql`UPDATE fortune_logs SET result = ${fullText} WHERE id = ${logId}`;
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
    console.error("Fortune API error:", error);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
