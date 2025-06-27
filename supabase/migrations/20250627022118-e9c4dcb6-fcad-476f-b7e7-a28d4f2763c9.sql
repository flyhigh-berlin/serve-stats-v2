
-- Add helper function to check if user exists by email
CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(email_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT user_id, full_name INTO user_record
  FROM public.user_profiles 
  WHERE email = email_param;
  
  IF FOUND THEN
    RETURN json_build_object(
      'exists', true, 
      'user_id', user_record.user_id,
      'full_name', user_record.full_name
    );
  ELSE
    RETURN json_build_object('exists', false);
  END IF;
END;
$$;

-- Add function to create team with immediate admin invitation capability
CREATE OR REPLACE FUNCTION public.create_team_with_admin_invites(
  team_name_param text,
  team_description_param text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_team_id UUID;
  team_record RECORD;
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Only super admins can create teams');
  END IF;
  
  -- Create the team
  INSERT INTO public.teams (name, created_by)
  VALUES (team_name_param, auth.uid())
  RETURNING id INTO new_team_id;
  
  -- Get the created team details
  SELECT * INTO team_record FROM public.teams WHERE id = new_team_id;
  
  RETURN json_build_object(
    'success', true,
    'team_id', new_team_id,
    'team', row_to_json(team_record)
  );
END;
$$;

-- Enhance the existing admin invitation function to work with pre-created teams
CREATE OR REPLACE FUNCTION public.create_admin_invitation_for_team(
  team_id_param uuid, 
  admin_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_invite_code TEXT;
  expires_date TIMESTAMP WITH TIME ZONE;
  team_name TEXT;
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Only super admins can create admin invitations');
  END IF;
  
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = admin_email) THEN
    RETURN json_build_object('success', false, 'error', 'User already exists, use assign function instead');
  END IF;
  
  -- Check if team exists
  SELECT name INTO team_name FROM public.teams WHERE id = team_id_param;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Team not found');
  END IF;
  
  -- Generate unique invite code
  new_invite_code := public.generate_invite_code();
  expires_date := now() + interval '7 days';
  
  -- Create admin invitation
  INSERT INTO public.team_invitations (
    team_id, 
    invite_code, 
    max_uses, 
    expires_at, 
    created_by, 
    admin_role
  )
  VALUES (
    team_id_param, 
    new_invite_code, 
    1, 
    expires_date, 
    auth.uid(), 
    true
  );
  
  RETURN json_build_object(
    'success', true, 
    'invite_code', new_invite_code, 
    'expires_at', expires_date,
    'admin_email', admin_email,
    'team_name', team_name
  );
END;
$$;
