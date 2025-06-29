
-- Fix the log_team_activity function signature to accept text instead of unknown
CREATE OR REPLACE FUNCTION public.log_team_activity(
  team_id_param UUID,
  action_param TEXT,
  details_param JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.team_activity_audit (
    team_id,
    action,
    details,
    performed_by,
    created_at
  ) VALUES (
    team_id_param,
    action_param,
    details_param,
    auth.uid(),
    now()
  );
  
  -- Update team's last activity
  UPDATE public.teams 
  SET last_activity_at = now() 
  WHERE id = team_id_param;
END;
$$;

-- Fix the get_team_analytics function to properly count games and serves
CREATE OR REPLACE FUNCTION public.get_team_analytics(team_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  member_stats RECORD;
  activity_stats RECORD;
  game_stats RECORD;
BEGIN
  -- Check if user is team admin or super admin
  IF NOT (public.is_team_admin(auth.uid(), team_id_param) OR public.is_super_admin()) THEN
    RETURN json_build_object('error', 'Access denied');
  END IF;
  
  -- Get member statistics
  SELECT 
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
    COUNT(*) FILTER (WHERE role = 'member') as member_count,
    COUNT(*) FILTER (WHERE joined_at >= now() - interval '30 days') as new_members_30d
  INTO member_stats
  FROM public.team_members 
  WHERE team_id = team_id_param;
  
  -- Get activity statistics
  SELECT 
    COUNT(*) as total_activities,
    COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days') as activities_7d,
    MAX(created_at) as last_activity
  INTO activity_stats
  FROM public.team_activity_audit 
  WHERE team_id = team_id_param;
  
  -- Get game statistics (fixed to properly count games and serves for this team)
  SELECT 
    COUNT(DISTINCT gd.id) as total_games,
    COUNT(s.id) as total_serves,
    COUNT(s.id) FILTER (WHERE s.type = 'ace') as total_aces,
    COUNT(s.id) FILTER (WHERE s.type = 'fail') as total_fails,
    COUNT(DISTINCT p.id) as total_players
  INTO game_stats
  FROM public.game_days gd
  LEFT JOIN public.serves s ON s.game_id = gd.id AND s.team_id = team_id_param
  LEFT JOIN public.players p ON p.team_id = team_id_param
  WHERE gd.team_id = team_id_param;
  
  -- Build result
  result := json_build_object(
    'members', json_build_object(
      'total', COALESCE(member_stats.total_members, 0),
      'admins', COALESCE(member_stats.admin_count, 0),
      'members', COALESCE(member_stats.member_count, 0),
      'new_30d', COALESCE(member_stats.new_members_30d, 0)
    ),
    'activity', json_build_object(
      'total', COALESCE(activity_stats.total_activities, 0),
      'recent_7d', COALESCE(activity_stats.activities_7d, 0),
      'last_activity', activity_stats.last_activity
    ),
    'games', json_build_object(
      'total_games', COALESCE(game_stats.total_games, 0),
      'total_serves', COALESCE(game_stats.total_serves, 0),
      'total_aces', COALESCE(game_stats.total_aces, 0),
      'total_fails', COALESCE(game_stats.total_fails, 0),
      'total_players', COALESCE(game_stats.total_players, 0)
    )
  );
  
  RETURN result;
END;
$$;

-- Ensure user profiles are created for new users (create trigger if not exists)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;
