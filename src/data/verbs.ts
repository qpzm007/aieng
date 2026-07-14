export interface Verb {
  english: string;
  korean: string;
  pronunciation: string;
  pastEnglish: string;
  pastPronunciation: string;
}

export interface VerbCategory {
  title: string;
  description: string;
  verbs: Verb[];
}

export const verbCategories: VerbCategory[] = [
  {
    title: "만능 동사",
    description: "매일 쓰는 만능 동사 (10개)",
    verbs: [
      { english: "be", korean: "이다, 있다", pronunciation: "비", pastEnglish: "was/were", pastPronunciation: "워즈/웨어" },
      { english: "have", korean: "가지고 있다, 먹다", pronunciation: "해브", pastEnglish: "had", pastPronunciation: "해드" },
      { english: "do", korean: "하다", pronunciation: "두", pastEnglish: "did", pastPronunciation: "디드" },
      { english: "say", korean: "말하다", pronunciation: "세이", pastEnglish: "said", pastPronunciation: "세드" },
      { english: "go", korean: "가다", pronunciation: "고", pastEnglish: "went", pastPronunciation: "웬트" },
      { english: "get", korean: "얻다, 받다, 사다", pronunciation: "겟", pastEnglish: "got", pastPronunciation: "갓" },
      { english: "make", korean: "만들다", pronunciation: "메이크", pastEnglish: "made", pastPronunciation: "메이드" },
      { english: "know", korean: "알다", pronunciation: "노우", pastEnglish: "knew", pastPronunciation: "뉴" },
      { english: "think", korean: "생각하다", pronunciation: "띵크", pastEnglish: "thought", pastPronunciation: "쏘트" },
      { english: "take", korean: "데려가다, 걸리다", pronunciation: "테이크", pastEnglish: "took", pastPronunciation: "툭" }
    ]
  },
  {
    title: "소통 동사",
    description: "소통하고 표현할 때 쓰는 동사 (15개)",
    verbs: [
      { english: "want", korean: "원하다", pronunciation: "원트", pastEnglish: "wanted", pastPronunciation: "원티드" },
      { english: "like", korean: "좋아하다", pronunciation: "라이크", pastEnglish: "liked", pastPronunciation: "라이크트" },
      { english: "need", korean: "필요하다", pronunciation: "니드", pastEnglish: "needed", pastPronunciation: "니디드" },
      { english: "tell", korean: "말해주다", pronunciation: "텔", pastEnglish: "told", pastPronunciation: "톨드" },
      { english: "ask", korean: "묻다, 부탁하다", pronunciation: "아스크", pastEnglish: "asked", pastPronunciation: "아스크트" },
      { english: "hear", korean: "들리다", pronunciation: "히어", pastEnglish: "heard", pastPronunciation: "허드" },
      { english: "listen", korean: "귀 기울여 듣다", pronunciation: "리스튼", pastEnglish: "listened", pastPronunciation: "리스든" },
      { english: "speak", korean: "말하다", pronunciation: "스피크", pastEnglish: "spoke", pastPronunciation: "스포크" },
      { english: "talk", korean: "이야기하다", pronunciation: "토크", pastEnglish: "talked", pastPronunciation: "토크트" },
      { english: "see", korean: "보이다, 보다", pronunciation: "시", pastEnglish: "saw", pastPronunciation: "쏘" },
      { english: "look", korean: "보다", pronunciation: "룩", pastEnglish: "looked", pastPronunciation: "룩트" },
      { english: "watch", korean: "지켜보다", pronunciation: "와치", pastEnglish: "watched", pastPronunciation: "와치트" },
      { english: "feel", korean: "느끼다", pronunciation: "필", pastEnglish: "felt", pastPronunciation: "펠트" },
      { english: "love", korean: "사랑하다", pronunciation: "러브", pastEnglish: "loved", pastPronunciation: "러브드" },
      { english: "hope", korean: "바라다", pronunciation: "호프", pastEnglish: "hoped", pastPronunciation: "홉트" }
    ]
  },
  {
    title: "일상 동사",
    description: "일상 행동을 나타내는 동사 (15개)",
    verbs: [
      { english: "eat", korean: "먹다", pronunciation: "이트", pastEnglish: "ate", pastPronunciation: "에이트" },
      { english: "drink", korean: "마시다", pronunciation: "드링크", pastEnglish: "drank", pastPronunciation: "드랭크" },
      { english: "sleep", korean: "자다", pronunciation: "슬립", pastEnglish: "slept", pastPronunciation: "슬렙트" },
      { english: "come", korean: "오다", pronunciation: "컴", pastEnglish: "came", pastPronunciation: "케임" },
      { english: "run", korean: "달리다", pronunciation: "런", pastEnglish: "ran", pastPronunciation: "랜" },
      { english: "walk", korean: "걷다", pronunciation: "워크", pastEnglish: "walked", pastPronunciation: "워크트" },
      { english: "work", korean: "일하다", pronunciation: "워크", pastEnglish: "worked", pastPronunciation: "워크트" },
      { english: "play", korean: "놀다, 연주하다", pronunciation: "플레이", pastEnglish: "played", pastPronunciation: "플레이드" },
      { english: "buy", korean: "사다", pronunciation: "바이", pastEnglish: "bought", pastPronunciation: "보트" },
      { english: "live", korean: "살다", pronunciation: "리브", pastEnglish: "lived", pastPronunciation: "리브드" },
      { english: "give", korean: "주다", pronunciation: "기브", pastEnglish: "gave", pastPronunciation: "게이브" },
      { english: "find", korean: "찾다, 발견하다", pronunciation: "파인드", pastEnglish: "found", pastPronunciation: "파운드" },
      { english: "lose", korean: "잃어버리다", pronunciation: "루즈", pastEnglish: "lost", pastPronunciation: "로스트" },
      { english: "open", korean: "열다", pronunciation: "오픈", pastEnglish: "opened", pastPronunciation: "오픈드" },
      { english: "close", korean: "닫다", pronunciation: "클로즈", pastEnglish: "closed", pastPronunciation: "클로즈드" }
    ]
  },
  {
    title: "상태변화 동사",
    description: "상태를 변화시키거나 결정하는 동사 (10개)",
    verbs: [
      { english: "use", korean: "사용하다", pronunciation: "유즈", pastEnglish: "used", pastPronunciation: "유즈드" },
      { english: "help", korean: "돕다", pronunciation: "헬프", pastEnglish: "helped", pastPronunciation: "헬프트" },
      { english: "start", korean: "시작하다", pronunciation: "스타트", pastEnglish: "started", pastPronunciation: "스타티드" },
      { english: "stop", korean: "멈추다", pronunciation: "스톱", pastEnglish: "stopped", pastPronunciation: "스톱트" },
      { english: "call", korean: "부르다, 전화하다", pronunciation: "콜", pastEnglish: "called", pastPronunciation: "콜드" },
      { english: "try", korean: "시도하다, 노력하다", pronunciation: "트라이", pastEnglish: "tried", pastPronunciation: "트라이드" },
      { english: "leave", korean: "떠나다, 남겨두다", pronunciation: "리브", pastEnglish: "left", pastPronunciation: "레프트" },
      { english: "keep", korean: "유지하다, 계속하다", pronunciation: "킵", pastEnglish: "kept", pastPronunciation: "케프트" },
      { english: "bring", korean: "가져오다", pronunciation: "브링", pastEnglish: "brought", pastPronunciation: "브로트" },
      { english: "decide", korean: "결정하다", pronunciation: "디사이드", pastEnglish: "decided", pastPronunciation: "디사이디드" }
    ]
  }
];
