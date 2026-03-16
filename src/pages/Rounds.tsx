import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Round = Tables<"rounds"> & { courses: { name: string } | null };

export default function Rounds() {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("rounds")
      .select("*, courses(name)")
      .eq("user_id", user.id)
      .order("date_played", { ascending: false })
      .then(({ data }) => {
        setRounds((data ?? []) as Round[]);
        setLoading(false);
      });
  }, [user]);

  return (
    <AppShell>
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-display tracking-tight">Rounds</h1>
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
          <p className="text-muted-foreground text-sm py-8 text-center">No rounds recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {rounds.map((round) => (
              <Link key={round.id} to={round.is_completed ? `/rounds/${round.id}` : `/rounds/${round.id}/play`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center justify-between py-3 px-4">
                    <div>
                      <p className="font-medium font-display text-sm">{round.courses?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(round.date_played).toLocaleDateString()} · {round.holes_played} holes
                        {!round.is_completed && " · In Progress"}
                      </p>
                    </div>
                    <p className="text-xl font-bold tabular-nums">{round.total_score ?? "—"}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
