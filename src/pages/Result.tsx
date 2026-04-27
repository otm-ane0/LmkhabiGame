import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGame } from "@/context/GameContext";
import PageShell from "@/components/PageShell";

const Result = () => {
  const navigate = useNavigate();
  const { players, word, getResult, resetGame } = useGame();
  const { mostVotedId, imposterCaught, imposters } = getResult();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { scale: 0.5, opacity: 0, rotation: -5 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.9, ease: "back.out(1.7)" },
      );
    }
  }, []);

  const mostVoted = players.find((p) => p.id === mostVotedId);

  const playAgain = () => {
    resetGame();
    navigate("/setup");
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
        <p className="text-muted-foreground text-sm mb-2">المخبي{imposters.length > 1 ? "ين" : ""} كان</p>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {imposters.map((p) => (
            <span key={p.id} className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground font-display text-xl">
              {p.name}
            </span>
          ))}
        </div>
        <div className="h-px bg-border my-4" />
        <p className="text-muted-foreground text-sm mb-2">الكلمة كانت</p>
        <p className="font-display text-3xl text-primary">{word}</p>
      </Card>

      {mostVoted && (
        <Card className="w-full p-4 mb-8 bg-muted/40 border-border/40">
          <p className="text-sm text-muted-foreground">
            صوّتو أكثر على: <span className="font-display text-lg text-foreground">{mostVoted.name}</span>
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button variant="hero" size="hero" onClick={playAgain}>عاود اللعب</Button>
        <Button variant="outline" onClick={() => { resetGame(); navigate("/"); }}>الرئيسية</Button>
      </div>
    </PageShell>
  );
};

export default Result;
