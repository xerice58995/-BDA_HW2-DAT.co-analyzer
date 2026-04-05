# DAT.co (MSTR) 量化儀表板

這是一個以 **Next.js 單一前端 + Node.js API Routes** 為核心的量化分析儀表板專案，使用 **Yahoo Finance 真實歷史資料** 計算 MSTR 溢價率、BTC / QQQ 歸一化報酬與相關性，並以 **Google Gemini** 生成中文 AI 分析。

---

## 專案特色

- **真實市場資料**：透過 Yahoo Finance 抓取 MSTR、BTC-USD、QQQ 歷史收盤價
- **真實計算邏輯**：以實際股價與 BTC 持倉價值計算溢價率
- **量化指標分析**：歸一化報酬、30 日滾動相關性、Beta 解讀
- **AI 深度洞察**：整合 Google Gemini 生成繁體中文分析
- **單一 Next.js 專案**：前端與 API 都在 `src/app/` 下，方便開發與部署
- **Vercel 友善**：可直接部署在 Vercel Serverless 環境

---

## 專案結構

```text
Biocoin_HW2/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── metrics/
│   │   │   │   └── route.ts      # 抓取真實市場資料並計算指標
│   │   │   └── analyze/
│   │   │       └── route.ts      # 呼叫 Gemini 產生 AI 分析
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx              # 儀表板頁面
│   └── components/
│       ├── Chart.tsx
│       ├── MarkdownContent.tsx
│       └── StatTile.tsx
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── vercel.json
├── README.md
└── .env.example
```

---

## 技術棧

### 前端
- **Next.js 14**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **lightweight-charts**

### API / 資料處理
- **Next.js Route Handlers**
- **Yahoo Finance API**
- **Google Gemini API**
- **內建 JavaScript / TypeScript 數值計算**

---

## 核心功能

### 1. `/api/metrics`
抓取真實市場資料並計算：

- `premium`：MSTR 溢價率
- `btc_norm`：BTC 歸一化報酬
- `qqq_norm`：QQQ 歸一化報酬
- `roll_corr`：30 日滾動相關性

### 2. `/api/analyze`
- 先讀取 `/api/metrics` 的同一份資料
- 再把資料送給 Gemini
- 回傳格式化的中文分析
- 若 Gemini 不可用，會使用固定 fallback 文本，但仍保持與 metrics 同源的數字

---

## 本地開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

建立 `.env.local`，內容如下：

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

如果你是部署到 Vercel，也可以在 Vercel 的 Environment Variables 中設定相同變數。

### 3. 啟動開發伺服器

```bash
npm run dev
```

預設會在：

```text
http://localhost:3000
```

---

## API 端點說明

### GET `/api/metrics`

回傳最新的歷史指標資料。

**範例回應：**

```json
[
  {
    "time": "2024-06-15",
    "premium": 18.65,
    "btc_norm": 104.2,
    "qqq_norm": 101.8,
    "roll_corr": 0.85
  }
]
```

### POST `/api/analyze`

使用 Gemini 生成 AI 分析。

**範例回應：**

```json
{
  "analysis": "## 🤖 AI 深度洞察 ...",
  "beta_btc": 1.16,
  "beta_qqq": -0.15,
  "correlation": 0.85,
  "premium": 18.65
}
```

---

## 指標定義

### 溢價率 Premium
以 MSTR 股價相對於 BTC NAV 的比例計算：

```text
Premium = (MSTR 股價 / BTC NAV per share - 1) × 100
```

### 歸一化報酬
以第一筆資料為基準，將價格轉成 100 起算的相對報酬：

```text
Normalized Return = (Current Price / Base Price) × 100
```

### 30 日滾動相關性
計算 MSTR 與 BTC 的近 30 日報酬相關性。

---

## Gemini API 設定

### 取得 API Key
1. 前往 Google AI Studio
2. 建立 Gemini API Key
3. 複製 API Key
4. 寫入 `.env.local`

### 注意
- 如果沒有設定 `GEMINI_API_KEY`
- `/api/analyze` 仍可運作
- 但會使用固定 fallback 分析，而不是 Gemini 文字輸出
