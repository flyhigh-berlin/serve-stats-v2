
-- Add missing columns to teams table (skip if they already exist)
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create comprehensive activity audit function
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

-- Function to get team analytics
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
  
  -- Get game statistics
  SELECT 
    COUNT(DISTINCT gd.id) as total_games,
    COUNT(s.id) as total_serves,
    COUNT(s.id) FILTER (WHERE s.type = 'ace') as total_aces,
    COUNT(s.id) FILTER (WHERE s.type = 'fail') as total_fails,
    COUNT(DISTINCT p.id) as total_players
  INTO game_stats
  FROM public.game_days gd
  LEFT JOIN public.serves s ON s.game_id = gd.id
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

-- Function for bulk member operations
CREATE OR REPLACE FUNCTION public.bulk_update_members(
  member_ids UUID[],
  operation TEXT,
  new_role team_member_role DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_count INTEGER := 0;
  team_id_var UUID;
  member_record RECORD;
BEGIN
  -- Get team_id from first member (assuming all are from same team)
  SELECT team_id INTO team_id_var 
  FROM public.team_members 
  WHERE id = member_ids[1];
  
  -- Check if user is team admin or super admin
  IF NOT (public.is_team_admin(auth.uid(), team_id_var) OR public.is_super_admin()) THEN
    RETURN json_build_object('success', false, 'error', 'Access denied');
  END IF;
  
  -- Perform bulk operation
  IF operation = 'remove' THEN
    DELETE FROM public.team_members 
    WHERE id = ANY(member_ids);
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    -- Log activity
    PERFORM public.log_team_activity(
      team_id_var,
      'bulk_member_removal',
      json_build_object('count', affected_count, 'member_ids', member_ids)
    );
    
  ELSIF operation = 'change_role' AND new_role IS NOT NULL THEN
    UPDATE public.team_members 
    SET role = new_role 
    WHERE id = ANY(member_ids);
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    -- Log activity
    PERFORM public.log_team_activity(
      team_id_var,
      'bulk_role_change',
      json_build_object('count', affected_count, 'new_role', new_role, 'member_ids', member_ids)
    );
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'affected_count', affected_count,
    'operation', operation
  );
END;
$$;

-- Function to update team settings
CREATE OR REPLACE FUNCTION public.update_team_settings(
  team_id_param UUID,
  team_name TEXT DEFAULT NULL,
  team_description TEXT DEFAULT NULL,
  team_logo_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_values RECORD;
BEGIN
  -- Check if user is team admin or super admin
  IF NOT (public.is_team_admin(auth.uid(), team_id_param) OR public.is_super_admin()) THEN
    RETURN json_build_object('success', false, 'error', 'Access denied');
  END IF;
  
  -- Get old values for logging
  SELECT name, description, logo_url INTO old_values
  FROM public.teams WHERE id = team_id_param;
  
  -- Update team settings
  UPDATE public.teams 
  SET 
    name = COALESCE(team_name, name),
    description = COALESCE(team_description, description),
    logo_url = COALESCE(team_logo_url, logo_url),
    updated_at = now()
  WHERE id = team_id_param;
  
  -- Log the changes
  PERFORM public.log_team_activity(
    team_id_param,
    'team_settings_updated',
    json_build_object(
      'old_values', row_to_json(old_values),
      'new_values', json_build_object(
        'name', COALESCE(team_name, old_values.name),
        'description', COALESCE(team_description, old_values.description),
        'logo_url', COALESCE(team_logo_url, old_values.logo_url)
      )
    )
  );
  
  RETURN json_build_object('success', true);
END;
$$;

-- Create storage bucket for team logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for team logos (drop if exists, then create)
DROP POLICY IF EXISTS "Team admins can upload logos" ON storage.objects;
CREATE POLICY "Team admins can upload logos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'team-logos' AND
  (public.is_super_admin() OR 
   EXISTS (
     SELECT 1 FROM public.team_members tm
     JOIN public.teams t ON t.id = tm.team_id
     WHERE tm.user_id = auth.uid() 
     AND tm.role = 'admin'
     AND (storage.foldername(name))[1] = t.id::text
   ))
);

DROP POLICY IF EXISTS "Anyone can view team logos" ON storage.objects;
CREATE POLICY "Anyone can view team logos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'team-logos');

-- Trigger to update member counts (drop if exists, then create)
DROP TRIGGER IF EXISTS update_team_member_counts_trigger ON public.team_members;

CREATE OR REPLACE FUNCTION public.update_team_member_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.teams 
    SET 
      member_count = member_count + 1,
      admin_count = admin_count + CASE WHEN NEW.role = 'admin' THEN 1 ELSE 0 END
    WHERE id = NEW.team_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.teams 
    SET 
      admin_count = admin_count + 
        CASE WHEN NEW.role = 'admin' THEN 1 ELSE 0 END -
        CASE WHEN OLD.role = 'admin' THEN 1 ELSE 0 END
    WHERE id = NEW.team_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.teams 
    SET 
      member_count = member_count - 1,
      admin_count = admin_count - CASE WHEN OLD.role = 'admin' THEN 1 ELSE 0 END
    WHERE id = OLD.team_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_team_member_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_team_member_counts();

-- Initialize existing team member counts
UPDATE public.teams 
SET 
  member_count = (
    SELECT COUNT(*) FROM public.team_members 
    WHERE team_id = teams.id
  ),
  admin_count = (
    SELECT COUNT(*) FROM public.team_members 
    WHERE team_id = teams.id AND role = 'admin'
  );
