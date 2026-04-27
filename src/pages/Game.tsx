import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useGame } from "@/context/GameContext";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const Game = () => {
  const navigate = useNavigate();
  const { durationSec, players } = useGame();
  const [remaining, setRemaining] = useState(durationSec);
  const timerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (players.length === 0) {
      navigate("/setup");
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          // navigate next tick to avoid setState during render
          setTimeout(() => navigate("/time-end"), 0);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pulse when low
  useEffect(() => {
    if (!timerRef.current) return;
    if (remaining <= 10 && remaining > 0) {
      gsap.to(timerRef.current, { scale: 1.08, duration: 0.4, yoyo: true, repeat: 1, ease: "power1.inOut" });
    }
  }, [remaining]);

  const lowTime = remaining <= 10;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='%23c2410c' stroke-width='1'><path d='M60 0 L120 60 L60 120 L0 60 Z'/><circle cx='60' cy='60' r='25'/><path d='M60 35 L85 60 L60 85 L35 60 Z'/></g></svg>\")",
        }}
      />

      <p className="text-muted-foreground text-sm mb-6 tracking-widest">باقي فالوقت</p>
      <div
        ref={timerRef}
        className="font-display text-[7rem] sm:text-[10rem] leading-none text-shadow-soft transition-colors"
        style={{ color: lowTime ? "hsl(var(--destructive))" : "hsl(var(--primary))" }}
      >
        {formatTime(remaining)}
      </div>
      <div className="mt-8 h-1 w-64 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-sunset transition-all duration-1000 ease-linear"
          style={{ width: `${(remaining / durationSec) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Game;
