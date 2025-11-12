import { useEffect } from "react";
import { Trophy } from "lucide-react";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrailFooter } from "./TrailFooter";

const GraduacaoRankingView = () => {
  const handleNavigate = (page: string) => {
    // Dispatch custom event to navigate in Index.tsx
    const event = new CustomEvent("navigate", { detail: page });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    // Potential side-effects for ranking page can go here
  }, []);

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="container mx-auto px-4 pt-4 sm:pt-6">
        {/* Local toggle between Trilha and Ranking */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-lg border bg-card">
            <button
              className="px-3 py-1.5 text-sm rounded-l-lg hover:bg-accent"
              onClick={() => handleNavigate("graduacao")}
            >
              Trilha
            </button>
            <button
              className="px-3 py-1.5 text-sm font-semibold bg-primary text-primary-foreground rounded-r-lg"
              onClick={() => handleNavigate("graduacao-ranking")}
            >
              Ranking
            </button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking da Equipe
            </CardTitle>
            <CardDescription>
              Veja a colocação geral por pontos e nível da sua equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              O ranking é calculado pelos pontos acumulados e nível atual de cada membro.
            </p>
          </CardContent>
        </Card>

        {/* Leaderboard reutilizado */}
        <Leaderboard />
      </div>

      {/* Footer de navegação da trilha permanece disponível */}
      <TrailFooter activePage="graduacao-ranking" onNavigate={handleNavigate} />
    </div>
  );
};

export default GraduacaoRankingView;

