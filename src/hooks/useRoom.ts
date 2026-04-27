import { useEffect, useState, useCallback, useRef } from "react";
import { fetchRoomByCode, fetchRoomPlayers, subscribeRoom, Room, RoomPlayer } from "@/lib/room";

export const useRoom = (code: string | undefined) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const reload = useCallback(async (roomId?: string) => {
    if (!code) return;
    const seq = ++requestSeq.current;

    try {
      const r = roomId ? null : await fetchRoomByCode(code);
      const targetId = roomId ?? r?.id;

      if (!targetId) {
        if (seq !== requestSeq.current) return;
        setRoom(null);
        setPlayers([]);
        setError("not-found");
        return;
      }

      const [latestRoom, list] = await Promise.all([
        roomId ? fetchRoomByCode(code) : Promise.resolve(r),
        fetchRoomPlayers(targetId),
      ]);

      if (seq !== requestSeq.current) return;

      if (!latestRoom) {
        setRoom(null);
        setPlayers([]);
        setError("not-found");
        return;
      }

      setRoom(latestRoom);
      setPlayers(list);
      setError(null);
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setError((e as Error).message);
    }
  }, [code]);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }

    let unsub: (() => void) | null = null;
    let pollId: number | null = null;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const seq = ++requestSeq.current;

      try {
        const r = await fetchRoomByCode(code);
        if (cancelled || seq !== requestSeq.current) return;

        if (!r) {
          setRoom(null);
          setPlayers([]);
          setError("not-found");
          setLoading(false);
          return;
        }

        const list = await fetchRoomPlayers(r.id);
        if (cancelled || seq !== requestSeq.current) return;

        setRoom(r);
        setPlayers(list);
        setError(null);
        setLoading(false);
        unsub = subscribeRoom(r.id, () => {
          void reload(r.id);
        });
        // Fallback polling keeps clients synced when a websocket event is missed.
        pollId = window.setInterval(() => {
          void reload(r.id);
        }, 2000);
      } catch (e) {
        if (cancelled || seq !== requestSeq.current) return;
        setError((e as Error).message);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      requestSeq.current += 1;
      if (unsub) unsub();
      if (pollId !== null) window.clearInterval(pollId);
    };
  }, [code, reload]);

  return { room, players, loading, error, reload };
};
