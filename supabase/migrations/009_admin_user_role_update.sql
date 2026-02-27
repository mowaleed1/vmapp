-- Allow admins to update user roles
CREATE POLICY "Admins can update user roles" ON public.users FOR UPDATE
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

-- Allow users to see their own profile and role
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Allow admins and agents to view all profiles
CREATE POLICY "Admins and agents view all profiles" ON public.users FOR SELECT
    USING (public.get_user_role() IN ('admin', 'agent'));

-- Make sure roles are viewable by everyone logged in
CREATE POLICY "Anyone can view roles" ON public.roles FOR SELECT
    USING (auth.uid() IS NOT NULL);
