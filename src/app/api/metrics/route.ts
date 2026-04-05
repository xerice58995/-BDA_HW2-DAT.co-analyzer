import { NextResponse } from "next/server";

type PricePoint = {
  date: string;
  close: number;
};

type MetricsRow = {
  time: string;
  premium: number;
  btc_norm: number;
  qqq_norm: number;
  roll_corr: number;
};

const MSTR_BTC_HOLDINGS = 205000;
const SHARES_OUTSTANDING = 17000000;
const CASH_AND_EQUIVALENTS = 0;
const TOTAL_DEBT = 0;

const HISTORY_DAYS = 180;
const MAX_POINTS = 181;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

async function fetchYahooHistory(
  symbol: string,
  days: number,
): Promise<PricePoint[]> {
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
  );
  url.searchParams.set("range", "1y");
  url.searchParams.set("interval", "1d");
  url.searchParams.set("includePrePost", "false");
  url.searchParams.set("events", "div,splits");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      accept: "application/json, text/plain, */*",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Yahoo Finance request failed for ${symbol}: ${res.status}`,
    );
  }

  const json = await res.json();

  const result = json?.chart?.result?.[0];
  const timestamps: number[] | undefined = result?.timestamp;
  const closes: Array<number | null> | undefined =
    result?.indicators?.quote?.[0]?.close;

  if (!timestamps || !closes || timestamps.length === 0) {
    throw new Error(`No historical data returned for ${symbol}`);
  }

  const points: PricePoint[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (typeof close !== "number" || !Number.isFinite(close)) continue;

    points.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      close,
    });
  }

  return points.slice(-Math.max(days + 1, MAX_POINTS));
}

function alignByDate(mstr: PricePoint[], btc: PricePoint[], qqq: PricePoint[]) {
  const btcMap = new Map(btc.map((p) => [p.date, p.close]));
  const qqqMap = new Map(qqq.map((p) => [p.date, p.close]));

  const aligned: Array<{
    date: string;
    mstr: number;
    btc: number;
    qqq: number;
  }> = [];

  for (const p of mstr) {
    const btcClose = btcMap.get(p.date);
    const qqqClose = qqqMap.get(p.date);
    if (typeof btcClose !== "number" || typeof qqqClose !== "number") continue;

    aligned.push({
      date: p.date,
      mstr: p.close,
      btc: btcClose,
      qqq: qqqClose,
    });
  }

  return aligned;
}

function calculateCorrelation(arr1: number[], arr2: number[]) {
  const n = Math.min(arr1.length, arr2.length);
  if (n < 2) return 0;

  const a = arr1.slice(-n);
  const b = arr2.slice(-n);

  const meanA = a.reduce((sum, v) => sum + v, 0) / n;
  const meanB = b.reduce((sum, v) => sum + v, 0) / n;

  let cov = 0;
  let varA = 0;
  let varB = 0;

  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }

  const denom = Math.sqrt(varA * varB);
  if (denom === 0) return 0;

  const corr = cov / denom;
  if (!Number.isFinite(corr)) return 0;

  return Math.max(-1, Math.min(1, corr));
}

function buildMetrics(
  aligned: Array<{
    date: string;
    mstr: number;
    btc: number;
    qqq: number;
  }>,
): MetricsRow[] {
  const rows: MetricsRow[] = [];

  const mstrReturns: number[] = [];
  const btcReturns: number[] = [];

  const baseBtc = aligned[0].btc;
  const baseQqq = aligned[0].qqq;

  for (let i = 0; i < aligned.length; i++) {
    const current = aligned[i];
    const prev = i > 0 ? aligned[i - 1] : null;

    const mstrRet = prev && prev.mstr !== 0 ? current.mstr / prev.mstr - 1 : 0;
    const btcRet = prev && prev.btc !== 0 ? current.btc / prev.btc - 1 : 0;

    mstrReturns.push(mstrRet);
    btcReturns.push(btcRet);

    const btcHoldingsValue = current.btc * MSTR_BTC_HOLDINGS;
    const btcNavPerShare =
      (btcHoldingsValue + CASH_AND_EQUIVALENTS - TOTAL_DEBT) /
      SHARES_OUTSTANDING;

    const premium =
      btcNavPerShare > 0 ? (current.mstr / btcNavPerShare - 1) * 100 : 0;

    const btcNorm = (current.btc / baseBtc) * 100;
    const qqqNorm = (current.qqq / baseQqq) * 100;

    const rollCorr =
      i >= 29
        ? calculateCorrelation(
            mstrReturns.slice(i - 29, i + 1),
            btcReturns.slice(i - 29, i + 1),
          )
        : 0;

    rows.push({
      time: current.date,
      premium: round2(premium),
      btc_norm: round2(btcNorm),
      qqq_norm: round2(qqqNorm),
      roll_corr: round3(rollCorr),
    });
  }

  return rows.slice(-HISTORY_DAYS);
}

export async function GET() {
  try {
    const [mstr, btc, qqq] = await Promise.all([
      fetchYahooHistory("MSTR", HISTORY_DAYS),
      fetchYahooHistory("BTC-USD", HISTORY_DAYS),
      fetchYahooHistory("QQQ", HISTORY_DAYS),
    ]);

    const merged = alignByDate(mstr, btc, qqq);

    if (merged.length < 35) {
      return NextResponse.json(
        {
          error:
            "可用的市場資料不足，請稍後再試或檢查 Yahoo Finance 連線狀態。",
        },
        { status: 502 },
      );
    }

    const rows = buildMetrics(merged);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching metrics:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch metrics from market data source",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
