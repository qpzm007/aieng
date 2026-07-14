import { NextResponse } from "next/server";
import { fairyTales, dailyConversations } from "@/data/stories";

// Backup news sentences by verb in case crawling or Gemini fails
const newsBackups: Record<string, string[]> = {
  be: [
    "The new electric vehicle was the center of attention at the motor show.",
    "Experts say that the economic situation will be stable by next quarter.",
    "Many citizens were at the city hall to protest the new tax policy."
  ],
  have: [
    "The tech giant had a major system failure during the busy working hours.",
    "Stock markets had a volatile day after the interest rate announcement.",
    "The startup has a new plan to expand its services in European markets."
  ],
  do: [
    "The government did a comprehensive study on climate change last year.",
    "Companies did their best to recover from the global shipping delay.",
    "The research team did a successful experiment at the national laboratory."
  ],
  say: [
    "The president said the government would support local green energy projects.",
    "Scientists said that global temperatures reached a record high in June.",
    "The report said that inflation was slowly decreasing in major cities."
  ],
  go: [
    "The CEO went to Washington to speak with industry regulators.",
    "Many retail investors are going to the stock market for tech shares.",
    "The space capsule went to the space station on Monday morning."
  ],
  get: [
    "The software startup got a ten million dollar investment from venture capitalists.",
    "The hospital got new medical equipment to improve patient care.",
    "Consumers got discounts on electronic goods during the holiday sale."
  ],
  make: [
    "The auto company made a contract to build a new factory in India.",
    "Engineers made a breakthrough in artificial intelligence chip design.",
    "The coalition made a joint statement about international trade rules."
  ],
  know: [
    "The security team knew about the system vulnerability before the attack.",
    "Economists knew that the price of oil would rise in winter.",
    "Nobody knew the outcome of the election until the final vote count."
  ],
  think: [
    "Analysts thought the market correction would finish by next week.",
    "The planning board thought about building a new subway line in Seoul.",
    "Many citizens think the government should lower the interest rates."
  ],
  take: [
    "The rescue team took the injured passengers to the nearest hospital.",
    "The central bank took measures to control the rising house prices.",
    "The journey to the red planet takes about six months with current rockets."
  ],
  want: [
    "The union wanted a ten percent increase in salaries this year.",
    "Young consumers want to buy organic products in supermarkets.",
    "The city council wanted to build a new park in the downtown area."
  ],
  like: [
    "Investors liked the company's strong financial report last quarter.",
    "The audience liked the new science fiction movie from the famous director.",
    "People like to use mobile apps to pay for public transport."
  ],
  need: [
    "The health department needed more vaccines to prevent the flu outbreak.",
    "Developing countries need financial help to build green power plants.",
    "The agricultural industry needs rain after a long dry summer."
  ],
  tell: [
    "The reporter told the story of local heroes in the war zone.",
    "The company told its employees about the new hybrid work policy.",
    "Witnesses told the police about the accident on the highway."
  ],
  ask: [
    "The committee asked the CEO for details about the security breach.",
    "Reporters asked the minister about the new immigration policy.",
    "The space agency asked university researchers for help with the project."
  ],
  hear: [
    "The local residents heard a loud explosion near the industrial area.",
    "Markets heard rumors about a potential merger between the two banks.",
    "The court heard arguments from both sides during the trial."
  ],
  listen: [
    "The central bank listened to opinions from commercial bankers.",
    "Politicians listened to the complaints of young business owners.",
    "The commission listened to public feedback before making the decision."
  ],
  speak: [
    "The foreign minister spoke to reporters at the international summit.",
    "The climate activist spoke about carbon emission targets in Geneva.",
    "The manager spoke to the team about the project deadline."
  ],
  talk: [
    "Leaders talked about national security issues at the round table.",
    "The two companies talked about a potential partnership last month.",
    "Scientists talked about the discovery of a new planet on the radio."
  ],
  see: [
    "Astronomers saw a giant comet passing near the Earth.",
    "Witnesses saw the suspect entering the bank at noon.",
    "The city saw a record number of tourists during the summer festival."
  ],
  look: [
    "Inspectors looked at the damaged bridge to find the cause of collapse.",
    "The court looked at the evidence presented by the prosecutor.",
    "Experts look at the stock chart to predict future trends."
  ],
  watch: [
    "Financial analysts watched the stock price fluctuations with concern.",
    "The world watched the historic landing of the lunar module.",
    "Security cameras watched the main gate of the military base."
  ],
  feel: [
    "Consumers felt optimistic about the economic recovery in spring.",
    "The staff felt excited about the new office building in Gangnam.",
    "Investors felt worried because of the rising geopolitical tensions."
  ],
  love: [
    "The public loved the new eco-friendly public design in Seoul.",
    "Tech enthusiasts love the new features of the folding smartphone.",
    "The audience loved the emotional speech of the Nobel winner."
  ],
  hope: [
    "The organization hoped to raise one million dollars for charity.",
    "Farmers hope that the autumn harvest will be successful.",
    "Doctors hope the new medicine will save many lives."
  ],
  eat: [
    "The children ate free meals at the community center in winter.",
    "The pandas ate fresh bamboo in the national zoo yesterday.",
    "People ate traditional food during the thanksgiving holiday."
  ],
  drink: [
    "Athletes drank energy drinks before the marathon race started.",
    "Local residents drank bottled water after the pipe broke.",
    "The president drank green tea during the press conference."
  ],
  sleep: [
    "The security guard slept during his night shift at the warehouse.",
    "Many passengers slept on the plane during the long flight.",
    "Studies show that people sleep better in cool bedrooms."
  ],
  come: [
    "The foreign delegation came to Seoul to discuss trade agreements.",
    "The design inspiration came from traditional Korean architecture.",
    "A cold wave came to the northern part of the country."
  ],
  run: [
    "The tech company ran a successful advertisement campaign on social media.",
    "Trains ran on a modified schedule due to heavy snow.",
    "The athlete ran the hundred-meter race in nine seconds."
  ],
  walk: [
    "The protesters walked along the main street to the parliament.",
    "Citizens walked in the park to enjoy the warm spring weather.",
    "Astronauts walked on the surface of the space station."
  ],
  work: [
    "The rescue team worked through the night to save the miners.",
    "The two companies worked together to design the electric car.",
    "Scientists worked in the clean room to manufacture microchips."
  ],
  play: [
    "The national team played a match against Japan last night.",
    "Kids played video games in the internet cafe after school.",
    "The orchestra played classical music at the charity concert."
  ],
  buy: [
    "The company bought a large plot of land to build a warehouse.",
    "Many people bought gold to protect their wealth during inflation.",
    "The city bought ten electric buses for public transport."
  ],
  live: [
    "The rare animals lived in the protected national park for decades.",
    "Many students live in dormitories near the university campus.",
    "The famous writer lived in a small island house during his career."
  ],
  give: [
    "The foundation gave scholarships to fifty promising students.",
    "The company gave bonuses to employees after a profitable year.",
    "The doctor gave advice to patients about healthy eating habits."
  ],
  find: [
    "Archaeologists found an ancient golden crown in the tomb.",
    "The police found the stolen paintings in an old warehouse.",
    "Scientists found a new species of frog in the rain forest."
  ],
  lose: [
    "The airline lost the baggage of fifty passengers on Tuesday.",
    "The company lost its market share due to strong competition.",
    "The football team lost the championship match by one goal."
  ],
  open: [
    "The government opened a new library in the metropolitan area.",
    "The museum opened a special exhibition of impressionist paintings.",
    "The store opened its doors to early shoppers on Friday."
  ],
  close: [
    "The factory closed its doors after twenty years of operation.",
    "The market closed higher after positive economic data.",
    "The highway closed due to a massive landslide near the tunnel."
  ],
  use: [
    "The laboratory used supercomputers to simulate the weather changes.",
    "Drivers used navigation apps to avoid the traffic jam.",
    "The school used digital tablets instead of printed textbooks."
  ],
  help: [
    "The international community helped the victims of the earthquake.",
    "The new software helped developers write code much faster.",
    "Exercise helps people reduce stress in daily life."
  ],
  start: [
    "The space agency started the launch countdown for the rocket.",
    "The company started its operations in India last month.",
    "The concert started with a beautiful violin solo."
  ],
  stop: [
    "The factory stopped production due to a shortage of microchips.",
    "The government stopped the construction of the nuclear plant.",
    "The driver stopped the train before the broken tracks."
  ],
  call: [
    "The president called a special meeting to discuss the crisis.",
    "The union called a strike after negotiations failed on Wednesday.",
    "Witnesses called the fire station when they saw the smoke."
  ],
  try: [
    "The government tried to lower the unemployment rate in summer.",
    "The company tried a new marketing strategy to attract teenagers.",
    "The doctors tried to cure the patient with a new drug."
  ],
  leave: [
    "The delegation left the country after signing the trade treaty.",
    "Many young people leave rural towns to find work in cities.",
    "The manager left the office at five o'clock yesterday."
  ],
  keep: [
    "The museum kept the historical documents in a secure room.",
    "The company kept its promise to reduce carbon emissions.",
    "They kept the fire burning during the cold winter night."
  ],
  bring: [
    "The storm brought heavy rains and strong winds to the coast.",
    "The festival brought thousands of visitors to the small town.",
    "The new policy brought positive changes to the education system."
  ],
  decide: [
    "The board decided to merge with their main competitor next year.",
    "The government decided to ban plastic bags in supermarkets.",
    "The committee decided to postpone the conference until autumn."
  ]
};

// RSS fetch function
async function fetchNewsHeadlines(): Promise<string[]> {
  try {
    const res = await fetch("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en", {
      next: { revalidate: 300 } // cache for 5 minutes
    });
    if (!res.ok) throw new Error("Failed to fetch RSS");
    const xml = await res.text();
    
    // Extract titles
    const titleRegex = /<title>(.*?)<\/title>/g;
    const titles: string[] = [];
    let match;
    while ((match = titleRegex.exec(xml)) !== null) {
      const title = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/ - [^-]+$/, "") // remove source name
        .trim();
      
      if (title && !title.includes("Google News")) {
        titles.push(title);
      }
      if (titles.length >= 20) break;
    }
    return titles;
  } catch (error) {
    console.error("Error fetching RSS headlines:", error);
    return [];
  }
}

// Generate custom sentence using Gemini API based on theme and checked rules
async function generateCustomSentenceWithGemini(
  verb: string,
  theme: string,
  headlines: string[],
  rules: number[]
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  let themeContext = "";
  if (theme === "fairy_tale") {
    themeContext = "A classic fairy tale style sentence (e.g. magic, princesses, knights, dragons, animals in a magical forest).";
  } else if (theme === "daily_conversation") {
    themeContext = "A natural daily conversational sentence (e.g. office, shopping, hanging out with friends, home life, travel).";
  } else {
    themeContext = `A realistic news sentence related to or inspired by these current news headlines:\n${headlines.slice(0, 8).map((h) => `- ${h}`).join("\n")}`;
  }

  // Create rules constraint instructions
  const ruleConstraints = rules.map(r => {
    switch (r) {
      case 1:
        return "1. 기본 틀 (누가 ➡️ 한다 ➡️ 무엇을): Ensure there is a clear Subject + Verb + Object/Complement structure.";
      case 2:
        return "2. 꼬리 틀 (장소 ➡️ 시간 ➡️ 이유): Include at least one clear modifier describing Place (e.g., 'at the library'), Time (e.g., 'yesterday'), or Reason (e.g., 'to make a plan').";
      case 3:
        return "3. 접착제 틀 (who / which): Include a relative clause describing a noun using 'who', 'which', or 'that' (e.g. 'the doctor who helps people', 'the cat which was sleeping').";
      case 4:
        return "4. 시간 뒤집기 틀 (과거 vs 미래): The sentence MUST use past tense (e.g. ended with -ed or irregular past like went, had, did) or future tense (e.g. using will / be going to).";
      case 5:
        return "5. 주인공 바꾸기 틀 (당하는 입장): The sentence MUST be in the passive voice (be + past participle, e.g. was broken, is called, were taken).";
      default:
        return "";
    }
  }).filter(Boolean).join("\n");

  const prompt = `
You are an expert English teacher. Generate exactly one English sentence that:
1. MUST use the verb "${verb}" (in present, past, or future tense depending on the rules).
2. Fits this theme: ${themeContext}
3. MUST apply the following grammar rules:
${ruleConstraints || "No specific rules required, make it a natural sentence."}
4. Is clear, grammatically correct, and suitable for intermediate English learners.

Respond ONLY with a single JSON object in the following format:
{
  "sentence": "The generated sentence here."
}
`;

  try {
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
      console.error("Gemini API error during content generation:", await response.text());
      return null;
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) return null;

    const parsed = JSON.parse(textContent);
    return parsed.sentence || null;
  } catch (error) {
    console.error("Gemini API error in generateCustomSentenceWithGemini:", error);
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const verb = searchParams.get("verb")?.toLowerCase() || "start";
  const theme = searchParams.get("theme") || "fairy_tale";
  const rulesParam = searchParams.get("rules") || "";
  const rules = rulesParam ? rulesParam.split(",").map(Number) : [];

  let sentence = "";

  // 1. Try to generate with Gemini if API Key is present
  const headlines = theme === "live_news" ? await fetchNewsHeadlines() : [];
  const generated = await generateCustomSentenceWithGemini(verb, theme, headlines, rules);
  if (generated) {
    sentence = generated;
  }

  // 2. Fallback to static datasets if Gemini fails or API Key is missing
  if (!sentence) {
    if (theme === "fairy_tale") {
      const list = fairyTales[verb] || fairyTales["start"];
      sentence = list[Math.floor(Math.random() * list.length)];
    } else if (theme === "daily_conversation") {
      const list = dailyConversations[verb] || dailyConversations["start"];
      sentence = list[Math.floor(Math.random() * list.length)];
    } else {
      const list = newsBackups[verb] || newsBackups["start"];
      sentence = list[Math.floor(Math.random() * list.length)];
    }
  }

  return NextResponse.json({ sentence });
}

