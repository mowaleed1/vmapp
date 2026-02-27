-- Migration: 010_update_user_role_rpc.sql
-- Description: Create a secure RPC function to update user roles

-- Create a secure function for admins to update ANY user's role
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator
SET search_path = public
AS $$
BEGIN
  -- 1. Check if the currently executing user is an admin
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can change roles.';
  END IF;

  -- 2. Perform the update
  UPDATE public.users 
  SET role_id = new_role_id
  WHERE id = target_user_id;

END;
$$;
