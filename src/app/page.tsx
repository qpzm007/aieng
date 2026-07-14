"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { verbCategories, Verb } from "@/data/verbs";

interface TrainBlock {
  type: "core" | "place" | "time" | "reason" | "complement";
  text: string;
  ko: string;
}

interface SentenceAnalysis {
  original_sentence: string;
  pronunciation_tip: string;
  korean_translation: string;
  train_blocks: TrainBlock[];
  applied_rules: number[];
}

const ruleExplans: Record<number, { title: string; desc: string; tip: string }> = {
  1: {
    title: "1. 기본 틀 (누가 ➡️ 한다 ➡️ 무엇을)",
    desc: "영어의 뼈대가 되는 가장 핵심 규칙입니다. 주인공(누가)과 행동(동사), 대상(무엇을)이 차례로 옵니다.",
    tip: "예: Republicans started a race (공화당원들은 경쟁을 시작했다)"
  },
  2: {
    title: "2. 꼬리 틀 (장소 ➡️ 시간 ➡️ 이유)",
    desc: "기본 틀 뒤에 꼬리처럼 부가 정보를 붙일 때는 항상 [장소 ➡️ 시간 ➡️ 이유] 순서로 자석처럼 붙입니다.",
    tip: "예: [on the ballot (장소)] ➡️ [to replace Graham (이유)]"
  },
  3: {
    title: "3. 접착제 틀 (who / which 보충설명)",
    desc: "단어 뒤에 who나 which 같은 '접착제'를 붙여 바로 앞 단어에 대해 자세히 설명(수식)해 줍니다.",
    tip: "예: The boy [who helped me] (나를 도왔던 그 소년)"
  },
  4: {
    title: "4. 시간 뒤집기 틀 (과거/미래 시점)",
    desc: "동사의 형태를 과거형(-ed 또는 불규칙 변형)이나 미래형(will / be going to)으로 바꾸어 말하는 시점을 뒤집습니다.",
    tip: "예: started (시작했다), will start (시작할 것이다)"
  },
  5: {
    title: "5. 주인공 바꾸기 틀 (당하는 입장 - 수동태)",
    desc: "주인공이 직접 하는 것이 아니라, 어떤 행동을 '당하는(받는)' 입장일 때 [be 동사 + 과거분사(p.p.)]로 표현합니다.",
    tip: "예: The book was written by him (그 책은 그에 의해 쓰였다)"
  }
};

export default function HomePage() {
  // Screen state: 'setup' | 'learn' | 'quiz'
  const [screen, setScreen] = useState<"setup" | "learn" | "quiz">("setup");
  
  // Setup selections
  const [activeTab, setActiveTab] = useState(0);
  const [selectedVerb, setSelectedVerb] = useState<Verb>(verbCategories[0].verbs[0]);
  const [theme, setTheme] = useState<"fairy_tale" | "live_news" | "daily_conversation">("fairy_tale");
  
  // Loading & Data state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sentence, setSentence] = useState("");
  const [analysis, setAnalysis] = useState<SentenceAnalysis | null>(null);
  
  // Learning Step inside Screen 2: 1 | 2 | 3
  const [learnStep, setLearnStep] = useState(1);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  
  // Tooltip index for train blocks
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  
  // Quiz state
  const [shuffledBlocks, setShuffledBlocks] = useState<(TrainBlock & { id: number })[]>([]);
  const [placedBlocks, setPlacedBlocks] = useState<(TrainBlock & { id: number })[]>([]);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizSuccess, setQuizSuccess] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState(0);

  // Rules selection state
  const [selectedRules, setSelectedRules] = useState<number[]>([1, 2]);
  const [showSlashes, setShowSlashes] = useState(false);

  const [activeRuleId, setActiveRuleId] = useState<number>(1);

  const toggleRule = (ruleId: number) => {
    if (ruleId === 1) return; // 기본 틀은 필수
    if (selectedRules.includes(ruleId)) {
      setSelectedRules(selectedRules.filter(id => id !== ruleId));
    } else {
      setSelectedRules([...selectedRules, ruleId]);
    }
  };

  const selectPreparedRule = (ruleId: number) => {
    setActiveRuleId(ruleId);
    setShowPronunciation(false);
    setShowTranslation(false);
  };

  // Set default verb on tab change
  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setSelectedVerb(verbCategories[index].verbs[0]);
  };

  // Fetch one single sentence containing all the selected rules
  const startLearning = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setLearnStep(1);
    setShowPronunciation(false);
    setShowTranslation(false);
    setShowSlashes(false);
    setActiveTooltip(null);
    
    try {
      // 1. Fetch content sentence passing all selected rules joined by comma
      const fetchRes = await fetch(`/api/fetch-content?verb=${selectedVerb.english}&theme=${theme}&rules=${selectedRules.join(",")}`);
      if (!fetchRes.ok) throw new Error("콘텐츠를 가져오는 데 실패했습니다.");
      const fetchData = await fetchRes.json();
      const rawSentence = fetchData.sentence;
      setSentence(rawSentence);

      // 2. Split sentence
      const splitRes = await fetch(`/api/split-sentence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: rawSentence })
      });
      if (!splitRes.ok) throw new Error("문장 분석에 실패했습니다.");
      const splitData = await splitRes.json();
      
      setAnalysis(splitData);
      
      // Default active rule is the first selected rule, or Rule 1
      const firstRuleId = selectedRules.includes(1) ? 1 : selectedRules[0] || 1;
      setActiveRuleId(firstRuleId);
      
      setScreen("learn");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Setup Quiz screen
  const startQuiz = () => {
    if (!analysis) return;
    
    // Add unique IDs to blocks for key tracking and shuffle them
    const blocksWithId = analysis.train_blocks.map((block, idx) => ({
      ...block,
      id: idx
    }));
    
    // Fisher-Yates shuffle
    const shuffled = [...blocksWithId];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setShuffledBlocks(shuffled);
    setPlacedBlocks([]);
    setQuizChecked(false);
    setQuizSuccess(false);
    setQuizAttempts(0);
    setScreen("quiz");
  };

  // TTS speaker using SpeechSynthesis
  const speakEnglish = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85; // Slightly slower for learning
      window.speechSynthesis.speak(utterance);
    }
  };

  // Click handler to move block to placed list
  const placeBlock = (block: TrainBlock & { id: number }) => {
    if (quizChecked && quizSuccess) return;
    setPlacedBlocks([...placedBlocks, block]);
    setShuffledBlocks(shuffledBlocks.filter(b => b.id !== block.id));
    setQuizChecked(false);
  };

  // Click handler to remove block from placed list
  const removeBlock = (block: TrainBlock & { id: number }) => {
    if (quizChecked && quizSuccess) return;
    setShuffledBlocks([...shuffledBlocks, block]);
    setPlacedBlocks(placedBlocks.filter(b => b.id !== block.id));
    setQuizChecked(false);
  };

  // Verify quiz answer
  const checkAnswer = () => {
    if (!analysis) return;
    setQuizChecked(true);
    
    // Check if the placed order matches the original analysis order
    const isCorrect = placedBlocks.every((block, idx) => {
      // Find where this text segment originally was in analysis.train_blocks
      const originalIdx = analysis.train_blocks.findIndex(tb => tb.text === block.text && tb.type === block.type);
      // We want the current idx to match its position relative to other placed blocks
      // Or simply: check if the placed text sequence exactly matches the original text sequence
      return block.text === analysis.train_blocks[idx]?.text;
    }) && placedBlocks.length === analysis.train_blocks.length;

    if (isCorrect) {
      setQuizSuccess(true);
      // Explode confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    } else {
      setQuizSuccess(false);
      setQuizAttempts(prev => prev + 1);
    }
  };

  const resetQuiz = () => {
    if (!analysis) return;
    const blocksWithId = analysis.train_blocks.map((block, idx) => ({
      ...block,
      id: idx
    }));
    // Reshuffle
    const shuffled = [...blocksWithId];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledBlocks(shuffled);
    setPlacedBlocks([]);
    setQuizChecked(false);
    setQuizSuccess(false);
  };

  // Highlight rules in Step 3
  const renderHighlightedText = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, idx) => {
      const cleanWord = word.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      
      const isPassiveAux = ["was", "were", "is", "are", "been"].includes(cleanWord);
      const isFutureMarker = ["will"].includes(cleanWord) || word.toLowerCase().includes("going to");
      const isPastMarker = cleanWord.endsWith("ed") || [
        "had", "did", "said", "went", "got", "made", "knew", "thought", 
        "took", "told", "heard", "spoke", "saw", "looked", "watched", 
        "felt", "loved", "hoped", "ate", "drank", "slept", "came", "ran", 
        "walked", "worked", "played", "bought", "lived", "gave", "found", 
        "lost", "opened", "closed", "stopped", "called", "tried", "left", 
        "kept", "brought", "decided"
      ].includes(cleanWord);

      if (isPassiveAux) {
        return (
          <span key={idx} className="relative group px-1 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
            {word}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-amber-950 text-amber-200 text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
              주인공 바꾸기 틀(당하는 입장)
            </span>
          </span>
        );
      }
      
      if (isFutureMarker) {
        return (
          <span key={idx} className="relative group px-1 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
            {word}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-cyan-950 text-cyan-200 text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
              시간 뒤집기 틀(미래)
            </span>
          </span>
        );
      }
      
      if (isPastMarker && cleanWord !== "to" && cleanWord !== "a" && cleanWord !== "the") {
        return (
          <span key={idx} className="relative group px-1 rounded bg-yellow-500/20 text-yellow-300 font-semibold border border-yellow-500/30">
            {word}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-yellow-950 text-yellow-200 text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
              시간 뒤집기 틀(과거)
            </span>
          </span>
        );
      }

      return <span key={idx}>{word}</span>;
    });
  };

  // Get train block styling color
  const getBlockColorClass = (type: string) => {
    switch (type) {
      case "core":
        return "from-teal-500/20 to-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:border-emerald-400";
      case "place":
        return "from-indigo-500/20 to-blue-500/20 text-blue-300 border-blue-500/40 hover:border-blue-400";
      case "time":
        return "from-fuchsia-500/20 to-pink-500/20 text-pink-300 border-pink-500/40 hover:border-pink-400";
      case "reason":
        return "from-amber-500/20 to-orange-500/20 text-orange-300 border-orange-500/40 hover:border-orange-400";
      case "complement":
        return "from-purple-500/20 to-violet-500/20 text-violet-300 border-purple-500/40 hover:border-purple-400";
      default:
        return "from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-500/40";
    }
  };

  const getBlockTypeName = (type: string) => {
    switch (type) {
      case "core": return "주인공 + 동사";
      case "place": return "장소";
      case "time": return "시간";
      case "reason": return "이유";
      case "complement": return "보충설명";
      default: return "블록";
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-6 px-4 md:px-8 max-w-6xl mx-auto w-full">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🚂</div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              외우지 말고 쪼개라!
            </h1>
            <p className="text-[10px] md:text-xs text-slate-400 font-medium">AI 패턴 영어 기차 학습기</p>
          </div>
        </div>
        
        {screen !== "setup" && (
          <button
            onClick={() => setScreen("setup")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 text-xs font-semibold cursor-pointer transition-all active:scale-95"
          >
            🏠 처음으로
          </button>
        )}
      </header>

      {/* ERROR MESSAGE BAR */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-lg mb-6 text-sm flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-rose-300 font-bold hover:text-white ml-2 text-xs">닫기</button>
        </div>
      )}

      {/* MAIN VIEW */}
      <main className="flex-1 flex flex-col justify-center">
        {/* ==================== 1. SETUP SCREEN ==================== */}
        {screen === "setup" && (
          <div className="space-y-8 animate-fadeIn">
            {/* 동사 선택 섹션 */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <span className="text-indigo-400">🔥 1단계:</span> 학습할 핵심 동사 고르기
              </h2>
              
              {/* Category Tabs */}
              <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                {verbCategories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTabChange(idx)}
                    className={`px-4 py-2 text-xs md:text-sm font-bold whitespace-nowrap rounded-t-lg transition-all cursor-pointer ${
                      activeTab === idx 
                        ? "border-b-2 border-indigo-500 text-indigo-400 bg-indigo-500/5 font-black" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>

              {/* Verbs List */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-h-[280px] overflow-y-auto pr-1">
                {verbCategories[activeTab].verbs.map((verb) => (
                  <button
                    key={verb.english}
                    onClick={() => setSelectedVerb(verb)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                      selectedVerb.english === verb.english
                        ? "glass-panel-active border-indigo-500 text-white glow-indigo scale-[1.02]"
                        : "glass-panel border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-lg font-extrabold tracking-tight">{verb.english}</span>
                      <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded">
                        {verb.pronunciation}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 truncate group-hover:text-slate-300">{verb.korean}</p>
                    <div className="text-[10px] text-slate-500 mt-1 italic">과거: {verb.pastEnglish} ({verb.pastPronunciation})</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 콘텐츠 종류 선택 섹션 */}
            <div className="space-y-4 pt-4 border-t border-slate-900">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <span className="text-purple-400">🧚 2단계:</span> 문장 테마 선택
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fairy Tale */}
                <button
                  onClick={() => setTheme("fairy_tale")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    theme === "fairy_tale"
                      ? "glass-panel-active border-indigo-500 glow-indigo"
                      : "glass-panel border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-3xl">🧚</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      theme === "fairy_tale" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                    }`}>로딩 0초</span>
                  </div>
                  <h3 className="font-extrabold text-slate-100">동화 (Fairy Tale)</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    상상력을 자극하는 흥미진진한 고전 동화 속 핵심 문장들로 패턴을 학습합니다.
                  </p>
                </button>

                {/* Live News */}
                <button
                  onClick={() => setTheme("live_news")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    theme === "live_news"
                      ? "glass-panel-active border-purple-500 glow-violet"
                      : "glass-panel border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-3xl">📰</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
                      실시간 크롤링
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-100">실시간 뉴스 (Live News)</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    오늘 올라온 생생한 최신 해외 뉴스를 긁어와 가장 트렌디한 문장으로 학습합니다.
                  </p>
                </button>

                {/* Daily Conversation */}
                <button
                  onClick={() => setTheme("daily_conversation")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    theme === "daily_conversation"
                      ? "glass-panel-active border-pink-500 glow-violet"
                      : "glass-panel border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-3xl">☕</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      theme === "daily_conversation" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                    }`}>로딩 0초</span>
                  </div>
                  <h3 className="font-extrabold text-slate-100">일상 대화 (Daily Conversation)</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    실제 외국인들이 매일 입에 달고 사는 자연스러운 생활 회화 표현들을 정복합니다.
                  </p>
                </button>
              </div>
            </div>

            {/* 3단계: 핵심 규칙 선택 */}
            <div className="space-y-4 pt-4 border-t border-slate-900">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <span className="text-pink-400">🚂 3단계:</span> 포함할 핵심 규칙 선택
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { id: 1, label: "1. 기본 틀", desc: "누가 ➡️ 한다 ➡️ 무엇을 (필수)" },
                  { id: 2, label: "2. 꼬리 틀", desc: "장소 ➡️ 시간 ➡️ 이유 순" },
                  { id: 3, label: "3. 접착제 틀", desc: "who / which 보충설명" },
                  { id: 4, label: "4. 시간 뒤집기 틀", desc: "과거 vs 미래 시점" },
                  { id: 5, label: "5. 주인공 바꾸기 틀", desc: "당하는 입장 (수동태)" }
                ].map((rule) => {
                  const isChecked = selectedRules.includes(rule.id);
                  return (
                    <button
                      key={rule.id}
                      onClick={() => toggleRule(rule.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer flex flex-col justify-between h-[65px] ${
                        isChecked
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-300 font-extrabold"
                          : rule.id === 1
                            ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800"
                      }`}
                      disabled={rule.id === 1}
                    >
                      <span className="font-bold block">{rule.label}</span>
                      <span className="text-[9px] opacity-70 block truncate">{rule.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Giant Start Button */}
            <div className="pt-8 flex justify-center">
              <button
                onClick={startLearning}
                disabled={isLoading}
                className="w-full md:w-96 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold text-lg shadow-xl shadow-indigo-900/30 hover:opacity-95 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>AI가 최신 글 가져오는 중...</span>
                  </>
                ) : (
                  <>
                    <span>학습 시작하기 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ==================== 2. LEARNING SCREEN (TRAIN SIMULATOR) ==================== */}
        {screen === "learn" && analysis && (
          <div className="space-y-8 animate-fadeIn">
            {/* Status Information */}
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {theme === "fairy_tale" ? "🧚" : theme === "live_news" ? "📰" : "☕"}
                </span>
                <span className="text-slate-300 font-bold">
                  {theme === "fairy_tale" ? "동화 테마" : theme === "live_news" ? "실시간 뉴스" : "일상 대화"}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-indigo-400 font-black">
                  핵심 동사: {selectedVerb.english} ({selectedVerb.korean})
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => speakEnglish(analysis.original_sentence)}
                  className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  🔊 소리 듣기
                </button>
              </div>
            </div>

            {/* Interactive Progress Tabs */}
            <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setLearnStep(1)}
                className={`py-3 text-center text-xs md:text-sm font-bold rounded-t-xl transition-all cursor-pointer ${
                  learnStep === 1 
                    ? "bg-slate-900 border-b-2 border-indigo-500 text-indigo-400 font-black" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                1단계: 원문 통째로 보기
              </button>
              <button
                onClick={() => setLearnStep(2)}
                className={`py-3 text-center text-xs md:text-sm font-bold rounded-t-xl transition-all cursor-pointer ${
                  learnStep === 2 
                    ? "bg-slate-900 border-b-2 border-purple-500 text-purple-400 font-black" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                2단계: 기차 쪼개기
              </button>
              <button
                onClick={() => setLearnStep(3)}
                className={`py-3 text-center text-xs md:text-sm font-bold rounded-t-xl transition-all cursor-pointer ${
                  learnStep === 3 
                    ? "bg-slate-900 border-b-2 border-pink-500 text-pink-400 font-black" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                3단계: 문법 하이라이트
              </button>
            </div>

            {/* STEP 1: ORIGINAL SENTENCE CONTAINER */}
            {learnStep === 1 && (
              <div className="bg-slate-900/40 p-8 rounded-2xl border border-slate-800/80 space-y-6 text-center shadow-lg animate-slideUp">
                 <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">Original English Sentence</span>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100 leading-snug pt-2 min-h-[90px] flex items-center justify-center">
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-3 text-indigo-400 text-base md:text-lg">
                        <svg className="animate-spin h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        AI가 규칙을 적용한 문장을 실시간 생성하고 있습니다...
                      </span>
                    ) : analysis ? (
                      <span className="flex flex-wrap justify-center items-center gap-y-2 gap-x-1.5 whitespace-pre-wrap">
                        {analysis.train_blocks.map((block, idx) => {
                          const isCore = activeRuleId === 1 && block.type === "core";
                          const isTail = activeRuleId === 2 && ["place", "time", "reason"].includes(block.type);
                          const isComp = activeRuleId === 3 && block.type === "complement";
                          const isTense = activeRuleId === 4 && (block.type === "core" && analysis.applied_rules.includes(4));
                          const isPassive = activeRuleId === 5 && (block.type === "core" && analysis.applied_rules.includes(5));
                          const shouldHighlight = isCore || isTail || isComp || isTense || isPassive;
                          
                          return (
                            <span key={idx} className="inline-block">
                              <span className={`px-2 py-1 rounded-lg transition-all duration-300 ${
                                shouldHighlight 
                                  ? activeRuleId === 1
                                    ? "bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/40 glow-emerald scale-[1.01]"
                                    : activeRuleId === 2
                                      ? "bg-blue-500/20 text-blue-300 font-extrabold border border-blue-500/40 glow-blue scale-[1.01]"
                                      : activeRuleId === 3
                                        ? "bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/40 glow-indigo scale-[1.01]"
                                        : activeRuleId === 4
                                          ? "bg-pink-500/20 text-pink-300 font-extrabold border border-pink-500/40 glow-violet scale-[1.01]"
                                          : "bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40 glow-orange scale-[1.01]"
                                  : "text-slate-100 font-bold opacity-80"
                              }`}>
                                {block.text}
                              </span>
                              {idx < analysis.train_blocks.length - 1 && (
                                <span className={`ml-2 text-slate-500 font-black transition-all ${
                                  showSlashes ? "text-emerald-400 opacity-100" : "opacity-0 w-0 overflow-hidden"
                                }`}>
                                  /
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </span>
                    ) : (
                      `""`
                    )}
                  </h3>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  <button
                    onClick={() => setShowPronunciation(!showPronunciation)}
                    disabled={isLoading}
                    className={`px-4 py-2.5 rounded-xl border text-xs md:text-sm font-bold transition-all cursor-pointer ${
                      showPronunciation 
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-black" 
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {showPronunciation ? "발음 팁 숨기기 🙈" : "한글 발음 팁 보기 👀"}
                  </button>
                  <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    disabled={isLoading}
                    className={`px-4 py-2.5 rounded-xl border text-xs md:text-sm font-bold transition-all cursor-pointer ${
                      showTranslation 
                        ? "bg-purple-600/20 border-purple-500 text-purple-300 font-black" 
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {showTranslation ? "해석 숨기기 🙈" : "한글 해석 보기 👀"}
                  </button>
                  <button
                    onClick={() => setShowSlashes(!showSlashes)}
                    disabled={isLoading}
                    className={`px-4 py-2.5 rounded-xl border text-xs md:text-sm font-bold transition-all cursor-pointer ${
                      showSlashes 
                        ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 font-black" 
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {showSlashes ? "구분선 숨기기 🙈" : "슬래시 구분보기 (/) 🔍"}
                  </button>
                </div>

                {/* Sub-panels for Pronunciation and Translation */}
                <div className="space-y-3 min-h-[80px]">
                  {!isLoading && showPronunciation && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-indigo-950 text-indigo-300 text-sm md:text-base font-bold animate-fadeIn">
                      🗣️ {analysis?.pronunciation_tip}
                    </div>
                  )}
                  {!isLoading && showTranslation && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-purple-950 text-purple-300 text-sm md:text-base font-bold animate-fadeIn text-left space-y-1">
                      <div className="text-slate-400 text-xs font-semibold">전체 한국어 번역:</div>
                      <div className="font-extrabold text-purple-300">🇰🇷 {analysis?.korean_translation}</div>
                    </div>
                  )}
                </div>

                {/* 만들어진 규칙 버튼들만 표시 */}
                <div className="pt-6 border-t border-slate-800/50 space-y-3 text-left">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400 block">적용된 규칙별 끊어 읽기 (클릭 시 하이라이트)</span>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {selectedRules.sort((a, b) => a - b).map((ruleId) => {
                      const isSelected = activeRuleId === ruleId;
                      const ruleMeta = [
                        { id: 1, label: "1. 기본 틀", desc: "누가 ➡️ 한다 ➡️ 무엇을" },
                        { id: 2, label: "2. 꼬리 틀", desc: "장소 ➡️ 시간 ➡️ 이유 순" },
                        { id: 3, label: "3. 접착제 틀", desc: "who / which 보충설명" },
                        { id: 4, label: "4. 시간 뒤집기 틀", desc: "과거 vs 미래 시점" },
                        { id: 5, label: "5. 주인공 바꾸기 틀", desc: "당하는 입장 (수동태)" }
                      ].find(r => r.id === ruleId);
                      
                      if (!ruleMeta) return null;
                      return (
                        <button
                          key={ruleId}
                          onClick={() => selectPreparedRule(ruleId)}
                          disabled={isLoading}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-[75px] ${
                            isSelected
                              ? "bg-indigo-500/15 border-indigo-500 text-indigo-300 font-extrabold glow-indigo scale-[1.01]"
                              : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-200"
                          } disabled:opacity-40`}
                        >
                          <span className="font-extrabold text-xs">{ruleMeta.label} 보기</span>
                          <span className="text-[9px] opacity-70 block truncate">{ruleMeta.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 현재 하이라이트된 규칙 상세 가이드 및 적용 구절 */}
                {!isLoading && analysis && (
                  <div className="pt-2">
                    {(() => {
                      if (activeRuleId === 1) {
                        const coreBlock = analysis.train_blocks.find(b => b.type === "core");
                        return (
                          <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-xl text-left animate-fadeIn">
                            <span className="text-emerald-400 font-extrabold text-xs md:text-sm block mb-2">🚂 1단계: 기본 결론 (누가 ➡️ 한다 ➡️ 무엇을)</span>
                            {coreBlock ? (
                              <div className="space-y-1.5">
                                <div className="text-sm font-black text-emerald-300">👉 {coreBlock.text}</div>
                                <div className="text-xs text-slate-300">해석: {coreBlock.ko}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">기본 틀 분석 내용이 없습니다.</span>
                            )}
                          </div>
                        );
                      }
                      if (activeRuleId === 2) {
                        const tailBlocks = analysis.train_blocks.filter(b => ["place", "time", "reason"].includes(b.type));
                        return (
                          <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-xl text-left animate-fadeIn space-y-3">
                            <span className="text-blue-400 font-extrabold text-xs md:text-sm block">🚂 2단계: 꼬리 틀 (장소 ➡️ 시간 ➡️ 이유 순서)</span>
                            {tailBlocks.length > 0 ? (
                              <div className="space-y-2.5">
                                {tailBlocks.map((b, i) => (
                                  <div key={i} className="text-xs border-l-2 border-blue-500/50 pl-2">
                                    <span className="font-bold text-blue-300">[{getBlockTypeName(b.type)}] {b.text}</span>
                                    <div className="text-slate-300 mt-0.5">- 해석: {b.ko}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 block">이 문장에는 추가된 장소/시간/이유 꼬리가 없습니다.</span>
                            )}
                          </div>
                        );
                      }
                      if (activeRuleId === 3) {
                        const compBlocks = analysis.train_blocks.filter(b => b.type === "complement" || b.text.toLowerCase().includes("who") || b.text.toLowerCase().includes("which") || b.text.toLowerCase().includes("that"));
                        return (
                          <div className="bg-purple-950/20 border border-purple-900/30 p-4 rounded-xl text-left animate-fadeIn">
                            <span className="text-purple-400 font-extrabold text-xs md:text-sm block mb-2">🚂 3단계: 접착제 틀 (명사 보충 설명 - who / which)</span>
                            {compBlocks.length > 0 ? (
                              <div className="space-y-2">
                                {compBlocks.map((b, i) => (
                                  <div key={i} className="text-xs border-l-2 border-purple-500/50 pl-2">
                                    <span className="font-black text-purple-300">👉 {b.text}</span>
                                    <div className="text-slate-300 mt-0.5">- 해석: {b.ko} (앞 명사를 설명)</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 block">이 문장에는 명사 보충 설명(who/which)이 없습니다.</span>
                            )}
                          </div>
                        );
                      }
                      if (activeRuleId === 4) {
                        const hasPast = analysis.applied_rules.includes(4);
                        return (
                          <div className="bg-pink-950/20 border border-pink-900/30 p-4 rounded-xl text-left animate-fadeIn">
                            <span className="text-pink-400 font-extrabold text-xs md:text-sm block mb-2">🚂 4단계: 시간 뒤집기 틀 (과거 vs 미래)</span>
                            {hasPast ? (
                              <div className="space-y-1.5">
                                <div className="text-xs font-bold text-pink-300">👉 시제 변형 감지됨 (과거/미래형)</div>
                                <p className="text-[11px] text-slate-300">선택 동사 "{selectedVerb.english}"가 시제 변형(과거형/미래형) 처리되었습니다.</p>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500">이 문장에는 시간 뒤집기 틀이 적용되지 않았습니다 (기본 현재 시제).</div>
                            )}
                          </div>
                        );
                      }
                      if (activeRuleId === 5) {
                        const hasPassive = analysis.applied_rules.includes(5);
                        return (
                          <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-xl text-left animate-fadeIn">
                            <span className="text-amber-400 font-extrabold text-xs md:text-sm block mb-2">🚂 5단계: 주인공 바꾸기 틀 (당하는 입장)</span>
                            {hasPassive ? (
                              <div className="space-y-1.5">
                                <div className="text-xs font-bold text-amber-300">👉 수동태(당하는 입장) 감지됨!</div>
                                <p className="text-[11px] text-slate-300">was/were + p.p. 형태가 활용되어 주어가 직접 하는 행동이 아닌, '당하거나 그렇게 됨'을 진술합니다.</p>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500">이 문장에는 주인공 바꾸기 틀이 적용되지 않았습니다 (능동태).</div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800/50 flex justify-end">
                  <button
                    onClick={() => setLearnStep(2)}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    2단계: 기차 쪼개기 ➡️
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: TRAIN BLOCK VISUALIZER */}
            {learnStep === 2 && (
              <div className="space-y-6 animate-slideUp">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-slate-200">🚂 5대 기차 규칙으로 쪼개기</h3>
                  <p className="text-xs text-slate-400">각 기차 칸을 클릭/터치하면 해당하는 한글 의미가 풍선 도움말로 등장합니다.</p>
                </div>

                {/* Train Tracks Layout */}
                <div className="train-track py-16 px-4 overflow-x-auto flex items-center justify-start min-h-[220px]">
                  <div className="flex items-center gap-1.5 min-w-max mx-auto pr-8">
                    {/* SVG TRAIN ENGINE */}
                    <div className="relative flex flex-col items-center">
                      {/* Animated Smoke Puffs */}
                      <div className="absolute -top-12 left-10 flex flex-col gap-1 items-end pointer-events-none">
                        <div className="w-3 h-3 bg-slate-400/35 rounded-full smoke-puff-1"></div>
                        <div className="w-4 h-4 bg-slate-400/25 rounded-full smoke-puff-2"></div>
                        <div className="w-2 h-2 bg-slate-400/45 rounded-full smoke-puff-3"></div>
                      </div>
                      <div className="w-24 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl relative shadow-lg flex flex-col justify-end p-2 border border-indigo-400/40 glow-indigo">
                        {/* Wheels */}
                        <div className="absolute -bottom-3 left-3 w-6 h-6 rounded-full bg-slate-900 border-2 border-indigo-400 animate-spin" style={{ animationDuration: '6s' }}></div>
                        <div className="absolute -bottom-3 right-3 w-6 h-6 rounded-full bg-slate-900 border-2 border-indigo-400 animate-spin" style={{ animationDuration: '6s' }}></div>
                        {/* Chimney */}
                        <div className="absolute -top-4 left-10 w-4 h-5 bg-indigo-600 rounded-t border-t border-indigo-400"></div>
                        {/* Window */}
                        <div className="absolute top-2 right-2 w-7 h-6 bg-slate-950/80 rounded border border-indigo-500/50 flex items-center justify-center">
                          <span className="text-[10px] text-cyan-400 font-extrabold">AI</span>
                        </div>
                        <span className="text-white text-[10px] font-black tracking-widest text-center">ENGINE</span>
                      </div>
                    </div>

                    {/* Train Blocks Link / Chain */}
                    <div className="w-8 h-2 bg-gradient-to-r from-indigo-500 to-slate-800 rounded"></div>

                    {/* RENDER TRAIN CAR BLOCKS */}
                    {analysis.train_blocks.map((block, idx) => (
                      <React.Fragment key={idx}>
                        <div className="relative">
                          {/* Tooltip speech bubble */}
                          {activeTooltip === idx && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/50 px-4 py-2.5 rounded-xl shadow-2xl z-50 text-center w-56 text-slate-100 animate-bounce">
                              <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400 block mb-0.5">Meaning</span>
                              <p className="text-xs font-bold leading-relaxed">{block.ko}</p>
                              {/* Small triangle arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-indigo-950/90 filter drop-shadow(0 1px 0 rgba(99, 102, 241, 0.5))"></div>
                            </div>
                          )}

                          {/* Train Car Box */}
                          <button
                            onClick={() => setActiveTooltip(activeTooltip === idx ? null : idx)}
                            className={`w-64 h-24 bg-gradient-to-br ${getBlockColorClass(block.type)} rounded-xl border p-3 flex flex-col justify-between shadow-lg relative cursor-pointer active:scale-95 transition-all text-left group`}
                          >
                            <span className="text-[9px] uppercase font-black tracking-widest opacity-80 group-hover:opacity-100">
                              [{getBlockTypeName(block.type)}]
                            </span>
                            <h4 className="text-sm font-bold tracking-tight leading-snug my-auto overflow-hidden text-ellipsis line-clamp-2">
                              {block.text}
                            </h4>
                            <span className="text-[9px] opacity-60 text-right">터치하여 번역보기 💡</span>

                            {/* Wheels for train car */}
                            <div className="absolute -bottom-2.5 left-6 w-5 h-5 rounded-full bg-slate-900 border border-slate-700"></div>
                            <div className="absolute -bottom-2.5 right-6 w-5 h-5 rounded-full bg-slate-900 border border-slate-700"></div>
                          </button>
                        </div>

                        {/* Connector chain except for the last item */}
                        {idx < analysis.train_blocks.length - 1 && (
                          <div className="w-8 h-2 bg-slate-800 rounded"></div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/80 text-sm max-w-xl mx-auto flex items-center gap-3">
                  <div className="text-xl">💡</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    영어 문장은 이렇게 <span className="text-indigo-400 font-bold">기차 칸 순서</span>대로 연결됩니다.
                    주인공이 등장한 뒤, 어디서(장소), 언제(시간), 왜(이유) 일어났는지 꼬리를 차례로 이어가며 머릿속으로 기차를 그려보세요!
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/50 flex justify-between">
                  <button
                    onClick={() => setLearnStep(1)}
                    className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    ⬅️ 1단계로
                  </button>
                  <button
                    onClick={() => setLearnStep(3)}
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    3단계: 규칙 마커 보기 ➡️
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: GRAMMAR MARKER HIGHLIGHTS & RULES */}
            {learnStep === 3 && (
              <div className="space-y-8 animate-slideUp">
                {/* Highlight explanation */}
                <div className="space-y-4 text-center">
                  <h3 className="text-lg font-bold text-slate-200">🔍 문법 핵심 규칙 마커 하이라이트</h3>
                  <p className="text-xs text-slate-400">단어 위에 마우스를 올리면 어떤 규칙이 적용되었는지 확인해 보세요.</p>
                  
                  <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 max-w-2xl mx-auto leading-relaxed text-lg md:text-xl font-bold">
                    <div className="flex flex-wrap justify-center gap-y-2 gap-x-0.5">
                      {analysis.train_blocks.map((block, bIdx) => (
                        <span key={bIdx} className="inline-block">
                          {renderHighlightedText(block.text)}
                          {bIdx < analysis.train_blocks.length - 1 && <span className="mx-2 text-indigo-500 font-extrabold">|</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5대 핵심 규칙 가이드북 (1과정, 2과정 분할 학습) */}
                <div className="space-y-6 max-w-4xl mx-auto">
                  <h4 className="text-base font-extrabold text-slate-200 border-l-4 border-indigo-500 pl-3">
                    🚂 평생 써먹는 영어의 5대 핵심 규칙 학습
                  </h4>

                  {/* [1과정] 영어의 기본과 꼬리 붙이기 */}
                  <div className="glass-panel p-5 rounded-2xl border border-slate-850 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-2 gap-2">
                      <h5 className="font-extrabold text-indigo-400 text-sm flex items-center gap-2 whitespace-nowrap">
                        <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded text-[10px] uppercase font-black">1과정</span>
                        영어의 기본과 꼬리 붙이기
                      </h5>
                      <span className="text-[10px] text-slate-400">영어는 무조건 결론(중요한 말)부터 던지고, 꼬리는 뒤로 붙입니다.</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 규칙 1 */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2 relative overflow-hidden group">
                        <div className="absolute top-2 right-2 text-2xl font-black text-slate-800/20 select-none">1</div>
                        <h6 className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                          1. 기본 틀 (누가 ➡️ 한다 ➡️ 무엇을)
                        </h6>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          현재 학습 중인 문장의 핵심 뼈대(누가 + 한다 + 무엇을)입니다.
                        </p>
                        {/* 현재 문장 매핑 */}
                        {(() => {
                          const coreBlock = analysis.train_blocks.find(b => b.type === "core");
                          return coreBlock ? (
                            <div className="mt-2 pt-2 border-t border-slate-900/60 bg-emerald-950/10 p-2.5 rounded-lg border border-emerald-900/20">
                              <span className="text-[9px] text-emerald-400 font-extrabold block">현재 문장 적용 구간:</span>
                              <div className="text-sm font-black text-emerald-300 mt-1">"{coreBlock.text}"</div>
                              <p className="text-xs text-slate-300 mt-1">해석: {coreBlock.ko}</p>
                            </div>
                          ) : (
                            <div className="mt-2 pt-2 border-t border-slate-900">
                              <span className="text-xs text-slate-500 block">이 문장에는 기본 틀 분석 정보가 없습니다.</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 규칙 2 */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2 relative overflow-hidden group">
                        <div className="absolute top-2 right-2 text-2xl font-black text-slate-800/20 select-none">2</div>
                        <h6 className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                          2. 꼬리 틀 (장소 ➡️ 시간 ➡️ 이유 순서)
                        </h6>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          핵심 정보 뒤에 덧붙여진 [장소 / 시간 / 이유] 꼬리 정보입니다.
                        </p>
                        {/* 현재 문장 매핑 */}
                        {(() => {
                          const tailBlocks = analysis.train_blocks.filter(b => ["place", "time", "reason"].includes(b.type));
                          return tailBlocks.length > 0 ? (
                            <div className="mt-2 pt-2 border-t border-slate-900/60 bg-blue-950/10 p-2.5 rounded-lg border border-blue-900/20 space-y-2">
                              <span className="text-[9px] text-blue-400 font-extrabold block">현재 문장 적용 구간:</span>
                              {tailBlocks.map((b, i) => (
                                <div key={i} className="text-xs">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-800/30">
                                    {getBlockTypeName(b.type)}
                                  </span>{" "}
                                  <span className="font-black text-blue-200">"{b.text}"</span>
                                  <div className="text-[10px] text-slate-300 ml-2 mt-0.5">- 해석: {b.ko}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2 pt-2 border-t border-slate-900/60 bg-slate-950/20 p-2 rounded-lg border border-slate-900/20">
                              <span className="text-xs text-slate-500 block">이 문장에는 추가된 장소/시간/이유 꼬리가 없습니다.</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* [2과정] 문장 늘리기와 시간 조절 */}
                  <div className="glass-panel p-5 rounded-2xl border border-slate-850 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-2 gap-2">
                      <h5 className="font-extrabold text-purple-400 text-sm flex items-center gap-2 whitespace-nowrap">
                        <span className="bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded text-[10px] uppercase font-black">2과정</span>
                        문장 늘리기와 시간 조절
                      </h5>
                      <span className="text-[10px] text-slate-400">접착제로 문장을 무한히 늘리고, 동사를 바꿔 시점과 입장을 조절합니다.</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 규칙 3 */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2 relative overflow-hidden group">
                        <div className="absolute top-2 right-2 text-2xl font-black text-slate-800/20 select-none">3</div>
                        <h6 className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-violet-400"></span>
                          3. 접착제 틀 (who / which)
                        </h6>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          명사 바로 뒤에서 수식/보충 설명해 주는 접착제(관계사 등) 연결 구간입니다.
                        </p>
                        {/* 현재 문장 매핑 */}
                        {(() => {
                          const compBlocks = analysis.train_blocks.filter(b => b.type === "complement" || b.text.toLowerCase().includes("who") || b.text.toLowerCase().includes("which") || b.text.toLowerCase().includes("that"));
                          return compBlocks.length > 0 ? (
                            <div className="mt-2 pt-2 border-t border-slate-900/60 bg-violet-950/10 p-2.5 rounded-lg border border-violet-900/20 space-y-1">
                              <span className="text-[9px] text-violet-400 font-extrabold block">현재 문장 적용 구간:</span>
                              {compBlocks.map((b, i) => (
                                <div key={i} className="text-xs">
                                  <span className="font-black text-violet-300">"{b.text}"</span>
                                  <div className="text-[10px] text-slate-300 mt-0.5">- 해석: {b.ko}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2 pt-2 border-t border-slate-900/60 bg-slate-950/20 p-2 rounded-lg border border-slate-900/20">
                              <span className="text-xs text-slate-500 block">이 문장에는 명사 보충 설명(who/which)이 없습니다.</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 규칙 4 */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2 relative overflow-hidden group">
                        <div className="absolute top-2 right-2 text-2xl font-black text-slate-800/20 select-none">4</div>
                        <h6 className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-pink-400"></span>
                          4. 시간 뒤집기 틀 (과거 vs 미래)
                        </h6>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          문장의 발생 시점이 과거(과거형 동사) 또는 미래(will)로 조정된 구간입니다.
                        </p>
                        {/* 현재 문장 매핑 */}
                        {(() => {
                          const hasPast = analysis.applied_rules.includes(4);
                          return hasPast ? (
                            <div className="mt-2 pt-2 border-t border-slate-900/60 bg-pink-950/10 p-2.5 rounded-lg border border-pink-900/20">
                              <span className="text-[9px] text-pink-400 font-extrabold block">현재 문장 적용:</span>
                              <div className="text-xs font-black text-pink-300 mt-1">시제 변형 감지됨 (과거/미래형)</div>
                              <p className="text-[10px] text-slate-300 mt-1">선택 동사 "{selectedVerb.english}"가 과거형 또는 미래형 시제로 변형되어 사용되었습니다.</p>
                            </div>
                          ) : (
                            <div className="mt-2 pt-2 border-t border-slate-900/60 bg-slate-950/20 p-2 rounded-lg border border-slate-900/20">
                              <span className="text-xs text-slate-500 block">이 문장은 기본적인 현재 시점(현재형)입니다.</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 규칙 5 */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2 relative overflow-hidden group">
                        <div className="absolute top-2 right-2 text-2xl font-black text-slate-800/20 select-none">5</div>
                        <h6 className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                          5. 주인공 바꾸기 틀 (당하는 입장)
                        </h6>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          주인공이 직접 하는 것이 아닌, 당하거나 겪는 입장(수동태)으로 작성된 구간입니다.
                        </p>
                        {/* 현재 문장 매핑 */}
                        {(() => {
                          const hasPassive = analysis.applied_rules.includes(5);
                          return hasPassive ? (
                            <div className="mt-2 pt-2 border-t border-slate-900/60 bg-amber-950/10 p-2.5 rounded-lg border border-amber-900/20">
                              <span className="text-[9px] text-amber-400 font-extrabold block">현재 문장 적용:</span>
                              <div className="text-xs font-black text-amber-300 mt-1">수동태(당하는 입장) 감지됨!</div>
                              <p className="text-[10px] text-slate-300 mt-1">was/were + p.p. 형태가 활용되어 '~되었다/해졌다'로 진술되었습니다.</p>
                            </div>
                          ) : (
                            <div className="mt-2 pt-2 border-t border-slate-900/60 bg-slate-950/20 p-2 rounded-lg border border-slate-900/20">
                              <span className="text-xs text-slate-500 block">이 문장은 주인공이 주동적으로 행동하는 능동태입니다.</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800/50 flex justify-between items-center">
                  <button
                    onClick={() => setLearnStep(2)}
                    className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    ⬅️ 2단계로
                  </button>
                  
                  <button
                    onClick={startQuiz}
                    className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-950/20 cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <span>🎓 졸업 시험 도전하기!</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. QUIZ SCREEN (GRADUATION EXAM) ==================== */}
        {screen === "quiz" && analysis && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">GRADUATION EXAM</span>
              <h2 className="text-2xl font-black text-slate-100">🎓 문장 조립 졸업 시험</h2>
              <p className="text-xs text-slate-400">한글 해석 힌트를 참고하여 단어 블록들을 기차 틀에 맞게 올바른 순서대로 조립하세요!</p>
            </div>

            {/* Korean Translation Hint */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center max-w-xl mx-auto">
              <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">한글 힌트</span>
              <p className="text-sm md:text-base font-bold text-indigo-300">
                "{analysis.korean_translation}"
              </p>
            </div>

            {/* Quiz Board: Placed Slots */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between max-w-4xl mx-auto px-2">
                <span>조립판 (기차 레일)</span>
                <span>{placedBlocks.length} / {analysis.train_blocks.length} 조립됨</span>
              </div>
              
              <div className="w-full max-w-4xl mx-auto bg-slate-950 p-6 rounded-2xl border-2 border-dashed border-slate-800 min-h-[140px] flex flex-wrap items-center justify-center gap-3 relative">
                {placedBlocks.length === 0 ? (
                  <p className="text-slate-500 text-xs font-semibold select-none">
                    아래의 쪼개진 블록을 클릭하면 차례대로 기차 레일에 붙습니다.
                  </p>
                ) : (
                  placedBlocks.map((block) => (
                    <button
                      key={block.id}
                      onClick={() => removeBlock(block)}
                      className={`px-4 py-3 bg-gradient-to-br ${getBlockColorClass(block.type)} rounded-xl border font-bold text-xs cursor-pointer hover:scale-95 active:scale-90 transition-all flex items-center gap-2`}
                    >
                      <span className="text-[9px] font-black bg-white/10 px-1 rounded">
                        {getBlockTypeName(block.type)}
                      </span>
                      <span>{block.text}</span>
                      <span className="text-slate-500 text-[10px]">✕</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Shuffled pool */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider max-w-4xl mx-auto px-2">
                부품 보관함 (흩어진 단어 블록)
              </div>
              
              <div className="w-full max-w-4xl mx-auto bg-slate-900/30 p-6 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-center gap-3 min-h-[100px]">
                {shuffledBlocks.length === 0 && !quizChecked ? (
                  <p className="text-emerald-400 text-xs font-bold animate-pulse">
                    모든 부품을 조립판에 올렸습니다! 아래 [정답 확인하기] 버튼을 누르세요.
                  </p>
                ) : (
                  shuffledBlocks.map((block) => (
                    <button
                      key={block.id}
                      onClick={() => placeBlock(block)}
                      className={`px-4 py-3 bg-slate-850 hover:bg-slate-800 text-slate-100 rounded-xl border border-slate-800 font-bold text-xs cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md`}
                    >
                      {block.text}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Feedback / Results Message */}
            {quizChecked && (
              <div className="max-w-md mx-auto text-center animate-fadeIn">
                {quizSuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl space-y-2">
                    <h4 className="text-lg font-extrabold flex items-center justify-center gap-2">
                      🎉 축하합니다! 완벽한 기차 완성!
                    </h4>
                    <p className="text-xs leading-relaxed">
                      영어의 어순 감각을 완벽히 마스터하셨습니다! 동사의 과거형태와 규칙들도 정확히 기억하고 계시네요.
                    </p>
                    <div className="text-sm font-bold text-white pt-1">
                      🗣️ "{analysis.original_sentence}"
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl space-y-1.5 animate-shake">
                    <h4 className="text-sm font-bold">❌ 기차 조립 순서가 맞지 않습니다!</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      기차 칸의 역할별 순서를 잘 고려해 보세요. <br />
                      <span className="text-indigo-400 font-bold">[주인공+동사]</span> 뒤에는 보통 <span className="text-indigo-400 font-bold">[장소 ➡️ 시간 ➡️ 이유]</span>가 옵니다.
                    </p>
                    <button
                      onClick={resetQuiz}
                      className="mt-2 text-xs font-bold text-rose-400 underline hover:text-rose-300 cursor-pointer"
                    >
                      순서 초기화하고 다시 풀기
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quiz Controller Buttons */}
            <div className="pt-6 border-t border-slate-800/50 flex justify-center gap-4">
              <button
                onClick={() => setScreen("learn")}
                className="px-4 py-3 border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 font-bold text-sm rounded-xl cursor-pointer transition-all"
              >
                ⬅️ 학습방으로 돌아가기
              </button>
              
              {quizSuccess ? (
                <button
                  onClick={startLearning}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold text-sm rounded-xl cursor-pointer hover:opacity-95 transition-all shadow-lg active:scale-95"
                >
                  새로운 문장 학습하기 🚀
                </button>
              ) : (
                <button
                  onClick={checkAnswer}
                  disabled={placedBlocks.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 transition-all shadow-lg active:scale-95"
                >
                  정답 확인하기 🔍
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-slate-900 pt-6 text-center space-y-2 text-[10px] md:text-xs text-slate-500 font-medium">
        <p>외우지 말고 쪼개라! © {new Date().getFullYear()} AI Pattern English Train. All rights reserved.</p>
        <p className="leading-relaxed">
          이 앱은 사용자가 고른 50개 패턴 동사와 Vercel 서버리스 웹 크롤링 및 Google Gemini 2.5 AI 모델을 활용하여 실시간으로 영어 문장을 쪼개주는 무료 학습 플랫폼입니다.
        </p>
      </footer>
    </div>
  );
}
