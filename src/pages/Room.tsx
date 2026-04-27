import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Copy, Check, Crown, X, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageShell from "@/components/PageShell";
import { useRoom } from "@/hooks/useRoom";
import { getSessionId } from "@/lib/session";
import { joinRoom, leaveRoom, startRoomGame, updateRoom } from "@/lib/room";
import { toast } from "sonner";

const MIN_PLAYERS = 4;

const Room = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const sessionId = getSessionId();
  const { room, players, loading, error } = useRoom(code);

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const link = `${window.location.origin}/room/${code?.toUpperCase()}`;
  const me = useMemo(() => players.find((p) => p.session_id === sessionId), [players, sessionId]);
  const isHost = room?.host_session_id === sessionId;

  // Auto-route on status change
  useEffect(() => {
    if (!room || !code) return;
    const path = `/room/${code.toUpperCase()}`;
    if (room.status === "revealing") navigate(`${path}/reveal`);
    else if (room.status === "playing") navigate(`${path}/game`);
    else if (room.status === "voting") navigate(`${path}/vote`);
    else if (room.status === "ended") navigate(`${path}/result`);
  }, [room?.status, code, navigate, room]);

  const handleJoin = async () => {
    if (!room) return;
    if (!name.trim()) {
      toast.error("كتب سميتك");
      return;
    }
    if (players.some((p) => p.name.toLowerCase() === name.trim().toLowerCase() && p.session_id !== sessionId)) {
      toast.error("هاد السمية مستعملة، بدلها");
      return;
    }
    setSubmitting(true);
    try {
      await joinRoom(room.id, sessionId, name);
    } catch (e) {
      toast.error("ما قدرناش ندخلوك");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("تنسخ الرابط");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKick = async (playerId: string) => {
    const target = players.find((p) => p.id === playerId);
    if (!target) return;
    await leaveRoom(room!.id, target.session_id);
    toast.success("طرد اللاعب");
  };

  const handleLeave = async () => {
    if (room && me) await leaveRoom(room.id, sessionId);
    navigate("/");
  };

  const handleStart = async () => {
    if (!room) return;
    if (!isHost) {
      toast.error("غير المول يقدر يبدا اللعب");
      return;
    }
    if (players.length < MIN_PLAYERS) {
      toast.error(`خاصكم على الأقل ${MIN_PLAYERS} لاعبين`);
      return;
    }
    try {
      await startRoomGame(room.id, sessionId, room.imposter_count, room.duration_sec);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "min-players") toast.error(`خاصكم على الأقل ${MIN_PLAYERS} لاعبين`);
      else if (msg === "not-host") toast.error("غير المول يقدر يبدا اللعب");
      else toast.error("ما قدرناش نبداو");
      console.error(e);
    }
  };

  const adjustImposters = async (delta: number) => {
    if (!room) return;
    if (!isHost) return;
    const max = Math.max(1, players.length - 1);
    const next = Math.min(max, Math.max(1, room.imposter_count + delta));
    try {
      await updateRoom(room.id, { imposter_count: next });
    } catch (e) {
      toast.error("ما قدرناش نبدلو عدد المخبيين");
      console.error(e);
    }
  };

  const adjustDuration = async (delta: number) => {
    if (!room) return;
    if (!isHost) return;
    const next = Math.min(600, Math.max(60, room.duration_sec + delta));
    try {
      await updateRoom(room.id, { duration_sec: next });
    } catch (e) {
      toast.error("ما قدرناش نبدلو الوقت");
      console.error(e);
    }
  };

  if (loading) {
    return <PageShell className="justify-center"><p className="text-muted-foreground">كنحملو الروم...</p></PageShell>;
  }

  if (error || !room) {
    return (
      <PageShell className="justify-center text-center max-w-md mx-auto">
        <h1 className="font-display text-3xl text-destructive mb-3">الروم ماكاينش</h1>
        <p className="text-muted-foreground mb-6">الكود ديال الروم غالط ولا الروم تسدّت</p>
        <Button variant="hero" size="hero" onClick={() => navigate("/")}>الرئيسية</Button>
      </PageShell>
    );
  }

  // Step 1: not joined yet → ask for name
  if (!me) {
    return (
      <PageShell className="max-w-md mx-auto justify-center">
        <header className="w-full flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>رجع</Button>
          <h1 className="font-display text-2xl text-primary">روم {room.code}</h1>
          <div className="w-12" />
        </header>

        <Card className="w-full p-6 shadow-card border-2 border-border/60">
          <p className="text-center font-display text-2xl text-primary mb-2">كتب سميتك</p>
          <p className="text-center text-sm text-muted-foreground mb-5">
            باش يعرفوك الباقي ديال اللاعبين
          </p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="السمية ديالك"
            className="text-right text-lg mb-4"
            maxLength={20}
            autoFocus
          />
          <Button
            variant="hero"
            size="hero"
            onClick={handleJoin}
            disabled={submitting || !name.trim()}
            className="w-full"
          >
            دخل
          </Button>
        </Card>

        {players.length > 0 && (
          <div className="mt-6 w-full">
            <p className="text-sm text-muted-foreground text-center mb-2">
              {players.length} لاعب فالروم
            </p>
          </div>
        )}
      </PageShell>
    );
  }

  // Step 2: joined → lobby
  return (
    <PageShell className="max-w-xl mx-auto">
      <header className="w-full flex items-center justify-between mb-5">
        <Button variant="ghost" size="sm" onClick={handleLeave}>خرج</Button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">روم</p>
          <h1 className="font-display text-3xl text-primary tracking-[0.3em]">{room.code}</h1>
        </div>
        <div className="w-12" />
      </header>

      <Card className="w-full p-3 mb-5 bg-muted/40 border-border/60">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs text-foreground/70 truncate text-left" dir="ltr">
            {link}
          </span>
          <Button onClick={handleCopy} variant="accent" size="icon" aria-label="نسخ">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </Card>

      <Card className="w-full p-5 mb-5 shadow-card border-2 border-border/60">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-secondary">اللاعبين ({players.length})</h2>
          <span className="text-xs text-muted-foreground">على الأقل {MIN_PLAYERS}</span>
        </div>
        <ul className="flex flex-col gap-2">
          {players.map((p) => {
            const playerIsHost = p.session_id === room.host_session_id;
            const isMe = p.session_id === sessionId;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between bg-muted/60 rounded-lg px-3 py-2 animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <span className="size-8 grid place-items-center rounded-full bg-gradient-sunset text-primary-foreground text-sm font-bold">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium">{p.name}</span>
                  {isMe && <span className="text-xs text-muted-foreground">(أنت)</span>}
                  {playerIsHost && <Crown className="size-4 text-accent" />}
                </div>
                {isHost && !playerIsHost && (
                  <button
                    onClick={() => handleKick(p.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="طرد"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {isHost ? (
        <>
          <Card className="w-full p-4 mb-3 shadow-card border-2 border-border/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-secondary">
                <Eye className="size-5" />
                <span className="font-display text-lg">عدد المخبيين</span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => adjustImposters(-1)}>−</Button>
                <span className="text-2xl font-display text-primary w-8 text-center">
                  {room.imposter_count}
                </span>
                <Button variant="outline" size="icon" onClick={() => adjustImposters(1)}>+</Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-secondary">
                <Clock className="size-5" />
                <span className="font-display text-lg">الوقت</span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => adjustDuration(-60)}>−</Button>
                <span className="text-2xl font-display text-primary w-16 text-center">
                  {Math.round(room.duration_sec / 60)} د
                </span>
                <Button variant="outline" size="icon" onClick={() => adjustDuration(60)}>+</Button>
              </div>
            </div>
          </Card>

          <p className="text-center text-sm text-muted-foreground mb-3">
            تسنا حتى يدخلو صحابك
          </p>
          <Button
            variant="hero"
            size="hero"
            className="w-full"
            disabled={players.length < MIN_PLAYERS}
            onClick={handleStart}
          >
            بدا اللعب
          </Button>
          {players.length < MIN_PLAYERS && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              باقي {MIN_PLAYERS - players.length} لاعب باش تبدا
            </p>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <div className="inline-block size-3 bg-accent rounded-full animate-pulse mb-3" />
          <p className="font-display text-xl text-foreground mb-1">
            تسنا حتى يبدا المول ديال الروم
          </p>
          <p className="text-sm text-muted-foreground">
            اللعبة غادي تبدا أوتوماتيكي
          </p>
        </div>
      )}
    </PageShell>
  );
};

export default Room;
