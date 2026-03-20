import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Minus, Plus } from "lucide-react";
import { calcGIR, calcScramble, getScoreColor, getScoreLabel } from "@/lib/stats";
import type { Tables } from "@/integrations/supabase/types";
import type { CustomFields } from "@/pages/RoundNew";

type RoundHole = Tables<"round_holes"> & {
  approach_start_lie?: string | null;
  approach_distance?: number | null;
  putt_distance_feet?: number | null;
};
type Round = Tables<"rounds">;

const FAIRWAY_OPTIONS: { label: string; value: Tables<"round_holes">["tee_shot_result"] }[] = [
  { label: "Fairway", value: "fairway" },
  { label: "Rough", value: "rough" },
  { label: "Sand", value: "sand" },
  { label: "Recovery", value: "recovery" },
  { label: "Penalty", value: "penalty" },
];

const APPROACH_LIE_OPTIONS = [
  { label: "Fairway", value: "fairway" },
  { label: "Rough", value: "rough" },
  { label: "Sand", value: "sand" },
  { label: "Recovery", value: "recovery" },
];

const APPROACH_DISTANCES = [75, 100, 125, 150, 175, 200, 225];
const PUTT_DISTANCES = [3, 5, 10, 15, 20, 30, 50];

export default function RoundPlay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [round, setRound] = useState<Round | null>(null);
  const [holes, setHoles] = useState<RoundHole[]>([]);
  const [currentHole, setCurrentHole] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

  // Load custom fields for advanced mode
  const customFields = useMemo<CustomFields | null>(() => {
    if (!id) return null;
    const stored = sessionStorage.getItem(`custom_fields_${id}`);
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  }, [id]);

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

  useEffect(() => {
    setShowMore(false);
  }, [currentHole]);

  const hole = holes[currentHole];
  const isQuick = round?.mode === "quick";
  const isAdvanced = round?.mode === "advanced";
  const isStandard = round?.mode === "standard";
  const isPar3 = hole?.par === 3;
  const progress = holes.length > 0 ? (holes.filter((h) => h.score != null).length / holes.length) * 100 : 0;

  // Determine which fields to show
  const showField = useCallback((field: keyof CustomFields): boolean => {
    if (isQuick) return false;
    if (isStandard) {
      // Standard shows: fairway (par4+), penalties, approach_lie (par4+), approach_distance (par4+)
      if (field === "fairway" || field === "approach_lie" || field === "approach_distance") return !isPar3;
      if (field === "penalties") return true;
      return false; // putt_distance, gir_override hidden by default
    }
    if (isAdvanced && customFields) return customFields[field];
    // fallback: standard-like
    return !isPar3 || !["fairway", "approach_lie", "approach_distance"].includes(field);
  }, [isQuick, isStandard, isAdvanced, customFields, isPar3]);

  const updateHole = useCallback(
    async (updates: Partial<RoundHole>) => {
      if (!hole) return;
      const merged = { ...hole, ...updates };

      const gir = calcGIR(merged.score, merged.putts, merged.par);
      if (gir !== null && !updates.gir) merged.gir = gir;

      const scramble = calcScramble(merged.gir, merged.score, merged.par);
      if (scramble) {
        merged.scramble_attempted = scramble.attempted;
        merged.scramble_converted = scramble.converted;
      }

      if (updates.tee_shot_result !== undefined) {
        merged.fairway_hit = updates.tee_shot_result === "fairway";
      }

      if (hole.par === 3) {
        merged.approach_distance = hole.yardage;
        merged.approach_start_lie = "tee";
      }

      const newHoles = [...holes];
      newHoles[currentHole] = merged;
      setHoles(newHoles);

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
    [hole, holes, currentHole],
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

  const scoreLabel = hole.score != null ? getScoreLabel(hole.score, hole.par) : null;

  // Build score buttons: show par-2 to par+4, minimum 1
  const scoreMin = Math.max(1, hole.par - 2);
  const scoreMax = hole.par + 4;
  const scoreButtons = Array.from({ length: scoreMax - scoreMin + 1 }, (_, i) => scoreMin + i);

  // Which "more" fields exist for this hole
  const hasMoreFields =
    (!isQuick && showField("putt_distance")) ||
    (!isQuick && showField("gir_override")) ||
    (!isQuick && showField("penalties"));

  // In standard mode, penalties are in "more" section
  const penaltiesInMore = isStandard;

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

      <Progress value={progress} className="h-1 rounded-none" />

      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full space-y-5 overflow-y-auto pb-24">
        {/* Hole header */}
        <div className="text-center space-y-0.5">
          <h2 className="text-3xl font-bold font-display tabular-nums">Hole {hole.hole_number}</h2>
          <p className="text-muted-foreground text-sm">
            Par {hole.par} · {hole.yardage} yds
          </p>
          {scoreLabel && (
            <p className={`text-xs font-semibold ${
              hole.score != null
                ? getScoreColor(hole.score, hole.par).replace("shadow-md", "").replace("scale-105", "")
                : "text-muted-foreground"
            }`}>
              {scoreLabel}
            </p>
          )}
        </div>

        {/* ── Score ── */}
        <Section label="Score">
          <NumberStrip
            values={scoreButtons}
            selected={hole.score ?? null}
            onSelect={(s) => updateHole({ score: s })}
            colorFn={(v) => hole.score === v ? getScoreColor(v, hole.par) : undefined}
            allowCustom
            customLabel="Other"
            min={1}
            max={20}
            onCustom={(v) => updateHole({ score: v })}
          />
        </Section>

        {/* ── Putts ── */}
        <Section label="Putts">
          <NumberStrip
            values={[0, 1, 2, 3]}
            selected={hole.putts ?? null}
            onSelect={(p) => updateHole({ putts: p })}
            allowCustom
            customLabel="4+"
            min={4}
            max={10}
            onCustom={(v) => updateHole({ putts: v })}
          />
        </Section>

        {/* ── Tee Shot (par 4+, non-quick) ── */}
        {showField("fairway") && (
          <Section label="Tee Shot">
            <div className="flex gap-1.5 flex-wrap justify-center">
              {FAIRWAY_OPTIONS.map((opt) => (
                <PillButton
                  key={opt.value}
                  label={opt.label}
                  selected={hole.tee_shot_result === opt.value}
                  onClick={() => updateHole({ tee_shot_result: opt.value })}
                />
              ))}
            </div>
          </Section>
        )}

        {/* ── Approach (par 4+, non-quick) ── */}
        {(showField("approach_lie") || showField("approach_distance")) && (
          <Section label="Approach">
            <div className="space-y-3">
              {showField("approach_lie") && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 text-center uppercase tracking-wider">Starting lie</p>
                  <div className="flex gap-1.5 flex-wrap justify-center">
                    {APPROACH_LIE_OPTIONS.map((opt) => (
                      <PillButton
                        key={opt.value}
                        label={opt.label}
                        selected={hole.approach_start_lie === opt.value}
                        onClick={() => updateHole({ approach_start_lie: opt.value } as any)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {showField("approach_distance") && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 text-center uppercase tracking-wider">Distance (yds)</p>
                  <DistancePicker
                    presets={APPROACH_DISTANCES}
                    value={hole.approach_distance ?? null}
                    onChange={(v) => updateHole({ approach_distance: v } as any)}
                    unit="yds"
                  />
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Penalties (shown directly in advanced/custom if enabled, otherwise in "more") ── */}
        {!isQuick && showField("penalties") && !penaltiesInMore && (
          <Section label="Penalties">
            <NumberStrip
              values={[0, 1, 2, 3]}
              selected={hole.penalty_strokes}
              onSelect={(p) => updateHole({ penalty_strokes: p })}
              colorFn={(v) => hole.penalty_strokes === v && v > 0 ? "bg-destructive text-destructive-foreground" : undefined}
            />
          </Section>
        )}

        {/* ── More details (collapsible) ── */}
        {!isQuick && (hasMoreFields || penaltiesInMore) && (
          <>
            <button
              onClick={() => setShowMore(!showMore)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              More details
              <ChevronDown className={`h-3 w-3 transition-transform ${showMore ? "rotate-180" : ""}`} />
            </button>

            {showMore && (
              <div className="space-y-4">
                {penaltiesInMore && (
                  <Section label="Penalties">
                    <NumberStrip
                      values={[0, 1, 2, 3]}
                      selected={hole.penalty_strokes}
                      onSelect={(p) => updateHole({ penalty_strokes: p })}
                      allowCustom
                      customLabel="4+"
                      min={4}
                      max={10}
                      onCustom={(v) => updateHole({ penalty_strokes: v })}
                      colorFn={(v) => hole.penalty_strokes === v && v > 0 ? "bg-destructive text-destructive-foreground" : undefined}
                    />
                  </Section>
                )}

                {showField("putt_distance") && (
                  <Section label="First Putt Distance">
                    <DistancePicker
                      presets={PUTT_DISTANCES}
                      value={hole.putt_distance_feet ?? null}
                      onChange={(v) => updateHole({ putt_distance_feet: v } as any)}
                      unit="ft"
                    />
                  </Section>
                )}

                {showField("gir_override") && (
                  <Section label={`GIR ${hole.gir != null ? (hole.gir ? "✓" : "✗") : ""}`}>
                    <div className="flex gap-2 justify-center">
                      {[true, false].map((v) => (
                        <button
                          key={String(v)}
                          onClick={() => updateHole({ gir: v })}
                          className={`px-5 h-10 rounded-lg text-sm font-medium transition-all active:scale-95 border ${
                            hole.gir === v
                              ? v ? "bg-birdie text-white border-transparent" : "bg-bogey text-white border-transparent"
                              : "bg-card border-border text-foreground hover:bg-muted"
                          }`}
                        >
                          {v ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            )}
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

/* ────────────────────────── Sub-components ────────────────────────── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block text-center">
        {label}
      </label>
      {children}
    </div>
  );
}

function PillButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-10 rounded-xl text-xs font-medium transition-all active:scale-95 border ${
        selected
          ? "bg-primary text-primary-foreground border-transparent shadow-sm"
          : "bg-card border-border text-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Flexible number strip with optional "other" for values outside the preset range.
 * Replaces hardcoded [1..8] / [0..4] arrays.
 */
function NumberStrip({
  values,
  selected,
  onSelect,
  colorFn,
  allowCustom,
  customLabel,
  min,
  max,
  onCustom,
}: {
  values: number[];
  selected: number | null;
  onSelect: (v: number) => void;
  colorFn?: (v: number) => string | undefined;
  allowCustom?: boolean;
  customLabel?: string;
  min?: number;
  max?: number;
  onCustom?: (v: number) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const isCustomValue = selected != null && !values.includes(selected);

  // Reset custom panel when selected goes back to a preset
  useEffect(() => {
    if (selected != null && values.includes(selected)) setShowCustom(false);
  }, [selected, values]);

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 flex-wrap justify-center">
        {values.map((v) => {
          const customColor = colorFn?.(v);
          const isSelected = selected === v;
          return (
            <button
              key={v}
              onClick={() => { setShowCustom(false); onSelect(v); }}
              className={`w-12 h-12 rounded-xl font-bold text-base tabular-nums transition-all active:scale-95 border ${
                isSelected
                  ? (customColor ?? "bg-primary text-primary-foreground") + " border-transparent shadow-sm"
                  : "bg-card border-border text-foreground hover:bg-muted"
              }`}
            >
              {v}
            </button>
          );
        })}
        {allowCustom && (
          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`px-3 h-12 rounded-xl text-xs font-medium transition-all active:scale-95 border ${
              isCustomValue || showCustom
                ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                : "bg-card border-border text-foreground hover:bg-muted"
            }`}
          >
            {customLabel ?? "…"}
          </button>
        )}
      </div>
      {(showCustom || isCustomValue) && allowCustom && onCustom && min != null && max != null && (
        <StepperInput
          value={selected != null && !values.includes(selected) ? selected : min}
          min={min}
          max={max}
          onChange={onCustom}
        />
      )}
    </div>
  );
}

/** Compact +/– stepper for edge-case values */
function StepperInput({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => { if (value > min) onChange(value - 1); }}
        disabled={value <= min}
        className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-lg font-bold tabular-nums">{value}</span>
      <button
        onClick={() => { if (value < max) onChange(value + 1); }}
        disabled={value >= max}
        className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
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
            className={`px-2.5 h-10 rounded-xl text-xs font-medium tabular-nums transition-all active:scale-95 border ${
              value === d
                ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                : "bg-card border-border text-foreground hover:bg-muted"
            }`}
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => setCustom(!custom)}
          className={`px-2.5 h-10 rounded-xl text-xs font-medium transition-all active:scale-95 border ${
            isCustom || custom
              ? "bg-primary text-primary-foreground border-transparent shadow-sm"
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
            className="w-20 h-10 rounded-xl border border-border bg-card text-center text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={unit}
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      )}
    </div>
  );
}
