import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeRoundStats, getScoreColor, getScoreLabel } from "@/lib/stats";
import type { Tables } from "@/integrations/supabase/types";

type Round = Tables<"rounds"> & { courses: { name: string } | null };
type RoundHole = Tables<"round_holes">;

export default function RoundShare() {
  const { id } = useParams<{ id: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [holes, setHoles] = useState<RoundHole[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: roundData, error } = await supabase
        .from("rounds")
        .select("*, courses(name)")
        .eq("id", id)
        .eq("is_public", true)
        .single();

      if (error || !roundData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: holesData } = await supabase
        .from("round_holes")
        .select("*")
        .eq("round_id", id)
        .order("hole_number");

      setRound(roundData as Round);
      setHoles(holesData ?? []);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound || !round) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="text-muted-foreground">This round is private or doesn't exist.</p>
        </div>
      </div>
    );
  }

  const stats = computeRoundStats(holes);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-8 max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">⛳ Pinpoint</p>
          <h1 className="text-2xl font-bold font-display">{round.courses?.name}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(round.date_played).toLocaleDateString()} · {round.holes_played} holes
          </p>
        </div>

        {/* Big score */}
        <div className="text-center">
          <p className="text-6xl font-bold font-display tabular-nums">{stats.totalScore}</p>
          <p className={`text-lg font-medium ${stats.scoreToPar > 0 ? "text-bogey" : stats.scoreToPar < 0 ? "text-birdie" : "text-muted-foreground"}`}>
            {stats.scoreToPar >= 0 ? "+" : ""}{stats.scoreToPar} (Par {stats.totalPar})
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="GIR" value={stats.girPercent != null ? `${Math.round(stats.girPercent)}%` : "—"} />
          <StatBox label="Avg Putts" value={stats.avgPutts != null ? stats.avgPutts.toFixed(1) : "—"} />
          <StatBox label="FIR" value={stats.firPercent != null ? `${Math.round(stats.firPercent)}%` : "—"} />
        </div>

        {/* Scoring strip */}
        <div className="flex gap-1 flex-wrap justify-center">
          {holes.map((h) => (
            <div
              key={h.hole_number}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${getScoreColor(h.score, h.par)}`}
            >
              {h.score ?? "—"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-3 px-3 text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold tabular-nums font-display">{value}</p>
      </CardContent>
    </Card>
  );
}
