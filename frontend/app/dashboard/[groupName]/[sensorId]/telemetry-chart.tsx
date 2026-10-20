"use client";

import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSentrix, type TelemetryPoint, type TelemetryRange } from "../../../lib/sentrix-store";

interface TelemetryChartProps {
  deviceId: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TelemetryPoint & { bounds: [number, number] };
  }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="surface-card min-w-56 rounded-xl border border-[var(--border)] p-3 shadow-xl text-xs space-y-1.5 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
        <span className="font-mono text-[10px] text-[var(--text-muted)]">{data.timeLabel}</span>
        {data.isAnomaly && (
          <span className="rounded bg-red-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-red-500">
            ANOMALY BREACH
          </span>
        )}
      </div>
      <div className="flex items-center justify-between font-mono">
        <span className="text-[var(--text-secondary)]">RMS Current:</span>
        <span className={`text-sm font-bold ${data.isAnomaly ? "text-red-500" : "text-[var(--text-primary)]"}`}>
          {data.rmsCurrent.toFixed(2)} A
        </span>
      </div>
      <div className="flex items-center justify-between font-mono text-[11px] text-[var(--text-muted)]">
        <span>Safe Zone:</span>
        <span className="text-amber-500/90">
          {data.lowerBound.toFixed(2)} – {data.upperBound.toFixed(2)} A
        </span>
      </div>
    </div>
  );
}

export function TelemetryChart({ deviceId }: TelemetryChartProps) {
  const { getTelemetryWithBounds } = useSentrix();
  const [timeframe, setTimeframe] = useState<TelemetryRange>("24h");

  const rawData = getTelemetryWithBounds(deviceId, timeframe);

  // Map to chart items with dual-bound array for shaded Area
  const chartData = rawData.map((pt) => ({
    ...pt,
    bounds: [pt.lowerBound, pt.upperBound] as [number, number],
  }));

  // Find min/max for dynamic Y-Axis scale safely
  const allValues = rawData
    .flatMap((d) => [d.rmsCurrent, d.lowerBound, d.upperBound])
    .filter((v) => typeof v === "number" && Number.isFinite(v));
  const minY = allValues.length > 0 ? Math.max(0, Math.floor(Math.min(...allValues) - 1)) : 0;
  const maxY = allValues.length > 0 ? Math.ceil(Math.max(...allValues) + 1.5) : 25;

  const anomalyCount = rawData.filter((d) => d.isAnomaly).length;

  return (
    <div className="surface-card rounded-xl border border-[var(--border)] p-5 sm:p-6 space-y-5">
      {/* Chart Header & Toggles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="eyebrow text-[10px]">Telemetry & Safe Range</h2>
            {anomalyCount > 0 && (
              <span className="rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-red-500">
                {anomalyCount} {anomalyCount === 1 ? "ANOMALY" : "ANOMALIES"}
              </span>
            )}
          </div>
        </div>

        {/* Timeframe Toggles */}
        <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--canvas)] p-1 self-start sm:self-auto">
          {(
            [
              { id: "1h", label: "1 Hour" },
              { id: "24h", label: "24 Hours" },
              { id: "7d", label: "7 Days" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              id={`toggle-timeframe-${item.id}`}
              onClick={() => setTimeframe(item.id)}
              className={`rounded-md px-3 py-1 text-xs font-mono font-medium transition ${
                timeframe === item.id
                  ? "bg-[var(--surface)] text-amber-500 shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-b border-[var(--border)] py-2.5 text-[11px] text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-5 rounded-sm bg-amber-500/20 border border-amber-500/40" />
          <span>Auto-ARIMA 95% Confidence Band (Safe Zone)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-0.5 w-5 bg-[var(--chart-line,var(--text-primary))]" />
          <span>Live Electrical RMS Draw (Amps)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
          <span>Anomaly Breached Threshold</span>
        </div>
      </div>

      {/* Recharts Composed Area + Line Chart */}
      <div className="h-80 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
            No telemetry data recorded for this timeframe.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid, #2b2c27)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="var(--chart-label, #777970)"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "var(--border, #2b2c27)" }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              stroke="var(--chart-label, #777970)"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "var(--border, #2b2c27)" }}
              domain={[minY, maxY]}
              unit=" A"
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Shaded Auto-ARIMA Confidence Interval Area */}
            <Area
              type="monotone"
              dataKey="bounds"
              stroke="none"
              fill="#f59e0b"
              fillOpacity={0.16}
              isAnimationActive={false}
            />

            {/* Expected Upper & Lower Bound Boundary Guidelines */}
            <Line
              type="monotone"
              dataKey="upperBound"
              stroke="#f59e0b"
              strokeOpacity={0.35}
              strokeDasharray="4 4"
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="lowerBound"
              stroke="#f59e0b"
              strokeOpacity={0.35}
              strokeDasharray="4 4"
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
            />

            {/* Live Electrical RMS Telemetry Data Line */}
            <Line
              type="monotone"
              dataKey="rmsCurrent"
              stroke="var(--chart-line, #f0efe9)"
              strokeWidth={2}
              isAnimationActive={false}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!payload?.isAnomaly || cx == null || cy == null) return <g key={`empty-${props.index}`} />;
                return (
                  <g key={`anomaly-${payload.timestamp}`}>
                    <circle cx={cx} cy={cy} r={7} fill="#ef4444" fillOpacity={0.3} className="animate-ping" />
                    <circle cx={cx} cy={cy} r={4.5} fill="#ef4444" stroke="#121311" strokeWidth={1.5} />
                  </g>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
