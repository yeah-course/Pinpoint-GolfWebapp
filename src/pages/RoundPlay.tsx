import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { calcGIR, calcScramble, getScoreColor } from "@/lib/stats";
import type { Tables } from "@/integrations/supabase/types";

type RoundHole = Tables<"round_holes"> & {
  approach_start_lie?: string | null;
  approach_distance?: number | null;
  putt_distance_feet?: number | null;
};
type Round = Tables<"rounds">;

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8];
const PUTTS = [0, 1, 2, 3, 4];
const PENALTIES = [0, 1, 2, 3];
const FAIRWAY_OPTIONS: { label: string; value: Tables<"round_holes">["tee_shot_result"] }[] = [
  { label: "Fairway", value: "fairway" },
  { label: "Rough", value: "rough" },
  { label: "Sand", value: "sand" },
  { label: "Recovery", value: "recovery" },
  { label: "Penalty", value: "penalty" },
];
const APPROACH_LIE_OPTIONS: { label: string; value: string }[] = [
  { label: "Tee", value: "tee" },
  { label: "Fairway", value: "fairway" },
  { label: "Rough", value: "rough" },
  { label: "Sand", value: "sand" },
  { label: "Recovery", value: "recovery" },
];

const APPROACH_DISTANCES = [50, 75, 100, 125, 150, 175, 200, 225, 250];
const PUTT_DISTANCES = [3, 5, 8, 10, 15, 20, 25, 30, 40, 50];

export default function RoundPlay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [round, setRound] = useState<Round | null>(null);
  const [holes, setHoles] = useState<RoundHole[]>([]);
  const [currentHole, setCurrentHole] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: roundData }, { data: holesData }] = await Promise.all([
        supabase.from("rounds").select("*").eq("id", id).single(),
        supabase.from("round_holes").select("*").eq("round_id", id).order("hole_number"),
      ]);
      setRound(roundData);
      setHoles((holesData as RoundHole[]) ?? []);
      setLoading(false);
    };
    load();
  }, [id]);

  const hole = holes[currentHole];
  const isQuick = round?.mode === "quick";
  const progress = holes.length > 0 ? (holes.filter((h) => h.score != null).length / holes.length) * 100 : 0;

  const updateHole = useCallback(
    async (updates: Partial<RoundHole>) => {
      if (!hole) return;

      const merged = { ...hole, ...updates };

      // Auto-calc GIR
      const gir = calcGIR(merged.score, merged.putts, merged.par);
      if (gir !== null && !updates.gir) merged.gir = gir;

      // Auto-calc scrambling
      const scramble = calcScramble(merged.gir, merged.score, merged.par);
      if (scramble) {
        merged.scramble_attempted = scramble.attempted;
        merged.scramble_converted = scramble.converted;
      }

      // Auto fairway_hit from tee_shot_result
      if (updates.tee_shot_result !== undefined) {
        merged.fairway_hit = updates.tee_shot_result === "fairway";
      }

      const newHoles = [...holes];
      newHoles[currentHole] = merged;
      setHoles(newHoles);

      // Auto-save
      await supabase
        .from("round_holes")
        .update({
          score: merged.score,
          putts: merged.putts,
          fairway_hit: merged.fairway_hit,
          gir: merged.gir,
          penalty_strokes: merged.penalty_strokes,
          tee_shot_result: merged.tee_shot_result,
          scramble_attempted: merged.scramble_attempted,
          scramble_converted: merged.scramble_converted,
          approach_start_lie: merged.approach_start_lie,
          approach_distance: merged.approach_distance,
          putt_distance_feet: merged.putt_distance_feet,
        } as any)
        .eq("id", hole.id);
    },
    [hole, holes, currentHole]
  );

  const finishRound = async () => {
    if (!round) return;
    const totalScore = holes.reduce((s, h) => s + (h.score ?? 0), 0);
    await supabase
      .from("rounds")
      .update({ is_completed: true, total_score: totalScore })
      .eq("id", round.id);
    navigate(`/rounds/${round.id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!round || !hole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Round not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="px-4 py-3 border-b bg-card flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/rounds`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-display font-semibold text-sm">
          Hole {hole.hole_number} of {holes.length}
        </span>
        <div className="w-10" />
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1 rounded-none" />

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-5 overflow-y-auto pb-24">
        {/* Hole header */}
        <div className="text-center">
          <h2 className="text-4xl font-bold font-display tabular-nums">Hole {hole.hole_number}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Par {hole.par} · {hole.yardage} yds
          </p>
        </div>

        {/* Score Strip */}
        <StripSection label="Score">
          <div className="flex gap-1.5 flex-wrap justify-center">
            {SCORES.map((s) => (
              <button
                key={s}
                onClick={() => updateHole({ score: s })}
                className={`w-12 h-12 rounded-lg font-bold text-lg tabular-nums transition-all active:scale-95 border ${
                  hole.score === s
                    ? getScoreColor(s, hole.par) + " border-transparent shadow-md scale-105"
                    : "bg-card border-border text-foreground hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </StripSection>

        {/* Putts Strip */}
        <StripSection label="Putts">
          <div className="flex gap-1.5 justify-center">
            {PUTTS.map((p) => (
              <button
                key={p}
                onClick={() => updateHole({ putts: p })}
                className={`w-12 h-12 rounded-lg font-bold text-lg tabular-nums transition-all active:scale-95 border ${
                  hole.putts === p
                    ? "bg-primary text-primary-foreground border-transparent shadow-md scale-105"
                    : "bg-card border-border text-foreground hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </StripSection>

        {/* Standard mode extras */}
        {!isQuick && (
          <>
            {/* Tee Shot Result (par 4+ only) */}
            {hole.par >= 4 && (
              <StripSection label="Tee Shot">
                <div className="flex gap-1.5 flex-wrap justify-center">
                  {FAIRWAY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateHole({ tee_shot_result: opt.value })}
                      className={`px-3 h-10 rounded-lg text-xs font-medium transition-all active:scale-95 border ${
                        hole.tee_shot_result === opt.value
                          ? "bg-primary text-primary-foreground border-transparent shadow-md"
                          : "bg-card border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </StripSection>
            )}

            {/* Approach Distance */}
            <StripSection label="Approach Distance (yds)">
              <DistancePicker
                presets={APPROACH_DISTANCES}
                value={hole.approach_distance ?? null}
                onChange={(v) => updateHole({ approach_distance: v } as any)}
                unit="yds"
              />
            </StripSection>

            {/* Approach Start Lie */}
            <StripSection label="Approach Start Lie">
              <div className="flex gap-1.5 flex-wrap justify-center">
                {APPROACH_LIE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateHole({ approach_start_lie: opt.value } as any)}
                    className={`px-3 h-10 rounded-lg text-xs font-medium transition-all active:scale-95 border ${
                      hole.approach_start_lie === opt.value
                        ? "bg-primary text-primary-foreground border-transparent shadow-md"
                        : "bg-card border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </StripSection>

            {/* GIR Override */}
            <StripSection label={`GIR ${hole.gir != null ? (hole.gir ? "✓" : "✗") : ""}`}>
              <div className="flex gap-1.5 justify-center">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    onClick={() => updateHole({ gir: v })}
                    className={`px-4 h-10 rounded-lg text-xs font-medium transition-all active:scale-95 border ${
                      hole.gir === v
                        ? v ? "bg-birdie text-white border-transparent" : "bg-bogey text-white border-transparent"
                        : "bg-card border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </StripSection>

            {/* First Putt Distance */}
            <StripSection label="First Putt Distance (ft)">
              <DistancePicker
                presets={PUTT_DISTANCES}
                value={hole.putt_distance_feet ?? null}
                onChange={(v) => updateHole({ putt_distance_feet: v } as any)}
                unit="ft"
              />
            </StripSection>

            {/* Penalties */}
            <StripSection label="Penalties">
              <div className="flex gap-1.5 justify-center">
                {PENALTIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => updateHole({ penalty_strokes: p })}
                    className={`w-12 h-12 rounded-lg font-bold text-lg tabular-nums transition-all active:scale-95 border ${
                      hole.penalty_strokes === p
                        ? p > 0 ? "bg-destructive text-destructive-foreground border-transparent shadow-md" : "bg-primary text-primary-foreground border-transparent shadow-md"
                        : "bg-card border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </StripSection>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="px-4 py-4 border-t bg-card flex items-center justify-between fixed bottom-0 left-0 right-0">
        <Button
          variant="outline"
          onClick={() => setCurrentHole(Math.max(0, currentHole - 1))}
          disabled={currentHole === 0}
          className="tap-target"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Prev
        </Button>

        {currentHole === holes.length - 1 ? (
          <Button onClick={finishRound} className="tap-target">
            <Check className="h-4 w-4 mr-1" /> Finish
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentHole(Math.min(holes.length - 1, currentHole + 1))}
            className="tap-target"
          >
            Next <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Small sub-components ── */

function StripSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function DistancePicker({
  presets,
  value,
  onChange,
  unit,
}: {
  presets: number[];
  value: number | null;
  onChange: (v: number) => void;
  unit: string;
}) {
  const [custom, setCustom] = useState(false);
  const isCustom = value != null && !presets.includes(value);

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 flex-wrap justify-center">
        {presets.map((d) => (
          <button
            key={d}
            onClick={() => { setCustom(false); onChange(d); }}
            className={`px-2.5 h-10 rounded-lg text-xs font-medium tabular-nums transition-all active:scale-95 border ${
              value === d
                ? "bg-primary text-primary-foreground border-transparent shadow-md"
                : "bg-card border-border text-foreground hover:bg-muted"
            }`}
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => setCustom(!custom)}
          className={`px-2.5 h-10 rounded-lg text-xs font-medium transition-all active:scale-95 border ${
            isCustom || custom
              ? "bg-primary text-primary-foreground border-transparent shadow-md"
              : "bg-card border-border text-foreground hover:bg-muted"
          }`}
        >
          Other
        </button>
      </div>
      {(custom || isCustom) && (
        <div className="flex items-center justify-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={unit === "ft" ? 100 : 600}
            value={value ?? ""}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n) && n > 0) onChange(n);
            }}
            className="w-20 h-10 rounded-lg border border-border bg-card text-center text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={unit}
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      )}
    </div>
  );
}
