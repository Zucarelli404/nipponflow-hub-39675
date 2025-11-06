import { Progress } from "@/components/ui/progress";

interface TrailTitleProps {
  checkpointLabel: string;
  overallProgress: number;
}

export const TrailTitle = ({ checkpointLabel, overallProgress }: TrailTitleProps) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Graduação: {checkpointLabel}</h1>
          <p className="text-purple-100">Continue sua jornada de vendas</p>
          
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso Geral</span>
              <span className="font-semibold">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3 bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
};
