import { Flame, Gem, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserProgression } from "@/hooks/useTrailProgression";
import { Progress } from "@/components/ui/progress";

interface TrailHeaderProps {
  userProgression: UserProgression | null | undefined;
  checkpointLabel: string;
  overallProgress: number;
}

export const TrailHeader = ({ userProgression, checkpointLabel, overallProgress }: TrailHeaderProps) => {
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        {/* Top row: User info and stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bem-vindo,</p>
              <p className="font-semibold text-gray-900">{user?.email?.split("@")[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1.5 rounded-full">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-gray-900 text-sm">{userProgression?.ofensiva_dias || 0}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-cyan-50 px-2.5 py-1.5 rounded-full">
              <Gem className="w-4 h-4 text-cyan-500" />
              <span className="font-bold text-gray-900 text-sm">{userProgression?.diamantes || 0}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1.5 rounded-full">
              <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
              <span className="font-bold text-gray-900 text-sm">{userProgression?.vidas || 5}</span>
            </div>
          </div>
        </div>

        {/* Graduation title and progress */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">Graduação: {checkpointLabel}</h1>
          <div className="flex items-center gap-3">
            <Progress value={overallProgress} className="h-2 flex-1" />
            <span className="text-sm font-semibold text-gray-700 min-w-[3rem]">{overallProgress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
