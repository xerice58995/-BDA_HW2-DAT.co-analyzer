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

    premiumSeries.createPriceLine({
      price: 0,
      color: "#ef4444",
      lineWidth: 2,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "公允價值 (0%)",
    });

    premiumSeries.createPriceLine({
      price: 25,
      color: "#f97316",
      lineWidth: 2,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "回撤警戒 (+25%)",
    });

    premiumSeries.createPriceLine({
      price: 10,
      color: "#3b82f6",
      lineWidth: 2,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "佈局機會 (+10%)",
    });

    const btcSeries = chart.addLineSeries({
      color: "#f59e0b",
      priceScaleId: "right",
      title: "BTC (Base 100)",
      lineWidth: 2,
      lineStyle: 1,
    });
    btcSeries.setData(data.map((d) => ({ time: d.time, value: d.btc_norm })));

    const qqqSeries = chart.addLineSeries({
      color: "#3b82f6",
      priceScaleId: "right",
      title: "QQQ (Base 100)",
      lineWidth: 2,
      lineStyle: 1,
    });
    qqqSeries.setData(data.map((d) => ({ time: d.time, value: d.qqq_norm })));

    chart.timeScale().fitContent();

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
