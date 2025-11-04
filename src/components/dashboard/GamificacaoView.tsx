import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfile } from "@/components/gamification/UserProfile";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { GoalsManager } from "@/components/gamification/GoalsManager";
import { RewardsStore } from "@/components/gamification/RewardsStore";
import { Trophy, Target, Gift, Users } from "lucide-react";

const GamificacaoView = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gamificação</h2>
        <p className="text-muted-foreground">
          Acompanhe seu progresso, conquiste badges e resgate prêmios
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <Trophy className="mr-2 h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="mr-2 h-4 w-4" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Users className="mr-2 h-4 w-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Gift className="mr-2 h-4 w-4" />
            Prêmios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <UserProfile />
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <GoalsManager />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Leaderboard />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <RewardsStore />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificacaoView;
