import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgesAdmin } from "./BadgesAdmin";
import { GoalsAdmin } from "./GoalsAdmin";
import { RewardsAdmin } from "./RewardsAdmin";
import { GamificationStats } from "./GamificationStats";
import { Trophy, Target, Gift, BarChart3 } from "lucide-react";

export function GamificationAdmin() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Administração de Gamificação</h2>
        <p className="text-muted-foreground">
          Gerencie badges, metas, prêmios e visualize estatísticas
        </p>
      </div>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stats">
            <BarChart3 className="mr-2 h-4 w-4" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="badges">
            <Trophy className="mr-2 h-4 w-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="mr-2 h-4 w-4" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Gift className="mr-2 h-4 w-4" />
            Prêmios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <GamificationStats />
        </TabsContent>

        <TabsContent value="badges">
          <BadgesAdmin />
        </TabsContent>

        <TabsContent value="goals">
          <GoalsAdmin />
        </TabsContent>

        <TabsContent value="rewards">
          <RewardsAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}
