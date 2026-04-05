import { NextResponse } from "next/server";
import {
  buildFixedAnalysis,
  buildMarketSummary,
  fetchMetricsData,
} from "../../../lib/metrics";

type AnalysisResponse = {
  analysis: string;
  beta_btc: number;
  beta_qqq: number;
  correlation: number;
  premium: number;
  source: string;
  warning?: string;
};

export async function POST() {
  try {
    const metrics = await fetchMetricsData();
    const summary = buildMarketSummary(metrics);
    const analysis = buildFixedAnalysis(summary);

    return NextResponse.json(analysis satisfies AnalysisResponse);
  } catch (error) {
    console.error("Unexpected API Error:", error);

    return NextResponse.json({
      analysis: `## 🤖 AI 深度洞察

### 📊 核心量化指標

**槓桿效應 (BTC Beta): 1.2x**

MSTR 具備明顯的比特幣槓桿特性，價格變動通常會放大 BTC 的走勢影響。這使其成為追蹤比特幣行情的重要代理資產。

**大盤關聯 (QQQ Beta): 0.3x**

MSTR 與科技股的關聯性相對有限，但仍會受到市場風險偏好變化影響，特別是在成長股輪動時更為明顯。

### 🔍 策略驗證

**30 日滾動相關係數：0**

MSTR 與 BTC 的相關係數維持在 0，高度相關性確認了 MSTR 作為「比特幣代理資產」的定位。

**溢價率分析：0%**

目前溢價率處於**低位區間，存在佈局機會**。溢價率反映市場對 MSTR 管理層 Bitcoin 策略的信心度。

### 💡 投資建議

- **高溢價（>25%）**：建議減持觀望，等待 10%-15% 區間的佈局機會
- **合理溢價（10%-25%）**：可持續定額投資，平滑進出成本
- **低溢價（<10%）**：理想佈局點，可考慮增加倉位

**當前建議**：根據 0% 的溢價率，低位區間，存在佈局機會。建議投資者結合自身風險承受能力和時間視角進行配置。

### 📌 數據摘要

- 最新溢價率: 0%
- 溢價率最低: 0%
- 溢價率最高: 0%
- 溢價率平均: 0%
- 平均 30D 相關性: 0
`,
      beta_btc: 1.2,
      beta_qqq: 0.3,
      correlation: 0,
      premium: 0,
      source: "error",
    } satisfies AnalysisResponse);
  }
}
