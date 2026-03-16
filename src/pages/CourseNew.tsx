import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";

interface TeeSetForm {
  name: string;
  color: string;
  courseRating: string;
  slopeRating: string;
  holes: { par: string; yardage: string; strokeIndex: string }[];
}

const DEFAULT_HOLES = () =>
  Array.from({ length: 18 }, () => ({ par: "4", yardage: "", strokeIndex: "" }));

export default function CourseNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [courseName, setCourseName] = useState("");
  const [location, setLocation] = useState("");

  // Step 2 & 3
  const [teeSets, setTeeSets] = useState<TeeSetForm[]>([
    { name: "White", color: "#ffffff", courseRating: "", slopeRating: "", holes: DEFAULT_HOLES() },
  ]);
  const [activeTee, setActiveTee] = useState(0);

  const addTeeSet = () => {
    setTeeSets([...teeSets, { name: "", color: "#ff0000", courseRating: "", slopeRating: "", holes: DEFAULT_HOLES() }]);
    setActiveTee(teeSets.length);
  };

  const removeTeeSet = (i: number) => {
    if (teeSets.length <= 1) return;
    const next = teeSets.filter((_, idx) => idx !== i);
    setTeeSets(next);
    setActiveTee(Math.min(activeTee, next.length - 1));
  };

  const updateTee = (i: number, field: keyof TeeSetForm, value: string) => {
    const copy = [...teeSets];
    (copy[i] as any)[field] = value;
    setTeeSets(copy);
  };

  const updateHole = (teeIdx: number, holeIdx: number, field: string, value: string) => {
    const copy = [...teeSets];
    (copy[teeIdx].holes[holeIdx] as any)[field] = value;
    setTeeSets(copy);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    // Create course
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .insert({ name: courseName, location: location || null, created_by: user.id })
      .select()
      .single();

    if (courseErr || !course) {
      toast({ title: "Error", description: courseErr?.message ?? "Failed to create course", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Create tee sets and holes
    for (const tee of teeSets) {
      const { data: teeSet, error: teeErr } = await supabase
        .from("tee_sets")
        .insert({
          course_id: course.id,
          name: tee.name,
          color: tee.color,
          course_rating: tee.courseRating ? parseFloat(tee.courseRating) : null,
          slope_rating: tee.slopeRating ? parseInt(tee.slopeRating) : null,
        })
        .select()
        .single();

      if (teeErr || !teeSet) continue;

      const holesData = tee.holes
        .map((h, i) => ({
          course_id: course.id,
          tee_set_id: teeSet.id,
          hole_number: i + 1,
          par: parseInt(h.par) || 4,
          yardage: parseInt(h.yardage) || 0,
          stroke_index: h.strokeIndex ? parseInt(h.strokeIndex) : null,
        }));

      await supabase.from("course_holes").insert(holesData);
    }

    setLoading(false);
    toast({ title: "Course created!" });
    navigate("/courses");
  };

  return (
    <AppShell>
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => (step > 1 ? setStep(step - 1) : navigate("/courses"))}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Add Course</h1>
            <p className="text-sm text-muted-foreground">Step {step} of 3</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Course Name *</Label>
                <Input placeholder="Augusta National" value={courseName} onChange={(e) => setCourseName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="Augusta, GA" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <Button className="w-full tap-target" onClick={() => setStep(2)} disabled={!courseName.trim()}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Tee Sets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teeSets.map((tee, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Tee Set {i + 1}</span>
                    {teeSets.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeTeeSet(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input placeholder="White" value={tee.name} onChange={(e) => updateTee(i, "name", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Color</Label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={tee.color} onChange={(e) => updateTee(i, "color", e.target.value)} className="h-10 w-10 rounded border cursor-pointer" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Course Rating</Label>
                      <Input type="number" step="0.1" placeholder="72.0" value={tee.courseRating} onChange={(e) => updateTee(i, "courseRating", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Slope Rating</Label>
                      <Input type="number" placeholder="125" value={tee.slopeRating} onChange={(e) => updateTee(i, "slopeRating", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addTeeSet}>
                <Plus className="h-4 w-4 mr-1" /> Add Tee Set
              </Button>
              <Button className="w-full tap-target" onClick={() => setStep(3)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Hole Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tee selector tabs */}
              {teeSets.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {teeSets.map((tee, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={activeTee === i ? "default" : "outline"}
                      onClick={() => setActiveTee(i)}
                    >
                      <span className="inline-block w-3 h-3 rounded-full mr-1.5 border" style={{ backgroundColor: tee.color }} />
                      {tee.name || `Tee ${i + 1}`}
                    </Button>
                  ))}
                </div>
              )}

              {/* Hole grid */}
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span>Hole</span>
                  <span>Par</span>
                  <span>Yards</span>
                  <span>SI</span>
                </div>
                {teeSets[activeTee].holes.map((hole, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 items-center">
                    <span className="text-sm font-medium tabular-nums pl-1">{i + 1}</span>
                    <select
                      value={hole.par}
                      onChange={(e) => updateHole(activeTee, i, "par", e.target.value)}
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                    >
                      {[3, 4, 5, 6].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      placeholder="412"
                      value={hole.yardage}
                      onChange={(e) => updateHole(activeTee, i, "yardage", e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder={String(i + 1)}
                      value={hole.strokeIndex}
                      onChange={(e) => updateHole(activeTee, i, "strokeIndex", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                ))}
              </div>

              <Button className="w-full tap-target" onClick={handleSubmit} disabled={loading}>
                {loading ? "Creating…" : "Create Course"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
