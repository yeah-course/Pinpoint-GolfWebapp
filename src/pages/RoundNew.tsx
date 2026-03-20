import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Play, Zap, BarChart3, SlidersHorizontal } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Course = Tables<"courses">;
type TeeSet = Tables<"tee_sets">;

export type CustomFields = {
  fairway: boolean;
  approach_lie: boolean;
  approach_distance: boolean;
  penalties: boolean;
  putt_distance: boolean;
  gir_override: boolean;
};

const DEFAULT_CUSTOM_FIELDS: CustomFields = {
  fairway: true,
  approach_lie: true,
  approach_distance: true,
  penalties: true,
  putt_distance: false,
  gir_override: false,
};

const FIELD_LABELS: Record<keyof CustomFields, string> = {
  fairway: "Tee shot result",
  approach_lie: "Approach start lie",
  approach_distance: "Approach distance",
  penalties: "Penalty strokes",
  putt_distance: "First putt distance",
  gir_override: "GIR override",
};

const MODES = [
  {
    value: "quick" as const,
    label: "Quick",
    icon: Zap,
    desc: "Score & putts only — fastest entry",
  },
  {
    value: "standard" as const,
    label: "Standard",
    icon: BarChart3,
    desc: "Core stats for solid analytics",
  },
  {
    value: "advanced" as const,
    label: "Custom",
    icon: SlidersHorizontal,
    desc: "Choose exactly what to track",
  },
];

export default function RoundNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedTee, setSelectedTee] = useState("");
  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(18);
  const [mode, setMode] = useState<"quick" | "standard" | "advanced">("standard");
  const [customFields, setCustomFields] = useState<CustomFields>(DEFAULT_CUSTOM_FIELDS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("courses").select("*").order("name").then(({ data }) => setCourses(data ?? []));
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    supabase.from("tee_sets").select("*").eq("course_id", selectedCourse).then(({ data }) => {
      setTeeSets(data ?? []);
      if (data && data.length > 0) setSelectedTee(data[0].id);
    });
  }, [selectedCourse]);

  const startRound = async () => {
    if (!user || !selectedCourse || !selectedTee) return;
    setLoading(true);

    const { data: courseHoles } = await supabase
      .from("course_holes")
      .select("*")
      .eq("tee_set_id", selectedTee)
      .order("hole_number");

    const { data: round, error } = await supabase
      .from("rounds")
      .insert({
        user_id: user.id,
        course_id: selectedCourse,
        tee_set_id: selectedTee,
        holes_played: holesPlayed,
        mode,
      })
      .select()
      .single();

    if (error || !round) {
      toast({ title: "Error", description: error?.message ?? "Failed to create round", variant: "destructive" });
      setLoading(false);
      return;
    }

    const holes = (courseHoles ?? [])
      .filter((h) => h.hole_number <= holesPlayed)
      .map((h) => ({
        round_id: round.id,
        hole_number: h.hole_number,
        par: h.par,
        yardage: h.yardage,
      }));

    if (holes.length > 0) {
      await supabase.from("round_holes").insert(holes);
    }

    // Store custom fields in sessionStorage for the play screen
    if (mode === "advanced") {
      sessionStorage.setItem(`custom_fields_${round.id}`, JSON.stringify(customFields));
    }

    setLoading(false);
    navigate(`/rounds/${round.id}/play`);
  };

  return (
    <AppShell>
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold font-display tracking-tight">New Round</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Round Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Course */}
            <div className="space-y-2">
              <Label>Course</Label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select a course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Tee Set */}
            {teeSets.length > 0 && (
              <div className="space-y-2">
                <Label>Tee Set</Label>
                <div className="flex gap-2 flex-wrap">
                  {teeSets.map((tee) => (
                    <Button
                      key={tee.id}
                      size="sm"
                      variant={selectedTee === tee.id ? "default" : "outline"}
                      onClick={() => setSelectedTee(tee.id)}
                      className="tap-target"
                    >
                      <span className="inline-block w-3 h-3 rounded-full mr-1.5 border" style={{ backgroundColor: tee.color }} />
                      {tee.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Holes */}
            <div className="space-y-2">
              <Label>Holes</Label>
              <div className="flex gap-2">
                {([9, 18] as const).map((h) => (
                  <Button
                    key={h}
                    variant={holesPlayed === h ? "default" : "outline"}
                    onClick={() => setHolesPlayed(h)}
                    className="flex-1 tap-target"
                  >
                    {h} Holes
                  </Button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div className="space-y-3">
              <Label>Entry Mode</Label>
              <div className="grid gap-2">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  const selected = mode === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                        selected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${selected ? "text-foreground" : "text-foreground"}`}>
                          {m.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selected ? "border-primary" : "border-muted-foreground/30"
                      }`}>
                        {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom field toggles */}
            {mode === "advanced" && (
              <div className="space-y-3 pt-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Fields to track</Label>
                <div className="space-y-2">
                  {(Object.keys(FIELD_LABELS) as (keyof CustomFields)[]).map((key) => (
                    <div key={key} className="flex items-center justify-between py-1.5">
                      <span className="text-sm">{FIELD_LABELS[key]}</span>
                      <Switch
                        checked={customFields[key]}
                        onCheckedChange={(checked) =>
                          setCustomFields((prev) => ({ ...prev, [key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full tap-target"
              onClick={startRound}
              disabled={!selectedCourse || !selectedTee || loading}
            >
              <Play className="h-4 w-4 mr-1" />
              {loading ? "Starting…" : "Start Round"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
