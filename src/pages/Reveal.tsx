import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { useGame } from "@/context/GameContext";
import PageShell from "@/components/PageShell";
import { Eye, EyeOff } from "lucide-react";

type Stage = "intro" | "revealed" | "pass";

const REVEAL_SECONDS = 3;

const Reveal = () => {
  const navigate = useNavigate();
  const { players, currentRevealIndex, nextReveal, markRoleSeen, word } = useGame();

  const [stage, setStage] = useState<Stage>("intro");
  const [countdown, setCountdown] = useState(REVEAL_SECONDS);

  const cardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const player = players[currentRevealIndex];
  const isLast = currentRevealIndex >= players.length - 1;
  const isFirst = currentRevealIndex === 0;

  // Guard: no players → back to setup
  useEffect(() => {
    if (players.length === 0) navigate("/setup");
  }, [players.length, navigate]);

  // Reset stage + card orientation whenever the player changes
  useEffect(() => {
    setStage("intro");
    setCountdown(REVEAL_SECONDS);
    if (cardRef.current) {
      gsap.set(cardRef.current, { rotationY: 0 });
      gsap.fromTo(
        cardRef.current,
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.4)" },
      );
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [currentRevealIndex]);

  const flipBack = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotationY: 0,
      duration: 0.7,
      ease: "power2.inOut",
      onComplete: () => setStage("pass"),
    });
  };

  const handleReveal = () => {
    if (!cardRef.current || stage !== "intro") return;
    if (player) markRoleSeen(player.id);

    gsap.to(cardRef.current, {
      rotationY: 180,
      duration: 0.7,
      ease: "power2.inOut",
      onComplete: () => {
        setStage("revealed");
        setCountdown(REVEAL_SECONDS);

        // Countdown indicator
        intervalRef.current = window.setInterval(() => {
          setCountdown((c) => (c > 0 ? c - 1 : 0));
        }, 1000);

        // Auto flip back after 3s
        timerRef.current = window.setTimeout(() => {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          flipBack();
        }, REVEAL_SECONDS * 1000);
      },
    });
  };

  const handleNext = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      opacity: 0,
      scale: 0.85,
      duration: 0.3,
      onComplete: () => {
        if (isLast) navigate("/game");
        else nextReveal();
      },
    });
  };

  if (!player) return null;

  return (
    <PageShell className="max-w-xl mx-auto justify-center">
      <p className="text-muted-foreground mb-2">
        لاعب {currentRevealIndex + 1} من {players.length}
      </p>
      <h1 className="font-display text-4xl text-primary mb-3 text-center">{player.name}</h1>

      {/* Stage prompt */}
      <p className="text-center text-base text-foreground/80 mb-6 min-h-[1.5rem]">
        {stage === "intro" && (isFirst ? "كليكي باش تشوف الدور ديالك" : "نوبتك، قلب باش تشوف الدور ديالك")}
        {stage === "revealed" && `باقي ${countdown}...`}
        {stage === "pass" && "دوز التليفون للي من بعد"}
      </p>

      <div className="[perspective:1000px] w-full max-w-sm aspect-[3/4] mb-8">
        <div
          ref={cardRef}
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Back of card (hidden state) */}
          <div
            className="absolute inset-0 rounded-3xl bg-gradient-tile shadow-card border-4 border-accent/40 flex flex-col items-center justify-center p-8 moroccan-pattern"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <EyeOff className="size-20 text-primary-foreground/90 mb-4" />
            <p className="text-primary-foreground font-display text-2xl text-center">
              الدور مخبي
            </p>
            <p className="text-primary-foreground/70 text-sm mt-2 text-center">
              سيفط التليفون فالواحد
            </p>
          </div>

          {/* Front of card (revealed state) */}
          <div
            className="absolute inset-0 rounded-3xl shadow-card border-4 flex flex-col items-center justify-center p-8 text-center"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              backgroundColor: player.isImposter ? "hsl(var(--secondary))" : "hsl(var(--card))",
              borderColor: player.isImposter ? "hsl(var(--accent))" : "hsl(var(--primary) / 0.3)",
            }}
          >
            {player.isImposter ? (
              <>
                <Eye className="size-16 text-accent mb-4" />
                <p className="text-secondary-foreground/80 text-sm mb-2">أنت...</p>
                <h2 className="font-display text-5xl text-accent mb-3">المخبي</h2>
                <p className="text-secondary-foreground font-display text-2xl">راك المخبي</p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-sm mb-2">الكلمة هي</p>
                <h2 className="font-display text-5xl text-primary mb-4">{word}</h2>
                <div className="h-px w-16 bg-border my-2" />
                <p className="text-muted-foreground text-xs mt-2">حفظها فراسك ولا تقولها</p>
              </>
            )}

            {/* Countdown ring indicator */}
            {stage === "revealed" && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {Array.from({ length: REVEAL_SECONDS }).map((_, i) => (
                  <span
                    key={i}
                    className="block w-2.5 h-2.5 rounded-full transition-colors"
                    style={{
                      backgroundColor:
                        i < countdown ? "hsl(var(--accent))" : "hsl(var(--muted-foreground) / 0.3)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {stage === "intro" && (
        <Button variant="hero" size="hero" onClick={handleReveal} className="w-full max-w-sm">
          شوف الدور
        </Button>
      )}

      {stage === "revealed" && (
        <Button variant="outline" size="hero" disabled className="w-full max-w-sm">
          باقي {countdown}...
        </Button>
      )}

      {stage === "pass" && (
        <Button variant="hero" size="hero" onClick={handleNext} className="w-full max-w-sm">
          {isLast ? "بدا اللعبة" : "واجد؟"}
        </Button>
      )}
    </PageShell>
  );
};

export default Reveal;
