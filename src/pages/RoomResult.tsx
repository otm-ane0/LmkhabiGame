import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageShell from "@/components/PageShell";
import { useRoom } from "@/hooks/useRoom";
import { getSessionId } from "@/lib/session";
import { restartRoom } from "@/lib/room";
import { toast } from "sonner";

const RoomResult = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const sessionId = getSessionId();
  const { room, players } = useRoom(code);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const isHost = room?.host_session_id === sessionId;

  useEffect(() => {
    if (!room || !code) return;
    const path = `/room/${code.toUpperCase()}`;
    if (room.status === "lobby") navigate(path);
    else if (room.status === "revealing") navigate(`${path}/reveal`);
  }, [room?.status, code, navigate, room]);

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { scale: 0.5, opacity: 0, rotation: -5 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.9, ease: "back.out(1.7)" },
      );
    }
  }, [room?.status]);

  if (!room) return <PageShell className="justify-center"><p>...</p></PageShell>;

  // Tally
  const tally = new Map<string, number>();
  players.forEach((p) => {
    if (p.vote_target_id) tally.set(p.vote_target_id, (tally.get(p.vote_target_id) || 0) + 1);
  });
  let mostVotedId: string | null = null;
  let max = 0;
  tally.forEach((v, k) => {
    if (v > max) {
      max = v;
      mostVotedId = k;
    }
  });
  const imposters = players.filter((p) => p.is_imposter);
  const imposterCaught = mostVotedId ? imposters.some((p) => p.id === mostVotedId) : false;
  const mostVoted = players.find((p) => p.id === mostVotedId);

  const handleRestart = async () => {
    try {
      await restartRoom(room.id, sessionId);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "not-host") toast.error("غير المول يقدر يعاود اللعب");
      else toast.error("ما قدرناش نعاودو اللعب");
      console.error(e);
    }
  };

  return (
    <PageShell className="max-w-xl mx-auto justify-center text-center">
      <h1
        ref={titleRef}
        className="font-display text-6xl mb-6"
        style={{ color: imposterCaught ? "hsl(var(--mint))" : "hsl(var(--destructive))" }}
      >
        {imposterCaught ? "ربحتو 🎉" : "خسرتو 😅"}
      </h1>

      <Card className="w-full p-6 mb-4 shadow-card border-2 border-border/60">
        <p className="text-muted-foreground text-sm mb-2">
          المخبي{imposters.length > 1 ? "ين" : ""} كان
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {imposters.map((p) => (
            <span
              key={p.id}
              className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground font-display text-xl"
            >
              {p.name}
            </span>
          ))}
        </div>
        <div className="h-px bg-border my-4" />
        <p className="text-muted-foreground text-sm mb-2">الكلمة كانت</p>
        <p className="font-display text-3xl text-primary">{room.word}</p>
      </Card>

      {mostVoted && (
        <Card className="w-full p-4 mb-8 bg-muted/40 border-border/40">
          <p className="text-sm text-muted-foreground">
            صوّتو أكثر على:{" "}
            <span className="font-display text-lg text-foreground">{mostVoted.name}</span>
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
        {isHost ? (
          <Button variant="hero" size="hero" onClick={handleRestart}>
            عاود اللعب
          </Button>
        ) : (
          <p className="text-muted-foreground">تسنا المول باش يعاود</p>
        )}
        <Button variant="outline" onClick={() => navigate("/")}>الرئيسية</Button>
      </div>
    </PageShell>
  );
};

export default RoomResult;
