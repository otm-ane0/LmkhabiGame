-- Rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_session_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  word TEXT NOT NULL DEFAULT '',
  imposter_count INT NOT NULL DEFAULT 1,
  duration_sec INT NOT NULL DEFAULT 300,
  current_reveal_index INT NOT NULL DEFAULT 0,
  game_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Room players table
CREATE TABLE public.room_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_imposter BOOLEAN NOT NULL DEFAULT false,
  has_seen_role BOOLEAN NOT NULL DEFAULT false,
  vote_target_id UUID,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, session_id)
);

CREATE INDEX idx_room_players_room ON public.room_players(room_id);
CREATE INDEX idx_rooms_code ON public.rooms(code);

-- RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

-- Permissive policies for an anonymous party game
CREATE POLICY "anyone can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update rooms" ON public.rooms FOR UPDATE USING (true);
CREATE POLICY "anyone can delete rooms" ON public.rooms FOR DELETE USING (true);

CREATE POLICY "anyone can view players" ON public.room_players FOR SELECT USING (true);
CREATE POLICY "anyone can join as player" ON public.room_players FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update players" ON public.room_players FOR UPDATE USING (true);
CREATE POLICY "anyone can leave" ON public.room_players FOR DELETE USING (true);

-- updated_at trigger for rooms
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;