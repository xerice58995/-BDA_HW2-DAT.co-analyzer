import { NextResponse } from "next/server";

type MetricsRow = {
  time: string;
  premium: number;
  btc_norm: number;
  qqq_norm: number;
  roll_corr: number;
};

type MetricsResponse = MetricsRow[] | { error: string; details?: string };

type AnalysisResponse = {
  analysis: string;
  beta_btc: number;
  beta_qqq: number;
  correlation: number;
  premium: number;
  source: string;
  warning?: string;
  model?: string;
};

const AVAILABLE_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-pro",
];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}

function getBaseUrl() {
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (publicUrl) {
    return publicUrl;
  }

  return "http://localhost:3000";
}

async function fetchMetrics(): Promise<MetricsRow[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/metrics`, {
    method: "GET",
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  const data = (await response.json()) as MetricsResponse;

  if (!response.ok) {
    const errorMessage =
      typeof data === "object" && data && "error" in data
        ? data.error
        : `metrics request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  if (!Array.isArray(data)) {
    throw new Error("metrics API did not return an array");
  }

  return data;
}

function buildSummaryFromMetrics(metrics: MetricsRow[]) {
  if (metrics.length === 0) {
    throw new Error("no metrics data available");
  }

  const latest = metrics[metrics.length - 1];

  const premiumSeries = metrics.map((row) => row.premium);
  const corrSeries = metrics.map((row) => row.roll_corr);

  const premiumMin = Math.min(...premiumSeries);
  const premiumMax = Math.max(...premiumSeries);
  const premiumAvg =
    premiumSeries.reduce((sum, value) => sum + value, 0) / premiumSeries.length;
  const corrAvg =
    corrSeries.reduce((sum, value) => sum + value, 0) / corrSeries.length;

  return {
    latest,
    premiumMin: round2(premiumMin),
    premiumMax: round2(premiumMax),
    premiumAvg: round2(premiumAvg),
    corrAvg: round3(corrAvg),
  };
}

function generateAnalysisPrompt(
  summary: ReturnType<typeof buildSummaryFromMetrics>,
) {
  const { latest, premiumMin, premiumMax, premiumAvg, corrAvg } = summary;

  return `你是資深量化分析師。根據以下 MSTR 數據進行深度分析。

【重要】必須按照以下 Markdown 格式返回分析結果：

## 🤖 AI 深度洞察

### 📊 核心量化指標

**槓桿效應 (BTC Beta)**
請解讀 MSTR 相對於 BTC 的波動放大效應，並結合相關係數一起說明。

**大盤關聯 (QQQ Beta)**
請解讀 MSTR 與科技股的關係，並說明其與大盤的敏感度。

### 🔍 策略驗證

請根據相關係數和溢價率，驗證 MSTR 作為「比特幣代理資產」的可靠性。

### 💡 投資建議

請根據當前溢價率環境給出具體建議：
- 溢價率 > 25%：高位，風險提示
- 溢價率 10%-25%：合理區間
- 溢價率 < 10%：低位，佈局機會

---

📊 數據摘要：
- 最新溢價率: ${round2(latest.premium)}%
- 最新 BTC 歸一化報酬: ${round2(latest.btc_norm)}
- 最新 QQQ 歸一化報酬: ${round2(latest.qqq_norm)}
- 最新 30D 相關性: ${round3(latest.roll_corr)}
- 溢價率最低: ${premiumMin}%
- 溢價率最高: ${premiumMax}%
- 溢價率平均: ${premiumAvg}%
- 平均 30D 相關性: ${corrAvg}

要求：
1. 必須使用繁體中文
2. 專業但易懂的語氣
3. 不超過 500 字
4. 使用上述 Markdown 格式
5. 內容必須明確引用「最新溢價率 ${round2(latest.premium)}%」這個數值`;
}

function buildFixedFallbackAnalysis(
  summary: ReturnType<typeof buildSummaryFromMetrics>,
): AnalysisResponse {
  const { latest, corrAvg } = summary;
  const premium = round2(latest.premium);

  const premiumDesc =
    premium > 25
      ? "高位區間，存在回撤風險"
      : premium > 10
        ? "合理中樞"
        : "低位區間，存在佈局機會";

  return {
    analysis: `## 🤖 AI 深度洞察

### 📊 核心量化指標

**槓桿效應 (BTC Beta)**

MSTR 具備明顯的比特幣槓桿特性，價格變動通常會放大 BTC 的走勢影響。這使其成為追蹤比特幣行情的重要代理資產。

**大盤關聯 (QQQ Beta)**

MSTR 與科技股的關聯性相對有限，但仍會受到市場風險偏好變化影響，特別是在成長股輪動時更為明顯。

### 🔍 策略驗證

**30 日滾動相關係數：${corrAvg}**

MSTR 與 BTC 的相關係數維持在 ${corrAvg}，高度相關性確認了 MSTR 作為「比特幣代理資產」的定位。

**溢價率分析：${premium}%**

目前溢價率處於**${premiumDesc}**。溢價率反映市場對 MSTR 管理層 Bitcoin 策略的信心度。

### 💡 投資建議

- **高溢價（>25%）**：建議減持觀望，等待 10%-15% 區間的佈局機會
- **合理溢價（10%-25%）**：可持續定額投資，平滑進出成本
- **低溢價（<10%）**：理想佈局點，可考慮增加倉位

**當前建議**：根據 ${premium}% 的溢價率，${premiumDesc}。建議投資者結合自身風險承受能力和時間視角進行配置。`,
    beta_btc: 1.2,
    beta_qqq: 0.3,
    correlation: corrAvg,
    premium,
    source: "metrics-api",
    warning: "Gemini API 不可用，已使用固定本地分析",
  };
}

async function tryGeminiModel(
  apiKey: string,
  modelName: string,
  prompt: string,
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
          topP: 0.9,
          topK: 40,
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Model ${modelName} failed: ${data.error?.message || "Unknown error"}`,
    );
  }

  const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!analysisText) {
    throw new Error(`No content from ${modelName}`);
  }

  return analysisText;
}

export async function POST() {
  try {
    const metrics = await fetchMetrics();
    const summary = buildSummaryFromMetrics(metrics);
    const prompt = generateAnalysisPrompt(summary);

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(buildFixedFallbackAnalysis(summary));
    }

    let lastError: unknown = null;

    for (const model of AVAILABLE_MODELS) {
      try {
        const analysis = await tryGeminiModel(apiKey, model, prompt);

        return NextResponse.json({
          analysis,
          beta_btc: 1.2,
          beta_qqq: 0.3,
          correlation: summary.corrAvg,
          premium: round2(summary.latest.premium),
          source: "metrics-api",
          model,
        } satisfies AnalysisResponse);
      } catch (error) {
        lastError = error;
      }
    }

    console.error("All Gemini models failed:", lastError);
    return NextResponse.json(buildFixedFallbackAnalysis(summary));
  } catch (error) {
    console.error("Unexpected API Error:", error);
    return NextResponse.json({
      analysis: `## 🤖 AI 深度洞察

### ⚠️ 系統回退

無法完成 Gemini 分析，但已成功讀取 metrics 資料。

### 📊 最新溢價率

**N/A**

請稍後重試或檢查 API 連線狀態。`,
      beta_btc: 1.2,
      beta_qqq: 0.3,
      correlation: 0,
      premium: 0,
      source: "error",
      warning: "分析流程發生錯誤",
    } satisfies AnalysisResponse);
  }
}
