"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import StatTile from "../components/StatTile";
import MarkdownContent from "../components/MarkdownContent";

const ChartComponent = dynamic(() => import("../components/Chart"), {
  ssr: false,
});

interface MetricsData {
  time: string;
  premium: number;
  btc_norm: number;
  qqq_norm: number;
  roll_corr: number;
}

interface AnalysisData {
  analysis: string;
  beta_btc: number;
  beta_qqq: number;
  warning?: string;
}

export default function Dashboard() {
  const [data, setData] = useState<MetricsData[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/metrics");
        const metricsData = await response.json();
        setData(Array.isArray(metricsData) ? metricsData : []);

        if (Array.isArray(metricsData) && metricsData.length > 0) {
          await handleAIAnalyze();
        }
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const handleAIAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", { method: "POST" });
      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error("Error analyzing data:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const latestMetrics = data.length > 0 ? data[data.length - 1] : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">
            DAT.co MSTR 量化儀表板
          </h1>
          <p className="text-gray-400 text-sm">
            即時追蹤 MSTR 相對於 Bitcoin 的溢價率、Beta 係數與市場相關性
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            <div className="h-32 bg-gray-800 rounded animate-pulse" />
            <div className="h-32 bg-gray-800 rounded animate-pulse" />
            <div className="h-32 bg-gray-800 rounded animate-pulse" />
            <div className="h-32 bg-gray-800 rounded animate-pulse" />
          </div>
        ) : latestMetrics ? (
          <div className="grid grid-cols-4 gap-4">
            <StatTile
              label="目前溢價率"
              value={latestMetrics.premium.toFixed(2)}
              unit="%"
              color={
                latestMetrics.premium > 20
                  ? "orange"
                  : latestMetrics.premium > 10
                    ? "green"
                    : "blue"
              }
              icon="💰"
            />
            <StatTile
              label="BTC Beta"
              value={analysis?.beta_btc?.toFixed(2) || "N/A"}
              unit="x"
              color={(analysis?.beta_btc ?? 0) > 1.5 ? "orange" : "blue"}
              icon="📈"
            />
            <StatTile
              label="QQQ Beta"
              value={analysis?.beta_qqq?.toFixed(2) || "N/A"}
              unit="x"
              color="purple"
              icon="📊"
            />
            <StatTile
              label="30D 相關性"
              value={latestMetrics.roll_corr.toFixed(2)}
              unit=""
              color={latestMetrics.roll_corr > 0.7 ? "green" : "blue"}
              icon="🔗"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-12 gap-6 min-h-[600px]">
          <div className="col-span-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">市場指標分析</h2>
              <span className="text-xs text-gray-400">
                {latestMetrics ? `更新於 ${latestMetrics.time}` : "載入中..."}
              </span>
            </div>
            <div className="h-[500px] w-full">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">載入圖表中...</p>
                </div>
              ) : data.length > 0 ? (
                <ChartComponent data={data} />
              ) : (
                <p className="text-gray-400">無可用數據</p>
              )}
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            <div className="flex-1 bg-gray-800 rounded-lg p-6 border border-gray-700 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">🤖 AI 深度洞察</h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isAnalyzing
                      ? "bg-blue-900/50 text-blue-300"
                      : "bg-green-900/50 text-green-300"
                  }`}
                >
                  {isAnalyzing ? "分析中..." : "已更新"}
                </span>
              </div>

              {analysis ? (
                <div className="space-y-4">
                  {analysis.warning && (
                    <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3 text-yellow-300 text-xs">
                      ⚠️ {analysis.warning}
                    </div>
                  )}
                  <MarkdownContent content={analysis.analysis} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>
                    {isAnalyzing ? "生成分析中..." : "點擊下方按鈕獲取分析"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAIAnalyze}
                disabled={isAnalyzing}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                {isAnalyzing ? "分析中..." : "刷新分析"}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                重新載入
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-gray-800 rounded-lg p-4 border border-gray-700 text-xs text-gray-300">
          <div className="space-y-2">
            <p className="font-semibold text-white">📊 圖表說明</p>
            <p>左側：MSTR 溢價率（綠色區域）</p>
            <p>右側軸：BTC & QQQ 歸一化報酬（100 = 基準）</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-white">💡 指標解讀</p>
            <p>Beta &gt; 1：高波動性（槓桿特性）</p>
            <p>相關性 &gt; 0.7：強相關（可靠代理）</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-white">⚠️ 風險提示</p>
            <p>溢價率 &gt; 25%：回撤風險</p>
            <p>溢價率 &lt; 10%：佈局機會</p>
          </div>
        </div>
      </div>
    </div>
  );
}
