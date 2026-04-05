import { createChart } from "lightweight-charts";
import { useEffect, useRef } from "react";

export default function Chart({ data }: { data: any[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#111827" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "#374151" },
      },
      rightPriceScale: { visible: true },
      leftPriceScale: { visible: true },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // 1. Premium 折線 - 加強視覺效果 (綁定左側 Y 軸)
    const premiumSeries = chart.addAreaSeries({
      lineColor: "#10b981",
      topColor: "rgba(16, 185, 129, 0.6)",
      bottomColor: "rgba(16, 185, 129, 0.0)",
      priceScaleId: "left",
      lineWidth: 3,
    });
    premiumSeries.setData(
      data.map((d) => ({ time: d.time, value: d.premium })),
    );

    // 設定基準線 0% - 公允價值
    premiumSeries.createPriceLine({
      price: 0,
      color: "#ef4444",
      lineWidth: 2,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "公允價值 (0%)",
    });

    // 設定警戒線 +25% - 回撤風險
    premiumSeries.createPriceLine({
      price: 25,
      color: "#f97316",
      lineWidth: 1.5,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "回撤警戒 (+25%)",
    });

    // 設定警戒線 +10% - 佈局機會
    premiumSeries.createPriceLine({
      price: 10,
      color: "#3b82f6",
      lineWidth: 1.5,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "佈局機會 (+10%)",
    });

    // 2. BTC 歸一化報酬率 - 調細虛線 (綁定右側 Y 軸)
    const btcSeries = chart.addLineSeries({
      color: "#f59e0b",
      priceScaleId: "right",
      title: "BTC (Base 100)",
      lineWidth: 1.5,
      lineStyle: 1, // 虛線
    });
    btcSeries.setData(data.map((d) => ({ time: d.time, value: d.btc_norm })));

    // 3. QQQ 歸一化報酬率 - 調細虛線 (綁定右側 Y 軸)
    const qqqSeries = chart.addLineSeries({
      color: "#3b82f6",
      priceScaleId: "right",
      title: "QQQ (Base 100)",
      lineWidth: 1.5,
      lineStyle: 1, // 虛線
    });
    qqqSeries.setData(data.map((d) => ({ time: d.time, value: d.qqq_norm })));

    chart.timeScale().fitContent();

    // 監聽視窗大小變化
    const handleResize = () => {
      if (chartContainerRef.current) {
        const width = chartContainerRef.current.clientWidth;
        const height = chartContainerRef.current.clientHeight;
        chart.applyOptions({ width, height });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
  );
}
