
-- Enable REPLICA IDENTITY FULL for all tables to capture complete row data for real-time events
ALTER TABLE public.players REPLICA IDENTITY FULL;
ALTER TABLE public.game_days REPLICA IDENTITY FULL;
ALTER TABLE public.serves REPLICA IDENTITY FULL;
ALTER TABLE public.custom_game_types REPLICA IDENTITY FULL;

-- Add tables to realtime publication (if not already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_days;
ALTER PUBLICATION supabase_realtime ADD TABLE public.serves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_game_types;
