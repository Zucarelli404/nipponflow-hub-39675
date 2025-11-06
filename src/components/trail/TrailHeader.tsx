import { Flame, Gem, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserProgression } from "@/hooks/useTrailProgression";

interface TrailHeaderProps {
  userProgression: UserProgression | null | undefined;
}

export const TrailHeader = ({ userProgression }: TrailHeaderProps) => {
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <p className="text-sm opacity-90">Bem-vindo,</p>
              <p className="font-semibold">{user?.email?.split("@")[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Flame className="w-4 h-4 text-orange-300" />
              <span className="font-bold">{userProgression?.ofensiva_dias || 0}</span>
            </div>

            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Gem className="w-4 h-4 text-cyan-300" />
              <span className="font-bold">{userProgression?.diamantes || 0}</span>
            </div>

            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Heart className="w-4 h-4 text-red-300" fill="currentColor" />
              <span className="font-bold">{userProgression?.vidas || 5}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
