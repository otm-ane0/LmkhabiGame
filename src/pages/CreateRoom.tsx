import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Share2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageShell from "@/components/PageShell";
import { createRoom, Room } from "@/lib/room";
import { getSessionId } from "@/lib/session";
import { toast } from "sonner";

const CreateRoom = () => {
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const link = room ? `${window.location.origin}/room/${room.code}` : "";

  const handleCreate = async () => {
    setCreating(true);
    try {
      const r = await createRoom(getSessionId());
      setRoom(r);
    } catch (e) {
      toast.error("ما قدرناش نصايبو الروم");
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("تنسخ الرابط");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("ما قدرناش نسخو");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "المخبي", text: "أجي تلعب معانا!", url: link });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <PageShell className="max-w-xl mx-auto justify-center">
      <header className="w-full flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>رجع</Button>
        <h1 className="font-display text-3xl text-primary">روم جديدة</h1>
        <div className="w-12" />
      </header>

      {!room && (
        <Card className="w-full p-6 shadow-card border-2 border-border/60 text-center">
          <p className="text-muted-foreground mb-5">وجد الرابط باش تصيفطو لصحابك</p>
          <Button
            variant="hero"
            size="hero"
            className="w-full"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? "كنصايبو الروم..." : "صايب روم"}
          </Button>
        </Card>
      )}

      {room && (
        <>
          <Card className="w-full p-6 mb-5 shadow-card border-2 border-border/60 text-center">
            <p className="text-muted-foreground text-sm mb-2">كود الروم</p>
            <p className="font-display text-5xl text-primary tracking-[0.4em] mb-1">
              {room.code}
            </p>
            <p className="text-xs text-muted-foreground mt-3">صيفط هاد الرابط لصحابك</p>

            <div className="mt-5 flex items-center gap-2 bg-muted/60 rounded-lg p-2">
              <span className="flex-1 text-sm text-foreground/80 truncate text-left" dir="ltr">
                {link}
              </span>
              <Button onClick={handleCopy} variant="accent" size="icon" aria-label="نسخ">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>

            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full mt-3 gap-2"
            >
              <Share2 className="size-4" />
              شير الرابط
            </Button>
          </Card>

          <Button
            variant="hero"
            size="hero"
            className="w-full gap-2"
            onClick={() => navigate(`/room/${room.code}`)}
          >
            دخل للروم <ArrowRight className="size-5" />
          </Button>
        </>
      )}
    </PageShell>
  );
};

export default CreateRoom;
