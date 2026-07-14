import { NextResponse } from "next/server";

// Fallback logic for common sentences to keep the app working 100% offline or if the key fails
const fallbackAnalysis: Record<string, any> = {
  "republicans started a race on the november ballot to replace graham.": {
    original_sentence: "Republicans started a race on the November ballot to replace Graham.",
    pronunciation_tip: "리퍼블리컨즈 스타티드 어 레이스 온 더 노벰버 밸럿 투 리플레이스 그레이엄",
    korean_translation: "공화당원들은 11월 선거에서 그레이엄 의원을 대체하기 위한 경쟁을 시작했습니다.",
    train_blocks: [
      { type: "core", text: "Republicans started a race", ko: "공화당원들은 경쟁을 시작했다" },
      { type: "place", text: "on the November ballot", ko: "11월 선거판에서" },
      { type: "reason", text: "to replace Graham", ko: "그레이엄을 대체하기 위해" }
    ],
    applied_rules: [1, 2, 4]
  },
  "once upon a time, there was a beautiful princess in a high tower.": {
    original_sentence: "Once upon a time, there was a beautiful princess in a high tower.",
    pronunciation_tip: "원스 어판 어 타임 데어 워즈 어 뷰티풀 프린세스 인 어 하이 타워",
    korean_translation: "옛날 옛적에 높은 탑에 아름다운 공주가 있었습니다.",
    train_blocks: [
      { type: "time", text: "Once upon a time", ko: "옛날 옛적에" },
      { type: "core", text: "there was a beautiful princess", ko: "아름다운 공주가 있었다" },
      { type: "place", text: "in a high tower", ko: "높은 탑에" }
    ],
    applied_rules: [1, 2, 4]
  }
};

// Generates a mock analysis for any sentence using simple heuristics
function generateMockAnalysis(sentence: string): any {
  const clean = sentence.trim();
  const lower = clean.toLowerCase();
  
  // Check exact matches first
  for (const [key, value] of Object.entries(fallbackAnalysis)) {
    if (lower.startsWith(key) || key.startsWith(lower)) {
      return value;
    }
  }

  // Basic sentence rule-based splitter fallback
  const words = clean.split(" ");
  const mid = Math.floor(words.length / 2);
  const part1 = words.slice(0, mid).join(" ");
  const part2 = words.slice(mid).join(" ");

  // Deduce rules based on content
  const applied_rules = [1];
  if (lower.includes(" in ") || lower.includes(" at ") || lower.includes(" on ") || lower.includes(" to the ")) {
    applied_rules.push(2);
  }
  if (lower.includes(" who ") || lower.includes(" which ") || lower.includes(" that ")) {
    applied_rules.push(3);
  }
  const isPast = words.some(w => w.endsWith("ed") || ["was", "were", "went", "had", "did", "said", "knew", "thought", "took", "told", "heard", "spoke", "saw", "looked", "watched", "felt", "loved", "hoped", "ate", "drank", "slept", "came", "ran", "walked", "worked", "played", "bought", "lived", "gave", "found", "lost", "opened", "closed", "stopped", "called", "tried", "left", "kept", "brought", "decided"].includes(w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")));
  const isFuture = lower.includes("will") || lower.includes("going to");
  if (isPast || isFuture) {
    applied_rules.push(4);
  }
  if (lower.includes("was ") && (lower.includes("ed ") || lower.includes("en ") || lower.includes("ed.") || lower.includes("en."))) {
    applied_rules.push(5);
  }

  return {
    original_sentence: clean,
    pronunciation_tip: "영어 발음을 직접 들으며 따라해 보세요!",
    korean_translation: "분석 완료! 문장 기차를 타고 재미있게 학습해 보세요.",
    train_blocks: [
      { type: "core", text: part1, ko: "문장의 핵심 주인공과 행동" },
      { type: "place", text: part2, ko: "문장의 추가 설명 및 배경" }
    ],
    applied_rules
  };
}

export async function POST(req: Request) {
  try {
    const { sentence } = await req.json();
    if (!sentence) {
      return NextResponse.json({ error: "Sentence is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Use fallback parser if API Key is not configured
    if (!apiKey) {
      console.log("No Gemini API key found, using local fallback parser.");
      return NextResponse.json(generateMockAnalysis(sentence));
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
Analyze the English sentence: "${sentence}"
Split it into logical train blocks.
CRITICAL: The blocks in the 'train_blocks' array MUST be ordered in the exact sequence they appear in the original sentence, so that joining their 'text' fields sequentially reproduces the original sentence. Do NOT rearrange the blocks; keep the original sentence's word order.

Each block should be classified into one of the following train block types:
- core: Basic sentence structure (Subject + Verb + Object/Complement). e.g., "Republicans started a race", "I bought a coffee".
- place: Locations or directions (e.g. "on the November ballot", "at the park").
- time: Time markers (e.g. "yesterday", "in the morning").
- reason: Why or how it is done (e.g. "to replace Graham", "because it was raining").
- complement: Adjectival or relative clauses modifying a noun directly in front (e.g., "who helped me", "which laid golden eggs", "wearing a red coat").

Identify which of the "5 Core Rules" are applied in this sentence. The 5 rules are:
- Rule 1 (기본 틀): 누가 ➡️ 한다 ➡️ 무엇을 (Core skeleton) - Always present.
- Rule 2 (꼬리 틀): 뒤에 [장소 ➡️ 시간 ➡️ 이유] 순서로 꼬리 붙이기 (if place, time, or reason blocks are present).
- Rule 3 (접착제 틀): 바로 앞 단어를 [who / which / that 등]로 보충 설명하기 (if a relative clause / complement block is modifying the noun).
- Rule 4 (시간 뒤집기 틀): 과거(했다 -ed or irregular verbs), 미래(할 것이다 will/be going to)로 시간 바꾸기.
- Rule 5 (주인공 바꾸기 틀): 당하는 입장(수동태 be + p.p., e.g., was built, is called).

Provide:
1. original_sentence: The original sentence.
2. pronunciation_tip: Korean pronunciation tips of the entire sentence (e.g., "리퍼블리컨즈 스타티드 어 레이스 온 더 노벰버 밸럿...").
3. korean_translation: Natural Korean translation of the whole sentence.
4. train_blocks: Array of JSON objects, each with:
   - type: one of "core", "place", "time", "reason", "complement"
   - text: the exact English segment (case-sensitive, maintaining original spaces when joined)
   - ko: Korean meaning of that block.
   NOTE: The segments must join back exactly to the original sentence (or with single space differences).
5. applied_rules: Array of numbers [1-5] corresponding to the rules applied.

Respond ONLY with a single JSON object matching this schema:
{
  "original_sentence": "Republicans started a race on the November ballot to replace Graham.",
  "pronunciation_tip": "리퍼블리컨즈 스타티드 어 레이스 온 더 노벰버 밸럿 투 리플레이스 그레이엄",
  "korean_translation": "공화당원들은 11월 선거에서 그레이엄 의원을 대체하기 위한 경쟁을 시작했습니다.",
  "train_blocks": [
    {"type": "core", "text": "Republicans started a race", "ko": "공화당원들은 경쟁을 시작했다"},
    {"type": "place", "text": "on the November ballot", "ko": "11월 선거판에서"},
    {"type": "reason", "text": "to replace Graham", "ko": "그레이엄을 대체하기 위해"}
  ],
  "applied_rules": [1, 2, 4]
}
`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      console.error("Gemini API error during splitting:", await response.text());
      return NextResponse.json(generateMockAnalysis(sentence));
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      return NextResponse.json(generateMockAnalysis(sentence));
    }

    try {
      const parsed = JSON.parse(textContent);
      
      // Post-process to ensure correct fields
      if (!parsed.original_sentence) parsed.original_sentence = sentence;
      if (!parsed.train_blocks || !Array.isArray(parsed.train_blocks)) {
        throw new Error("Invalid train blocks in API response");
      }
      return NextResponse.json(parsed);
    } catch (e) {
      console.error("Failed to parse Gemini JSON output:", textContent, e);
      return NextResponse.json(generateMockAnalysis(sentence));
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
