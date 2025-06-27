
-- Drop the existing function first
DROP FUNCTION IF EXISTS public.validate_invite_code(character varying);

-- Check if invitation_type enum exists, if not create it
DO $$ BEGIN
    CREATE TYPE public.invitation_type AS ENUM ('admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add invitation_type column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.team_invitations 
    ADD COLUMN invitation_type invitation_type NOT NULL DEFAULT 'admin';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update constraints to allow unlimited uses for member invitations
-- Remove the current constraint if it exists and add a new conditional one
ALTER TABLE public.team_invitations 
DROP CONSTRAINT IF EXISTS team_invitations_max_uses_check;

-- Add conditional constraint: admin invitations max_uses = 1, member invitations can be unlimited
ALTER TABLE public.team_invitations 
ADD CONSTRAINT team_invitations_max_uses_check 
CHECK (
  (invitation_type = 'admin' AND max_uses = 1) OR 
  (invitation_type = 'member' AND max_uses >= 1)
);

-- Make invited_email nullable for member invitations but required for admin invitations
-- Drop existing constraint if exists
ALTER TABLE public.team_invitations 
DROP CONSTRAINT IF EXISTS team_invitations_email_check;

-- Add conditional constraint for email requirement
ALTER TABLE public.team_invitations 
ADD CONSTRAINT team_invitations_email_check 
CHECK (
  (invitation_type = 'admin' AND invited_email IS NOT NULL) OR 
  (invitation_type = 'member')
);

-- Create function to create/update member invitation for a team
CREATE OR REPLACE FUNCTION public.create_member_invitation_for_team(team_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_invite_code TEXT;
  expires_date TIMESTAMP WITH TIME ZONE;
  existing_invitation RECORD;
BEGIN
  -- Check if user is team admin or super admin
  IF NOT (public.is_team_admin(auth.uid(), team_id_param) OR public.is_super_admin()) THEN
    RETURN json_build_object('success', false, 'error', 'Only team admins can create member invitations');
  END IF;
  
  -- Check if team exists
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE id = team_id_param) THEN
    RETURN json_build_object('success', false, 'error', 'Team not found');
  END IF;
  
  -- Check for existing active member invitation
  SELECT * INTO existing_invitation
  FROM public.team_invitations
  WHERE team_id = team_id_param 
    AND invitation_type = 'member' 
    AND is_active = true;
  
  -- If exists, deactivate it
  IF FOUND THEN
    UPDATE public.team_invitations 
    SET is_active = false
    WHERE id = existing_invitation.id;
  END IF;
  
  -- Generate new invite code and set expiration
  new_invite_code := public.generate_invite_code();
  expires_date := now() + interval '30 days'; -- Member invitations last longer
  
  -- Create new member invitation
  INSERT INTO public.team_invitations (
    team_id, 
    invite_code, 
    max_uses, 
    expires_at, 
    created_by, 
    admin_role,
    invitation_type
  )
  VALUES (
    team_id_param, 
    new_invite_code, 
    999, -- High number for reusable member invitations
    expires_date, 
    auth.uid(), 
    false,
    'member'
  );
  
  RETURN json_build_object(
    'success', true, 
    'invite_code', new_invite_code, 
    'expires_at', expires_date
  );
END;
$$;

-- Create function to get current member invitation for a team
CREATE OR REPLACE FUNCTION public.get_team_member_invitation(team_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if user is team admin or super admin
  IF NOT (public.is_team_admin(auth.uid(), team_id_param) OR public.is_super_admin()) THEN
    RETURN json_build_object('success', false, 'error', 'Access denied');
  END IF;
  
  -- Get active member invitation
  SELECT * INTO invitation_record
  FROM public.team_invitations
  WHERE team_id = team_id_param 
    AND invitation_type = 'member' 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'invitation', row_to_json(invitation_record)
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'invitation', null
    );
  END IF;
END;
$$;

-- Create function to deactivate member invitation
CREATE OR REPLACE FUNCTION public.deactivate_member_invitation(team_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is team admin or super admin
  IF NOT (public.is_team_admin(auth.uid(), team_id_param) OR public.is_super_admin()) THEN
    RETURN json_build_object('success', false, 'error', 'Access denied');
  END IF;
  
  -- Deactivate member invitation
  UPDATE public.team_invitations 
  SET is_active = false
  WHERE team_id = team_id_param 
    AND invitation_type = 'member' 
    AND is_active = true;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Recreate the validate_invite_code function with the new return type
CREATE OR REPLACE FUNCTION public.validate_invite_code(code character varying)
RETURNS TABLE(
  invitation_id uuid, 
  team_id uuid, 
  team_name character varying, 
  is_valid boolean, 
  error_message text, 
  admin_role boolean, 
  invited_email text,
  invitation_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_record RECORD;
  team_record RECORD;
BEGIN
  -- Find the invitation
  SELECT * INTO invite_record
  FROM public.team_invitations
  WHERE invite_code = code;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::VARCHAR(255), FALSE, 'Invalid invitation code'::TEXT, FALSE, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if invitation is active
  IF NOT invite_record.is_active THEN
    RETURN QUERY SELECT invite_record.id, invite_record.team_id, NULL::VARCHAR(255), FALSE, 'Invitation has been deactivated'::TEXT, COALESCE(invite_record.admin_role, FALSE), invite_record.invited_email, invite_record.invitation_type::TEXT;
    RETURN;
  END IF;
  
  -- Check expiration
  IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < now() THEN
    RETURN QUERY SELECT invite_record.id, invite_record.team_id, NULL::VARCHAR(255), FALSE, 'Invitation has expired'::TEXT, COALESCE(invite_record.admin_role, FALSE), invite_record.invited_email, invite_record.invitation_type::TEXT;
    RETURN;
  END IF;
  
  -- For admin invitations, check if already accepted (single use)
  IF invite_record.invitation_type = 'admin' AND invite_record.accepted_at IS NOT NULL THEN
    RETURN QUERY SELECT invite_record.id, invite_record.team_id, NULL::VARCHAR(255), FALSE, 'Invitation has already been accepted'::TEXT, COALESCE(invite_record.admin_role, FALSE), invite_record.invited_email, invite_record.invitation_type::TEXT;
    RETURN;
  END IF;
  
  -- For member invitations, check usage limit (should be high but still check)
  IF invite_record.invitation_type = 'member' AND invite_record.current_uses >= invite_record.max_uses THEN
    RETURN QUERY SELECT invite_record.id, invite_record.team_id, NULL::VARCHAR(255), FALSE, 'Invitation usage limit reached'::TEXT, COALESCE(invite_record.admin_role, FALSE), invite_record.invited_email, invite_record.invitation_type::TEXT;
    RETURN;
  END IF;
  
  -- Get team info
  SELECT name INTO team_record FROM public.teams WHERE id = invite_record.team_id;
  
  -- Return valid invitation
  RETURN QUERY SELECT 
    invite_record.id, 
    invite_record.team_id, 
    team_record.name, 
    TRUE, 
    'Valid invitation'::TEXT,
    COALESCE(invite_record.admin_role, FALSE),
    invite_record.invited_email,
    invite_record.invitation_type::TEXT;
END;
$$;

-- Update create_admin_invitation_for_team to use new invitation_type
CREATE OR REPLACE FUNCTION public.create_admin_invitation_for_team(team_id_param uuid, admin_email text)
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
  
  -- Create admin invitation with invited_email and invitation_type
  INSERT INTO public.team_invitations (
    team_id, 
    invite_code, 
    max_uses, 
    expires_at, 
    created_by, 
    admin_role,
    invited_email,
    invitation_type
  )
  VALUES (
    team_id_param, 
    new_invite_code, 
    1, 
    expires_date, 
    auth.uid(), 
    true,
    admin_email,
    'admin'
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
