import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGame } from "@/context/GameContext";
import PageShell from "@/components/PageShell";
import { Check } from "lucide-react";
import { toast } from "sonner";

const Vote = () => {
  const navigate = useNavigate();
  const { players, castVote } = useGame();
  const [voterIndex, setVoterIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const voter = players[voterIndex];
  const isLast = voterIndex >= players.length - 1;

  if (!voter) return null;

  const handleConfirm = () => {
    if (!selected) {
      toast.error("اختار شي واحد");
      return;
    }
    castVote(voter.id, selected);
    setSelected(null);
    if (isLast) navigate("/result");
    else setVoterIndex((i) => i + 1);
  };

  return (
    <PageShell className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <p className="text-muted-foreground text-sm">دور التصويت</p>
        <h1 className="font-display text-4xl text-primary mt-1">{voter.name}</h1>
        <p className="text-foreground/80 mt-2">شكون المخبي؟</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full mb-8">
        {players
          .filter((p) => p.id !== voter.id)
          .map((p) => {
            const isSel = selected === p.id;
            return (
              <Card
                key={p.id}
                onClick={() => setSelected(p.id)}
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

      <Button variant="hero" size="hero" onClick={handleConfirm} className="w-full">
        {isLast ? "شوف النتيجة" : "كمل"}
      </Button>

      <div className="flex gap-1 mt-6">
        {players.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i <= voterIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </PageShell>
  );
};

export default Vote;
