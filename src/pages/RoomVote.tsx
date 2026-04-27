import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageShell from "@/components/PageShell";
import { useRoom } from "@/hooks/useRoom";
import { getSessionId } from "@/lib/session";
import { castRoomVote, endRoom } from "@/lib/room";
import { toast } from "sonner";

const RoomVote = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const sessionId = getSessionId();
  const { room, players } = useRoom(code);

  const me = players.find((p) => p.session_id === sessionId);
  const isHost = room?.host_session_id === sessionId;
  const allVoted = players.length > 0 && players.every((p) => !!p.vote_target_id);
  const votedCount = players.filter((p) => !!p.vote_target_id).length;

  const [submitting, setSubmitting] = useState(false);

  // Auto-route
  useEffect(() => {
    if (!room || !code) return;
    const path = `/room/${code.toUpperCase()}`;
    if (room.status === "ended") navigate(`${path}/result`);
    else if (room.status === "lobby") navigate(path);
  }, [room?.status, code, navigate, room]);

  // When everyone has voted, host moves to ended
  useEffect(() => {
    if (allVoted && isHost && room?.status === "voting") {
      endRoom(room.id, sessionId).catch((e) => {
        console.error(e);
      });
    }
  }, [allVoted, isHost, room?.id, room?.status, sessionId]);

  const handleShowResult = async () => {
    if (!room) return;
    try {
      await endRoom(room.id, sessionId);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "not-host") toast.error("غير المول يقدر يكمل الجولة");
      else toast.error("ما قدرناش نبينو النتيجة");
      console.error(e);
    }
  };

  const handleVote = async (targetId: string) => {
    if (!me) return;
    setSubmitting(true);
    try {
      await castRoomVote(me.id, targetId);
      toast.success("تصوّت");
    } catch {
      toast.error("ما قدرناش نصوّتو");
    } finally {
      setSubmitting(false);
    }
  };

  if (!room || !me) return <PageShell className="justify-center"><p>...</p></PageShell>;

  const myVote = me.vote_target_id;

  return (
    <PageShell className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <p className="text-muted-foreground text-sm">دور التصويت</p>
        <h1 className="font-display text-4xl text-primary mt-1">شكون المخبي؟</h1>
        <p className="text-foreground/80 mt-2">{me.name}، صوّت على واحد</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full mb-6">
        {players
          .filter((p) => p.id !== me.id)
          .map((p) => {
            const isSel = myVote === p.id;
            return (
              <Card
                key={p.id}
                onClick={() => !submitting && handleVote(p.id)}
                className={`p-4 cursor-pointer transition-all border-2 text-center hover:scale-[1.03] ${
                  isSel
                    ? "bg-gradient-sunset text-primary-foreground border-accent shadow-glow"
                    : "border-border/60 hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isSel && <Check className="size-5" />}
                  <span className="font-display text-lg">{p.name}</span>
                </div>
              </Card>
            );
          })}
      </div>

      <div className="text-center mb-3">
        <p className="text-sm text-muted-foreground mb-2">
          {votedCount} / {players.length} لاعبين صوّتو
        </p>
        <div className="h-1.5 w-full max-w-sm mx-auto bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-sunset transition-all duration-500"
            style={{ width: `${(votedCount / players.length) * 100}%` }}
          />
        </div>
      </div>

      {myVote && !allVoted && (
        <p className="text-center text-sm text-muted-foreground">تسنا الباقي يصوّتو...</p>
      )}

      {allVoted && isHost && (
        <Button variant="hero" size="hero" className="w-full mt-4" onClick={handleShowResult}>
          شوف النتيجة
        </Button>
      )}
    </PageShell>
  );
};

export default RoomVote;
