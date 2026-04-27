import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gsap } from "gsap";
import { Eye, EyeOff, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/PageShell";
import { useRoom } from "@/hooks/useRoom";
import { getSessionId } from "@/lib/session";
import { markRoleSeen, startTimer } from "@/lib/room";
import { toast } from "sonner";

const RoomReveal = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const sessionId = getSessionId();
  const { room, players } = useRoom(code);

  const me = players.find((p) => p.session_id === sessionId);
  const isHost = room?.host_session_id === sessionId;
  const allSeen = players.length > 0 && players.every((p) => p.has_seen_role);

  const [revealed, setRevealed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-route on status change
  useEffect(() => {
    if (!room || !code) return;
    const path = `/room/${code.toUpperCase()}`;
    if (room.status === "lobby") navigate(path);
    else if (room.status === "playing") navigate(`${path}/game`);
    else if (room.status === "voting") navigate(`${path}/vote`);
    else if (room.status === "ended") navigate(`${path}/result`);
  }, [room?.status, code, navigate, room]);

  const handleReveal = async () => {
    if (!cardRef.current || !me || revealed) return;
    gsap.to(cardRef.current, {
      rotationY: 180,
      duration: 0.7,
      ease: "power2.inOut",
      onComplete: async () => {
        setRevealed(true);
        if (!me.has_seen_role) await markRoleSeen(me.id);
      },
    });
  };

  const handleStartGame = async () => {
    if (!room) return;
    try {
      await startTimer(room.id, sessionId);
      if (code) navigate(`/room/${code.toUpperCase()}/game`);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "not-host") toast.error("غير المول يقدر يبدا التايمر");
      else if (msg === "roles-not-seen") toast.error("خاص جميع اللاعبين يشوفو الدور ديالهم");
      else toast.error("ما قدرناش نبداو التايمر");
      console.error(e);
    }
  };

  if (!room || !me) {
    return <PageShell className="justify-center"><p className="text-muted-foreground">...</p></PageShell>;
  }

  const seenCount = players.filter((p) => p.has_seen_role).length;

  return (
    <PageShell className="max-w-xl mx-auto justify-center">
      <p className="text-muted-foreground text-center mb-1">السمية ديالك</p>
      <h1 className="font-display text-3xl text-primary text-center mb-6">{me.name}</h1>

      <div className="[perspective:1000px] w-full max-w-sm aspect-[3/4] mb-6 mx-auto">
        <div
          ref={cardRef}
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0 rounded-3xl bg-gradient-tile shadow-card border-4 border-accent/40 flex flex-col items-center justify-center p-8 moroccan-pattern"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <EyeOff className="size-20 text-primary-foreground/90 mb-4" />
            <p className="text-primary-foreground font-display text-2xl text-center">
              الدور مخبي
            </p>
            <p className="text-primary-foreground/70 text-sm mt-2 text-center">
              كليكي باش تشوف الدور ديالك
            </p>
          </div>
          <div
            className="absolute inset-0 rounded-3xl shadow-card border-4 flex flex-col items-center justify-center p-8 text-center"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              backgroundColor: me.is_imposter ? "hsl(var(--secondary))" : "hsl(var(--card))",
              borderColor: me.is_imposter ? "hsl(var(--accent))" : "hsl(var(--primary) / 0.3)",
            }}
          >
            {me.is_imposter ? (
              <>
                <Eye className="size-16 text-accent mb-4" />
                <p className="text-secondary-foreground/80 text-sm mb-2">أنت...</p>
                <h2 className="font-display text-5xl text-accent mb-3">المخبي</h2>
                <p className="text-secondary-foreground font-display text-2xl">راك المخبي</p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-sm mb-2">الكلمة هي</p>
                <h2 className="font-display text-5xl text-primary mb-4">{room.word}</h2>
                <p className="text-muted-foreground text-xs mt-2">حفظها فراسك ولا تقولها</p>
              </>
            )}
          </div>
        </div>
      </div>

      {!revealed ? (
        <Button variant="hero" size="hero" onClick={handleReveal} className="w-full max-w-sm mx-auto">
          شوف الدور
        </Button>
      ) : (
        <div className="w-full max-w-sm mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {seenCount} / {players.length} لاعبين شافو الدور ديالهم
          </p>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-gradient-sunset transition-all duration-500"
              style={{ width: `${(seenCount / players.length) * 100}%` }}
            />
          </div>
          {isHost ? (
            <Button
              variant="hero"
              size="hero"
              className="w-full"
              disabled={!allSeen}
              onClick={handleStartGame}
            >
              <Crown className="size-5 me-2" />
              بدا التايمر
            </Button>
          ) : (
            <p className="text-foreground/80">
              {allSeen ? "تسنا المول باش يبدا التايمر" : "تسنا الباقي يشوفو الدور ديالهم"}
            </p>
          )}
        </div>
      )}
    </PageShell>
  );
};

export default RoomReveal;
