import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface SGCategory {
  category: string;
  value: number;
}

interface GameRadarChartProps {
  data: SGCategory[];
  roundCount: number;
}

const DOMAIN_MAX = 3;
const DOMAIN_MIN = -3;

function clamp(v: number) {
  return Math.max(DOMAIN_MIN, Math.min(DOMAIN_MAX, v));
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { category, value } = payload[0].payload as SGCategory;
  const color = value >= 0 ? "hsl(var(--birdie))" : "hsl(var(--bogey))";
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl text-xs">
      <p className="font-medium text-foreground mb-0.5">{category}</p>
      <p className="tabular-nums font-semibold" style={{ color }}>
        {value >= 0 ? "+" : ""}{value.toFixed(2)}
      </p>
    </div>
  );
}

export function GameRadarChart({ data, roundCount }: GameRadarChartProps) {
  // Shift values into positive range for radar rendering, keep originals for tooltip
  const shifted = data.map((d) => ({
    ...d,
    display: clamp(d.value) - DOMAIN_MIN, // 0–6 range
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display font-semibold flex items-center justify-between">
          Game Shape
          <span className="text-xs font-normal text-muted-foreground">
            {roundCount} round{roundCount !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="w-full aspect-square max-w-[280px] mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={shifted}>
              <PolarGrid
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
              />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
              />
              <Radar
                dataKey="display"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {/* Zero-line legend */}
        <p className="text-[10px] text-center text-muted-foreground mt-1">
          Centre = −3 · Middle ring = 0 · Outer = +3
        </p>
      </CardContent>
    </Card>
  );
}
