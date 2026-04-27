import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Users, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useGame } from "@/context/GameContext";
import PageShell from "@/components/PageShell";
import { toast } from "sonner";

const Setup = () => {
  const navigate = useNavigate();
  const { players, addPlayer, removePlayer, imposterCount, setImposterCount, durationSec, setDurationSec, startGame } = useGame();
  const [name, setName] = useState("");

  const minutes = Math.round(durationSec / 60);
  const maxImposters = Math.max(1, players.length - 1);

  const handleAdd = () => {
    if (!name.trim()) return;
    addPlayer(name);
    setName("");
  };

  const handleStart = () => {
    if (players.length < 3) {
      toast.error("خاصك على الأقل 3 لاعبين");
      return;
    }
    if (imposterCount >= players.length) {
      toast.error("بزاف ديال المخبيين");
      return;
    }
    startGame();
    navigate("/reveal");
  };

  return (
    <PageShell className="max-w-xl mx-auto">
      <header className="w-full flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>رجع</Button>
        <h1 className="font-display text-3xl text-primary">الإعدادات</h1>
        <div className="w-12" />
      </header>

      <Card className="w-full p-5 mb-5 shadow-card border-2 border-border/60">
        <div className="flex items-center gap-2 mb-3 text-secondary">
          <Users className="size-5" />
          <h2 className="font-display text-xl">اللاعبين ({players.length})</h2>
        </div>
        <div className="flex gap-2 mb-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="زيد سميّة"
            className="text-right"
          />
          <Button onClick={handleAdd} variant="accent" size="icon">
            <Plus className="size-5" />
          </Button>
        </div>
        <ul className="flex flex-col gap-2">
          {players.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center justify-between bg-muted/60 rounded-lg px-3 py-2 animate-fade-in"
            >
              <div className="flex items-center gap-3">
                <span className="size-7 grid place-items-center rounded-full bg-gradient-sunset text-primary-foreground text-sm font-bold">
                  {i + 1}
                </span>
                <span className="font-medium">{p.name}</span>
              </div>
              <button
                onClick={() => removePlayer(p.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="size-5" />
              </button>
            </li>
          ))}
          {players.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">زيد اللاعبين باش تبدا</p>
          )}
        </ul>
      </Card>

      <Card className="w-full p-5 mb-5 shadow-card border-2 border-border/60">
        <div className="flex items-center gap-2 mb-3 text-secondary">
          <Eye className="size-5" />
          <h2 className="font-display text-xl">عدد المخبيين</h2>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setImposterCount(Math.max(1, imposterCount - 1))}
          >−</Button>
          <span className="text-3xl font-display text-primary w-12 text-center">{imposterCount}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setImposterCount(Math.min(maxImposters, imposterCount + 1))}
          >+</Button>
        </div>
      </Card>

      <Card className="w-full p-5 mb-6 shadow-card border-2 border-border/60">
        <div className="flex items-center gap-2 mb-3 text-secondary">
          <Clock className="size-5" />
          <h2 className="font-display text-xl">مدة اللعبة</h2>
        </div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDurationSec(Math.max(60, durationSec - 60))}
          >−</Button>
          <span className="text-3xl font-display text-primary w-24 text-center">
            {minutes} <span className="text-base">دقيقة</span>
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDurationSec(Math.min(600, durationSec + 60))}
          >+</Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">من 1 إلى 10 دقائق</p>
      </Card>

      <Button variant="hero" size="hero" onClick={handleStart} className="w-full">
        كمل
      </Button>
    </PageShell>
  );
};

export default Setup;
