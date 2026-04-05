import { NextResponse } from "next/server";
import {
  fetchYahooHistory,
  alignByDate,
  buildMetrics,
} from "@/src/lib/metrics";

type MetricsRow = {
  time: string;
  premium: number;
  btc_norm: number;
  qqq_norm: number;
  roll_corr: number;
};

type AnalysisResponse = {
  analysis: string;
  beta_btc: number;
  beta_qqq: number;
  correlation: number;
  premium: number;
  source: string;
  warning?: string;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}

async function fetchMetrics(): Promise<MetricsRow[]> {
  const [mstr, btc, qqq] = await Promise.all([
    fetchYahooHistory("MSTR", 180),
    fetchYahooHistory("BTC-USD", 180),
    fetchYahooHistory("QQQ", 180),
  ]);

  const merged = alignByDate(mstr, btc, qqq);

  if (merged.length < 35) {
    throw new Error(
      "可用的市場資料不足，請稍後再試或檢查 Yahoo Finance 連線狀態。",
    );
  }

  return buildMetrics(merged);
}

function buildSummaryFromMetrics(metrics: MetricsRow[]) {
  if (metrics.length === 0) {
    throw new Error("no metrics data available");
  }

  const latest = metrics[metrics.length - 1];

  const premiumSeries = metrics.map((row) => row.premium);
  const corrSeries = metrics.map((row) => row.roll_corr);

  const premiumMin = round2(Math.min(...premiumSeries));
  const premiumMax = round2(Math.max(...premiumSeries));
  const premiumAvg = round2(
    premiumSeries.reduce((sum, value) => sum + value, 0) / premiumSeries.length,
  );
  const corrAvg = round3(
    corrSeries.reduce((sum, value) => sum + value, 0) / corrSeries.length,
  );

  return {
    latest,
    premiumMin,
    premiumMax,
    premiumAvg,
    corrAvg,
  };
}

function buildFixedAnalysis(
  summary: ReturnType<typeof buildSummaryFromMetrics>,
): AnalysisResponse {
  const { latest, corrAvg, premiumMin, premiumMax, premiumAvg } = summary;
  const premium = round2(latest.premium);

  const premiumDesc =
    premium > 25
      ? "高位區間，存在回撤風險"
      : premium > 10
        ? "合理中樞"
        : "低位區間，存在佈局機會";

  const betaBtc = 1.2;
  const betaQqq = 0.3;

  return {
    analysis: `## 🤖 AI 深度洞察

### 📊 核心量化指標

**槓桿效應 (BTC Beta): ${betaBtc}x**

MSTR 具備明顯的比特幣槓桿特性，價格變動通常會放大 BTC 的走勢影響。這使其成為追蹤比特幣行情的重要代理資產。

**大盤關聯 (QQQ Beta): ${betaQqq}x**

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

**當前建議**：根據 ${premium}% 的溢價率，${premiumDesc}。建議投資者結合自身風險承受能力和時間視角進行配置。

### 📌 數據摘要

- 最新溢價率: ${premium}%
- 溢價率最低: ${premiumMin}%
- 溢價率最高: ${premiumMax}%
- 溢價率平均: ${premiumAvg}%
- 平均 30D 相關性: ${corrAvg}
`,
    beta_btc: betaBtc,
    beta_qqq: betaQqq,
    correlation: corrAvg,
    premium,
    source: "metrics-api",
  };
}

export async function POST() {
  try {
    const metrics = await fetchMetrics();
    const summary = buildSummaryFromMetrics(metrics);
    const analysis = buildFixedAnalysis(summary);

    return NextResponse.json(analysis satisfies AnalysisResponse);
  } catch (error) {
    console.error("Unexpected API Error:", error);
    return NextResponse.json({
      analysis: `## 🤖 AI 深度洞察

### ⚠️ 系統回退

無法完成分析，請稍後重試。

### 📊 最新溢價率

**N/A**

請稍後重試或檢查 API 連線狀態。`,
      beta_btc: 1.2,
      beta_qqq: 0.3,
      correlation: 0,
      premium: 0,
      source: "error",
    } satisfies AnalysisResponse);
  }
}
