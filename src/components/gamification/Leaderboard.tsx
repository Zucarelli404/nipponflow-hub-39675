import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  current_level: number;
  profiles: {
    nome: string;
  };
}

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("user_points" as any)
        .select(`
          user_id,
          total_points,
          current_level,
          profiles!inner (nome)
        `)
        .order("total_points", { ascending: false })
        .limit(10);

      if (error) throw error;
      setLeaderboard((data as unknown as LeaderboardEntry[]) || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
            {position + 1}
          </div>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <div>Carregando ranking...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Ranking Geral
        </CardTitle>
        <CardDescription>Top 10 colaboradores com mais pontos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                index < 3 ? "bg-accent/50" : ""
              }`}
            >
              <div className="flex-shrink-0">{getPositionIcon(index)}</div>

              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(entry.profiles.nome)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.profiles.nome}</p>
                <p className="text-sm text-muted-foreground">
                  Nível {entry.current_level}
                </p>
              </div>

              <div className="text-right">
                <Badge variant="secondary" className="font-bold">
                  {entry.total_points.toLocaleString()} pts
                </Badge>
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum dado disponível ainda.</p>
              <p className="text-sm mt-1">
                Comece a ganhar pontos para aparecer no ranking!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
