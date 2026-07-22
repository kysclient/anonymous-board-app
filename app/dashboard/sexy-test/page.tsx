"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Flame,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import styles from "./sexy-test.module.css";
import { shareResultCard } from "@/lib/share-result-card";

type Axis = "aura" | "sense" | "style" | "warmth";
type Stage = "intro" | "quiz" | "result";
type ShareState = "idle" | "capturing" | "downloaded";
type ResultView = (typeof RESULT_TYPES)[Axis] & {
  score: number;
  scores: Record<Axis, number>;
};

interface Answer {
  label: string;
  axis: Axis;
  secondary: Axis;
  heat: number;
}

interface Question {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  answers: Answer[];
}

const QUESTIONS: Question[] = [
  {
    eyebrow: "FIRST IMPRESSION",
    title: "낯선 모임에 도착한 순간, 나는?",
    description: "첫 10초 동안 가장 나다운 행동을 골라주세요.",
    image: "/sexy-test/01-presence.png",
    answers: [
      { label: "여유롭게 둘러본 뒤 자연스럽게 인사한다", axis: "aura", secondary: "warmth", heat: 8 },
      { label: "눈에 띄는 사람에게 먼저 다가간다", axis: "aura", secondary: "sense", heat: 10 },
      { label: "옷매무새를 정리하고 분위기부터 파악한다", axis: "style", secondary: "aura", heat: 8 },
      { label: "재밌어 보이는 대화에 슬쩍 합류한다", axis: "sense", secondary: "warmth", heat: 7 },
    ],
  },
  {
    eyebrow: "CONVERSATION",
    title: "호감 가는 사람과 마주 앉았다.",
    description: "당신의 대화가 매력적으로 느껴지는 이유는 무엇일까요?",
    image: "/sexy-test/02-conversation.png",
    answers: [
      { label: "상대가 한 말을 기억하고 깊게 물어본다", axis: "warmth", secondary: "sense", heat: 8 },
      { label: "센스 있는 농담으로 긴장을 풀어준다", axis: "sense", secondary: "aura", heat: 10 },
      { label: "눈을 맞추고 천천히 내 이야기를 한다", axis: "aura", secondary: "warmth", heat: 9 },
      { label: "취향과 스타일 이야기를 자연스럽게 꺼낸다", axis: "style", secondary: "sense", heat: 8 },
    ],
  },
  {
    eyebrow: "PERSONAL STYLE",
    title: "오늘 나를 가장 빛나게 할 옷은?",
    description: "중요한 약속을 앞두고 마지막 선택을 해야 합니다.",
    image: "/sexy-test/03-style.png",
    answers: [
      { label: "핏이 완벽한 올 블랙", axis: "aura", secondary: "style", heat: 9 },
      { label: "나만 소화할 수 있는 강렬한 포인트 룩", axis: "style", secondary: "aura", heat: 10 },
      { label: "편안하지만 소재가 좋은 미니멀 룩", axis: "style", secondary: "warmth", heat: 8 },
      { label: "상대가 좋아할 것 같은 분위기의 룩", axis: "warmth", secondary: "style", heat: 7 },
    ],
  },
  {
    eyebrow: "ENERGY",
    title: "분위기가 무르익은 파티에서 나는?",
    description: "사람들이 기억하는 당신의 에너지를 선택하세요.",
    image: "/sexy-test/04-energy.png",
    answers: [
      { label: "망설임 없이 음악 속으로 들어간다", axis: "aura", secondary: "sense", heat: 10 },
      { label: "친구들을 한 명씩 끌어내 함께 즐긴다", axis: "warmth", secondary: "aura", heat: 9 },
      { label: "좋은 음악과 공간을 조용히 감상한다", axis: "style", secondary: "aura", heat: 7 },
      { label: "재치 있는 리액션으로 테이블을 웃게 한다", axis: "sense", secondary: "warmth", heat: 8 },
    ],
  },
  {
    eyebrow: "SPONTANEITY",
    title: "갑자기 떠나자는 연락이 왔다.",
    description: "계획에 없던 새벽 드라이브, 당신의 대답은?",
    image: "/sexy-test/05-spontaneity.png",
    answers: [
      { label: "목적지는 가면서 정하지 뭐. 지금 나간다", axis: "aura", secondary: "sense", heat: 10 },
      { label: "선곡부터 완벽하게 준비하고 출발한다", axis: "style", secondary: "sense", heat: 9 },
      { label: "다들 안전하게 갈 수 있는지 먼저 챙긴다", axis: "warmth", secondary: "style", heat: 7 },
      { label: "재밌겠다며 더 좋은 코스를 즉석에서 제안한다", axis: "sense", secondary: "aura", heat: 9 },
    ],
  },
  {
    eyebrow: "WARM SIGNAL",
    title: "비 오는 밤, 우산은 하나뿐이다.",
    description: "당신의 다정함은 어떤 방식으로 드러날까요?",
    image: "/sexy-test/06-warmth.png",
    answers: [
      { label: "말없이 상대 쪽으로 우산을 더 기울인다", axis: "warmth", secondary: "aura", heat: 10 },
      { label: "가까이 붙을 명분이 생겼다며 웃는다", axis: "sense", secondary: "aura", heat: 9 },
      { label: "택시를 부르고 따뜻한 음료까지 건넨다", axis: "warmth", secondary: "style", heat: 8 },
      { label: "비 오는 거리까지 영화처럼 즐긴다", axis: "style", secondary: "sense", heat: 8 },
    ],
  },
];

const RESULT_TYPES: Record<
  Axis,
  { name: string; subtitle: string; description: string; tags: string[]; image: string }
> = {
  aura: {
    name: "시선 고정 아우라형",
    subtitle: "아무것도 하지 않아도 분위기가 바뀌는 사람",
    description: "당신의 매력은 여유와 자신감에서 시작됩니다. 먼저 말하지 않아도 존재감이 있고, 결정적인 순간에는 망설이지 않아요. 과한 연출보다 자연스러운 태도가 가장 강력한 무기입니다.",
    tags: ["자신감", "눈맞춤", "결정력"],
    image: "/sexy-test/01-presence.png",
  },
  sense: {
    name: "대화 유죄 플러팅형",
    subtitle: "한마디로 긴장을 풀고 두마디로 마음을 여는 사람",
    description: "당신은 표정과 타이밍을 읽는 감각이 뛰어납니다. 센스 있는 농담과 자연스러운 리액션으로 상대를 편안하게 만들죠. 당신의 매력은 가까워질수록 더 선명해집니다.",
    tags: ["위트", "타이밍", "리액션"],
    image: "/sexy-test/02-conversation.png",
  },
  style: {
    name: "취향 저격 스타일형",
    subtitle: "무엇을 선택하든 자기 것으로 만드는 사람",
    description: "당신은 취향을 숨기지 않고 자신만의 방식으로 표현합니다. 옷, 음악, 공간을 고르는 감각까지 모두 매력의 일부예요. 유행보다 일관된 자기 취향이 사람들의 시선을 붙잡습니다.",
    tags: ["취향", "감각", "디테일"],
    image: "/sexy-test/03-style.png",
  },
  warmth: {
    name: "은근 치명 다정형",
    subtitle: "나중에 생각할수록 더 설레는 사람",
    description: "당신의 매력은 세심한 관찰과 자연스러운 배려에 있습니다. 티 내지 않고 챙겨주는 행동이 상대에게 오래 남아요. 편안함 속에서 슬쩍 드러나는 단단함이 반전 포인트입니다.",
    tags: ["배려", "안정감", "반전매력"],
    image: "/sexy-test/06-warmth.png",
  },
};

const EMPTY_SCORES: Record<Axis, number> = {
  aura: 0,
  sense: 0,
  style: 0,
  warmth: 0,
};

export default function SexyTestPage() {
  const [stage, setStage] = useState<Stage>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [shareState, setShareState] = useState<ShareState>("idle");
  const resultCardRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => {
    const scores = { ...EMPTY_SCORES };
    let heat = 0;

    answers.forEach((answer) => {
      scores[answer.axis] += 3;
      scores[answer.secondary] += 1;
      heat += answer.heat;
    });

    const topAxis = (Object.entries(scores) as [Axis, number][]).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] ?? "aura";
    const sexyScore = Math.min(99, Math.max(48, Math.round(40 + heat * 0.92)));

    return { ...RESULT_TYPES[topAxis], score: sexyScore, scores };
  }, [answers]);

  const start = () => {
    setAnswers([]);
    setQuestionIndex(0);
    setSelectedIndex(null);
    setShareState("idle");
    setStage("quiz");
  };

  const chooseAnswer = (answer: Answer, answerIndex: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(answerIndex);

    window.setTimeout(() => {
      const nextAnswers = [...answers, answer];
      setAnswers(nextAnswers);

      if (questionIndex === QUESTIONS.length - 1) {
        setStage("result");
      } else {
        setQuestionIndex((current) => current + 1);
        setSelectedIndex(null);
      }
    }, 360);
  };

  const goBack = () => {
    if (questionIndex === 0) {
      setStage("intro");
      return;
    }
    setAnswers((current) => current.slice(0, -1));
    setQuestionIndex((current) => current - 1);
    setSelectedIndex(null);
  };

  const shareResult = async () => {
    if (!resultCardRef.current || shareState === "capturing") return;
    setShareState("capturing");
    try {
      const outcome = await shareResultCard(resultCardRef.current, {
        fileName: `spicy-sexy-${result.score}.png`,
      });
      setShareState(outcome);
    } catch {
      setShareState("idle");
    }
  };

  return (
    <div className={styles.shell}>
      {stage === "intro" && <IntroScreen onStart={start} />}
      {stage === "quiz" && (
        <QuizScreen
          question={QUESTIONS[questionIndex]}
          questionIndex={questionIndex}
          selectedIndex={selectedIndex}
          onBack={goBack}
          onChoose={chooseAnswer}
        />
      )}
      {stage === "result" && (
        <ResultScreen
          result={result}
          shareState={shareState}
          cardRef={resultCardRef}
          onShare={shareResult}
          onRestart={start}
        />
      )}
    </div>
  );
}

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className={styles.intro}>
      <div className={styles.introMedia}>
        <Image src="/sexy-test/01-presence.png" alt="파티에 등장한 자신감 있는 성인 캐릭터" fill priority sizes="(min-width: 900px) 55vw, 100vw" />
        <div className={styles.introShade} />
        <span className={styles.introIssue}>SPICY ORIGINAL · 01</span>
      </div>
      <div className={styles.introContent}>
        <div className={styles.brandLine}><Flame /><span>SPICY LAB</span></div>
        <p className={styles.introEyebrow}>6 QUESTIONS · 2 MIN</p>
        <h1>나는 얼마나<br /><em>SEXY</em>한 사람일까?</h1>
        <p className={styles.introCopy}>외모 말고도 사람을 끌어당기는 건 많으니까.<br />당신의 진짜 매력 온도를 측정해보세요.</p>
        <button type="button" onClick={onStart} className={styles.startButton}>테스트 시작하기 <ArrowRight /></button>
        <p className={styles.disclaimer}>본 테스트는 재미를 위한 성인용 성향 테스트입니다.</p>
      </div>
    </section>
  );
}

function QuizScreen({ question, questionIndex, selectedIndex, onBack, onChoose }: {
  question: Question;
  questionIndex: number;
  selectedIndex: number | null;
  onBack: () => void;
  onChoose: (answer: Answer, index: number) => void;
}) {
  const progress = ((questionIndex + 1) / QUESTIONS.length) * 100;
  return (
    <section className={styles.quiz}>
      <div className={styles.quizTopbar}>
        <button type="button" onClick={onBack} aria-label="이전 질문"><ArrowLeft /></button>
        <div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div>
        <span>{String(questionIndex + 1).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")}</span>
      </div>
      <div className={styles.quizGrid}>
        <div className={styles.questionMedia}>
          <Image key={question.image} src={question.image} alt="" fill priority sizes="(min-width: 900px) 52vw, 100vw" />
          <div className={styles.mediaLabel}>{question.eyebrow}</div>
        </div>
        <div className={styles.questionPanel}>
          <p className={styles.questionNumber}>QUESTION {String(questionIndex + 1).padStart(2, "0")}</p>
          <h2>{question.title}</h2>
          <p className={styles.questionDescription}>{question.description}</p>
          <div className={styles.answerList}>
            {question.answers.map((answer, index) => (
              <button
                type="button"
                key={answer.label}
                onClick={() => onChoose(answer, index)}
                className={selectedIndex === index ? styles.answerSelected : ""}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                <strong>{answer.label}</strong>
                {selectedIndex === index ? <Check /> : <ArrowRight />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultScreen({ result, shareState, cardRef, onShare, onRestart }: {
  result: ResultView;
  shareState: ShareState;
  cardRef: React.RefObject<HTMLDivElement | null>;
  onShare: () => void;
  onRestart: () => void;
}) {
  return (
    <section className={styles.resultPage}>
      <div className={styles.resultCard} ref={cardRef}>
        <div className={styles.resultMedia}>
          <Image src={result.image} alt="" fill priority sizes="(min-width: 900px) 48vw, 100vw" />
          <div className={styles.resultGradient} />
          <div className={styles.scoreBlock}><span>SEXY INDEX</span><strong>{result.score}<small>%</small></strong></div>
        </div>
        <div className={styles.resultContent}>
          <div className={styles.resultKicker}><Sparkles /> YOUR TYPE</div>
          <h2>{result.name}</h2>
          <p className={styles.resultSubtitle}>{result.subtitle}</p>
          <p className={styles.resultDescription}>{result.description}</p>
          <div className={styles.tags}>{result.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
          <div className={styles.axisChart}>
            {(Object.entries(result.scores) as [Axis, number][]).map(([axis, score]) => (
              <div key={axis}><span>{axis === "aura" ? "아우라" : axis === "sense" ? "센스" : axis === "style" ? "스타일" : "다정함"}</span><div><i style={{ width: `${Math.min(100, score * 7)}%` }} /></div></div>
            ))}
          </div>
          <div className={styles.shareSignature}>SPICY LAB · SHARE YOUR HEAT</div>
          <div className={styles.resultActions}>
            <button type="button" onClick={onShare} className={styles.shareButton} disabled={shareState === "capturing"}>
              {shareState === "downloaded" ? <Check /> : <Download />}
              <span data-capture-label>{shareState === "capturing" ? "이미지 만드는 중..." : shareState === "downloaded" ? "다운로드 완료" : "결과 이미지 다운로드"}</span>
            </button>
            <button type="button" onClick={onRestart} className={styles.restartButton}><RotateCcw /> 다시 하기</button>
          </div>
        </div>
      </div>
    </section>
  );
}
