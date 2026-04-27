import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/PageShell";

const TimeEnd = () => {
  const navigate = useNavigate();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.6)" },
      );
    }
  }, []);

  return (
    <PageShell className="justify-center text-center max-w-xl mx-auto">
      <div className="size-32 rounded-full bg-destructive/10 grid place-items-center mb-8">
        <span className="text-6xl">⏰</span>
      </div>
      <h1 ref={titleRef} className="font-display text-5xl sm:text-6xl text-destructive mb-6">
        سالا الوقت!
      </h1>
      <p className="text-xl text-foreground/80 mb-2">دابا خاصكم تشكّو فشي واحد</p>
      <p className="text-sm text-muted-foreground mb-12">شكون كيبان عليه أنه المخبي؟</p>

      <Button variant="hero" size="hero" onClick={() => navigate("/vote")} className="w-full max-w-sm">
        صوّت
      </Button>
    </PageShell>
  );
};

export default TimeEnd;
