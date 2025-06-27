
-- Update the validate_invite_code function to include email validation
CREATE OR REPLACE FUNCTION public.validate_invite_code(code character varying)
RETURNS TABLE(invitation_id uuid, team_id uuid, team_name character varying, is_valid boolean, error_message text, admin_role boolean, invited_email text)
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
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::VARCHAR(255), FALSE, 'Invalid invitation code'::TEXT, FALSE, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if invitation is active
  IF NOT invite_record.is_active THEN
    RETURN QUERY SELECT invite_record.id, invite_record.team_id, NULL::VARCHAR(255), FALSE, 'Invitation has been deactivated'::TEXT, COALESCE(invite_record.admin_role, FALSE), invite_record.invited_email;
    RETURN;
  END IF;
  
  -- Check if already accepted
  IF invite_record.accepted_at IS NOT NULL THEN
    RETURN QUERY SELECT invite_record.id, invite_record.team_id, NULL::VARCHAR(255), FALSE, 'Invitation has already been accepted'::TEXT, COALESCE(invite_record.admin_role, FALSE), invite_record.invited_email;
    RETURN;
  END IF;
  
  -- Check expiration
  IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < now() THEN
    RETURN QUERY SELECT invite_record.id, invite_record.team_id, NULL::VARCHAR(255), FALSE, 'Invitation has expired'::TEXT, COALESCE(invite_record.admin_role, FALSE), invite_record.invited_email;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF invite_record.current_uses >= invite_record.max_uses THEN
    RETURN QUERY SELECT invite_record.id, invite_record.team_id, NULL::VARCHAR(255), FALSE, 'Invitation usage limit reached'::TEXT, COALESCE(invite_record.admin_role, FALSE), invite_record.invited_email;
    RETURN;
  END IF;
  
  -- Get team info
  SELECT name INTO team_record FROM public.teams WHERE id = invite_record.team_id;
  
  -- Return valid invitation with invited_email
  RETURN QUERY SELECT 
    invite_record.id, 
    invite_record.team_id, 
    team_record.name, 
    TRUE, 
    'Valid invitation'::TEXT,
    COALESCE(invite_record.admin_role, FALSE),
    invite_record.invited_email;
END;
$$;

-- Create a new function to handle invitation-based signup and team joining
CREATE OR REPLACE FUNCTION public.accept_invitation_signup(
  invitation_code text,
  user_email text,
  user_id_param uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_record RECORD;
  team_record RECORD;
  member_role team_member_role;
BEGIN
  -- Find and validate the invitation
  SELECT * INTO invite_record
  FROM public.team_invitations
  WHERE invite_code = invitation_code;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invitation code');
  END IF;
  
  -- Check if invitation is active
  IF NOT invite_record.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Invitation has been deactivated');
  END IF;
  
  -- Check if already accepted
  IF invite_record.accepted_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invitation has already been accepted');
  END IF;
  
  -- Check expiration
  IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Invitation has expired');
  END IF;
  
  -- Validate email matches invitation (if specified)
  IF invite_record.invited_email IS NOT NULL AND LOWER(invite_record.invited_email) != LOWER(user_email) THEN
    RETURN json_build_object('success', false, 'error', 'This invitation was created for a different email address');
  END IF;
  
  -- Get team info
  SELECT * INTO team_record FROM public.teams WHERE id = invite_record.team_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Team not found');
  END IF;
  
  -- Determine role
  member_role := CASE WHEN invite_record.admin_role THEN 'admin'::team_member_role ELSE 'member'::team_member_role END;
  
  -- Check if user is already a team member
  IF EXISTS (SELECT 1 FROM public.team_members WHERE team_id = invite_record.team_id AND user_id = user_id_param) THEN
    RETURN json_build_object('success', false, 'error', 'User is already a member of this team');
  END IF;
  
  -- Add user to team
  INSERT INTO public.team_members (team_id, user_id, role, joined_at)
  VALUES (invite_record.team_id, user_id_param, member_role, now());
  
  -- Mark invitation as accepted
  UPDATE public.team_invitations 
  SET 
    accepted_at = now(),
    accepted_by = user_id_param,
    current_uses = current_uses + 1,
    last_used_at = now()
  WHERE id = invite_record.id;
  
  RETURN json_build_object(
    'success', true,
    'team_id', invite_record.team_id,
    'team_name', team_record.name,
    'role', member_role,
    'message', 'Successfully joined team as ' || member_role
  );
END;
$$;

-- Update the existing joinTeam-related validation to properly mark invitations as accepted
CREATE OR REPLACE FUNCTION public.mark_invitation_accepted(
  invitation_code text,
  user_id_param uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Find the invitation
  SELECT * INTO invite_record
  FROM public.team_invitations
  WHERE invite_code = invitation_code;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invitation not found');
  END IF;
  
  -- Mark as accepted
  UPDATE public.team_invitations 
  SET 
    accepted_at = now(),
    accepted_by = user_id_param,
    current_uses = current_uses + 1,
    last_used_at = now()
  WHERE id = invite_record.id;
  
  RETURN json_build_object('success', true);
END;
$$;
