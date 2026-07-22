"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CornerDownLeft,
  Delete as DeleteIcon,
  Download,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { shareResultCard } from "@/lib/share-result-card";
import styles from "./hojun-test.module.css";

type Stage = "intro" | "quiz" | "result";
type ShareState = "idle" | "capturing" | "downloaded";

interface Choice {
  label: string;
  ratio: number;
}

interface BaseQuestion {
  tag: string;
  title: string;
  note: string;
  image: string;
  weight: number;
}

interface ChoiceQuestion extends BaseQuestion {
  kind?: "choice";
  choices: Choice[];
}

interface InitialQuestion extends BaseQuestion {
  kind: "initials";
  answer: string;
}

type Question = ChoiceQuestion | InitialQuestion;

const INITIAL_KEYS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const QUESTIONS: Question[] = [
  {
    tag: "BIG BRAIN ENERGY",
    title: "새 모자를 사러 갔다. 가장 먼저 보는 건?",
    note: "디자인보다 중요한 현실적인 체크 포인트가 있다.",
    image: "/hojun-test/selfie.jpeg",
    weight: 16,
    choices: [
      { label: "색이 내 옷과 잘 맞는지", ratio: 0 },
      { label: "일단 머리가 들어가는지부터 본다", ratio: 1 },
      { label: "사진이 잘 나오는 디자인인지", ratio: 0.35 },
      { label: "가장 큰 사이즈가 남았는지", ratio: 0.72 },
    ],
  },
  {
    tag: "ROMANCE ARCHIVE",
    title: "모임 연애 회고록을 쓴다면 분량은?",
    note: "목차만 봐도 등장인물이 심상치 않다.",
    image: "/hojun-test/night.jpeg",
    weight: 17,
    choices: [
      { label: "프롤로그에서 끝난다", ratio: 0 },
      { label: "시즌 3 정도는 나온다", ratio: 0.72 },
      { label: "5회 초과, 외전까지 제작 가능", ratio: 1 },
      { label: "단편 하나면 충분하다", ratio: 0.3 },
    ],
  },
  {
    tag: "ONLINE / OFFLINE",
    title: "단톡방의 나와 실제 만남의 나는?",
    note: "화면을 끄는 순간 전혀 다른 캐릭터가 등장한다.",
    image: "/hojun-test/night.jpeg",
    weight: 17,
    choices: [
      { label: "온라인은 개븅신, 실제로 보면 의외로 괜찮다", ratio: 1 },
      { label: "온라인이나 오프라인이나 조용하다", ratio: 0 },
      { label: "온라인에서만 살짝 텐션이 오른다", ratio: 0.72 },
      { label: "둘 다 적당히 말이 많다", ratio: 0.32 },
    ],
  },
  {
    tag: "HOME BASE",
    title: "친구들과 약속 장소를 잡는다면?",
    note: "어쩐지 모든 길은 한 동네로 통한다.",
    image: "/hojun-test/selfie.jpeg",
    weight: 16,
    choices: [
      { label: "모두에게 공평한 정중앙", ratio: 0 },
      { label: "그날 맛집이 있는 동네", ratio: 0.3 },
      { label: "4호선이면 일단 마음이 편하다", ratio: 0.7 },
      { label: "성신여대입구가 사실상 세계의 중심", ratio: 1 },
    ],
  },
  {
    tag: "LOVE FORECAST",
    title: "연애에 먹구름이 보이기 시작했다.",
    note: "이번 분기의 관계 전망을 솔직하게 선택한다면?",
    image: "/hojun-test/night.jpeg",
    weight: 17,
    choices: [
      { label: "아무 문제 없다. 맑음", ratio: 0 },
      { label: "곧 엔딩 크레딧이 올라올 것 같다", ratio: 1 },
      { label: "친구들에게 슬쩍 상담을 시작한다", ratio: 0.73 },
      { label: "대화하면 금방 풀릴 소나기", ratio: 0.32 },
    ],
  },
  {
    kind: "initials",
    tag: "FINAL IDENTITY CHECK",
    title: "가장 최근 모임에서 연애를 한 사람의 이름 초성 3글자는?",
    note: "보안 키패드에서 초성을 순서대로 입력하세요.",
    image: "/hojun-test/selfie.jpeg",
    weight: 17,
    answer: "ㅇㅈㅇ",
  },
];

const getResult = (score: number) => {
  if (score >= 90) return {
    name: "본인 등판급 이호준",
    subtitle: "혹시 지금 이 테스트 본인이 풀고 있나요?",
    description: "큰 존재감, 화려한 모임 연애사, 온라인과 오프라인의 온도 차, 성신여대 생활권, 아슬아슬한 연애 전망, 마지막 초성 인증까지. 숨길 수 없는 이호준 풀세트입니다.",
    tags: ["본인등판", "초성마스터", "성신생활권"],
  };
  if (score >= 70) return {
    name: "거의 이호준 도플갱어",
    subtitle: "옆모습만 보면 친구들도 잠깐 헷갈릴 수준",
    description: "생활 반경과 온라인 텐션, 연애 서사에서 강한 호준력이 감지됐습니다. 마지막 초성까지 맞혔다면 이미 관계자 수준입니다.",
    tags: ["고농도호준", "온라인강자", "연애서사"],
  };
  if (score >= 45) return {
    name: "은근한 이호준 친척",
    subtitle: "결정적인 순간마다 한 스푼씩 닮았다",
    description: "완전히 같지는 않지만 몇몇 선택에서 묘하게 익숙한 향기가 납니다. 특히 단톡방 텐션이나 약속 장소를 고를 때 잠재된 호준력이 튀어나옵니다.",
    tags: ["반반호준", "잠재력", "묘하게닮음"],
  };
  if (score >= 20) return {
    name: "이호준 원격 지인",
    subtitle: "같은 단톡방에 있어도 캐릭터는 꽤 다르다",
    description: "호준력은 낮은 편이지만 한두 가지 공통점은 발견됐습니다. 아직은 안전하지만 성신여대입구 약속이 잦아지면 수치가 오를 수 있습니다.",
    tags: ["저농도호준", "안전구간", "관찰대상"],
  };
  return {
    name: "이호준과 정반대 인간",
    subtitle: "공통점 세 글자 찾기도 쉽지 않은 수준",
    description: "생활 패턴부터 연애 서사까지 놀라울 만큼 반대입니다. 이 정도면 오히려 이호준 연구원으로서 객관적인 관찰이 가능한 귀한 인재입니다.",
    tags: ["청정구역", "관찰자", "정반대매력"],
  };
};

export default function HojunTestPage() {
  const [stage, setStage] = useState<Stage>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [initials, setInitials] = useState<string[]>([]);
  const [shareState, setShareState] = useState<ShareState>("idle");
  const resultRef = useRef<HTMLDivElement>(null);

  const score = useMemo(
    () => Math.round(answers.reduce((total, ratio, index) => total + ratio * QUESTIONS[index].weight, 0)),
    [answers]
  );
  const result = getResult(score);

  const start = () => {
    setQuestionIndex(0);
    setAnswers([]);
    setSelectedIndex(null);
    setInitials([]);
    setShareState("idle");
    setStage("quiz");
  };

  const choose = (choice: Choice, index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    window.setTimeout(() => {
      setAnswers((current) => [...current, choice.ratio]);
      if (questionIndex === QUESTIONS.length - 1) setStage("result");
      else {
        setQuestionIndex((current) => current + 1);
        setSelectedIndex(null);
      }
    }, 320);
  };

  const back = () => {
    if (questionIndex === 0) {
      setStage("intro");
      return;
    }
    setAnswers((current) => current.slice(0, -1));
    setQuestionIndex((current) => current - 1);
    setSelectedIndex(null);
    setInitials([]);
  };

  const pressInitial = (initial: string) => {
    setInitials((current) => current.length < 3 ? [...current, initial] : current);
  };

  const submitInitials = () => {
    const question = QUESTIONS[questionIndex];
    if (question.kind !== "initials" || initials.length !== 3) return;
    const answerLetters = question.answer.split("");
    const matches = initials.filter((initial, index) => initial === answerLetters[index]).length;
    const ratio = matches === 3 ? 1 : matches === 2 ? 0.72 : matches === 1 ? 0.3 : 0;
    setAnswers((current) => [...current, ratio]);
    setStage("result");
  };

  const share = async () => {
    if (!resultRef.current || shareState === "capturing") return;
    setShareState("capturing");
    try {
      const outcome = await shareResultCard(resultRef.current, {
        fileName: `lee-hojun-${score}-percent.png`,
      });
      setShareState(outcome);
    } catch {
      setShareState("idle");
    }
  };

  const currentQuestion = QUESTIONS[questionIndex];

  return (
    <div className={styles.shell}>
      {stage === "intro" && (
        <section className={styles.intro}>
          <div className={styles.introImage}>
            <Image src="/hojun-test/selfie.jpeg" alt="이호준 테스트 커버" fill priority sizes="(min-width: 900px) 55vw, 100vw" />
            <div className={styles.imageShade} />
            <span className={styles.coverLabel}>SPICY PEOPLE FILE · 001</span>
          </div>
          <div className={styles.introCopy}>
            <div className={styles.logo}><BadgeCheck /><span>HOJUN-O-METER</span></div>
            <p className={styles.eyebrow}>6 QUESTIONS · 100% OFFICIAL</p>
            <h1>내 안의<br /><em>이호준</em>은 몇 %?</h1>
            <p>평범해 보이는 몇 가지 선택만으로<br />당신 안에 숨은 호준력을 정밀하게 판독합니다.</p>
            <button type="button" onClick={start} className={styles.primaryButton}>측정 시작하기 <ArrowRight /></button>
            <small>SPICY HUMAN LAB이 100% 공식 인증합니다.</small>
          </div>
        </section>
      )}

      {stage === "quiz" && (
        <section className={styles.quiz}>
          <header className={styles.quizHeader}>
            <button type="button" onClick={back} aria-label="이전 질문"><ArrowLeft /></button>
            <div><i style={{ width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%` }} /></div>
            <span>{questionIndex + 1} / {QUESTIONS.length}</span>
          </header>
          <div className={styles.quizBody}>
            <div className={styles.quizImage}>
              <Image key={currentQuestion.image} src={currentQuestion.image} alt="" fill priority sizes="(min-width: 900px) 48vw, 100vw" />
              <span>{currentQuestion.tag}</span>
            </div>
            <div className={styles.question}>
              <p>CASE {String(questionIndex + 1).padStart(2, "0")}</p>
              <h2>{currentQuestion.title}</h2>
              <small>{currentQuestion.note}</small>
              {currentQuestion.kind === "initials" ? (
                <div className={styles.initialQuiz}>
                  <div className={styles.initialDisplay} aria-label={`입력한 초성 ${initials.join(" ") || "없음"}`}>
                    {[0, 1, 2].map((index) => <span key={index} className={initials[index] ? styles.filledSlot : ""}>{initials[index] ?? "·"}</span>)}
                  </div>
                  <div className={styles.secureLine}><i /> 보안 초성 키패드 <i /></div>
                  <div className={styles.initialKeypad}>
                    {INITIAL_KEYS.map((initial) => (
                      <button type="button" key={initial} onClick={() => pressInitial(initial)} disabled={initials.length >= 3} aria-label={`${initial} 입력`}>{initial}</button>
                    ))}
                  </div>
                  <div className={styles.keypadActions}>
                    <button type="button" onClick={() => setInitials((current) => current.slice(0, -1))} disabled={!initials.length}><DeleteIcon /> 한 글자 지우기</button>
                    <button type="button" onClick={() => setInitials([])} disabled={!initials.length}>전체 지우기</button>
                  </div>
                  <button type="button" onClick={submitInitials} disabled={initials.length !== 3} className={styles.initialSubmit}>정답 제출하기 <CornerDownLeft /></button>
                </div>
              ) : (
                <div className={styles.choices}>
                  {currentQuestion.choices.map((choice, index) => (
                    <button
                      type="button"
                      key={choice.label}
                      onClick={() => choose(choice, index)}
                      className={selectedIndex === index ? styles.selected : ""}
                    >
                      <span>{String.fromCharCode(65 + index)}</span>
                      <strong>{choice.label}</strong>
                      {selectedIndex === index ? <Check /> : <ArrowRight />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {stage === "result" && (
        <section className={styles.resultPage}>
          <div className={styles.resultCard} ref={resultRef}>
            <div className={styles.resultImage}>
              <Image src="/hojun-test/selfie.jpeg" alt="이호준 싱크로율 결과" fill priority sizes="(min-width: 900px) 48vw, 100vw" />
              <div className={styles.resultShade} />
              <div className={styles.score}><span>HOJUN SYNC RATE</span><strong>{score}<small>%</small></strong></div>
            </div>
            <div className={styles.resultCopy}>
              <div className={styles.resultKicker}><Sparkles /> ANALYSIS COMPLETE</div>
              <h2>{result.name}</h2>
              <h3>{result.subtitle}</h3>
              <p>{result.description}</p>
              <div className={styles.tags}>{result.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
              <div className={styles.meter}>
                <div><span>일반인</span><span>이호준</span></div>
                <div><i style={{ width: `${score}%` }} /><b style={{ left: `${score}%` }} /></div>
              </div>
              <div className={styles.signature}><BadgeCheck /> SPICY HUMAN LAB · 100% OFFICIAL</div>
              <div className={styles.actions}>
                <button type="button" onClick={share} disabled={shareState === "capturing"} className={styles.primaryButton}>
                  {shareState === "downloaded" ? <Check /> : <Download />}
                  <span data-capture-label>{shareState === "capturing" ? "이미지 만드는 중..." : shareState === "downloaded" ? "다운로드 완료" : "결과 이미지 다운로드"}</span>
                </button>
                <button type="button" onClick={start} className={styles.restart}><RotateCcw /> 다시 하기</button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
