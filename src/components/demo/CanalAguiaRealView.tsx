import { useRef } from "react";
import { Radio, Eye } from "lucide-react";
import { useLiveToggle } from "@/hooks/useLiveToggle";

const CanalAguiaRealView = () => {
  const liveRef = useRef<HTMLDivElement | null>(null);
  const { isLive, viewers } = useLiveToggle({ intervalMs: 120000, initialLive: true });
  return (
    <div className="relative min-h-[70vh] p-4">
      <div ref={liveRef} className="aspect-video rounded-lg overflow-hidden border relative">
        {/* Overlay de status da live */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full shadow-sm border bg-red-700/90 text-white">
            <div className="relative h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
              <Radio className="h-3 w-3" />
              {isLive && <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-white/80 animate-ping" />}
            </div>
            {isLive ? (
              <span className="text-[10px] font-bold leading-tight tracking-wide text-center">
                AO
                <br />
                VIVO
              </span>
            ) : (
              <span className="text-xs font-bold tracking-wide">OFFLINE</span>
            )}
            {isLive && (
              <span className="flex items-center gap-1 text-xs pr-1">
                <Eye className="h-3 w-3" /> {viewers}
              </span>
            )}
          </div>
        </div>
        <iframe
          className="w-full h-full"
          src="https://www.youtube.com/embed/VBb6ngKUmRk?rel=0&modestbranding=1"
          title="Transmissão ao vivo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default CanalAguiaRealView;
