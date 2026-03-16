import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Globe, Lock } from "lucide-react";
import { computeRoundStats, getScoreColor, getScoreLabel } from "@/lib/stats";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Round = Tables<"rounds"> & { courses: { name: string } | null };
type RoundHole = Tables<"round_holes">;

export default function RoundDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [round, setRound] = useState<Round | null>(null);
  const [holes, setHoles] = useState<RoundHole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: roundData }, { data: holesData }] = await Promise.all([
        supabase.from("rounds").select("*, courses(name)").eq("id", id).single(),
        supabase.from("round_holes").select("*").eq("round_id", id).order("hole_number"),
      ]);
      setRound(roundData as Round);
      setHoles(holesData ?? []);
      setLoading(false);
    };
    load();
  }, [id]);

  const togglePublic = async () => {
    if (!round) return;
    const newVal = !round.is_public;
    await supabase.from("rounds").update({ is_public: newVal }).eq("id", round.id);
    setRound({ ...round, is_public: newVal });
    if (newVal) {
      const url = `${window.location.origin}/rounds/${round.id}/share`;
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share link copied to clipboard." });
    } else {
      toast({ title: "Round is now private" });
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (!round) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Round not found.</p>
        </div>
      </AppShell>
    );
  }

  const stats = computeRoundStats(holes);

  return (
    <AppShell>
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold font-display">{round.courses?.name ?? "Round"}</h1>
              <p className="text-sm text-muted-foreground">
                {new Date(round.date_played).toLocaleDateString()} · {round.holes_played} holes
              </p>
            </div>
          </div>
          {user?.id === round.user_id && (
            <Button variant="outline" size="sm" onClick={togglePublic}>
              {round.is_public ? <Globe className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
              {round.is_public ? "Shared" : "Share"}
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Score" value={String(stats.totalScore)} />
          <StatBox label="vs Par" value={`${stats.scoreToPar >= 0 ? "+" : ""}${stats.scoreToPar}`} />
          <StatBox label="GIR" value={stats.girPercent != null ? `${Math.round(stats.girPercent)}%` : "—"} />
          <StatBox label="Avg Putts" value={stats.avgPutts != null ? stats.avgPutts.toFixed(1) : "—"} />
          <StatBox label="FIR" value={stats.firPercent != null ? `${Math.round(stats.firPercent)}%` : "—"} />
          <StatBox label="Penalties" value={String(stats.totalPenalties)} />
          <StatBox label="Scrambling" value={stats.scramblingPercent != null ? `${Math.round(stats.scramblingPercent)}%` : "—"} />
        </div>

        {/* Hole Scoring Strip */}
        <div className="flex gap-1 flex-wrap">
          {holes.map((h) => (
            <div
              key={h.hole_number}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${getScoreColor(h.score, h.par)}`}
              title={`Hole ${h.hole_number}: ${h.score ?? "—"} (${getScoreLabel(h.score, h.par)})`}
            >
              {h.score ?? "—"}
            </div>
          ))}
        </div>

        {/* Hole-by-hole table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Hole-by-Hole</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 pr-2">Hole</th>
                  <th className="text-center py-2 px-1">Par</th>
                  <th className="text-center py-2 px-1">Yds</th>
                  <th className="text-center py-2 px-1">Score</th>
                  <th className="text-center py-2 px-1">Putts</th>
                  <th className="text-center py-2 px-1">FIR</th>
                  <th className="text-center py-2 px-1">GIR</th>
                  <th className="text-center py-2 px-1">Pen</th>
                </tr>
              </thead>
              <tbody>
                {holes.map((h) => (
                  <tr key={h.hole_number} className="border-b last:border-0">
                    <td className="py-2 pr-2 font-medium tabular-nums">{h.hole_number}</td>
                    <td className="text-center py-2 px-1 tabular-nums">{h.par}</td>
                    <td className="text-center py-2 px-1 tabular-nums text-muted-foreground">{h.yardage}</td>
                    <td className="text-center py-2 px-1">
                      <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ${getScoreColor(h.score, h.par)}`}>
                        {h.score ?? "—"}
                      </span>
                    </td>
                    <td className="text-center py-2 px-1 tabular-nums">{h.putts ?? "—"}</td>
                    <td className="text-center py-2 px-1">{h.par >= 4 ? (h.fairway_hit == null ? "—" : h.fairway_hit ? "✓" : "✗") : "—"}</td>
                    <td className="text-center py-2 px-1">{h.gir == null ? "—" : h.gir ? "✓" : "✗"}</td>
                    <td className="text-center py-2 px-1 tabular-nums">{h.penalty_strokes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums font-display">{value}</p>
      </CardContent>
    </Card>
  );
}
