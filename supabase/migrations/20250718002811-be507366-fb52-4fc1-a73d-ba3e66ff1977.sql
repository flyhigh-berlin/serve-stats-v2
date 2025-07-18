-- Enable real-time for tables
ALTER TABLE public.players REPLICA IDENTITY FULL;
ALTER TABLE public.game_days REPLICA IDENTITY FULL;
ALTER TABLE public.serves REPLICA IDENTITY FULL;
ALTER TABLE public.custom_game_types REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_days;
ALTER PUBLICATION supabase_realtime ADD TABLE public.serves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_game_types;