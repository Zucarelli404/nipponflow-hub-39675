import { useEffect, useRef, useState } from "react";

interface UseLiveToggleOptions {
  intervalMs?: number;
  initialLive?: boolean;
}

// Hook de demonstração para alternar status da live online/offline
export const useLiveToggle = (options: UseLiveToggleOptions = {}) => {
  const { intervalMs = 120000, initialLive = true } = options; // 2 minutos
  const [isLive, setIsLive] = useState<boolean>(initialLive);
  const [viewers, setViewers] = useState<number>(initialLive ? Math.floor(Math.random() * 250) + 50 : 0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Alterna a cada intervalMs
    timerRef.current = window.setInterval(() => {
      setIsLive((prev) => {
        const next = !prev;
        if (next) {
          // Quando ficar online, simula um número de espectadores
          setViewers(Math.floor(Math.random() * 300) + 50);
        } else {
          setViewers(0);
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [intervalMs]);

  // Pequena flutuação nos viewers enquanto estiver online (a cada ~15s)
  useEffect(() => {
    if (!isLive) return;
    const fluct = window.setInterval(() => {
      setViewers((v) => Math.max(0, v + (Math.floor(Math.random() * 21) - 10)));
    }, 15000);
    return () => window.clearInterval(fluct);
  }, [isLive]);

  return { isLive, viewers };
};

