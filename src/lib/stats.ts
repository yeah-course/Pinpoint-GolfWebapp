import type { Tables } from "@/integrations/supabase/types";

type RoundHole = Tables<"round_holes">;

export function calcGIR(score: number | null, putts: number | null, par: number): boolean | null {
  if (score == null || putts == null) return null;
  return (score - putts) <= (par - 2);
}

export function calcScramble(gir: boolean | null, score: number | null, par: number): { attempted: boolean; converted: boolean } | null {
  if (gir == null || gir === true || score == null) return null;
  return {
    attempted: true,
    converted: score <= par,
  };
}

export function getScoreColor(score: number | null, par: number): string {
  if (score == null) return "";
  const diff = score - par;
  if (diff <= -2) return "bg-eagle text-white";
  if (diff === -1) return "bg-birdie text-white";
  if (diff === 0) return "bg-par text-foreground";
  if (diff === 1) return "bg-bogey text-white";
  if (diff === 2) return "bg-double text-white";
  return "bg-worse text-white";
}

export function getScoreLabel(score: number | null, par: number): string {
  if (score == null) return "—";
  const diff = score - par;
  if (diff <= -3) return "Albatross";
  if (diff === -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Double";
  if (diff === 3) return "Triple";
  return `+${diff}`;
}

export interface RoundStats {
  totalScore: number;
  totalPar: number;
  scoreToPar: number;
  firPercent: number | null;
  girPercent: number | null;
  avgPutts: number | null;
  totalPenalties: number;
  scramblingPercent: number | null;
}

export function computeRoundStats(holes: RoundHole[]): RoundStats {
  const scored = holes.filter((h) => h.score != null);
  const totalScore = scored.reduce((s, h) => s + (h.score ?? 0), 0);
  const totalPar = scored.reduce((s, h) => s + h.par, 0);

  // FIR — only count par 4s and par 5s
  const firHoles = scored.filter((h) => h.par >= 4 && h.fairway_hit != null);
  const firPercent = firHoles.length > 0
    ? (firHoles.filter((h) => h.fairway_hit).length / firHoles.length) * 100
    : null;

  // GIR
  const girHoles = scored.filter((h) => h.gir != null);
  const girPercent = girHoles.length > 0
    ? (girHoles.filter((h) => h.gir).length / girHoles.length) * 100
    : null;

  // Putts
  const puttHoles = scored.filter((h) => h.putts != null);
  const avgPutts = puttHoles.length > 0
    ? puttHoles.reduce((s, h) => s + (h.putts ?? 0), 0) / puttHoles.length
    : null;

  // Penalties
  const totalPenalties = scored.reduce((s, h) => s + h.penalty_strokes, 0);

  // Scrambling
  const scrambleAttempted = scored.filter((h) => h.scramble_attempted);
  const scramblingPercent = scrambleAttempted.length > 0
    ? (scrambleAttempted.filter((h) => h.scramble_converted).length / scrambleAttempted.length) * 100
    : null;

  return {
    totalScore,
    totalPar,
    scoreToPar: totalScore - totalPar,
    firPercent,
    girPercent,
    avgPutts,
    totalPenalties,
    scramblingPercent,
  };
}
