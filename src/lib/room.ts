import { supabase } from "@/integrations/supabase/client";
import { pickRandomWord } from "@/lib/words";

export type RoomStatus = "lobby" | "revealing" | "playing" | "voting" | "ended";

export type Room = {
  id: string;
  code: string;
  host_session_id: string;
  status: RoomStatus;
  word: string;
  imposter_count: number;
  duration_sec: number;
  current_reveal_index: number;
  game_started_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RoomPlayer = {
  id: string;
  room_id: string;
  session_id: string;
  name: string;
  is_imposter: boolean;
  has_seen_role: boolean;
  vote_target_id: string | null;
  joined_at: string;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const generateRoomCode = (len = 5) =>
  Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

export const createRoom = async (hostSessionId: string): Promise<Room> => {
  // Try a few times in case of code collision
  for (let i = 0; i < 5; i++) {
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ code, host_session_id: hostSessionId })
      .select()
      .single();
    if (!error && data) return data as Room;
    if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
      throw error;
    }
  }
  throw new Error("Failed to generate a unique room code");
};

export const fetchRoomByCode = async (code: string): Promise<Room | null> => {
  const { data } = await supabase.from("rooms").select("*").eq("code", code.toUpperCase()).maybeSingle();
  return (data as Room) ?? null;
};

export const fetchRoomPlayers = async (roomId: string): Promise<RoomPlayer[]> => {
  const { data, error } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RoomPlayer[];
};

export const joinRoom = async (
  roomId: string,
  sessionId: string,
  name: string,
): Promise<RoomPlayer> => {
  const { data, error } = await supabase
    .from("room_players")
    .upsert(
      { room_id: roomId, session_id: sessionId, name: name.trim() },
      { onConflict: "room_id,session_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as RoomPlayer;
};

export const leaveRoom = async (roomId: string, sessionId: string) => {
  await supabase.from("room_players").delete().eq("room_id", roomId).eq("session_id", sessionId);
};

export const updateRoom = async (roomId: string, patch: Partial<Room>) => {
  const { error } = await supabase.from("rooms").update(patch).eq("id", roomId);
  if (error) throw error;
};

const assertHost = async (roomId: string, hostSessionId: string): Promise<Room> => {
  const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("room-not-found");

  const room = data as Room;
  if (room.host_session_id !== hostSessionId) {
    throw new Error("not-host");
  }

  return room;
};

export const startRoomGame = async (
  roomId: string,
  hostSessionId: string,
  imposterCount: number,
  durationSec: number,
) => {
  const room = await assertHost(roomId, hostSessionId);
  if (room.status !== "lobby") throw new Error("invalid-state");

  const players = await fetchRoomPlayers(roomId);
  if (players.length < 4) throw new Error("min-players");

  const boundedImposterCount = Math.min(Math.max(1, imposterCount), players.length - 1);
  const boundedDurationSec = Math.min(600, Math.max(60, durationSec));

  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const imposterIds = new Set(
    shuffled.slice(0, boundedImposterCount).map((p) => p.id),
  );

  // Reset all player flags + assign roles
  await Promise.all(
    players.map((p) =>
      supabase
        .from("room_players")
        .update({
          is_imposter: imposterIds.has(p.id),
          has_seen_role: false,
          vote_target_id: null,
        })
        .eq("id", p.id),
    ),
  );

  await updateRoom(roomId, {
    status: "revealing",
    word: pickRandomWord(),
    imposter_count: boundedImposterCount,
    duration_sec: boundedDurationSec,
    current_reveal_index: 0,
    game_started_at: null,
  });
};

export const markRoleSeen = async (playerId: string) => {
  await supabase.from("room_players").update({ has_seen_role: true }).eq("id", playerId);
};

export const startTimer = async (roomId: string, hostSessionId: string) => {
  const room = await assertHost(roomId, hostSessionId);
  if (room.status !== "revealing") throw new Error("invalid-state");

  const players = await fetchRoomPlayers(roomId);
  if (players.length === 0 || players.some((p) => !p.has_seen_role)) {
    throw new Error("roles-not-seen");
  }

  await updateRoom(roomId, { status: "playing", game_started_at: new Date().toISOString() });
};

export const goToVoting = async (roomId: string, hostSessionId: string) => {
  const room = await assertHost(roomId, hostSessionId);
  if (room.status !== "playing") throw new Error("invalid-state");

  await updateRoom(roomId, { status: "voting" });
};

export const castRoomVote = async (playerId: string, targetId: string) => {
  await supabase.from("room_players").update({ vote_target_id: targetId }).eq("id", playerId);
};

export const endRoom = async (roomId: string, hostSessionId: string) => {
  const room = await assertHost(roomId, hostSessionId);
  if (room.status !== "voting") throw new Error("invalid-state");

  await updateRoom(roomId, { status: "ended" });
};

export const restartRoom = async (roomId: string, hostSessionId: string) => {
  await assertHost(roomId, hostSessionId);

  // Move back to lobby and clear flags
  const players = await fetchRoomPlayers(roomId);
  await Promise.all(
    players.map((p) =>
      supabase
        .from("room_players")
        .update({ is_imposter: false, has_seen_role: false, vote_target_id: null })
        .eq("id", p.id),
    ),
  );
  await updateRoom(roomId, {
    status: "lobby",
    word: "",
    current_reveal_index: 0,
    game_started_at: null,
  });
};

// Subscribe to room + players changes; returns an unsubscribe function.
export const subscribeRoom = (
  roomId: string,
  onChange: () => void,
): (() => void) => {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
      onChange,
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
};
