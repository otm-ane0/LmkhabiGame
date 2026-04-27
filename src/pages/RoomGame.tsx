import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gsap } from "gsap";
import { useRoom } from "@/hooks/useRoom";
import { goToVoting } from "@/lib/room";
import { getSessionId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const RoomGame = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const sessionId = getSessionId();
  const { room } = useRoom(code);

  const [now, setNow] = useState(Date.now());
  const timerRef = useRef<HTMLDivElement>(null);
  const isHost = room?.host_session_id === sessionId;

  const startedAt = room?.game_started_at ? new Date(room.game_started_at).getTime() : 0;
  const remaining = startedAt
    ? Math.max(0, (room?.duration_sec ?? 0) - Math.floor((now - startedAt) / 1000))
    : room?.duration_sec ?? 0;
  const lowTime = remaining <= 10 && remaining > 0;

  // Tick clock
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  // Auto-route on status change
  useEffect(() => {
    if (!room || !code) return;
    const path = `/room/${code.toUpperCase()}`;
    if (room.status === "voting") navigate(`${path}/vote`);
    else if (room.status === "ended") navigate(`${path}/result`);
    else if (room.status === "lobby") navigate(path);
    else if (room.status === "revealing") navigate(`${path}/reveal`);
  }, [room?.status, code, navigate, room]);

  // Auto-advance to voting when timer hits zero (host triggers it)
  useEffect(() => {
    if (remaining === 0 && isHost && room?.status === "playing" && startedAt) {
      goToVoting(room.id, sessionId).catch((e) => {
        console.error(e);
      });
    }
  }, [remaining, isHost, room?.status, room?.id, startedAt, sessionId]);

  const handleCloseNow = async () => {
    if (!room) return;
    try {
      await goToVoting(room.id, sessionId);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "not-host") toast.error("غير المول يقدر يسد الوقت");
      else toast.error("ما قدرناش نساليو هاد الجولة");
      console.error(e);
    }
  };

  // Pulse when low
  useEffect(() => {
    if (!timerRef.current) return;
    if (lowTime) {
      gsap.to(timerRef.current, { scale: 1.08, duration: 0.4, yoyo: true, repeat: 1, ease: "power1.inOut" });
    }
  }, [remaining, lowTime]);

  if (!room || !room.game_started_at) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">...</div>;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-4">
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
          style={{ width: `${(remaining / room.duration_sec) * 100}%` }}
        />
      </div>

      {isHost && remaining > 0 && (
        <Button
          variant="outline"
          className="mt-10"
          onClick={handleCloseNow}
        >
          سدّ الوقت دابا
        </Button>
      )}
    </div>
  );
};

export default RoomGame;
