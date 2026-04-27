import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/PageShell";
import homeMusic from "@/audio/زط مط فط فقولك راك مزروط (feat. Majid L'infinitiy).mp3";

const Home = () => {
  const navigate = useNavigate();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const starRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMusicOn, setIsMusicOn] = useState(false);

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { scale: 0.7, opacity: 0, rotation: -8 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.9, ease: "back.out(1.7)" },
      );
    }
    if (starRef.current) {
      gsap.to(starRef.current, { rotation: 360, duration: 40, repeat: -1, ease: "none" });
    }

    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    void audio.play().then(() => {
      setIsMusicOn(true);
    }).catch(() => {
      // Browsers can block autoplay with sound until user interaction.
      setIsMusicOn(false);
    });
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsMusicOn(true);
      } catch {
        setIsMusicOn(false);
      }
      return;
    }

    audio.pause();
    setIsMusicOn(false);
  };

  return (
    <PageShell className="justify-center text-center relative overflow-hidden">
      <audio ref={audioRef} src={homeMusic} loop preload="auto" />

      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMusic}
        className="absolute top-4 left-4 z-20"
      >
        {isMusicOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
      </Button>

      <div
        ref={starRef}
        className="absolute -top-32 -left-32 w-[28rem] h-[28rem] opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><g fill='none' stroke='%23c2410c' stroke-width='1.5'><path d='M100 10 L190 100 L100 190 L10 100 Z'/><path d='M100 30 L170 100 L100 170 L30 100 Z'/><circle cx='100' cy='100' r='40'/><path d='M100 60 L140 100 L100 140 L60 100 Z'/></g></svg>\")",
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[32rem] h-[32rem] opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><g fill='none' stroke='%231e40af' stroke-width='1.5'><path d='M100 10 L190 100 L100 190 L10 100 Z'/><circle cx='100' cy='100' r='60'/><circle cx='100' cy='100' r='30'/></g></svg>\")",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 my-auto">
        <p className="text-accent font-display text-xl tracking-widest">لعبة مغربية</p>
        <h1
          ref={titleRef}
          className="font-display text-7xl sm:text-8xl text-primary text-shadow-soft leading-none"
        >
          المخبي
        </h1>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="h-px w-12 bg-border" />
          <span className="text-sm">شكون فيكم المخبي؟</span>
          <span className="h-px w-12 bg-border" />
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs mt-6">
          <Button
            variant="hero"
            size="hero"
            onClick={() => navigate("/create-room")}
            className="w-full"
          >
            صايب روم
          </Button>
          <Button
            variant="outline"
            size="hero"
            onClick={() => navigate("/setup")}
            className="w-full"
          >
            لعب فتليفون واحد
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-10">صنع بحب 🇲🇦</p>
      </div>
    </PageShell>
  );
};

export default Home;
