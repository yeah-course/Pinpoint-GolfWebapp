/**
 * Aggregate strokes gained across multiple rounds for radar/dashboard use.
 */
import { computeRoundSG, type RoundSG } from "./strokes-gained";
import type { Tables } from "@/integrations/supabase/types";
import type { SGCategory } from "@/components/dashboard/GameRadarChart";

type RoundHole = Tables<"round_holes">;

export interface SGAggregation {
  categories: SGCategory[];
  perRound: RoundSG[];
  roundCount: number;
}

export function aggregateSG(
  roundHolesMap: Record<string, RoundHole[]>,
  roundIds: string[]
): SGAggregation {
  const perRound: RoundSG[] = [];

  for (const id of roundIds) {
    const holes = roundHolesMap[id];
    if (!holes || holes.length === 0) continue;
    perRound.push(computeRoundSG(holes));
  }

  const n = perRound.length || 1;

  const avg = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / n;

  const categories: SGCategory[] = [
    { category: "Off the Tee", value: avg(perRound.map((r) => r.tee)) },
    { category: "Approach", value: avg(perRound.map((r) => r.approach)) },
    { category: "Around Green", value: avg(perRound.map((r) => r.aroundGreen)) },
    { category: "Putting", value: avg(perRound.map((r) => r.putting)) },
  ];

  return { categories, perRound, roundCount: perRound.length };
}
