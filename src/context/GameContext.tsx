import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { pickRandomWord } from "@/lib/words";

export type Player = {
  id: string;
  name: string;
  isImposter: boolean;
  hasSeenRole: boolean;
  vote?: string; // id of voted player
};

type GameState = {
  players: Player[];
  imposterCount: number;
  durationSec: number; // game duration in seconds
  word: string;
  currentRevealIndex: number;
};

type GameContextType = GameState & {
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  setImposterCount: (n: number) => void;
  setDurationSec: (s: number) => void;
  startGame: () => void;
  markRoleSeen: (id: string) => void;
  nextReveal: () => void;
  resetReveal: () => void;
  castVote: (voterId: string, targetId: string) => void;
  resetGame: () => void;
  getResult: () => { mostVotedId: string | null; imposterCaught: boolean; imposters: Player[] };
};

const GameContext = createContext<GameContextType | undefined>(undefined);

const uid = () => Math.random().toString(36).slice(2, 9);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [imposterCount, setImposterCount] = useState(1);
  const [durationSec, setDurationSec] = useState(300); // 5 min default
  const [word, setWord] = useState("");
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);

  const addPlayer = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPlayers((p) => [...p, { id: uid(), name: trimmed, isImposter: false, hasSeenRole: false }]);
  }, []);

  const removePlayer = useCallback((id: string) => {
    setPlayers((p) => p.filter((x) => x.id !== id));
  }, []);

  const startGame = useCallback(() => {
    const newWord = pickRandomWord();
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const imposterIds = new Set(shuffled.slice(0, Math.min(imposterCount, players.length - 1)).map((p) => p.id));
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        isImposter: imposterIds.has(p.id),
        hasSeenRole: false,
        vote: undefined,
      })),
    );
    setWord(newWord);
    setCurrentRevealIndex(0);
  }, [players, imposterCount]);

  const markRoleSeen = useCallback((id: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, hasSeenRole: true } : p)));
  }, []);

  const nextReveal = useCallback(() => {
    setCurrentRevealIndex((i) => i + 1);
  }, []);

  const resetReveal = useCallback(() => setCurrentRevealIndex(0), []);

  const castVote = useCallback((voterId: string, targetId: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === voterId ? { ...p, vote: targetId } : p)));
  }, []);

  const resetGame = useCallback(() => {
    setPlayers((prev) => prev.map((p) => ({ ...p, isImposter: false, hasSeenRole: false, vote: undefined })));
    setWord("");
    setCurrentRevealIndex(0);
  }, []);

  const getResult = useCallback(() => {
    const tally = new Map<string, number>();
    players.forEach((p) => {
      if (p.vote) tally.set(p.vote, (tally.get(p.vote) || 0) + 1);
    });
    let mostVotedId: string | null = null;
    let max = 0;
    tally.forEach((v, k) => {
      if (v > max) {
        max = v;
        mostVotedId = k;
      }
    });
    const imposters = players.filter((p) => p.isImposter);
    const imposterCaught = mostVotedId ? imposters.some((p) => p.id === mostVotedId) : false;
    return { mostVotedId, imposterCaught, imposters };
  }, [players]);

  const value = useMemo<GameContextType>(
    () => ({
      players,
      imposterCount,
      durationSec,
      word,
      currentRevealIndex,
      addPlayer,
      removePlayer,
      setImposterCount,
      setDurationSec,
      startGame,
      markRoleSeen,
      nextReveal,
      resetReveal,
      castVote,
      resetGame,
      getResult,
    }),
    [players, imposterCount, durationSec, word, currentRevealIndex, addPlayer, removePlayer, startGame, markRoleSeen, nextReveal, resetReveal, castVote, resetGame, getResult],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
};
