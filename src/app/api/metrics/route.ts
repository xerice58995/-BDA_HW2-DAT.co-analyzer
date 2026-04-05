import { NextResponse } from "next/server";
import {
  alignByDate,
  buildMetrics,
  fetchYahooHistory,
} from "../../../lib/metrics";

export async function GET() {
  try {
    const [mstr, btc, qqq] = await Promise.all([
      fetchYahooHistory("MSTR", 180),
      fetchYahooHistory("BTC-USD", 180),
      fetchYahooHistory("QQQ", 180),
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
