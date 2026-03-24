import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aggregateSG } from "@/lib/sg-aggregate";
import { AlertTriangle, Target, Trophy, Dumbbell } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Round = Tables<"rounds">;
type RoundHole = Tables<"round_holes">;

interface RankedCategory {
  category: string;
  value: number;
  icon: string;
  tip: string;
  subDetail: string;
}

const CATEGORY_META: Record<string, { icon: string; tips: { bad: string; ok: string }; subBad: string; subOk: string }> = {
  "Off the Tee": {
    icon: "🏌️",
    tips: {
      bad: "Wayward tee shots are costing you strokes. Focus on accuracy off the tee — even if it means less distance.",
      ok: "Your driving is solid. Keep maintaining your tee game with consistency work.",
    },
    subBad: "Driver accuracy & course management",
    subOk: "Tee shot consistency",
  },
  Approach: {
    icon: "🎯",
    tips: {
      bad: "Your approach play is your biggest leak. Work on mid-iron distance control and green-seeking accuracy.",
      ok: "Approaches are a strength — you're hitting greens and giving yourself chances.",
    },
    subBad: "Mid-iron accuracy & distance control",
    subOk: "Iron play & green targeting",
  },
  "Around Green": {
    icon: "⛳",
    tips: {
      bad: "Missed greens are turning into bogeys too often. Sharpen your chipping and scrambling to save more pars.",
      ok: "Good touch around the greens — your short game is keeping your scores tight.",
    },
    subBad: "Chipping, pitching & scrambling",
    subOk: "Short game touch",
  },
  Putting: {
    icon: "🕳️",
    tips: {
      bad: "You're losing strokes on the green. Focus on lag putting to avoid 3-putts and holing more inside 8 feet.",
      ok: "The flat stick is working well. Your putting is keeping you competitive.",
    },
    subBad: "Lag putting & inside 8 feet",
    subOk: "Green reading & speed control",
  },
};

function rankCategories(categories: { category: string; value: number }[]): RankedCategory[] {
  const sorted = [...categories].sort((a, b) => a.value - b.value); // worst first
  return sorted.map((c) => {
    const meta = CATEGORY_META[c.category];
    const isWeak = c.value < -0.1;
    return {
      category: c.category,
      value: c.value,
      icon: meta?.icon ?? "📊",
      tip: isWeak ? meta?.tips.bad ?? "" : meta?.tips.ok ?? "",
      subDetail: isWeak ? meta?.subBad ?? "" : meta?.subOk ?? "",
    };
  });
}

function practiceSplit(ranked: RankedCategory[]): { category: string; pct: number; action: string }[] {
  // Allocate practice time: worst gets most, best gets "maintain"
  const weaknesses = ranked.filter((r) => r.value < -0.1);
  const n = weaknesses.length;

  if (n === 0) {
    return ranked.map((r, i) => ({
      category: r.category,
      pct: 25,
      action: "Maintain",
    }));
  }

  const splits = n >= 3 ? [45, 30, 15, 10] : n === 2 ? [50, 30, 10, 10] : [50, 20, 15, 15];
  return ranked.map((r, i) => ({
    category: r.category,
    pct: splits[i] ?? 10,
    action: i === ranked.length - 1 && r.value > 0 ? "Maintain" : i < n ? "Improve" : "Maintain",
  }));
}

function sgLabel(v: number) {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}`;
}

export default function GameOverview() {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [allHoles, setAllHoles] = useState<Record<string, RoundHole[]>>({});
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("10");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: rds } = await supabase
        .from("rounds")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .order("date_played", { ascending: false })
        .limit(20);

      const rounds = rds ?? [];
      setRounds(rounds);

      if (rounds.length > 0) {
        const { data: holes } = await supabase
          .from("round_holes")
          .select("*")
          .in("round_id", rounds.map((r) => r.id));

        const grouped: Record<string, RoundHole[]> = {};
        (holes ?? []).forEach((h) => {
          (grouped[h.round_id] ??= []).push(h);
        });
        setAllHoles(grouped);
      }
      setLoading(false);
    })();
  }, [user]);

  const analysis = useMemo(() => {
    if (rounds.length === 0) return null;

    let ids: string[];
    if (timeframe === "30d") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      ids = rounds.filter((r) => new Date(r.date_played) >= cutoff).map((r) => r.id);
    } else {
      ids = rounds.slice(0, parseInt(timeframe, 10)).map((r) => r.id);
    }
    if (ids.length === 0) return null;

    const sg = aggregateSG(allHoles, ids);
    if (sg.roundCount === 0) return null;

    const ranked = rankCategories(sg.categories);
    const practice = practiceSplit(ranked);
    return { sg, ranked, practice };
  }, [rounds, allHoles, timeframe]);

  const primary = analysis?.ranked[0];
  const secondary = analysis?.ranked[1];
  const strength = analysis?.ranked[analysis.ranked.length - 1];

  return (
    <AppShell>
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Game Overview</h1>
            <p className="text-sm text-muted-foreground">Your priorities based on recent performance</p>
          </div>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Last 5 rounds</SelectItem>
              <SelectItem value="10">Last 10 rounds</SelectItem>
              <SelectItem value="20">Last 20 rounds</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !analysis ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-display font-semibold mb-2">Not enough data yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete a few rounds to unlock your game analysis.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary sentence */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4 px-5">
                <p className="text-sm leading-relaxed">
                  Based on your last <span className="font-semibold">{analysis.sg.roundCount} round{analysis.sg.roundCount !== 1 ? "s" : ""}</span>,
                  your biggest opportunity is <span className="font-semibold text-primary">{primary?.category.toLowerCase()}</span>.
                  {strength && strength.value > 0.1 && (
                    <> Your <span className="font-semibold text-primary">{strength.category.toLowerCase()}</span> is a clear strength.</>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Primary Focus */}
            {primary && (
              <PriorityCard
                rank="Top Priority"
                icon={<AlertTriangle className="h-5 w-5 text-bogey" />}
                category={primary}
                accent="bogey"
              />
            )}

            {/* Secondary Focus */}
            {secondary && secondary.value < -0.05 && (
              <PriorityCard
                rank="Second Priority"
                icon={<Target className="h-5 w-5 text-amber-500" />}
                category={secondary}
                accent="amber"
              />
            )}

            {/* Current Strength */}
            {strength && strength.value > 0 && (
              <PriorityCard
                rank="Current Strength"
                icon={<Trophy className="h-5 w-5 text-birdie" />}
                category={strength}
                accent="birdie"
              />
            )}

            {/* Recommended Practice Focus */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-display font-semibold">Recommended Practice Split</h2>
              </div>
              <Card>
                <CardContent className="py-4 px-5 space-y-3">
                  {analysis.practice.map((p) => (
                    <div key={p.category} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{p.category}</span>
                          <span className="text-xs text-muted-foreground">{p.action} · {p.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${p.pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <div>
              <h2 className="text-lg font-display font-semibold mb-3">All Categories</h2>
              <div className="grid grid-cols-2 gap-3">
                {analysis.ranked.map((c) => (
                  <Card key={c.category}>
                    <CardContent className="py-3 px-4">
                      <span className="text-lg mb-1 block">{c.icon}</span>
                      <p className="text-xs text-muted-foreground font-medium">{c.category}</p>
                      <p className={`text-xl font-bold tabular-nums font-display ${c.value >= 0 ? "text-birdie" : "text-bogey"}`}>
                        {sgLabel(c.value)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function PriorityCard({
  rank,
  icon,
  category,
  accent,
}: {
  rank: string;
  icon: React.ReactNode;
  category: RankedCategory;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="py-4 px-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{rank}</span>
              <span className={`text-sm font-bold tabular-nums ${category.value >= 0 ? "text-birdie" : "text-bogey"}`}>
                {sgLabel(category.value)}
              </span>
            </div>
            <h3 className="text-base font-display font-semibold mb-1">{category.category}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">{category.tip}</p>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {category.subDetail}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
