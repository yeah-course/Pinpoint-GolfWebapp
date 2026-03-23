import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Target, Flag as FlagIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { computeRoundStats, getScoreColor } from "@/lib/stats";
import { aggregateSG } from "@/lib/sg-aggregate";
import { GameRadarChart } from "@/components/dashboard/GameRadarChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type Round = Tables<"rounds"> & { courses: { name: string } | null };
type RoundHole = Tables<"round_holes">;

export default function Dashboard() {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [allHoles, setAllHoles] = useState<Record<string, RoundHole[]>>({});
  const [loading, setLoading] = useState(true);
  const [sgTimeframe, setSgTimeframe] = useState("5");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: roundsData } = await supabase
        .from("rounds")
        .select("*, courses(name)")
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .order("date_played", { ascending: false })
        .limit(20);

      const rds = (roundsData ?? []) as Round[];
      setRounds(rds);

      if (rds.length > 0) {
        const { data: holesData } = await supabase
          .from("round_holes")
          .select("*")
          .in("round_id", rds.map((r) => r.id));

        const grouped: Record<string, RoundHole[]> = {};
        (holesData ?? []).forEach((h) => {
          if (!grouped[h.round_id]) grouped[h.round_id] = [];
          grouped[h.round_id].push(h);
        });
        setAllHoles(grouped);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const latestStats = rounds.length > 0 && allHoles[rounds[0].id]
    ? computeRoundStats(allHoles[rounds[0].id])
    : null;

  const sgData = useMemo(() => {
    if (rounds.length === 0) return null;
    let selectedIds: string[];
    if (sgTimeframe === "30d") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      selectedIds = rounds
        .filter((r) => new Date(r.date_played) >= cutoff)
        .map((r) => r.id);
    } else {
      const n = parseInt(sgTimeframe, 10);
      selectedIds = rounds.slice(0, n).map((r) => r.id);
    }
    if (selectedIds.length === 0) return null;
    return aggregateSG(allHoles, selectedIds);
  }, [rounds, allHoles, sgTimeframe]);

  return (
    <AppShell>
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Your golf performance at a glance</p>
          </div>
          <Button asChild size="sm" className="tap-target">
            <Link to="/rounds/new">
              <Plus className="h-4 w-4 mr-1" />
              New Round
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : rounds.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FlagIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-display font-semibold mb-2">No rounds yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start tracking your game by recording your first round.
              </p>
              <Button asChild>
                <Link to="/rounds/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Record First Round
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stat Cards */}
            {latestStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Last Score" value={String(latestStats.totalScore)} sub={`${latestStats.scoreToPar >= 0 ? "+" : ""}${latestStats.scoreToPar}`} />
                <StatCard label="GIR" value={latestStats.girPercent != null ? `${Math.round(latestStats.girPercent)}%` : "—"} icon={<Target className="h-4 w-4 text-primary" />} />
                <StatCard label="Avg Putts" value={latestStats.avgPutts != null ? latestStats.avgPutts.toFixed(1) : "—"} />
                <StatCard label="FIR" value={latestStats.firPercent != null ? `${Math.round(latestStats.firPercent)}%` : "—"} />
              </div>
            )}

            {/* Recent Rounds */}
            <div>
              <h2 className="text-lg font-display font-semibold mb-3">Recent Rounds</h2>
              <div className="space-y-2">
                {rounds.map((round) => {
                  const holes = allHoles[round.id] ?? [];
                  const stats = holes.length > 0 ? computeRoundStats(holes) : null;
                  return (
                    <Link key={round.id} to={`/rounds/${round.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="flex items-center justify-between py-3 px-4">
                          <div>
                            <p className="font-medium font-display text-sm">{round.courses?.name ?? "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(round.date_played).toLocaleDateString()} · {round.holes_played} holes
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold tabular-nums">{round.total_score ?? "—"}</p>
                            {stats && (
                              <p className={`text-xs font-medium tabular-nums ${stats.scoreToPar > 0 ? "text-bogey" : stats.scoreToPar < 0 ? "text-birdie" : "text-muted-foreground"}`}>
                                {stats.scoreToPar >= 0 ? "+" : ""}{stats.scoreToPar}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Hole Scoring Strip for latest round */}
            {allHoles[rounds[0].id] && (
              <div>
                <h2 className="text-lg font-display font-semibold mb-3">Latest Round — Hole by Hole</h2>
                <div className="flex gap-1 flex-wrap">
                  {allHoles[rounds[0].id]
                    .sort((a, b) => a.hole_number - b.hole_number)
                    .map((hole) => (
                      <div
                        key={hole.hole_number}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${getScoreColor(hole.score, hole.par)}`}
                        title={`Hole ${hole.hole_number}: ${hole.score ?? "—"} (Par ${hole.par})`}
                      >
                        {hole.score ?? "—"}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          {icon}
        </div>
        <p className="text-2xl font-bold tabular-nums font-display">{value}</p>
        {sub && <p className="text-xs text-muted-foreground tabular-nums">{sub}</p>}
      </CardContent>
    </Card>
  );
}
